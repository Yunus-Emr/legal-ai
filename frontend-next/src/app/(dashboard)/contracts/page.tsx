"use client";

/**
 * Contract Analysis Page
 *
 * - Kullanıcı mevcut corpus'tan bir doküman seçer
 * - "Analyze" butonuna basınca AI Canvas'a yönlendirir
 *   veya anlık RAG + Chat API ile risk analizi yapar
 * - Risk skoru, riskli maddeler ve öneri listesi gösterilir
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileSignature,
  Loader2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  FileText,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { documentsApi, type Document, chatApi } from "@/lib/api";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface RiskClause {
  clause: string;
  risk: "High" | "Medium" | "Low";
  reason: string;
  recommendation: string;
}

interface AnalysisResult {
  overallRisk: "High" | "Medium" | "Low";
  score: number; // 0-100 (100 = highest risk)
  summary: string;
  clauses: RiskClause[];
  rawAnswer: string;
}

const RISK_COLORS: Record<string, string> = {
  High: "text-danger bg-danger/10 border-danger/30",
  Medium: "text-warning bg-warning/10 border-warning/30",
  Low: "text-success bg-success/10 border-success/30",
};

const RISK_ICONS: Record<string, React.ReactNode> = {
  High: <ShieldAlert className="w-4 h-4" />,
  Medium: <AlertTriangle className="w-4 h-4" />,
  Low: <CheckCircle className="w-4 h-4" />,
};

/* ── Gauge ─────────────────────────────────────────────────────────────── */
function RiskGauge({ score }: { score: number }) {
  const color = score >= 70 ? "#EF4444" : score >= 40 ? "#F59E0B" : "#10B981";
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-border" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold font-mono" style={{ color }}>{score}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk</span>
      </div>
    </div>
  );
}

/* ── Parse AI response ─────────────────────────────────────────────────── */
function parseAnalysis(raw: string, docName: string): AnalysisResult {
  // Simple heuristic parse — score estimation from keyword density
  const highCount = (raw.match(/\b(high risk|critical|risky|violation|breach|penalt|unlimited liability)\b/gi) || []).length;
  const medCount = (raw.match(/\b(medium|moderate|concern|clause|review|attention)\b/gi) || []).length;

  const score = Math.min(100, highCount * 15 + medCount * 5);
  const overallRisk: "High" | "Medium" | "Low" = score >= 60 ? "High" : score >= 30 ? "Medium" : "Low";

  // Extract summary (first 2 sentences)
  const sentences = raw.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  const summary = sentences.slice(0, 2).join(". ").trim() + ".";

  // Build synthetic clauses from paragraphs
  const paragraphs = raw.split("\n").filter((l) => l.trim().length > 40);
  const clauses: RiskClause[] = paragraphs.slice(0, 5).map((para, i) => {
    const risk: "High" | "Medium" | "Low" = i === 0 && highCount > 2 ? "High" : i < 3 && medCount > 1 ? "Medium" : "Low";
    return {
      clause: `Madde ${i + 1}: ${para.slice(0, 80)}...`,
      risk,
      reason: para.slice(0, 120),
      recommendation: risk === "High" ? "Bu maddeyi hukuki danışmanla gözden geçirin." : risk === "Medium" ? "İnceleme sırasında dikkat edin." : "Mevcut haliyle uygun görünüyor.",
    };
  });

  return { overallRisk, score, summary, clauses, rawAnswer: raw };
}

/* ── Main ──────────────────────────────────────────────────────────────── */
export default function ContractsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    documentsApi.list().then((res) => {
      setDocuments(res.data.documents.filter((d) => d.status === "indexed"));
      setIsLoadingDocs(false);
    }).catch(() => setIsLoadingDocs(false));
  }, []);

  const handleAnalyze = async () => {
    if (!selectedDoc) return;
    setIsAnalyzing(true);
    setResult(null);
    setAnalysisError(null);

    try {
      const query = `[Role: Contract Review, Jurisdiction: Turkey]
[Primary Context Document: ${selectedDoc.filename}]
Bu sözleşmenin tüm maddelerini hukuki risk açısından analiz et. Her madde için risk seviyesini (High/Medium/Low) belirt, riskli bölümleri açıkla ve öneriler sun. Genel risk skorunu da vererek başla.`;

      const res = await chatApi.send(query);
      const parsed = parseAnalysis(res.data.answer, selectedDoc.filename);
      setResult(parsed);
    } catch (err: any) {
      setAnalysisError(err?.response?.data?.detail || "Analiz sırasında bir hata oluştu.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 h-full overflow-y-auto font-sans">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Contract Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI ile sözleşmelerinizi risk açısından analiz edin ve zayıf noktaları tespit edin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* LEFT: Document selector */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="bg-surface border-border sticky top-0">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Sözleşme Seç
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {isLoadingDocs ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Dokümanlar yükleniyor...</span>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">İndekslenmiş doküman bulunamadı.</p>
                  <p className="text-xs mt-1">Documents sekmesine gidip PDF yükleyin.</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => { setSelectedDoc(doc); setResult(null); }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedDoc?.id === doc.id
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-elevated/40 hover:border-primary/30 hover:bg-elevated"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileSignature className={`w-4 h-4 shrink-0 ${selectedDoc?.id === doc.id ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium truncate">{doc.filename}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 ml-6 font-mono">{doc.chunk_count} chunks</p>
                  </button>
                ))
              )}

              <Button
                onClick={handleAnalyze}
                disabled={!selectedDoc || isAnalyzing}
                className="w-full bg-primary hover:bg-primary/90 text-white mt-2"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analiz ediliyor...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> AI ile Analiz Et</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Result */}
        <div className="col-span-12 lg:col-span-8">
          <AnimatePresence mode="wait">
            {/* Empty state */}
            {!result && !isAnalyzing && !analysisError && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-80 text-center text-muted-foreground border border-dashed border-border rounded-2xl"
              >
                <FileSignature className="w-10 h-10 mb-4 opacity-20" />
                <p className="font-medium">Bir sözleşme seçin ve analiz başlatın</p>
                <p className="text-sm mt-1 opacity-60">AI, riskli maddeleri tespit edecek ve öneriler sunacak.</p>
              </motion.div>
            )}

            {/* Loading */}
            {isAnalyzing && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-80 gap-4 border border-dashed border-primary/30 rounded-2xl bg-primary/5"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-2 border-primary/20 rounded-full" />
                  <Loader2 className="w-16 h-16 absolute inset-0 animate-spin text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Sözleşme analiz ediliyor...</p>
                  <p className="text-xs text-muted-foreground mt-1">AI hukuki risk değerlendirmesi yapıyor.</p>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {analysisError && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {analysisError}
                <Button variant="ghost" size="sm" onClick={() => { setAnalysisError(null); handleAnalyze(); }} className="ml-auto text-xs">
                  <RefreshCw className="w-3 h-3 mr-1" /> Tekrar Dene
                </Button>
              </motion.div>
            )}

            {/* Result */}
            {result && (
              <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                {/* Overview Card */}
                <Card className="bg-surface border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      <RiskGauge score={result.score} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-xs px-2 py-1 border ${RISK_COLORS[result.overallRisk]}`}>
                            {RISK_ICONS[result.overallRisk]}
                            <span className="ml-1">{result.overallRisk} Risk</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">{selectedDoc?.filename}</span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">{result.summary}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Clauses */}
                <Card className="bg-surface border-border">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-base">Tespit Edilen Risk Maddeleri ({result.clauses.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {result.clauses.map((clause, i) => (
                        <div key={i} className="p-4 hover:bg-elevated/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${RISK_COLORS[clause.risk]}`}>
                              {RISK_ICONS[clause.risk]} {clause.risk}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground mb-1">{clause.clause}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed mb-2">{clause.reason}</p>
                              <div className="flex items-start gap-1.5 text-xs text-primary">
                                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                                {clause.recommendation}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Open in AI Canvas */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => window.location.href = "/ai-canvas"}
                  >
                    AI Canvas'ta Detaylı Sorgula <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
