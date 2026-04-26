import numpy as np
import json
import os
import time
import faiss
import gradio as gr
from sentence_transformers import SentenceTransformer, CrossEncoder
from opensearchpy import OpenSearch

# =========================
# CONFIG
# =========================
RECORDS_FILE    = "data/records.json"
EMB_FILE        = "models/emb_minilm.npy"
FAISS_FILE      = "faiss.index"
INDEX_NAME      = "service_calls"
OS_HOST         = "http://localhost:9201"

TOP_K_OS        = 50
TOP_K_ANN       = 50
RRF_TOP_K       = 80
FINAL_TOP_K     = 5
CROSS_MODEL     = "cross-encoder/ms-marco-TinyBERT-L-2-v2"

# =========================
# DATA
# =========================
with open(RECORDS_FILE, encoding="utf-8") as f:
    records = json.load(f)

contents     = [r["content"] for r in records]
id_to_index  = {str(r["id"]): i for i, r in enumerate(records)}
doc_to_indices = {}
for i, r in enumerate(records):
    doc_id = str(r["document_id"])
    doc_to_indices.setdefault(doc_id, []).append(i)

print(f"{len(records)} record yüklendi.")

# =========================
# MODELS
# =========================
os_client      = OpenSearch(OS_HOST)
embed_model    = SentenceTransformer("all-MiniLM-L6-v2")
cross_encoder  = CrossEncoder(CROSS_MODEL)

embeddings     = np.load(EMB_FILE)
faiss_index    = faiss.read_index(FAISS_FILE)
print("Modeller hazır.")

# =========================
# SEARCH FUNCTIONS
# =========================
def opensearch_search(query, k=TOP_K_OS):
    resp = os_client.search(index=INDEX_NAME, body={
        "query": {
            "multi_match": {
                "query": query,
                "fields": ["content^2", "call_type", "location"],
                "type": "best_fields"
            }
        },
        "size": k
    })
    results = []
    for hit in resp["hits"]["hits"]:
        _id = hit["_id"]
        if _id in id_to_index:
            results.append(id_to_index[_id])
    return results

def ann_search(query, k=TOP_K_ANN):
    q_emb = embed_model.encode(
        query,
        convert_to_numpy=True,
        normalize_embeddings=True
    ).reshape(1, -1)
    _, indices = faiss_index.search(q_emb, k)
    return indices[0].tolist()

def rrf_fusion(ann_idx, os_idx, k=60):
    scores = {}
    for rank, idx in enumerate(ann_idx):
        scores[idx] = scores.get(idx, 0) + 1 / (k + rank + 1)
    for rank, idx in enumerate(os_idx):
        scores[idx] = scores.get(idx, 0) + 1 / (k + rank + 1)
    return sorted(scores, key=scores.get, reverse=True)[:RRF_TOP_K]

def expand_with_parent(indices):
    """Aynı work order'a ait tüm chunk'ları dahil et."""
    expanded = set(indices)
    for idx in indices:
        doc_id = str(records[idx]["document_id"])
        siblings = doc_to_indices.get(doc_id, [])
        expanded.update(siblings)
    return list(expanded)

def cross_rerank(query, candidate_idx):
    pairs  = [(query, contents[idx][:512]) for idx in candidate_idx]
    scores = cross_encoder.predict(pairs)
    ranked = sorted(
        zip(candidate_idx, scores),
        key=lambda x: x[1],
        reverse=True
    )
    return ranked[:FINAL_TOP_K]

# =========================
# PIPELINE
# =========================
def search_pipeline(query):
    timings = {}
    t0 = time.time()

    t1 = time.time()
    os_idx = opensearch_search(query)
    timings["OpenSearch BM25"] = round(time.time() - t1, 3)

    t2 = time.time()
    ann_idx = ann_search(query)
    timings["FAISS ANN"] = round(time.time() - t2, 3)

    t3 = time.time()
    fused_idx = rrf_fusion(ann_idx, os_idx)
    timings["RRF Fusion"] = round(time.time() - t3, 3)

    t4 = time.time()
    expanded_idx = expand_with_parent(fused_idx)
    timings["Parent Expand"] = round(time.time() - t4, 3)

    t5 = time.time()
    ranked = cross_rerank(query, expanded_idx)
    timings["Cross-Encoder"] = round(time.time() - t5, 3)

    timings["TOTAL"] = round(time.time() - t0, 3)

    results = []
    for i, (idx, score) in enumerate(ranked):
        meta = records[idx]["metadata"]
        results.append({
            "rank":             i + 1,
            "score":            float(score),
            "snippet":          contents[idx][:800],
            "wrkordnbr":        meta.get("wrkordnbr"),
            "call_type":        meta.get("call_type"),
            "technician":       meta.get("technician"),
            "labor_hours":      meta.get("labor_hours"),
            "location":         meta.get("location"),
            "completion_date":  meta.get("completion_date"),
        })

    return results, timings

# =========================
# UI FORMATTER
# =========================
def format_output(results, timings):
    out = ""
    for r in results:
        out += f"### #{r['rank']} — Score: {round(r['score'], 3)}\n"
        out += f"**Work Order:** `{r['wrkordnbr']}` | "
        out += f"**Type:** {r['call_type']} | "
        out += f"**Location:** {r['location']} | "
        out += f"**Tech:** {r['technician']} | "
        out += f"**Hours:** {r['labor_hours']}\n\n"
        out += f"{r['snippet']}\n\n---\n\n"

    out += "### Timings\n"
    for k, v in timings.items():
        out += f"- `{k}`: {v}s\n"
    return out

def gradio_fn(query):
    if not query.strip():
        return "Lütfen bir sorgu girin."
    results, timings = search_pipeline(query)
    return format_output(results, timings)

with gr.Blocks(title="Service Call RAG") as app:
    gr.Markdown("## Service Call Hybrid Search\nTechnician query → historical resolutions")

    with gr.Row():
        query_box = gr.Textbox(
            label="Technician Query",
            placeholder="e.g. pump not dispensing fuel, screen stuck on closed...",
            lines=2
        )

    search_btn = gr.Button("Search", variant="primary")
    output_box = gr.Markdown()

    search_btn.click(fn=gradio_fn, inputs=query_box, outputs=output_box)
    query_box.submit(fn=gradio_fn, inputs=query_box, outputs=output_box)

    gr.Examples(
        examples=[
            ["pump not dispensing, screen frozen"],
            ["fuel leak at dispenser base"],
            ["card reader not working"],
        ],
        inputs=query_box
    )

app.launch(server_port=7860, share=False)