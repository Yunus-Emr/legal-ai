"use client";

/**
 * Documents / Corpus Page — Multi-Language Dynamic Translation
 */

import { useEffect, useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  UploadCloud,
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Database,
  Sparkles,
  Bot,
  Brain,
} from "lucide-react";
import { documentsApi, type Document as AppDocument, chatApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

/* ── Translations ──────────────────────────────────────────────────────── */
const TRANSLATIONS = {
  tr: {
    title: "Doküman Havuzu (Corpus)",
    subtitle: "Merkezi hukuki bilgi tabanı. PDF yükleyin, AI embeddings oluşturun.",
    refresh: "Yenile",
    uploadBtn: "Dosya Yükle",
    uploading: "İşleniyor...",
    searchPlaceholder: "Doküman adı ile ara...",
    totalDocs: "Toplam Doküman",
    indexed: "İndekslenmiş",
    processing: "İşleniyor",
    totalChunks: "Toplam Chunk",
    colName: "Ad",
    colSize: "Boyut",
    colDate: "Yükleme Tarihi",
    colStatus: "AI Durumu",
    colChunks: "Chunks",
    loading: "Dokümanlar yükleniyor...",
    noResults: "sonuç bulunamadı.",
    noDocs: "Corpus'ta doküman bulunamadı. PDF yükleyin.",
    confirmDelete: "Bu dokümanı silmek istediğinizden emin misiniz? Tüm AI embeddings kaldırılacak.",
    statusIndexed: "İndekslendi",
    statusProcessing: "İşleniyor",
    statusError: "Hata"
  },
  en: {
    title: "Document Corpus",
    subtitle: "Centralized legal knowledge base. Upload PDFs, generate AI embeddings.",
    refresh: "Refresh",
    uploadBtn: "Upload Document",
    uploading: "Processing...",
    searchPlaceholder: "Search by document name...",
    totalDocs: "Total Documents",
    indexed: "Indexed",
    processing: "Processing",
    totalChunks: "Total Chunks",
    colName: "Name",
    colSize: "Size",
    colDate: "Upload Date",
    colStatus: "AI Status",
    colChunks: "Chunks",
    loading: "Loading documents...",
    noResults: "no results found.",
    noDocs: "No documents in corpus. Upload a file.",
    confirmDelete: "Are you sure you want to delete this document? All AI embeddings will be removed.",
    statusIndexed: "Indexed",
    statusProcessing: "Processing",
    statusError: "Error"
  }
};

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function StatusBadge({ status, t }: { status: AppDocument["status"]; t: any }) {
  if (status === "indexed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold bg-success/10 text-success border border-success/20">
        <CheckCircle2 className="w-3 h-3" />
        {t.statusIndexed}
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold bg-warning/10 text-warning border border-warning/20">
        <Loader2 className="w-3 h-3 animate-spin" />
        {t.statusProcessing}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold bg-danger/10 text-danger border border-danger/20">
      <XCircle className="w-3 h-3" />
      {t.statusError}
    </span>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lang, setLang] = useState<"tr" | "en">("tr");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* AI Document Analysis Side-over Panel (Drawer) States & Handlers */
  const [analyzingDoc, setAnalyzingDoc] = useState<AppDocument | null>(null);
  const [drawerTab, setDrawerTab] = useState<"summary" | "risks" | "chat">("summary");
  const [summaryText, setSummaryText] = useState("");
  const [risksText, setRisksText] = useState("");
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [drawerChat, setDrawerChat] = useState<{ sender: "user" | "ai"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  const handleOpenAnalysis = async (doc: AppDocument) => {
    setAnalyzingDoc(doc);
    setDrawerTab("summary");
    setSummaryText("");
    setRisksText("");
    setDrawerChat([
      { sender: "ai", text: `Merhaba! **${doc.filename}** dokümanı hakkında analiz yapmaya hazırım. Yukarıdaki sekmelerden hazır analizleri inceleyebilir ya da bana doğrudan doküman ile ilgili sorular sorabilirsiniz.` }
    ]);
    setIsLoadingAnalysis(true);

    try {
      // Run automatic quick summary
      const query = `[Role: Executive Summary, Document: ${doc.filename}] Bu dokümanın ana konusunu, taraflarını ve 3 maddelik yönetici özetini çıkar.`;
      const res = await chatApi.send(query);
      setSummaryText(res.data.answer);

      // Run automatic risk analysis
      const riskQuery = `[Role: Legal Risk Compliance, Document: ${doc.filename}] Bu dokümandaki kritik hukuki riskleri ve dikkat edilmesi gereken uyuşmazlık noktalarını liste halinde belirt.`;
      const riskRes = await chatApi.send(riskQuery);
      setRisksText(riskRes.data.answer);
    } catch (err) {
      setSummaryText("Analiz yüklenirken bir hata oluştu veya bakiye yetersiz.");
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleSendDrawerChat = async () => {
    if (!chatInput.trim() || !analyzingDoc) return;
    const userMsg = chatInput;
    setDrawerChat((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setIsSendingChat(true);

    try {
      const query = `[Context Document: ${analyzingDoc.filename}] ${userMsg}`;
      const res = await chatApi.send(query);
      setDrawerChat((prev) => [...prev, { sender: "ai", text: res.data.answer }]);
    } catch (err) {
      setDrawerChat((prev) => [...prev, { sender: "ai", text: "Sorgu sırasında bir hata oluştu." }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  /* Dynamic Translation Hook */
  useEffect(() => {
    const loadLang = () => {
      try {
        const p = JSON.parse(localStorage.getItem("lexai_prefs") || "{}");
        if (p.lang === "tr" || p.lang === "en") setLang(p.lang);
      } catch {}
    };
    loadLang();
    window.addEventListener("lexai_prefs_changed", loadLang);
    return () => window.removeEventListener("lexai_prefs_changed", loadLang);
  }, []);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;

  const fetchDocuments = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const { data } = await documentsApi.list();
      setDocuments(data.documents);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(() => fetchDocuments(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(
    () =>
      documents.filter(
        (d) =>
          !search ||
          d.filename.toLowerCase().includes(search.toLowerCase())
      ),
    [documents, search]
  );

  const stats = useMemo(
    () => ({
      total: documents.length,
      indexed: documents.filter((d) => d.status === "indexed").length,
      processing: documents.filter((d) => d.status === "processing").length,
      totalChunks: documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0),
    }),
    [documents]
  );

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const { data } = await documentsApi.upload(Array.from(files));
      setDocuments((prev) => {
        const merged = [...data.documents, ...prev];
        return merged.filter(
          (doc, idx, self) => idx === self.findIndex((t) => t.id === doc.id)
        );
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setUploadError(
        err.response?.data?.detail || err.message || "Upload failed"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;

    setDocuments((prev) => prev.filter((d) => d.id !== id));
    try {
      await documentsApi.delete(id);
    } catch (err) {
      console.error("Failed to delete", err);
      fetchDocuments();
    }
  };

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col font-sans bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {uploadError && (
            <div className="flex items-center gap-2 text-sm text-danger bg-danger/10 px-3 py-2 rounded-lg border border-danger/20 max-w-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate text-xs">{uploadError}</span>
            </div>
          )}
          <button
            onClick={() => fetchDocuments(true)}
            disabled={isRefreshing}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-elevated/60 transition-colors disabled:opacity-50"
            title={t.refresh}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept=".pdf,.txt,.docx"
          />
          <Button
            className="bg-primary hover:bg-primary/90 text-white transition-all shadow-md"
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4 mr-2" />
            )}
            {isUploading ? t.uploading : t.uploadBtn}
          </Button>
        </div>
      </div>

      {/* Stats row */}
      {!isLoading && documents.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
          {[
            { label: t.totalDocs, value: stats.total, icon: FileText, color: "text-primary bg-primary/10 border-primary/20" },
            { label: t.indexed, value: stats.indexed, icon: CheckCircle2, color: "text-success bg-success/10 border-success/20" },
            { label: t.processing, value: stats.processing, icon: Clock, color: "text-warning bg-warning/10 border-warning/20" },
            { label: t.totalChunks, value: stats.totalChunks.toLocaleString(), icon: Database, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
          ].map((s) => (
            <Card key={s.label} className="glass-panel border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-semibold text-foreground">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-surface border-border text-foreground"
          />
        </div>
        {search && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} / {documents.length} {t.totalDocs.toLowerCase()}
          </span>
        )}
      </div>

      {/* Document Table */}
      <div className="flex-1 overflow-hidden min-h-0">
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border bg-elevated/50 sticky top-0 z-10 select-none">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t.colName}</th>
                  <th className="px-6 py-4 font-semibold">{t.colSize}</th>
                  <th className="px-6 py-4 font-semibold">{t.colDate}</th>
                  <th className="px-6 py-4 font-semibold">{t.colStatus}</th>
                  <th className="px-6 py-4 font-semibold text-center">{t.colChunks}</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 opacity-50" />
                      {t.loading}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      {search
                        ? `"${search}" ${t.noResults}`
                        : t.noDocs}
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {filtered.map((doc) => (
                      <motion.tr
                        key={doc.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="hover:bg-elevated/50 transition-colors group"
                      >
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              doc.status === "error"
                                ? "bg-danger/10 text-danger animate-pulse"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                          </div>
                          <span
                            className="font-semibold text-foreground truncate max-w-[240px]"
                            title={doc.filename}
                          >
                            {doc.filename}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                          {formatBytes(doc.size_bytes)}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {new Date(doc.created_at).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={doc.status} t={t} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          {doc.status === "indexed" ? (
                            <span className="text-xs font-mono text-muted-foreground bg-elevated/60 px-2 py-1 rounded">
                              {doc.chunk_count}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                          {doc.status === "indexed" && (
                            <button
                              onClick={() => handleOpenAnalysis(doc)}
                              className="text-primary hover:text-primary-foreground p-2 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
                              title="AI Analiz Et"
                            >
                              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-muted-foreground hover:text-danger p-2 rounded-lg hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Analysis Slide-over Drawer */}
      <AnimatePresence>
        {analyzingDoc && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setAnalyzingDoc(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-pointer"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-surface border-l border-border shadow-2xl z-50 flex flex-col h-full overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-border flex items-center justify-between shrink-0 relative bg-elevated/40">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate text-foreground pr-8 animate-pulse" title={analyzingDoc.filename}>
                      {analyzingDoc.filename}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">Yapay Zeka Analiz Merkezi</p>
                  </div>
                </div>
                <button
                  onClick={() => setAnalyzingDoc(null)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-elevated transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-4 py-2 border-b border-border bg-elevated/20 flex gap-2 shrink-0">
                {[
                  { id: "summary", label: "Özet" },
                  { id: "risks", label: "Risk Analizi" },
                  { id: "chat", label: "Belgeye Soru Sor" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      drawerTab === tab.id
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "border-transparent text-muted-foreground hover:bg-elevated hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 min-h-0 flex flex-col">
                {isLoadingAnalysis && (
                  <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground text-sm py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span>Yapay zeka analiz ediyor...</span>
                  </div>
                )}

                {!isLoadingAnalysis && drawerTab === "summary" && (
                  <div className="text-xs leading-relaxed text-foreground whitespace-pre-wrap bg-elevated/25 p-4 rounded-xl border border-border/50 shadow-inner">
                    {summaryText || "Özet oluşturulamadı veya bakiye yetersiz."}
                  </div>
                )}

                {!isLoadingAnalysis && drawerTab === "risks" && (
                  <div className="text-xs leading-relaxed text-foreground whitespace-pre-wrap bg-danger/5 p-4 rounded-xl border border-danger/25 text-foreground/90">
                    {risksText || "Risk değerlendirmesi yapılamadı."}
                  </div>
                )}

                {drawerTab === "chat" && (
                  <div className="flex flex-col flex-1 h-full min-h-0 justify-between">
                    <div className="space-y-4 overflow-y-auto pr-1 flex-1 mb-4 max-h-[420px]">
                      {drawerChat.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2.5 max-w-[85%] ${
                            msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                          }`}
                        >
                          <div className={`p-1.5 rounded-full shrink-0 ${
                            msg.sender === "user" ? "bg-primary/20 text-primary" : "bg-ai-accent/20 text-ai-accent"
                          }`}>
                            {msg.sender === "user" ? <FileText className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                          </div>
                          <div className={`text-xs p-3 rounded-xl border ${
                            msg.sender === "user"
                              ? "bg-primary/10 text-foreground border-primary/20"
                              : "bg-surface text-foreground border-border/80"
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                      {isSendingChat && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-3">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Yapay zeka yanıt yazıyor...</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 border-t border-border pt-4 mt-auto">
                      <Input
                        placeholder="Bu belgeye dair bir soru sorun..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendDrawerChat()}
                        className="bg-surface border-border text-xs flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleSendDrawerChat}
                        disabled={isSendingChat || !chatInput.trim()}
                        className="bg-primary text-white shrink-0 text-xs cursor-pointer"
                      >
                        Sor
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
