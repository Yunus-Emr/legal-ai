"use client";

/**
 * Cases / Matters Page — Multi-Language Dynamic Translation
 */

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  KanbanSquare,
  MoreHorizontal,
  Plus,
  Briefcase,
  Calendar,
  User,
  AlertTriangle,
  X,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { mattersApi } from "@/lib/api";

/* ── Translations ──────────────────────────────────────────────────────── */
const TRANSLATIONS = {
  tr: {
    title: "Davalarım ve Dosyalarım",
    subtitle: "Aktif davaları, risk analizlerini ve ekip koordinasyonunu yönetin.",
    newMatter: "Yeni Matter Aç",
    searchPlaceholder: "Matter, müvekkil veya ID ara...",
    filter: "Filtrele",
    resultsCount: "sonuç",
    loading: "Davalar yükleniyor...",
    error: "Davalar yüklenirken hata oluştu.",
    modalTitle: "Yeni Dava / Dosya Aç",
    modalTitleLabel: "Matter Başlığı *",
    modalClientLabel: "Müvekkil *",
    modalTypeLabel: "Tür",
    modalDueDateLabel: "Vade Tarihi",
    modalAttorneyLabel: "Sorumlu Avukat",
    btnCancel: "İptal",
    btnCreate: "Oluştur",
    btnCreating: "Oluşturuluyor...",
    colMatter: "Matter",
    colClient: "Müvekkil",
    colType: "Tür",
    colStatus: "Durum",
    colRisk: "AI Risk",
    colOwner: "Sorumlu",
    colUpdated: "Güncelleme",
    noMatches: "Eşleşen matter bulunamadı.",
    detail: "Detay"
  },
  en: {
    title: "My Cases & Matters",
    subtitle: "Manage active matters, risk intelligence, and attorney tasks.",
    newMatter: "New Matter",
    searchPlaceholder: "Search matters, clients, or IDs...",
    filter: "Filter",
    resultsCount: "results",
    loading: "Loading cases...",
    error: "Failed to load cases.",
    modalTitle: "Open New Matter",
    modalTitleLabel: "Matter Title *",
    modalClientLabel: "Client *",
    modalTypeLabel: "Type",
    modalDueDateLabel: "Due Date",
    modalAttorneyLabel: "Lead Counsel",
    btnCancel: "Cancel",
    btnCreate: "Create Matter",
    btnCreating: "Creating...",
    colMatter: "Matter",
    colClient: "Client",
    colType: "Type",
    colStatus: "Status",
    colRisk: "AI Risk",
    colOwner: "Counsel",
    colUpdated: "Updated",
    noMatches: "No matching matters found.",
    detail: "Details"
  }
};

/* ── Types ─────────────────────────────────────────────────────────────── */
type RiskLevel = "High" | "Medium" | "Low";
type CaseStatus = "Active" | "Discovery" | "Review" | "Pending" | "Closed";

interface Matter {
  id: string;
  title: string;
  client: string;
  type: string;
  status: CaseStatus;
  risk: RiskLevel;
  updated: string;
  attorney: string;
  dueDate: string;
}

const mapBackendMatter = (b: any): Matter => ({
  id: b.id,
  title: b.title,
  client: b.client,
  type: b.type,
  status: b.status as CaseStatus,
  risk: b.risk as RiskLevel,
  updated: b.created_at ? new Date(b.created_at).toLocaleDateString("tr-TR") : "Şimdi",
  attorney: b.attorney || "Unassigned",
  dueDate: b.due_date || "—",
});

const KANBAN_COLS: CaseStatus[] = ["Pending", "Discovery", "Review", "Active", "Closed"];

const RISK_DOT: Record<RiskLevel, string> = {
  High: "bg-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]",
  Medium: "bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]",
  Low: "bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]",
};

const STATUS_BADGE: Record<CaseStatus, string> = {
  Active: "bg-primary/10 text-primary border-primary/30",
  Discovery: "bg-info/10 text-info border-info/30",
  Review: "bg-warning/10 text-warning border-warning/30",
  Pending: "bg-muted text-muted-foreground border-border",
  Closed: "bg-elevated text-muted-foreground border-border",
};

/* ── New Matter Modal ──────────────────────────────────────────────────── */
interface NewMatterModalProps {
  onClose: () => void;
  onSave: (m: Matter) => void;
  t: any;
}

function NewMatterModal({ onClose, onSave, t }: NewMatterModalProps) {
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [type, setType] = useState("Corporate");
  const [attorney, setAttorney] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !client.trim()) return;
    setSaving(true);
    try {
      const res = await mattersApi.create({
        title,
        client,
        type,
        status: "Pending",
        risk: "Low",
        attorney: attorney || undefined,
        due_date: dueDate || undefined,
      });
      onSave(mapBackendMatter(res.data));
      onClose();
    } catch (err) {
      console.error("Dava açılırken hata oluştu:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-lg bg-[#111827] border border-border rounded-2xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">{t.modalTitle}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-elevated text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">{t.modalTitleLabel}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g., Smith vs. Corp" className="bg-elevated border-border text-foreground" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">{t.modalClientLabel}</label>
            <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client name" className="bg-elevated border-border text-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">{t.modalTypeLabel}</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-elevated border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {["Corporate", "Litigation", "Compliance", "Labour", "IP", "Property", "Criminal", "Family"].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">{t.modalDueDateLabel}</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-elevated border-border text-foreground" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">{t.modalAttorneyLabel}</label>
            <Input value={attorney} onChange={(e) => setAttorney(e.target.value)} placeholder="Atty. Yılmaz" className="bg-elevated border-border text-foreground" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="border-border text-foreground">{t.btnCancel}</Button>
          <Button onClick={handleSave} disabled={!title.trim() || !client.trim() || saving} className="bg-primary text-white">
            {saving ? t.btnCreating : t.btnCreate}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────────────────── */
export default function CasesPage() {
  const [view, setView] = useState<"table" | "kanban" | "grid">("table");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [cases, setCases] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lang, setLang] = useState<"tr" | "en">("tr");

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

  useEffect(() => {
    const fetchMatters = async () => {
      try {
        setLoading(true);
        const res = await mattersApi.list();
        setCases(res.data.map(mapBackendMatter));
      } catch (err: any) {
        console.error("Dava listeleme hatası:", err);
        setError(t.error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatters();
  }, [t.error]);

  const filtered = useMemo(
    () => cases.filter((c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.client.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
    ),
    [cases, search]
  );

  const handleAddMatter = (m: Matter) => setCases((prev) => [m, ...prev]);

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col font-sans bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" /> {t.newMatter}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 shrink-0 gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-elevated border-border text-foreground"
            />
          </div>
          <Button variant="outline" size="sm" className="border-border bg-transparent hover:bg-elevated text-muted-foreground">
            <Filter className="w-4 h-4 mr-2" /> {t.filter}
          </Button>
          {search && (
            <span className="text-xs text-muted-foreground">{filtered.length} {t.resultsCount}</span>
          )}
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="w-auto">
          <TabsList className="bg-elevated border border-border h-9 p-1">
            <TabsTrigger value="table" className="px-2.5 h-full data-[state=active]:bg-surface"><List className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="kanban" className="px-2.5 h-full data-[state=active]:bg-surface"><KanbanSquare className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="grid" className="px-2.5 h-full data-[state=active]:bg-surface"><LayoutGrid className="w-4 h-4" /></TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-transparent mr-3 mb-2" />
            <span>{t.loading}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl p-6">
            <AlertTriangle className="w-8 h-8 mb-2" />
            <p>{error}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* TABLE VIEW */}
            {view === "table" && (
              <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="border border-border rounded-xl bg-surface overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-elevated text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                      <tr>
                        <th className="px-5 py-3.5 font-semibold">{t.colMatter}</th>
                        <th className="px-5 py-3.5 font-semibold">{t.colClient}</th>
                        <th className="px-5 py-3.5 font-semibold">{t.colType}</th>
                        <th className="px-5 py-3.5 font-semibold">{t.colStatus}</th>
                        <th className="px-5 py-3.5 font-semibold">{t.colRisk}</th>
                        <th className="px-5 py-3.5 font-semibold">{t.colOwner}</th>
                        <th className="px-5 py-3.5 font-semibold">{t.colUpdated}</th>
                        <th className="px-5 py-3.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered.map((c, i) => (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="hover:bg-elevated/50 transition-colors group cursor-pointer"
                        >
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{c.title}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">{c.id}</p>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">{c.client}</td>
                          <td className="px-5 py-3.5 text-muted-foreground text-xs">{c.type}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider ${STATUS_BADGE[c.status]}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${RISK_DOT[c.risk]}`} />
                              <span className="text-xs text-muted-foreground">{c.risk}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground">{c.attorney}</td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground">{c.updated}</td>
                          <td className="px-5 py-3.5 text-right">
                            <button className="p-1.5 rounded-lg hover:bg-elevated text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                            <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            {t.noMatches}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* KANBAN VIEW */}
            {view === "kanban" && (
              <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex gap-4 h-full pb-4 overflow-x-auto"
              >
                {KANBAN_COLS.map((col) => {
                  const colCases = filtered.filter((c) => c.status === col);
                  return (
                    <div key={col} className="w-72 shrink-0 flex flex-col gap-3">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{col}</h3>
                        <span className="text-xs bg-elevated px-2 py-0.5 rounded font-mono text-muted-foreground">{colCases.length}</span>
                      </div>
                      <div className="flex-1 bg-elevated/20 rounded-xl border border-dashed border-border p-3 space-y-3 min-h-[200px]">
                        {colCases.map((c) => (
                          <Card key={c.id} className="bg-surface border-border hover:border-primary/40 cursor-pointer transition-all">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] font-mono text-muted-foreground">{c.id}</span>
                                <div className={`w-2 h-2 rounded-full ${RISK_DOT[c.risk]}`} />
                              </div>
                              <h4 className="text-sm font-semibold text-foreground leading-snug">{c.title}</h4>
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1"><User className="w-3 h-3" />{c.client}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.dueDate}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* GRID VIEW */}
            {view === "grid" && (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {filtered.map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="bg-surface border-border hover:border-primary/40 cursor-pointer transition-all group">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider ${STATUS_BADGE[c.status]}`}>
                            {c.status}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {c.risk === "High" && <AlertTriangle className="w-3.5 h-3.5 text-danger" />}
                            <div className={`w-2 h-2 rounded-full ${RISK_DOT[c.risk]}`} />
                            <span className="text-xs text-muted-foreground">{c.risk}</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{c.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{c.type} • {c.client}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{c.attorney}</span>
                          <span className="flex items-center gap-1 group-hover:text-primary transition-colors font-medium">
                            {t.detail} <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <NewMatterModal onClose={() => setShowModal(false)} onSave={handleAddMatter} t={t} />
        )}
      </AnimatePresence>
    </div>
  );
}
