import asyncio
import json
import os
import sys
import argparse
import uuid
import re
from typing import List, Dict, Any, Optional

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.core.logger import get_logger
from app.db.postgres import SessionLocal
from app.db.models import Document, DocumentTOC, DocumentNode
from app.services.llm_service import llm_service
from sqlalchemy import select, delete
from scripts.chunker import ChunkerConfig, ArticleSplitter, PDFReader, TextCleaner

logger = get_logger(__name__)

def generate_hierarchy(doc_title: str, blocks: List[Any]) -> Dict[str, Any]:
    """
    ArticleBlock listesinden hiyerarşik JSON yapısı üretir.
    """
    root = {
        "node_id": "root",
        "title": doc_title,
        "summary": f"{doc_title} belgesinin genel fihristi.",
        "start_page": 1,
        "end_page": 1,
        "nodes": []
    }
    
    current_section = None
    all_pages = []
    
    for block in blocks:
        # Create a safe node_id
        node_id = block.article.lower().replace(" ", "_")
        node_id = re.sub(r"[^\w\-]", "", node_id)
        if not node_id:
            node_id = f"node_{uuid.uuid4().hex[:6]}"
            
        summary = block.text[:300] + "..." if len(block.text) > 300 else block.text
        
        node = {
            "node_id": node_id,
            "title": block.article,
            "summary": summary,
            "start_page": min(block.pages) if block.pages else 1,
            "end_page": max(block.pages) if block.pages else 1,
            "nodes": []  # nested nodes if any
        }
        
        if block.pages:
            all_pages.extend(block.pages)
            
        if block.section:
            section_title = block.section
            section_id = section_title.lower().replace(" ", "_")
            section_id = re.sub(r"[^\w\-]", "", section_id)
            if not section_id:
                section_id = f"sec_{uuid.uuid4().hex[:6]}"
                
            if not current_section or current_section["title"] != section_title:
                current_section = {
                    "node_id": section_id,
                    "title": section_title,
                    "summary": f"{section_title} kapsamındaki maddeler.",
                    "start_page": node["start_page"],
                    "end_page": node["end_page"],
                    "nodes": []
                }
                root["nodes"].append(current_section)
                
            current_section["nodes"].append(node)
            current_section["end_page"] = max(current_section["end_page"], node["end_page"])
        else:
            root["nodes"].append(node)
            
    if all_pages:
        root["start_page"] = min(all_pages)
        root["end_page"] = max(all_pages)
        
    return root

async def generate_llm_summaries(toc: Dict[str, Any], blocks: List[Any], doc_title: str):
    """
    OpenAI API kullanarak ana başlıklar ve bölümler için AI özetleri çıkartır.
    """
    logger.info("Yapay Zeka ile İçindekiler özetleri çıkarılıyor...")
    
    # 1. Genel Belge Özeti
    full_text_sample = "\n".join([b.text[:200] for b in blocks[:15]])
    prompt = f"""Aşağıdaki hukuki metin kesitlerini inceleyerek bu belgenin genel amacını, konusunu ve hukuki niteliğini açıklayan 2-3 cümlelik son derece profesyonel bir özet yaz.
    
    BELGE ADI: {doc_title}
    METİN KESİTLERİ:
    {full_text_sample}
    
    ÖZET:"""
    
    try:
        summary = await llm_service.complete(prompt, max_tokens=150)
        if "Demo Yanıtı" not in summary:
            toc["summary"] = summary.strip()
    except Exception as e:
        logger.warning(f"Genel özet üretilemedi: {e}")
        
    # 2. Bölüm Özetleri
    for node in toc["nodes"]:
        if "nodes" in node and node["nodes"]:  # Bu bir Bölüm (Section)
            section_text = ""
            for sub in node["nodes"]:
                # find block corresponding to this article
                matching_block = next((b for b in blocks if b.article == sub["title"]), None)
                if matching_block:
                    section_text += f"\n\n{matching_block.article}:\n{matching_block.text[:400]}"
                    
            if section_text:
                prompt = f"""Aşağıda bir kanunun/sözleşmenin bir bölümündeki maddelerin özetleri yer almaktadır. Bu bölümün (örn: {node['title']}) genel amacını ve kapsadığı hukuki meseleleri açıklayan 1-2 cümlelik son derece profesyonel bir özet yaz.
                
                BÖLÜM: {node['title']}
                MADDELER:
                {section_text[:1500]}
                
                BÖLÜM ÖZETİ:"""
                try:
                    sec_summary = await llm_service.complete(prompt, max_tokens=100)
                    if "Demo Yanıtı" not in sec_summary:
                        node["summary"] = sec_summary.strip()
                except Exception as e:
                    logger.warning(f"Bölüm özeti üretilemedi: {e}")
                    
    # 3. Önemli maddelerin özetleri
    for node in toc["nodes"]:
        items_to_summarize = []
        if "nodes" in node and node["nodes"]:
            items_to_summarize = node["nodes"]
        else:
            items_to_summarize = [node]
            
        for sub in items_to_summarize:
            matching_block = next((b for b in blocks if b.article == sub["title"]), None)
            if matching_block and len(matching_block.text) > 800:
                prompt = f"""Aşağıdaki hukuki maddeyi incele ve hukuki dille 1-2 cümlelik kısa ve öz net bir özet yaz.
                
                MADDE: {matching_block.article}
                METİN:
                {matching_block.text}
                
                ÖZET:"""
                try:
                    sub_summary = await llm_service.complete(prompt, max_tokens=100)
                    if "Demo Yanıtı" not in sub_summary:
                        sub["summary"] = sub_summary.strip()
                except Exception as e:
                    logger.warning(f"Madde özeti üretilemedi: {e}")

async def process_pdf(pdf_path: str):
    if not os.path.exists(pdf_path):
        logger.error(f"Dosya bulunamadı: {pdf_path}")
        return
        
    filename = os.path.basename(pdf_path)
    doc_title = os.path.splitext(filename)[0]
    doc_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, filename))
    
    logger.info(f"📄 PDF okunuyor: {filename}...")
    pages = PDFReader.read(pdf_path)
    
    logger.info("🌲 Hiyerarşik ağaç ve maddeler çıkartılıyor...")
    config = ChunkerConfig()
    splitter = ArticleSplitter(config)
    blocks = splitter.split(pages)
    
    if not blocks:
        logger.warning(f"Dokümandan hiçbir madde veya bölüm çıkarılamadı!")
        return
        
    logger.info(f"Bulunan madde/bölüm sayısı: {len(blocks)}")
    
    # 1. Hiyerarşik ToC oluştur
    toc = generate_hierarchy(doc_title, blocks)
    
    # 2. LLM ile özetleri güncelle
    await generate_llm_summaries(toc, blocks, doc_title)
    
    # 3. Veritabanına kaydet
    async with SessionLocal() as db:
        # Önce Documents tablosunda var mı bak
        result = await db.execute(select(Document).where(Document.id == doc_uuid))
        existing_doc = result.scalar_one_or_none()
        
        if not existing_doc:
            doc_size = os.path.getsize(pdf_path)
            new_doc = Document(
                id=doc_uuid,
                filename=filename,
                size_bytes=doc_size,
                chunk_count=len(blocks),
                status="indexed"
            )
            db.add(new_doc)
            logger.info(f"Documents tablosuna yeni kayıt eklendi: {doc_uuid}")
        else:
            existing_doc.status = "indexed"
            logger.info(f"Documents tablosunda mevcut kayıt güncellendi: {doc_uuid}")
            
        # Mevcut TOC ve Nodes kayıtlarını temizle (idempotency için)
        await db.execute(delete(DocumentTOC).where(DocumentTOC.document_id == doc_uuid))
        await db.execute(delete(DocumentNode).where(DocumentNode.document_id == doc_uuid))
        
        # TOC Ekle
        new_toc = DocumentTOC(
            document_id=doc_uuid,
            toc=toc
        )
        db.add(new_toc)
        
        # Her bir düğümü document_nodes tablosuna ekle
        # a. Root Düğümü
        db.add(DocumentNode(
            document_id=doc_uuid,
            node_id="root",
            title=toc["title"],
            content=toc["summary"],
            node_metadata={"type": "root", "start_page": toc["start_page"], "end_page": toc["end_page"]}
        ))
        
        # b. Bölümler ve Maddeler
        for node in toc["nodes"]:
            is_section = "nodes" in node and len(node["nodes"]) > 0
            node_type = "section" if is_section else "article"
            
            # Bulunan makale içeriği
            content_text = node["summary"]
            if node_type == "article":
                matching_block = next((b for b in blocks if b.article == node["title"]), None)
                if matching_block:
                    content_text = matching_block.text
                    
            db.add(DocumentNode(
                document_id=doc_uuid,
                node_id=node["node_id"],
                title=node["title"],
                content=content_text,
                node_metadata={"type": node_type, "start_page": node["start_page"], "end_page": node["end_page"]}
            ))
            
            # Eğer bölüm ise alt maddeleri de ekle
            if is_section:
                for sub in node["nodes"]:
                    matching_block = next((b for b in blocks if b.article == sub["title"]), None)
                    sub_content = matching_block.text if matching_block else sub["summary"]
                    
                    db.add(DocumentNode(
                        document_id=doc_uuid,
                        node_id=sub["node_id"],
                        title=sub["title"],
                        content=sub_content,
                        node_metadata={"type": "article", "start_page": sub["start_page"], "end_page": sub["end_page"]}
                    ))
                    
        await db.commit()
        logger.info(f"✅ {filename} PageIndex başarıyla oluşturuldu ve DB'ye kaydedildi!")

async def main():
    parser = argparse.ArgumentParser(description="PDF'ten PageIndex (TOC ve Düğümler) çıkaran script.")
    parser.add_argument("--pdf", type=str, help="İşlenecek PDF dosyasının yolu")
    args = parser.parse_args()
    
    if args.pdf:
        await process_pdf(args.pdf)
    else:
        # Eğer parametre yoksa, data/raw_pdfs altındaki tüm PDF'leri işle
        raw_dir = os.path.join(os.path.dirname(__file__), "..", "data", "raw_pdfs")
        if not os.path.exists(raw_dir):
            # fallback backend/data/raw_pdfs
            raw_dir = "/app/data/raw_pdfs"
            
        if os.path.exists(raw_dir):
            pdfs = [os.path.join(raw_dir, f) for f in os.listdir(raw_dir) if f.lower().endswith(".pdf")]
            if pdfs:
                logger.info(f"{raw_dir} dizinindeki {len(pdfs)} PDF işleniyor...")
                for pdf in pdfs:
                    await process_pdf(pdf)
            else:
                logger.warning(f"{raw_dir} içinde PDF bulunamadı. Lütfen --pdf parametresi verin.")
        else:
            logger.error("Hiçbir PDF dizini bulunamadı. Lütfen --pdf <yol> şeklinde çalıştırın.")

if __name__ == "__main__":
    asyncio.run(main())
