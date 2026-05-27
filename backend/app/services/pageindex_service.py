import json
import re
from typing import List, Dict, Any, Optional, AsyncIterator
from sqlalchemy import select
from app.db.models import Document, DocumentTOC, DocumentNode
from app.services.llm_service import llm_service
from app.core.logger import get_logger
from app.core.config import settings

logger = get_logger(__name__)

class PageIndexService:
    async def get_all_tocs_summary(self, db) -> str:
        """
        Sistemdeki tüm dokümanların içindekiler yapısının özetini çıkarır.
        """
        result = await db.execute(select(DocumentTOC))
        tocs = result.scalars().all()
        
        if not tocs:
            return "Sistemde henüz PageIndex (fihrist) oluşturulmuş doküman bulunmamaktadır."
            
        doc_ids = [t.document_id for t in tocs]
        doc_result = await db.execute(select(Document).where(Document.id.in_(doc_ids)))
        docs = {d.id: d.filename for d in doc_result.scalars().all()}
        
        summary_lines = []
        for t in tocs:
            filename = docs.get(t.document_id, "Bilinmeyen Doküman")
            toc_data = t.toc
            summary_lines.append(f"=== DOKÜMAN: {filename} (ID: {t.document_id}) ===")
            summary_lines.append(f"Genel Özet: {toc_data.get('summary', 'Özet yok.')}")
            
            # Ana bölümleri veya maddeleri listele
            summary_lines.append("Fihrist Yapısı:")
            for node in toc_data.get("nodes", [])[:20]: # İlk 20 düğümü göster
                is_sec = "nodes" in node and len(node["nodes"]) > 0
                if is_sec:
                    summary_lines.append(f"  - Bölüm: {node['title']} (ID: {node['node_id']})")
                    for sub in node["nodes"][:5]:
                        summary_lines.append(f"    * Madde: {sub['title']} (ID: {sub['node_id']}) - Özet: {sub.get('summary', '')[:100]}...")
                else:
                    summary_lines.append(f"  - Madde: {node['title']} (ID: {node['node_id']}) - Özet: {node.get('summary', '')[:100]}...")
            summary_lines.append("\n")
            
        return "\n".join(summary_lines)

    async def run_agent_stream(
        self,
        query: str,
        session_id: str,
        history: Optional[List[Dict[str, str]]] = None,
        db=None
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Agentic RAG — İçindekileri analiz eder, adım adım düşünür, ilgili maddeleri çeker ve streaming yanıt üretir.
        """
        if db is None:
            yield {"type": "error", "message": "Veritabanı bağlantısı yok."}
            return

        yield {"type": "thought", "thought": "🧠 PageIndex Ajanı başlatıldı. Sistem fihristleri taranıyor..."}
        
        # 1. Tüm içindekileri çek
        tocs_summary = await self.get_all_tocs_summary(db)
        
        history_text = ""
        if history:
            history_text = "\n".join([f"{h['role']}: {h['content']}" for h in history])

        # 2. Ajanın karar vermesini iste
        yield {"type": "thought", "thought": "🔍 Hukuk fihristi inceleniyor ve en alakalı maddeler belirleniyor..."}
        
        router_prompt = f"""Sen uzman bir Türk Hukuku Yapay Zeka Ajanısın. Önünde hukuki belgelerin "İçindekiler Ağaçları" (Table of Contents - TOC) bulunmaktadır.
Kullanıcının sorusunu en doğru ve eksiksiz şekilde yanıtlayabilmek için hangi belgeleri ve bu belgelerin altındaki hangi bölümleri/maddeleri (node_id'leri) incelemen gerektiğini belirlemelisin.

BELGE AĞAÇLARI:
{tocs_summary}

KULLANICI SORUSU:
{query}

SOHBET GEÇMİŞİ:
{history_text}

Lütfen soruyu cevaplamak için en alakalı node_id'leri seç. En fazla 3-4 adet en kritik node_id seçebilirsin.
Sonucu şu JSON formatında döndür:
{{
  "reasoning": "Seçim gerekçen...",
  "selected_nodes": [
    {{"document_id": "...", "node_id": "..."}},
    ...
  ]
}}"""
        
        selected_nodes = []
        reasoning = ""
        try:
            router_response = await llm_service.complete(
                router_prompt, 
                model="gpt-4o-mini", 
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            # JSON'ı temizle ve parse et
            json_match = re.search(r"\{.*\}", router_response, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                reasoning = parsed.get("reasoning", "")
                selected_nodes = parsed.get("selected_nodes", [])
            else:
                yield {"type": "thought", "thought": "⚠️ İçindekiler incelenirken formatlama hatası algılandı, varsayılan maddelere yönleniliyor."}
        except Exception as e:
            logger.error(f"[PageIndexAgent] Yönlendirme hatası: {e}")
            yield {"type": "thought", "thought": f"⚠️ Ajan karar verme adımında hata oluştu: {str(e)}"}

        if reasoning:
            yield {"type": "thought", "thought": f"🤔 Ajan Düşüncesi: {reasoning}"}
            
        if not selected_nodes:
            yield {"type": "thought", "thought": "❌ Soruyla doğrudan eşleşen yasal bir madde bulunamadı."}
            # Normal RAG'e fallback veya genel cevap
            
        # 3. Seçilen maddelerin içeriklerini DB'den çek
        retrieved_contents = []
        sources = []
        
        for item in selected_nodes:
            doc_id = item.get("document_id")
            node_id = item.get("node_id")
            
            yield {"type": "thought", "thought": f"📖 {node_id} nolu hukuki madde çekiliyor ve okunuyor..."}
            
            result = await db.execute(
                select(DocumentNode).where(
                    DocumentNode.document_id == doc_id,
                    DocumentNode.node_id == node_id
                )
            )
            node_record = result.scalar_one_or_none()
            
            if node_record:
                retrieved_contents.append({
                    "title": node_record.title,
                    "content": node_record.content,
                    "node_id": node_id,
                    "document_id": doc_id
                })
                
                # Get doc filename
                doc_info = await db.execute(select(Document).where(Document.id == doc_id))
                doc_record = doc_info.scalar_one_or_none()
                doc_name = doc_record.filename if doc_record else "Bilinmeyen Belge"
                
                sources.append({
                    "document_name": doc_name,
                    "chunk_id": node_id,
                    "page": node_record.node_metadata.get("start_page", 1) if node_record.node_metadata else 1,
                    "score": 1.0,
                    "text": node_record.content
                })
                
        # 4. Agentic Loop Step 2: Atıf kontrolü (Bkz. Madde X vb.)
        yield {"type": "thought", "thought": "🔍 Çekilen maddelerde diğer maddelere yapılan atıflar (referanslar) analiz ediliyor..."}
        
        all_context_text = "\n\n".join([f"=== {rc['title']} ===\n{rc['content']}" for rc in retrieved_contents])
        
        agent_loop_prompt = f"""Aşağıdaki hukuki metinleri incele. Bu maddelerde atıfta bulunulan (örn: "Madde 17'ye göre", "Bkz. Geçici Madde 2", "5. madde hariç") ancak şu an elimizde metni olmayan başka kritik maddeler var mı?
Eğer varsa ve soruyu tam yanıtlamak için o maddeleri de okuman gerekiyorsa, o maddelerin node_id'lerini belirt.

ELİMİZDEKİ MADDELER:
{all_context_text}

KULLANICI SORUSU:
{query}

Sistemdeki tüm fihrist yapısı:
{tocs_summary}

Eğer ek madde çekmek istiyorsan, "selected_nodes" listesine ekle. İstemiyorsan boş bırak.
Döndüreceğin JSON formatı:
{{
  "reasoning": "Atıf analizi gerekçen...",
  "selected_nodes": [
    {{"document_id": "...", "node_id": "..."}}
  ]
}}"""

        try:
            loop_response = await llm_service.complete(
                agent_loop_prompt, 
                model="gpt-4o-mini", 
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            json_match = re.search(r"\{.*\}", loop_response, re.DOTALL)
            if json_match:
                parsed_loop = json.loads(json_match.group(0))
                extra_nodes = parsed_loop.get("selected_nodes", [])
                extra_reasoning = parsed_loop.get("reasoning", "")
                
                if extra_nodes:
                    yield {"type": "thought", "thought": f"🔗 Atıf Analizi: {extra_reasoning}"}
                    for item in extra_nodes:
                        doc_id = item.get("document_id")
                        node_id = item.get("node_id")
                        
                        # Zaten çekilmişse tekrar çekme
                        if any(rc["node_id"] == node_id and rc["document_id"] == doc_id for rc in retrieved_contents):
                            continue
                            
                        yield {"type": "thought", "thought": f"🔄 Atıf yapılan {node_id} nolu ek madde derinlemesine incelemeye alınıyor..."}
                        
                        result = await db.execute(
                            select(DocumentNode).where(
                                DocumentNode.document_id == doc_id,
                                DocumentNode.node_id == node_id
                            )
                        )
                        node_record = result.scalar_one_or_none()
                        
                        if node_record:
                            retrieved_contents.append({
                                "title": node_record.title,
                                "content": node_record.content,
                                "node_id": node_id,
                                "document_id": doc_id
                            })
                            
                            doc_info = await db.execute(select(Document).where(Document.id == doc_id))
                            doc_record = doc_info.scalar_one_or_none()
                            doc_name = doc_record.filename if doc_record else "Bilinmeyen Belge"
                            
                            sources.append({
                                "document_name": doc_name,
                                "chunk_id": node_id,
                                "page": node_record.node_metadata.get("start_page", 1) if node_record.node_metadata else 1,
                                "score": 0.9,
                                "text": node_record.content
                            })
        except Exception as e:
            logger.error(f"[PageIndexAgent] Atıf analizi hatası: {e}")
            
        yield {"type": "thought", "thought": "✍️ Tüm veriler birleştirildi. Hukuki mütalaa yazılıyor..."}
        
        # 5. Nihai cevabı oluştur
        yield {"type": "sources", "sources": sources}
        
        final_context = "\n\n".join([f"=== {rc['title']} ===\n{rc['content']}" for rc in retrieved_contents])
        
        from app.services.rag_service import LEGAL_COT_PROMPT
        prompt = LEGAL_COT_PROMPT.format(context=final_context, question=query, history=history_text)
        
        async for token in llm_service.stream_openai(prompt):
            yield {"type": "token", "token": token}
            
        yield {"type": "done"}

    async def run_agent(
        self,
        query: str,
        session_id: str,
        history: Optional[List[Dict[str, str]]] = None,
        db=None
    ) -> Dict[str, Any]:
        """
        Non-streaming agent runner.
        """
        answer_parts = []
        sources = []
        
        async for event in self.run_agent_stream(query, session_id, history, db):
            if event["type"] == "sources":
                sources = event["sources"]
            elif event["type"] == "token":
                answer_parts.append(event["token"])
                
        return {
            "answer": "".join(answer_parts),
            "sources": sources
        }

pageindex_service = PageIndexService()
