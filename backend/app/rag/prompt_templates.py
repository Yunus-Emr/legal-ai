"""
Prompt Templates — Hukuki QA promptları
"""

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
