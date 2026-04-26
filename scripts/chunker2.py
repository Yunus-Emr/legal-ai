"""
╔══════════════════════════════════════════════════════════════════╗
║         TÜRK HUKUKİ DOKÜMAN CHUNKER v3.1 - DÜZELTİLMİŞ           ║
║         Strategy Pattern + Lazy Transformer + Dataclass Pipeline ║
╚══════════════════════════════════════════════════════════════════╝

Kurulum:
    pip install pymupdf transformers torch tqdm colorama

Desteklenen türler:
    Kanun · Yönetmelik · Tebliğ · Mahkeme Kararı · Sözleşme · Anayasa
"""

from __future__ import annotations

import json
import logging
import os
import re
import uuid
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF
from colorama import Fore, Style
from colorama import init as colorama_init
from tqdm import tqdm

colorama_init(autoreset=True)


# ══════════════════════════════════════════════════════════════════
# LOGGING
# ══════════════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("chunker.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════
# CONFIG
# ══════════════════════════════════════════════════════════════════

@dataclass
class ChunkerConfig:
    dataset_path: str          = "datasets"
    output_path: str           = "chunks/chunks.jsonl"
    stats_path: str            = "chunks/stats.json"
    window_size: int           = 500
    overlap: int               = 100
    min_chunk_words: int       = 40
    long_chunk_threshold: int  = 500
    use_transformers: bool     = True
    ner_model: str             = "savasy/bert-base-turkish-ner-cased"
    device: str                = "cpu"


# ══════════════════════════════════════════════════════════════════
# PATTERNS - DÜZELTİLDİ
# ══════════════════════════════════════════════════════════════════

class Patterns:
    """Tüm regex pattern'ları tek yerde."""

    # ✅ DÜZELTME: MULTILINE eklendi + pattern güçlendirildi
    ARTICLE = re.compile(
        r"(?:GEÇİCİ\s+|EK\s+)?MADDE\s*\d+[\w/]*(?:\s*[-–—:.]\s*)?",
        re.IGNORECASE | re.MULTILINE,
    )
    KARAR = re.compile(
        r"KARAR\s*(?:NO\.?\s*:?\s*[\w/\-]+)?",
        re.IGNORECASE | re.MULTILINE,
    )
    SECTION = re.compile(
        r"(?:BİRİNCİ|İKİNCİ|ÜÇÜNCÜ|DÖRDÜNCÜ|BEŞİNCİ|"
        r"ALTINCI|YEDİNCİ|SEKİZİNCİ|DOKUZUNCU|ONUNCU|"
        r"ON\s*BİRİNCİ|ON\s*İKİNCİ)"
        r"\s+(?:BÖLÜM|KISIM|FASIL|BAŞLIK)",
        re.IGNORECASE | re.MULTILINE,
    )
    
    # Metadata - ORİJİNAL
    RG_TARIH  = re.compile(r"Resmî?\s+Gazete\s+Tarih[i:]?\s*:?\s*(\d{1,2}[./]\d{1,2}[./]\d{4})", re.IGNORECASE)
    RG_TARIH2 = re.compile(r"(\d{1,2}[./]\d{1,2}[./]\d{4})\s+tarihli\s+Resmî?\s+Gazete", re.IGNORECASE)
    RG_SAYI   = re.compile(r"Resmî?\s+Gazete\s+Say[ıi][s:]?\s*:?\s*(\d{4,6})", re.IGNORECASE)
    KANUN_NO  = re.compile(r"(?:Kanun\s+No\.?|K\.\s*No\.?)\s*:?\s*(\d{3,6})", re.IGNORECASE)
    KANUN_NO2 = re.compile(r"\b(\d{3,6})\s+sayılı\s+(?:bu\s+)?[Kk]anun", re.IGNORECASE)
    KABUL_TAR = re.compile(r"(?:Kabul|Yürürlük)\s+Tarihi\s*:?\s*(\d{1,2}[./]\d{1,2}[./]\d{4})", re.IGNORECASE)

    HEADER_SPLITTER = re.compile(
        r"((?:GEÇİCİ\s+|EK\s+)?MADDE\s*\d+[\w/]*(?:\s*[-–—:.]\s*)?|KARAR\s*(?:NO\.?\s*:?\s*[\w/\-]+)?)",
        re.IGNORECASE | re.MULTILINE,
    )

    DOC_KEYWORDS: dict[str, list[str]] = {
        "kanun":      ["kanun", "madde", "hüküm", "yaptırım"],
        "yonetmelik": ["yönetmelik", "uygulama usul"],
        "teblig":     ["tebliğ", "duyuru", "bildirim"],
        "karar":      ["karar", "mahkeme", "dava"],
        "sozlesme":   ["sözleşme", "taraf", "edim"],
        "anayasa":    ["anayasa", "temel hak"],
    }

    @classmethod
    def detect_doc_type(cls, text: str) -> str:
        lower = text.lower()
        scores = {
            dtype: sum(kw in lower for kw in kws)
            for dtype, kws in cls.DOC_KEYWORDS.items()
        }
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else "bilinmiyor"


# ══════════════════════════════════════════════════════════════════
# DATACLASSES - ORİJİNAL
# ══════════════════════════════════════════════════════════════════

@dataclass
class DocumentMetadata:
    law_name: str
    source_file: str
    doc_type: str                        = "bilinmiyor"
    kanun_no: Optional[str]              = None
    resmi_gazete_tarihi: Optional[str]   = None
    resmi_gazete_sayisi: Optional[str]   = None
    kabul_tarihi: Optional[str]          = None
    kurumlar: list                       = field(default_factory=list)
    kisiler: list                        = field(default_factory=list)
    toplam_sayfa: int                    = 0
    extraction_date: str                 = field(
        default_factory=lambda: datetime.now().isoformat(timespec="seconds")
    )


@dataclass
class ArticleBlock:
    article: str
    section: Optional[str]
    text: str
    pages: list[int]


@dataclass
class Chunk:
    chunk_id: str
    text: str
    article: str
    section: Optional[str]
    pages: list[int]
    window_index: int
    total_windows: int
    method: str
    word_count: int
    char_count: int
    metadata: DocumentMetadata

    def to_record(self) -> dict:
        base = {
            "chunk_id":      self.chunk_id,
            "text":          self.text,
            "article":       self.article,
            "section":       self.section,
            "pages":         self.pages,
            "window_index":  self.window_index,
            "total_windows": self.total_windows,
            "method":        self.method,
            "word_count":    self.word_count,
            "char_count":    self.char_count,
        }
        base.update(asdict(self.metadata))
        return base


# ══════════════════════════════════════════════════════════════════
# NER — ORİJİNAL
# ══════════════════════════════════════════════════════════════════

class NERStrategy(ABC):
    @abstractmethod
    def extract(self, text: str) -> dict[str, list[str]]:
        ...


class RegexNERStrategy(NERStrategy):
    _ORG_RE = re.compile(
        r"(?:T\.C\.)?\s*"
        r"([A-ZÇŞĞÜÖİ][a-zçşğüöı]+"
        r"(?:\s+[A-ZÇŞĞÜÖİ][a-zçşğüöı]+)*"
        r"\s+(?:Bakanlığı|Müdürlüğü|Kurumu|Kurulu|Mahkemesi|Dairesi|Genel Müdürlüğü))",
    )

    def extract(self, text: str) -> dict[str, list[str]]:
        orgs = list(dict.fromkeys(m.group(1) for m in self._ORG_RE.finditer(text)))
        return {"ORG": orgs[:5], "PER": [], "LOC": []}


class TransformerNERStrategy(NERStrategy):
    def __init__(self, model_name: str, device: str = "cpu") -> None:
        self._model_name = model_name
        self._device     = device
        self._pipeline   = None
        self._failed     = False
        self._fallback   = RegexNERStrategy()

    def _ensure_loaded(self) -> bool:
        if self._pipeline is not None:
            return True
        if self._failed:
            return False
        try:
            from transformers import (AutoModelForTokenClassification,
                                      AutoTokenizer, pipeline)

            log.info(f"{Fore.CYAN}NER modeli yükleniyor: {self._model_name}{Style.RESET_ALL}")
            tok   = AutoTokenizer.from_pretrained(self._model_name)
            model = AutoModelForTokenClassification.from_pretrained(self._model_name)
            self._pipeline = pipeline(
                "ner",
                model=model,
                tokenizer=tok,
                aggregation_strategy="simple",
                device=-1,
            )
            log.info(f"{Fore.GREEN}✓ NER modeli hazır{Style.RESET_ALL}")
            return True

        except Exception as exc:
            log.warning(
                f"{Fore.YELLOW}Transformer yüklenemedi ({exc})"
                f" → regex fallback aktif{Style.RESET_ALL}"
            )
            self._failed = True
            return False

    def extract(self, text: str) -> dict[str, list[str]]:
        if not self._ensure_loaded():
            return self._fallback.extract(text)

        entities: dict[str, list[str]] = {"ORG": [], "PER": [], "LOC": []}
        try:
            sample  = " ".join(text.split()[:600])[:2000]
            results = self._pipeline(sample)
            for ent in results:
                label = ent.get("entity_group", "")
                word  = ent.get("word", "").strip()
                if label in entities and word and word not in entities[label]:
                    entities[label].append(word)
        except Exception as exc:
            log.debug(f"NER inference hatası: {exc}")
            return self._fallback.extract(text)

        return entities


# ══════════════════════════════════════════════════════════════════
# PDF READER - ORİJİNAL
# ══════════════════════════════════════════════════════════════════

class PDFReader:
    @staticmethod
    def read(pdf_path: str) -> list[dict]:
        doc   = fitz.open(pdf_path)
        pages = [{"page": i + 1, "text": p.get_text("text")} for i, p in enumerate(doc)]
        doc.close()
        return pages

    @staticmethod
    def full_text(pages: list[dict]) -> str:
        return " ".join(p["text"] for p in pages)


# ══════════════════════════════════════════════════════════════════
# TEXT CLEANER - ORİJİNAL
# ══════════════════════════════════════════════════════════════════

class TextCleaner:
    _RULES = [
        (re.compile(r"-\n"),     ""),    
        (re.compile(r"\f"),      " "),   
        (re.compile(r"\t"),      " "),   
        (re.compile(r"\s{2,}"),  " "),   
    ]

    _FOOTNOTE_REF  = re.compile(r"(?<=[a-zçşğüöıA-ZÇŞĞÜÖİ\"»,;.)])\d{1,3}(?=\s)")
    _FOOTNOTE_BODY = re.compile(
        r"\b\d{1,3}\s+\d{1,2}[./]\d{1,2}[./]\d{4}\s+tarihli[^.]+?\.",
        re.IGNORECASE,
    )

    @classmethod
    def clean(cls, text: str) -> str:
        for pattern, repl in cls._RULES:
            text = pattern.sub(repl, text)
        return text.strip()

    @classmethod
    def remove_footnotes(cls, text: str) -> str:
        text = cls._FOOTNOTE_BODY.sub("", text)
        text = cls._FOOTNOTE_REF.sub("", text)
        text = re.sub(r"\s{2,}", " ", text)
        return text.strip()


# ══════════════════════════════════════════════════════════════════
# METADATA EXTRACTOR - ORİJİNAL
# ══════════════════════════════════════════════════════════════════

class MetadataExtractor:
    def __init__(self, ner: NERStrategy) -> None:
        self._ner = ner

    @staticmethod
    def _normalize_entities(items: list[str]) -> list[str]:
        seen:   set[str]  = set()
        result: list[str] = []
        for item in items:
            normalized = re.sub(r"\s+", " ", item).strip()
            if normalized and normalized not in seen:
                seen.add(normalized)
                result.append(normalized)
        return result

    @staticmethod
    def _kanun_no_from_filename(filename: str) -> Optional[str]:
        parts = Path(filename).stem.replace("-", ".").split(".")
        last  = parts[-1] if parts else ""
        return last if re.fullmatch(r"\d{3,6}", last) else None

    def extract(self, filename: str, text: str, pages: list[dict]) -> DocumentMetadata:
        def _group1(pattern: re.Pattern) -> Optional[str]:
            m = pattern.search(text)
            return m.group(1) if m else None

        kanun_no = (
            _group1(Patterns.KANUN_NO)
            or _group1(Patterns.KANUN_NO2)
            or self._kanun_no_from_filename(filename)
        )
        rg_tarih = (
            _group1(Patterns.RG_TARIH)
            or _group1(Patterns.RG_TARIH2)
        )

        meta = DocumentMetadata(
            law_name            = Path(filename).stem,
            source_file         = filename,
            doc_type            = Patterns.detect_doc_type(text),
            kanun_no            = kanun_no,
            resmi_gazete_tarihi = rg_tarih,
            resmi_gazete_sayisi = _group1(Patterns.RG_SAYI),
            kabul_tarihi        = _group1(Patterns.KABUL_TAR),
            toplam_sayfa        = len(pages),
        )

        entities      = self._ner.extract(text)
        meta.kurumlar = self._normalize_entities(entities.get("ORG", []))
        meta.kisiler  = self._normalize_entities(entities.get("PER", []))
        return meta


# ══════════════════════════════════════════════════════════════════
# ARTICLE SPLITTER - DÜZELTİLDİ (ASIL SORUN BURASIYDI)
# ══════════════════════════════════════════════════════════════════

class ArticleSplitter:
    """
    MADDE / KARAR bazlı bloklara ayırır - DÜZELTİLDİ.
    """

    def __init__(self, config: ChunkerConfig) -> None:
        self._min_words = config.min_chunk_words

    @staticmethod
    def _is_header(part: str) -> bool:
        stripped = part.strip()
        return bool(
            Patterns.ARTICLE.fullmatch(stripped)
            or Patterns.KARAR.fullmatch(stripped)
        )

    def split(self, pages: list[dict]) -> list[ArticleBlock]:
        """✅ DÜZELTME: Header'ları regex ile bul + aralarını böl"""
        blocks: list[ArticleBlock] = []
        
        full_text = PDFReader.full_text(pages)
        headers = list(Patterns.HEADER_SPLITTER.finditer(full_text))
        
        if not headers:
            # Header yoksa tek blok
            clean_text = TextCleaner.clean(full_text)
            if len(clean_text.split()) >= self._min_words:
                blocks.append(ArticleBlock(
                    article="TAM_METIN",
                    section=None,
                    text=clean_text,
                    pages=[p["page"] for p in pages],
                ))
            return blocks

        cur_article = "GİRİŞ"
        cur_section: Optional[str] = None
        prev_end = 0

        for i, header_match in enumerate(headers):
            header_text = header_match.group(1).strip()
            
            # Önceki bloğu al
            block_start = prev_end
            block_end = header_match.start()
            block_text = full_text[block_start:block_end].strip()
            
            if block_text:
                clean_block = TextCleaner.clean(block_text)
                if len(clean_block.split()) >= self._min_words:
                    # Section kontrolü
                    sec_match = Patterns.SECTION.search(full_text[max(0, block_start-200):block_end])
                    cur_section = sec_match.group(0).strip() if sec_match else cur_section
                    
                    blocks.append(ArticleBlock(
                        article=cur_article,
                        section=cur_section,
                        text=clean_block,
                        pages=self._get_pages_for_range(pages, block_start, block_end),
                    ))

            # Yeni header ayarla
            cur_article = header_text
            prev_end = header_match.end()

        # Son blok
        last_block = full_text[prev_end:].strip()
        if last_block:
            clean_last = TextCleaner.clean(last_block)
            if len(clean_last.split()) >= self._min_words:
                blocks.append(ArticleBlock(
                    article=cur_article,
                    section=cur_section,
                    text=clean_last,
                    pages=self._get_pages_for_range(pages, prev_end, len(full_text)),
                ))

        return blocks

    def _get_pages_for_range(self, pages: list[dict], start: int, end: int) -> list[int]:
        """Text range için sayfaları tahmin et."""
        page_texts = [p["text"] for p in pages]
        cumulative = 0
        page_nums = []
        
        for i, page_text in enumerate(page_texts):
            cumulative += len(page_text)
            if start < cumulative:
                page_nums.append(pages[i]["page"])
            if end <= cumulative:
                break
        return page_nums or [1]


# ══════════════════════════════════════════════════════════════════
# CHUNKING STRATEGIES - ORİJİNAL
# ══════════════════════════════════════════════════════════════════

class ChunkingStrategy(ABC):
    @abstractmethod
    def chunk(self, block: ArticleBlock, metadata: DocumentMetadata) -> list[Chunk]:
        ...


class DirectChunkingStrategy(ChunkingStrategy):
    def chunk(self, block: ArticleBlock, metadata: DocumentMetadata) -> list[Chunk]:
        clean = TextCleaner.remove_footnotes(block.text)
        return [Chunk(
            chunk_id      = str(uuid.uuid4()),
            text          = clean,
            article       = block.article,
            section       = block.section,
            pages         = block.pages,
            window_index  = 0,
            total_windows = 1,
            method        = "structure",
            word_count    = len(clean.split()),
            char_count    = len(clean),
            metadata      = metadata,
        )]


class SlidingWindowStrategy(ChunkingStrategy):
    def __init__(self, window_size: int, overlap: int, min_words: int) -> None:
        self._window   = window_size
        self._overlap  = overlap
        self._min      = min_words

    def _make_windows(self, text: str, header: str) -> list[str]:
        clean  = TextCleaner.remove_footnotes(text)
        words  = clean.split()
        step   = self._window - self._overlap
        result = []
        for start in range(0, len(words), step):
            chunk_words = words[start : start + self._window]
            if len(chunk_words) < self._min:
                break
            result.append(f"[{header}] " + " ".join(chunk_words))
        return result or [text]

    def chunk(self, block: ArticleBlock, metadata: DocumentMetadata) -> list[Chunk]:
        windows       = self._make_windows(block.text, block.article)
        total         = len(windows)
        all_pages     = block.pages
        pages_per_win = max(1, len(all_pages) // total) if all_pages else 1

        chunks = []
        for idx, win in enumerate(windows):
            start_p   = idx * pages_per_win
            end_p     = start_p + pages_per_win + 1
            win_pages = all_pages[start_p:end_p] or all_pages[-1:]
            chunks.append(Chunk(
                chunk_id      = str(uuid.uuid4()),
                text          = win,
                article       = block.article,
                section       = block.section,
                pages         = win_pages,
                window_index  = idx,
                total_windows = total,
                method        = "hybrid_sliding",
                word_count    = len(win.split()),
                char_count    = len(win),
                metadata      = metadata,
            ))
        return chunks


class HybridChunker:
    def __init__(self, config: ChunkerConfig) -> None:
        self._threshold = config.long_chunk_threshold
        self._direct    = DirectChunkingStrategy()
        self._sliding   = SlidingWindowStrategy(
            window_size = config.window_size,
            overlap     = config.overlap,
            min_words   = config.min_chunk_words,
        )

    def process(self, blocks: list[ArticleBlock], metadata: DocumentMetadata) -> list[Chunk]:
        chunks: list[Chunk] = []
        for block in blocks:
            strategy = (
                self._sliding
                if len(block.text.split()) >= self._threshold
                else self._direct
            )
            chunks.extend(strategy.chunk(block, metadata))
        return chunks


# ══════════════════════════════════════════════════════════════════
# STATISTICS - ORİJİNAL
# ══════════════════════════════════════════════════════════════════

class StatsCollector:
    @staticmethod
    def compute(chunks: list[Chunk]) -> dict:
        if not chunks:
            return {}

        wc = [c.word_count for c in chunks]
        cc = [c.char_count for c in chunks]

        method_dist   = {}
        doctype_dist  = {}
        for c in chunks:
            method_dist[c.method]                      = method_dist.get(c.method, 0) + 1
            dt = c.metadata.doc_type
            doctype_dist[dt]                           = doctype_dist.get(dt, 0) + 1

        return {
            "toplam_chunk":    len(chunks),
            "ort_kelime":      round(sum(wc) / len(wc), 1),
            "min_kelime":      min(wc),
            "max_kelime":      max(wc),
            "ort_karakter":    round(sum(cc) / len(cc), 1),
            "chunking_metodu": method_dist,
            "dokuman_tipleri": doctype_dist,
            "olusturulma":     datetime.now().isoformat(timespec="seconds"),
        }


# ══════════════════════════════════════════════════════════════════
# PDF PROCESSOR - ORİJİNAL
# ══════════════════════════════════════════════════════════════════

class PDFProcessor:
    def __init__(
        self,
        config:   ChunkerConfig,
        splitter: ArticleSplitter,
        chunker:  HybridChunker,
        meta_ext: MetadataExtractor,
    ) -> None:
        self._config   = config
        self._splitter = splitter
        self._chunker  = chunker
        self._meta_ext = meta_ext

    def process(self, pdf_path: str) -> list[Chunk]:
        filename = Path(pdf_path).name
        log.info(f"  → {filename} işleniyor…")

        pages    = PDFReader.read(pdf_path)
        text     = PDFReader.full_text(pages)
        metadata = self._meta_ext.extract(filename, text, pages)
        blocks   = self._splitter.split(pages)

        log.info(f"     {len(blocks)} blok bulundu")

        chunks = self._chunker.process(blocks, metadata)
        log.info(f"     {len(chunks)} chunk üretildi")
        return chunks


# ══════════════════════════════════════════════════════════════════
# PIPELINE - ORİJİNAL
# ══════════════════════════════════════════════════════════════════

class ChunkerPipeline:
    def __init__(self, config: ChunkerConfig) -> None:
        self._config = config

        ner_strategy = (
            TransformerNERStrategy(config.ner_model, config.device)
            if config.use_transformers
            else RegexNERStrategy()
        )

        self._processor = PDFProcessor(
            config   = config,
            splitter = ArticleSplitter(config),
            chunker  = HybridChunker(config),
            meta_ext = MetadataExtractor(ner_strategy),
        )

    def run(self) -> None:
        Path("chunks").mkdir(parents=True, exist_ok=True)

        pdf_files = [
            f for f in os.listdir(self._config.dataset_path)
            if f.lower().endswith(".pdf")
        ]
        if not pdf_files:
            log.error(f"'{self._config.dataset_path}' içinde PDF bulunamadı!")
            return

        log.info(f"\n{Fore.CYAN}{'─' * 52}")
        log.info(f"  CHUNKER BAŞLADI  |  {len(pdf_files)} PDF")
        log.info(f"{'─' * 52}{Style.RESET_ALL}\n")

        all_chunks: list[Chunk] = []
        for filename in tqdm(pdf_files, desc="PDF işleniyor", colour="cyan"):
            pdf_path = os.path.join(self._config.dataset_path, filename)
            try:
                all_chunks.extend(self._processor.process(pdf_path))
            except Exception as exc:
                log.error(f"{Fore.RED}HATA [{filename}]: {exc}{Style.RESET_ALL}")

        self._save_jsonl(all_chunks)
        self._save_stats(all_chunks)
        self._print_summary(all_chunks)

    def _save_jsonl(self, chunks: list[Chunk]) -> None:
        with open(self._config.output_path, "w", encoding="utf-8") as f:
            for chunk in chunks:
                f.write(json.dumps(chunk.to_record(), ensure_ascii=False) + "\n")

    def _save_stats(self, chunks: list[Chunk]) -> None:
        stats = StatsCollector.compute(chunks)
        with open(self._config.stats_path, "w", encoding="utf-8") as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)

    def _print_summary(self, chunks: list[Chunk]) -> None:
        stats = StatsCollector.compute(chunks)
        log.info(f"\n{Fore.GREEN}{'═' * 52}")
        log.info(f"  ✓ TAMAMLANDI")
        log.info(f"  Toplam chunk  : {stats.get('toplam_chunk', 0)}")
        log.info(f"  Ort. kelime   : {stats.get('ort_kelime', 0)}")
        log.info(f"  Çıktı         : {self._config.output_path}")
        log.info(f"  İstatistik    : {self._config.stats_path}")
        log.info(f"{'═' * 52}{Style.RESET_ALL}\n")


# ══════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    ChunkerPipeline(ChunkerConfig()).run()