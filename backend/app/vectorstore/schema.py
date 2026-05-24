"""
OpenSearch Index Schema — Hybrid Search mapping
Hem dense vector (kNN) hem de BM25 text aramasını destekler.
"""

LEGAL_INDEX_MAPPING = {
    "settings": {
        "index": {
            "knn": True,
            "knn.algo_param.ef_search": 200,
        },
        "analysis": {
            "analyzer": {
                "turkish_legal": {
                    "type": "custom",
                    "tokenizer": "standard",
                    "filter": ["lowercase", "turkish_stop", "asciifolding"],
                },
            },
            "filter": {
                "turkish_stop": {
                    "type": "stop",
                    "stopwords": "_turkish_",
                },
            },
        },
    },
    "mappings": {
        "properties": {
            "chunk_id":      {"type": "keyword"},
            "doc_id":        {"type": "keyword"},
            "document_name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
            # BM25 araması için — türkçe analyzer ile tokenize edilir
            "text": {
                "type": "text",
                "analyzer": "turkish_legal",
                "fields": {
                    "keyword": {"type": "keyword", "ignore_above": 512},
                },
            },
            "page":          {"type": "integer"},
            "word_count":    {"type": "integer"},
            "start_word":    {"type": "integer"},
            # kNN vektör araması için — HNSW (Hierarchical NSW)
            "embedding": {
                "type": "knn_vector",
                "dimension": 1536,
                "method": {
                    "name":       "hnsw",
                    "space_type": "cosinesimil",
                    "engine":     "lucene",
                    "parameters": {"ef_construction": 256, "m": 16},
                },
            },
        }
    },
}

# Hybrid Search ağırlıkları — alpha=1.0 tam vektör, alpha=0.0 tam BM25
# Üretim ortamında A/B testi ile optimize edilmeli
HYBRID_ALPHA = 0.7  # %70 vektör + %30 BM25
