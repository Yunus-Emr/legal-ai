"""
OpenSearch Index Schema — mapping tanımı
"""

LEGAL_INDEX_MAPPING = {
    "settings": {
        "index": {
            "knn": True,
            "knn.algo_param.ef_search": 100,
        }
    },
    "mappings": {
        "properties": {
            "chunk_id":      {"type": "keyword"},
            "doc_id":        {"type": "keyword"},
            "document_name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
            "text":          {"type": "text", "analyzer": "turkish"},
            "page":          {"type": "integer"},
            "word_count":    {"type": "integer"},
            "start_word":    {"type": "integer"},
            "embedding": {
                "type": "knn_vector",
                "dimension": 1024,
                "method": {
                    "name":       "hnsw",
                    "space_type": "innerproduct",
                    # nmslib OpenSearch 2.x'te kaldırıldı — lucene kullanıyoruz
                    "engine":     "lucene",
                    "parameters": {"ef_construction": 128, "m": 16},
                },
            },
        }
    },
}
