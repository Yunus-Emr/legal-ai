import json
import numpy as np
import faiss
import os
from opensearchpy import OpenSearch
from opensearchpy.helpers import bulk
from sentence_transformers import SentenceTransformer

RECORDS_FILE = "data/records.json"
EMB_FILE     = "models/emb_minilm.npy"
FAISS_FILE   = "faiss.index"
INDEX_NAME   = "service_calls"         
OS_HOST      = "http://localhost:9201"

def build_opensearch_index(client, records):
    if client.indices.exists(index=INDEX_NAME):
        print(f"'{INDEX_NAME}' zaten var, siliniyor...")
        client.indices.delete(index=INDEX_NAME)

    client.indices.create(index=INDEX_NAME, body={
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 0,
            "analysis": {
                "analyzer": {
                    "english_analyzer": {
                        "type": "english"
                    }
                }
            }
        },
        "mappings": {
            "properties": {
                "content":    {"type": "text", "analyzer": "english_analyzer"},
                "wrkordnbr":  {"type": "keyword"},
                "call_type":  {"type": "keyword"},
                "location":   {"type": "keyword"},
                "status":     {"type": "keyword"},
            }
        }
    })
    print(f"'{INDEX_NAME}' index oluşturuldu.")

    def clean_value(v):
        if v is None:
            return None
        try:
            if isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
                return None
        except Exception:
            pass
        return v
    def generate_docs(records):
        for r in records:
            yield {
                "_index": INDEX_NAME,
                "_id": str(r["id"]),
                "_source": {
                    "content":   r["content"],
                    "wrkordnbr": clean_value(r["metadata"].get("wrkordnbr")),
                    "call_type": clean_value(r["metadata"].get("call_type")),
                    "location":  clean_value(r["metadata"].get("location")),
                    "status":    clean_value(r["metadata"].get("status")),
                }
            }

    success, failed = bulk(
        client, generate_docs(records),
        chunk_size=500,
        request_timeout=60
    )
    print(f"OpenSearch: {success} başarılı, {failed} hatalı")

def build_faiss_index(records):
    contents = [r["content"] for r in records]

    model = SentenceTransformer("all-MiniLM-L6-v2")

    if os.path.exists(EMB_FILE):
        print("Mevcut embedding yükleniyor...")
        embeddings = np.load(EMB_FILE)
    else:
        print(f"{len(contents)} kayıt embed ediliyor...")
        embeddings = model.encode(
            contents,
            convert_to_numpy=True,
            normalize_embeddings=True,
            batch_size=64,
            show_progress_bar=True
        )
        os.makedirs(os.path.dirname(EMB_FILE), exist_ok=True)
        np.save(EMB_FILE, embeddings)
        print(f"Embedding kaydedildi: {EMB_FILE}")

    dim = embeddings.shape[1]
    index = faiss.IndexHNSWFlat(dim, 32)
    index.add(embeddings)
    faiss.write_index(index, FAISS_FILE)
    print(f"FAISS index kaydedildi: {FAISS_FILE} ({len(contents)} vektör)")

def main():
    with open(RECORDS_FILE, encoding="utf-8") as f:
        records = json.load(f)
    print(f"{len(records)} record yüklendi.")

    client = OpenSearch(OS_HOST)
    build_opensearch_index(client, records)
    build_faiss_index(records)
    print("\nIndexleme tamamlandı!")

if __name__ == "__main__":
    main()