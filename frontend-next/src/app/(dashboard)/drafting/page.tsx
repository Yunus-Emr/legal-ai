"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Edit3,
  Sparkles,
  Send,
  Loader2,
  Trash2,
  FileText,
  Save,
  CheckCircle,
  Download,
  AlertCircle,
  Clock,
  Sparkle,
  Plus,
  RefreshCw,
  Search,
  BookOpen,
  HelpCircle,
  ArrowRight,
  User,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { draftsApi, chatApi, type Draft } from "@/lib/api";

// ── Types & Constants ────────────────────────────────────────────────────────
interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

const DOCUMENT_TYPES = [
  "Non-Disclosure Agreement (NDA)",
  "Service Level Agreement (SLA)",
  "Employment Contract",
  "Software License Agreement",
  "Partnership Agreement",
  "Commercial Lease Agreement",
  "Cease & Desist Letter",
  "General Court Petition (Dilekçe)"
];

const JURISDICTIONS = [
  "Republic of Turkey (TR)",
  "United States (Delaware - US)",
  "United Kingdom (E&W - UK)",
  "European Union (GDPR Aligned)"
];

const TONES = [
  { value: "Formal & Balanced", label: "Balanced / Standard" },
  { value: "Highly Protective / Strict", label: "Pro-Client / Protective" },
  { value: "Collaborative & Simple", label: "Plain English / Friendly" }
];

export default function DraftingPage() {
  // ── States ─────────────────────────────────────────────────────────────────
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form States
  const [prompt, setPrompt] = useState("");
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0]);
  const [jurisdiction, setJurisdiction] = useState(JURISDICTIONS[0]);
  const [tone, setTone] = useState(TONES[0].value);
  const [customTitle, setCustomTitle] = useState("");

  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState<string | null>(null); // Action name like "formal"
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Auto-save & Ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Toast Notification Helper ──────────────────────────────────────────────
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // ── Fetch Drafts from Backend ──────────────────────────────────────────────
  const fetchDrafts = async (selectFirst = false) => {
    try {
      setLoading(true);
      const res = await draftsApi.list();
      setDrafts(res.data);
      if (selectFirst && res.data.length > 0) {
        setSelectedDraft(res.data[0]);
      }
    } catch (err: any) {
      showToast("Taslaklar alınamadı. Lütfen oturumunuzu kontrol edin.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts(true);
  }, []);

  // ── Auto Save Logic ────────────────────────────────────────────────────────
  const triggerAutoSave = (draftId: string, updatedTitle: string, updatedContent: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    setSavingStatus("saving");
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await draftsApi.update(draftId, {
          title: updatedTitle,
          content: updatedContent
        });
        setSavingStatus("saved");
        // Update local list
        setDrafts((prev) =>
          prev.map((d) =>
            d.id === draftId ? { ...d, title: updatedTitle, content: updatedContent } : d
          )
        );
      } catch (err) {
        setSavingStatus("error");
        showToast("Otomatik kaydetme başarısız oldu.", "error");
      }
    }, 1500);
  };

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedDraft) return;
    const newContent = e.target.value;
    setSelectedDraft({ ...selectedDraft, content: newContent });
    triggerAutoSave(selectedDraft.id, selectedDraft.title, newContent);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDraft) return;
    const newTitle = e.target.value;
    setSelectedDraft({ ...selectedDraft, title: newTitle });
    triggerAutoSave(selectedDraft.id, newTitle, selectedDraft.content || "");
  };

  // ── Actions: Create Blank Draft ────────────────────────────────────────────
  const handleCreateBlankDraft = async () => {
    try {
      const title = `Untitled ${docType.split(" ")[0]} Draft`;
      const res = await draftsApi.create({
        title,
        content: `// ${docType} - Draft\n// Jurisdiction: ${jurisdiction}\n// Created on: ${new Date().toLocaleDateString()}\n\n`
      });
      setDrafts((prev) => [res.data, ...prev]);
      setSelectedDraft(res.data);
      showToast("Yeni boş taslak oluşturuldu.", "success");
    } catch (err) {
      showToast("Taslak oluşturulamadı.", "error");
    }
  };

  // ── Actions: Generate with AI ──────────────────────────────────────────────
  const handleGenerateDraft = async () => {
    if (!prompt.trim()) {
      showToast("Lütfen AI'ın ne yazmasını istediğinizi açıklayın.", "info");
      return;
    }

    try {
      setIsGenerating(true);
      const title = customTitle.trim() || `${docType.split(" ")[0]} - ${new Date().toLocaleDateString("tr-TR")}`;

      const aiQuery = `Aşağıdaki özelliklere sahip profesyonel bir hukuki taslak (draft) metni oluştur:
- Belge Türü: ${docType}
- Hukuk Düzeni / Yargı Yetkisi: ${jurisdiction}
- Üslup ve Ton: ${tone}
- Detaylar ve Koşullar: ${prompt}

Lütfen sadece hukuki belge metnini döndür, açıklama veya başlangıç/bitiş sohbet cümleleri ekleme. Doğrudan hukuki başlıklar ve maddelerle başla.`;

      // Call LLM Chat API
      const chatRes = await chatApi.send(aiQuery);
      const generatedContent = chatRes.data.answer;

      // Save into drafts db
      const newDraftRes = await draftsApi.create({
        title,
        content: generatedContent
      });

      setDrafts((prev) => [newDraftRes.data, ...prev]);
      setSelectedDraft(newDraftRes.data);
      setPrompt("");
      setCustomTitle("");
      showToast("Hukuki taslak AI tarafından başarıyla üretildi!", "success");
    } catch (err) {
      showToast("AI taslak üretiminde hata oluştu.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Actions: Delete Draft ──────────────────────────────────────────────────
  const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bu taslağı silmek istediğinizden emin misiniz?")) return;

    try {
      await draftsApi.delete(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      if (selectedDraft?.id === id) {
        setSelectedDraft(null);
      }
      showToast("Taslak silindi.", "success");
    } catch (err) {
      showToast("Taslak silinemedi.", "error");
    }
  };

  // ── Actions: Quick AI Refinement Wizard ─────────────────────────────────────
  const handleRefineText = async (action: string, instruction: string) => {
    if (!selectedDraft || !selectedDraft.content) return;

    try {
      setIsRefining(action);
      const promptText = `Aşağıdaki hukuki taslağı şu talimata göre düzenle: "${instruction}".
Sadece güncellenmiş metni döndür, giriş veya açıklama ekleme.

Metin:
${selectedDraft.content}`;

      const chatRes = await chatApi.send(promptText);
      const refinedText = chatRes.data.answer;

      setSelectedDraft({ ...selectedDraft, content: refinedText });
      triggerAutoSave(selectedDraft.id, selectedDraft.title, refinedText);
      showToast("Metin başarıyla yapay zeka ile güncellendi.", "success");
    } catch (err) {
      showToast("İşlem sırasında bir hata oluştu.", "error");
    } finally {
      setIsRefining(null);
    }
  };

  // ── Actions: Download document ─────────────────────────────────────────────
  const handleDownload = (format: "txt" | "md") => {
    if (!selectedDraft || !selectedDraft.content) return;
    const blob = new Blob([selectedDraft.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedDraft.title.replace(/\s+/g, "_")}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Belge indirildi.", "success");
  };

  // ── Auxiliary: Word/Char Counter ───────────────────────────────────────────
  const getWordCharCount = () => {
    const text = selectedDraft?.content || "";
    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    const chars = text.length;
    const readingTime = Math.ceil(words / 200); // Avg 200 wpm
    return { words, chars, readingTime };
  };

  const { words, chars, readingTime } = getWordCharCount();

  // Filter drafts list
  const filteredDrafts = drafts.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col font-sans text-foreground bg-[#090D1A] overflow-hidden relative">
      
      {/* ── Dynamic Floating Toasts ──────────────────────────────────────────── */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-4 rounded-xl shadow-lg border backdrop-blur-md flex items-center gap-3 pointer-events-auto ${
                toast.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : toast.type === "error"
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-400"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : toast.type === "error" ? (
                <AlertCircle className="w-5 h-5 shrink-0" />
              ) : (
                <Sparkles className="w-5 h-5 shrink-0" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Top Header Toolbar ────────────────────────────────────────────────── */}
      <div className="h-16 border-b border-border flex items-center justify-between px-8 bg-surface/40 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg border border-primary/20">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight">AI Drafting Studio</h1>
            <p className="text-[11px] text-muted-foreground">Draft and refine professional legal contracts instantly.</p>
          </div>
        </div>

        {/* Global Save/Status indicator */}
        <div className="flex items-center gap-4">
          {selectedDraft && (
            <div className="flex items-center gap-2 px-3 py-1 bg-elevated/50 border border-border rounded-full text-xs">
              {savingStatus === "saving" && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-muted-foreground">Autosaving...</span>
                </>
              )}
              {savingStatus === "saved" && (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-400 font-medium">Saved to Cloud</span>
                </>
              )}
              {savingStatus === "error" && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-rose-400 font-medium">Save Error</span>
                </>
              )}
              {savingStatus === "idle" && (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Up to date</span>
                </>
              )}
            </div>
          )}
          <Button onClick={handleCreateBlankDraft} className="bg-primary hover:bg-primary/95 text-white shadow-md text-xs font-semibold px-4 h-9">
            <Plus className="w-4 h-4 mr-1.5" /> New Empty Draft
          </Button>
        </div>
      </div>

      {/* ── Main Application Columns ────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Controls & History */}
        <div className="w-96 border-r border-border bg-[#0C1222] flex flex-col overflow-hidden shrink-0">
          <Tabs defaultValue="generator" className="flex-1 flex flex-col">
            <div className="px-6 pt-4 border-b border-border bg-[#090D1A]/60">
              <TabsList className="bg-elevated w-full p-1 h-10 border border-border rounded-lg mb-3">
                <TabsTrigger value="generator" className="flex-1 text-xs font-semibold rounded-md data-[state=active]:bg-[#1A253E] data-[state=active]:text-primary">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-ai-accent" /> AI Generator
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1 text-xs font-semibold rounded-md data-[state=active]:bg-[#1A253E] data-[state=active]:text-primary" onClick={() => fetchDrafts()}>
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" /> My Drafts ({drafts.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              
              {/* TAB 1: AI Prompt Generator */}
              <TabsContent value="generator" className="m-0 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">1. Document Settings</label>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] text-muted-foreground mb-1 block">Contract Template</span>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full bg-elevated border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {DOCUMENT_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] text-muted-foreground mb-1 block">Jurisdiction (Hukuk Düzeni)</span>
                      <select
                        value={jurisdiction}
                        onChange={(e) => setJurisdiction(e.target.value)}
                        className="w-full bg-elevated border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {JURISDICTIONS.map((j) => (
                          <option key={j} value={j}>{j}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] text-muted-foreground mb-1 block">Tone of Voice</span>
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full bg-elevated border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {TONES.map((to) => (
                          <option key={to.value} value={to.value}>{to.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">2. Specification Prompt</label>
                    <span className="text-[10px] text-muted-foreground">Describe your terms</span>
                  </div>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., NDA between Company A and Company B, including strict trade secret protection, 5-year duration, and Turkish law jurisdiction..."
                    className="h-32 text-xs bg-elevated border-border resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Custom Title (Optional)</label>
                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="E.g., NDA_AcmeCorp_v1"
                    className="text-xs bg-elevated border-border"
                  />
                </div>

                <Button
                  onClick={handleGenerateDraft}
                  disabled={isGenerating}
                  className="w-full bg-ai-accent hover:bg-ai-accent/90 text-white font-semibold text-xs py-5 rounded-lg shadow-md mt-4 transition-all duration-300 transform active:scale-95"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Drafting metin üretiliyor...
                    </>
                  ) : (
                    <>
                      <Sparkle className="w-4 h-4 mr-2 text-yellow-300" /> Generate Legal Draft
                    </>
                  )}
                </Button>

                <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3 mt-6">
                  <BookOpen className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <strong>Co-Counsel Tip:</strong> The generated draft is instantly loaded to the right. All edits are saved automatically in real-time.
                  </p>
                </div>
              </TabsContent>

              {/* TAB 2: Draft History */}
              <TabsContent value="history" className="m-0 flex flex-col h-full space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search drafts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs bg-elevated border-border h-9"
                  />
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto min-h-0 pr-1">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-xs gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      Loading your library...
                    </div>
                  ) : filteredDrafts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-xs">
                      No matching drafts found.
                    </div>
                  ) : (
                    filteredDrafts.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setSelectedDraft(d)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 flex justify-between items-start group relative overflow-hidden ${
                          selectedDraft?.id === d.id
                            ? "bg-primary/10 border-primary/40 text-primary-foreground"
                            : "bg-elevated/40 border-border hover:bg-[#1A253E] hover:border-border/80"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 pr-6">
                          <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${selectedDraft?.id === d.id ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-foreground truncate">{d.title}</h4>
                            <p className="text-[10px] text-muted-foreground truncate mt-1">
                              {d.content ? d.content.substring(0, 70).replace(/[#\*\/]/g, "") + "..." : "Empty document"}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteDraft(d.id, e)}
                          className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-muted-foreground p-1 rounded-md transition-opacity absolute right-2 top-2.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

            </div>
          </Tabs>
        </div>

        {/* RIGHT COLUMN: Document Workspace / Editor */}
        <div className="flex-1 bg-[#090D1A] p-8 overflow-y-auto flex flex-col min-w-0 relative">
          
          <AnimatePresence mode="wait">
            {selectedDraft ? (
              <motion.div
                key={selectedDraft.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex-1 flex flex-col max-w-4xl mx-auto w-full h-full"
              >
                {/* Editor Header Panel */}
                <div className="bg-[#0C1222] border border-border p-4 rounded-t-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 shadow-md">
                  <div className="flex-1 min-w-0">
                    <Input
                      value={selectedDraft.title}
                      onChange={handleTitleChange}
                      className="bg-transparent border-none text-base font-bold text-foreground focus:ring-0 p-0 h-auto focus-visible:ring-0 focus-visible:outline-none"
                    />
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1 font-mono">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {readingTime} min read</span>
                      <span>•</span>
                      <span>{words} words</span>
                      <span>•</span>
                      <span>{chars} characters</span>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload("md")}
                      className="border-border text-xs text-muted-foreground hover:text-foreground h-8"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> Export (.md)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload("txt")}
                      className="border-border text-xs text-muted-foreground hover:text-foreground h-8"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> Export (.txt)
                    </Button>
                  </div>
                </div>

                {/* AI Refinement Quick Bar */}
                <div className="bg-[#121A2F]/80 border-x border-b border-border/80 px-4 py-2 text-xs flex flex-wrap items-center gap-2.5 shrink-0">
                  <span className="text-[10px] font-bold text-[#A8B2C7] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-ai-accent" /> Refine Draft:
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!!isRefining}
                    onClick={() => handleRefineText("formal", "Dili son derece resmi, kurumsal ve yetkin bir hukuki üsluba çevir.")}
                    className="h-7 text-[11px] text-primary hover:bg-[#1A253E] px-2.5 font-medium rounded-lg"
                  >
                    {isRefining === "formal" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "👔 Make Highly Formal"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!!isRefining}
                    onClick={() => handleRefineText("simplify", "Hukuki anlamı koruyarak dili olabildiğince plain English / sade ve anlaşılır hale getir.")}
                    className="h-7 text-[11px] text-primary hover:bg-[#1A253E] px-2.5 font-medium rounded-lg"
                  >
                    {isRefining === "simplify" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "🍃 Simplify Terms"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!!isRefining}
                    onClick={() => handleRefineText("shorten", "Metindeki gereksiz tekrarları çıkar, daha öz ve net bir şekilde kısalt.")}
                    className="h-7 text-[11px] text-primary hover:bg-[#1A253E] px-2.5 font-medium rounded-lg"
                  >
                    {isRefining === "shorten" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "✂️ Shorten Code"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!!isRefining}
                    onClick={() => handleRefineText("protect", "Kendi tarafımı (hizmet alan / şirket / müşteri) koruyacak şekilde riskli olabilecek maddeleri lehime düzenle.")}
                    className="h-7 text-[11px] text-amber-400 hover:text-amber-300 hover:bg-[#1A253E] px-2.5 font-medium rounded-lg"
                  >
                    {isRefining === "protect" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "🛡️ Maximize Protection"}
                  </Button>
                </div>

                {/* Professional Paper Editor View */}
                <div className="flex-1 bg-[#090D1A] pt-6 flex flex-col min-h-0 relative">
                  
                  {/* Subtle watermarked legal scale emblem under document */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                    <Edit3 className="w-[300px] h-[300px] text-white" />
                  </div>

                  <div className="flex-1 bg-[#101726]/75 border border-border/80 rounded-b-2xl shadow-inner relative flex flex-col p-8 font-serif leading-relaxed text-sm">
                    {isRefining ? (
                      <div className="absolute inset-0 bg-[#0C1222]/85 backdrop-blur-sm rounded-b-2xl flex flex-col items-center justify-center gap-4 z-20">
                        <Loader2 className="w-10 h-10 animate-spin text-ai-accent" />
                        <div className="text-center">
                          <p className="text-sm font-semibold text-foreground">Draft Metni Güncelleniyor...</p>
                          <p className="text-xs text-muted-foreground mt-1">Yapay zeka hukuk danışmanınız taslağı elden geçiriyor.</p>
                        </div>
                      </div>
                    ) : null}

                    <textarea
                      value={selectedDraft.content || ""}
                      onChange={handleEditorChange}
                      className="w-full flex-1 bg-transparent border-none outline-none resize-none text-foreground font-serif leading-8 text-[15px] focus:ring-0 focus:outline-none"
                      placeholder="Buraya taslağınızı yazın veya sol paneldeki AI jeneratörünü kullanarak otomatik üretin..."
                    />
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto"
              >
                <div className="w-16 h-16 bg-primary/10 text-primary border border-primary/20 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                  <Edit3 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">AI Drafting Studio'ya Hoş Geldiniz</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Sol taraftaki şablondan belge türünü seçip yönergelerinizi yazarak anında profesyonel bir sözleşme üretebilir veya boş bir doküman açarak başlayabilirsiniz.
                </p>

                <div className="grid grid-cols-2 gap-3 w-full mt-8">
                  <Button
                    onClick={handleCreateBlankDraft}
                    variant="outline"
                    className="border-border text-xs hover:bg-elevated h-11"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Start Empty Draft
                  </Button>
                  <Button
                    onClick={() => {
                      const tabsTrigger = document.querySelector('[value="history"]') as HTMLButtonElement;
                      if (tabsTrigger) tabsTrigger.click();
                    }}
                    className="bg-primary hover:bg-primary/95 text-white text-xs h-11"
                  >
                    <BookOpen className="w-4 h-4 mr-2" /> Open Existing Draft
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
