"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Scale,
  BookOpen,
  AlertCircle,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import api from "@/lib/api";

interface SearchHit {
  chunk_id: string;
  document_name: string;
  text: string;
  score: number;
  page?: number;
}

interface SearchResponse {
  query: string;
  results: SearchHit[];
  total: number;
}

const EXAMPLE_QUERIES = [
  "İş sözleşmesinin feshi ve kıdem tazminatı şartları",
  "Kira sözleşmesinde kiracının hakları",
  "İşçi hakları ve fazla mesai ücreti",
  "Tüketici hakkı ve ayıplı mal iade",
];

export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searched, setSearched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (q?: string) => {
    const searchQuery = (q || query).trim();
    if (!searchQuery) return;

    setQuery(searchQuery);
    setIsLoading(true);
    setError(null);
    setResults([]);
    setSearched(true);
    setExpandedId(null);

    try {
      const res = await api.post<SearchResponse>("/api/v1/search", {
        query: searchQuery,
        top_k: 8,
      });
      setResults(res.data.results || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Arama servisi yanıt veremedi. Lütfen tekrar deneyin.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0E1A] overflow-hidden">
      {/* Hero search area */}
      <div className="flex-shrink-0 flex flex-col items-center px-8 pt-10 pb-6">
        <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(59,111,232,0.2)]">
          <Scale className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-semibold mb-1 tracking-tight text-foreground">
          Legal Research Engine
        </h1>
        <p className="text-muted-foreground mb-6 text-center max-w-xl text-sm">
          Türk hukuk mevzuatı üzerinde doğal dil ile anlam tabanlı arama yapın.
        </p>

        {/* Search bar */}
        <div className="w-full max-w-3xl relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-ai-accent rounded-xl blur opacity-20 group-focus-within:opacity-50 transition duration-500" />
          <div className="relative flex items-center bg-[#111827] border border-border rounded-xl shadow-lg p-2">
            <Search className="w-5 h-5 text-muted-foreground ml-3 shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Örn: İşçi kıdem tazminatı şartları nelerdir?"
              className="border-0 bg-transparent focus-visible:ring-0 text-base py-6 w-full mx-2"
            />
            <Button
              onClick={() => handleSearch()}
              disabled={isLoading || !query.trim()}
              className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6 h-10 ml-1 font-medium shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Ara"
              )}
            </Button>
          </div>
        </div>

        {/* Example queries */}
        {!searched && (
          <div className="flex flex-wrap gap-2 mt-5 justify-center max-w-2xl">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => handleSearch(q)}
                className="text-xs px-3 py-1.5 bg-[#1A2235] border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
              >
                <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Quick links (before search) */}
        {!searched && (
          <div className="grid grid-cols-2 gap-3 mt-6 w-full max-w-3xl">
            <div className="flex items-start gap-3 p-4 bg-[#111827] border border-border rounded-xl">
              <BookOpen className="w-5 h-5 text-ai-accent mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-sm text-foreground">Kanun Veritabanı</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  3.638 chunk — 4857 sayılı İş Kanunu ve diğerleri
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-[#111827] border border-border rounded-xl">
              <AlertCircle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-sm text-foreground">Anlam Tabanlı Arama</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  multilingual-e5-large + OpenSearch kNN
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto mb-4 flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="max-w-3xl mx-auto space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 bg-[#111827] border border-border rounded-xl animate-pulse"
              >
                <div className="h-3 bg-border rounded w-1/3 mb-3" />
                <div className="h-2 bg-border rounded w-full mb-2" />
                <div className="h-2 bg-border rounded w-5/6" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!isLoading && results.length > 0 && (
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-muted-foreground mb-3">
              <span className="text-foreground font-medium">{results.length}</span> sonuç bulundu — &quot;{query}&quot;
            </p>
            <div className="space-y-3">
              {results.map((hit) => {
                const isExpanded = expandedId === hit.chunk_id;
                const previewText = hit.text.slice(0, 200);
                const hasMore = hit.text.length > 200;

                return (
                  <div
                    key={hit.chunk_id}
                    className="p-5 bg-[#111827] border border-border rounded-xl hover:border-primary/40 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">
                          {hit.document_name || "Bilinmeyen Belge"}
                        </span>
                        {hit.page && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            s.{hit.page}
                          </span>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="shrink-0 text-xs border-primary/30 text-primary/80"
                      >
                        {(hit.score * 100).toFixed(0)}% eşleşme
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isExpanded ? hit.text : previewText}
                      {!isExpanded && hasMore && "..."}
                    </p>

                    {hasMore && (
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : hit.chunk_id)
                        }
                        className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" /> Daha az göster
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" /> Devamını gör
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No results */}
        {!isLoading && searched && results.length === 0 && !error && (
          <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm">
              &quot;{query}&quot; için sonuç bulunamadı.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Farklı anahtar kelimeler deneyin veya veri tabanının yüklendiğinden emin olun.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
