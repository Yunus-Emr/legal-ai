"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  UploadCloud,
  FileText,
  Filter,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Database,
} from "lucide-react";
import { documentsApi, type Document as AppDocument } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function StatusBadge({ status }: { status: AppDocument["status"] }) {
  if (status === "indexed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold bg-success/10 text-success border border-success/20">
        <CheckCircle2 className="w-3 h-3" />
        Indexed
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold bg-warning/10 text-warning border border-warning/20">
        <Loader2 className="w-3 h-3 animate-spin" />
        Processing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold bg-danger/10 text-danger border border-danger/20">
      <XCircle className="w-3 h-3" />
      Error
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (
      !confirm(
        "Bu dokümanı silmek istediğinizden emin misiniz? Tüm AI embeddings kaldırılacak."
      )
    )
      return;

    setDocuments((prev) => prev.filter((d) => d.id !== id));
    try {
      await documentsApi.delete(id);
    } catch (err) {
      console.error("Failed to delete", err);
      fetchDocuments();
    }
  };

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col font-sans">
      {/* Header */}
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Document Corpus
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Merkezi hukuki bilgi tabanı. PDF yükleyin, AI embeddings oluşturun.
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
            title="Yenile"
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
            {isUploading ? "İşleniyor..." : "Dosya Yükle"}
          </Button>
        </div>
      </div>

      {/* Stats row */}
      {!isLoading && documents.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
          {[
            { label: "Toplam Doküman", value: stats.total, icon: FileText, color: "text-primary bg-primary/10" },
            { label: "İndekslenmiş", value: stats.indexed, icon: CheckCircle2, color: "text-success bg-success/10" },
            { label: "İşleniyor", value: stats.processing, icon: Clock, color: "text-warning bg-warning/10" },
            { label: "Toplam Chunk", value: stats.totalChunks.toLocaleString(), icon: Database, color: "text-ai-accent bg-ai-accent/10" },
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
            placeholder="Doküman adı ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-surface border-border"
          />
        </div>
        {search && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} / {documents.length} doküman
          </span>
        )}
      </div>

      {/* Document Table */}
      <div className="flex-1 overflow-hidden min-h-0">
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border bg-elevated/50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-medium">Ad</th>
                  <th className="px-6 py-4 font-medium">Boyut</th>
                  <th className="px-6 py-4 font-medium">Yükleme Tarihi</th>
                  <th className="px-6 py-4 font-medium">AI Durumu</th>
                  <th className="px-6 py-4 font-medium text-center">Chunks</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 opacity-50" />
                      Dokümanlar yükleniyor...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      {search
                        ? `"${search}" için sonuç bulunamadı.`
                        : "Corpus'ta doküman bulunamadı. PDF yükleyin."}
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
                                ? "bg-danger/10 text-danger"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                          </div>
                          <span
                            className="font-medium text-foreground truncate max-w-[240px]"
                            title={doc.filename}
                          >
                            {doc.filename}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                          {formatBytes(doc.size_bytes)}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {new Date(doc.created_at).toLocaleDateString("tr-TR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={doc.status} />
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
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-muted-foreground hover:text-danger p-2 rounded-lg hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Dokümanı Sil"
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
    </div>
  );
}
