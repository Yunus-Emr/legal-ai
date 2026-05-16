import asyncio
import os
import sys

# Ensure backend module path is available
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.services.rag_service import rag_service
from app.core.logger import get_logger

logger = get_logger(__name__)

async def test_rag():
    print("=== RAG PIPELINE TESTİ BAŞLIYOR ===")
    
    query = "İşçinin haklı nedenle derhal fesih hakkı hangi hallerde geçerlidir?"
    session_id = "test_session_001"
    
    print(f"\n[1] Soru: {query}")
    
    try:
        print("[2] RAG Servisine İstek Gönderiliyor...")
        result = await rag_service.ask(query=query, session_id=session_id)
        
        print("\n=== YANIT ===")
        print(result["answer"])
        
        print("\n=== KAYNAKLAR ===")
        if result["sources"]:
            for i, src in enumerate(result["sources"]):
                print(f"{i+1}. Doküman: {src['document_name']}")
                print(f"   Chunk ID: {src['chunk_id']}")
                print(f"   Sayfa: {src.get('page', 'Bilinmiyor')}")
                print(f"   Skor: {src.get('score', 0)}")
        else:
            print("Kaynak bulunamadı.")
            
        print("\n=== TEST BAŞARILI ===")
        
    except Exception as e:
        print("\n=== HATA OLUŞTU ===")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_rag())
