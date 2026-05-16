"""
Prompt Templates — Hukuki QA promptları

DURUM: Bu dosyadaki promptlar artık kullanılmıyor.
Aktif promptlar app/services/rag_service.py içinde LEGAL_COT_PROMPT ve NO_DOCS_PROMPT
olarak tanımlıdır (conversational memory ve CoT destekli, daha gelişmiş versiyonlar).

Bu dosya ilerideki refactoring için referans olarak tutulmaktadır.
Yeni geliştirmelerde rag_service.py'deki promptları güncelleyin.
"""

# ─── KULLANILMIYOR — Referans amaçlı bırakılmıştır ────────────────────────

LEGAL_QA_PROMPT = """Sen uzman bir Türk hukuk asistanısın. Aşağıdaki hukuki doküman bölümlerine dayanarak kullanıcının sorusunu yanıtla.

## Kaynak Doküman Bölümleri
{context}

## Kullanıcı Sorusu
{question}

## Yanıt Kuralları
- Yalnızca verilen kaynaklara dayan; varsayımda bulunma
- Eğer kaynaklarda yanıt yoksa bunu açıkça belirt
- Hukuki terimler kullanırken Türkçe ve anlaşılır açıklamalar yap
- Yanıtın sonunda kaynaklandığın madde/bölümü belirt
- Yanıtı markdown formatında yaz

## Yanıt:"""

SUMMARY_PROMPT = """Aşağıdaki hukuki dokümanı Türkçe olarak özetle. Önemli maddeleri, tarafların yükümlülüklerini ve kritik koşulları vurgula.

## Doküman İçeriği
{content}

## Özet:"""

KEYWORD_EXTRACTION_PROMPT = """Aşağıdaki hukuki metinden önemli anahtar kelimeleri ve hukuki kavramları çıkar.

## Metin
{text}

## Anahtar Kelimeler (virgülle ayır):"""
