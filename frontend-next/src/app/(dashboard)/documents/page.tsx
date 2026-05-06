"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UploadCloud, FileText, Filter, Folder, MoreVertical, Trash2, Loader2, AlertCircle } from "lucide-react";
import { documentsApi, type Document as AppDocument } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const { data } = await documentsApi.list();
      setDocuments(data.documents);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // Auto refresh every 10 seconds to catch indexing updates
    const interval = setInterval(() => fetchDocuments(), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    const fileArray = Array.from(files);

    try {
      const { data } = await documentsApi.upload(fileArray);
      // Gelen yeni dosyaları mevcut listeye ekleyelim
      setDocuments((prev) => {
        const newDocs = [...data.documents, ...prev];
        // id bazında deduplicate edelim (isteğe bağlı)
        return newDocs.filter((doc, index, self) => index === self.findIndex((t) => t.id === doc.id));
      });
      // Dosya input'unu temizle
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.response?.data?.detail || err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document? This will remove all AI embeddings.")) return;
    
    // Optimistic UI update
    setDocuments(prev => prev.filter(d => d.id !== id));
    
    try {
      await documentsApi.delete(id);
    } catch (err) {
      console.error("Failed to delete", err);
      fetchDocuments(); // revert on fail
    }
  };

  return (
    <div className="p-8 h-full flex flex-col font-sans">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Document Corpus</h1>
          <p className="text-sm text-muted-foreground mt-1">Centralized legal knowledge base. Upload PDFs to process embeddings.</p>
        </div>
        <div className="flex items-center gap-4">
          {uploadError && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20">
              <AlertCircle className="w-4 h-4" />
              {uploadError}
            </div>
          )}
          
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
            {isUploading ? "Processing..." : "Upload Files"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search documents by content, metadata, or tags..." className="pl-9 bg-surface border-border" />
        </div>
        <Button variant="outline" className="border-border bg-transparent hover:bg-elevated text-foreground">
          <Filter className="w-4 h-4 mr-2" /> Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 overflow-hidden">
        {/* Sidebar Folders */}
        <div className="col-span-1 bg-surface border border-border rounded-xl p-4 flex flex-col gap-2 overflow-y-auto shadow-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Folders</h3>
          {["All Documents", "M&A Deals", "Employment Contracts", "Litigation Evidence", "Firm Templates", "Archived"].map((folder, i) => (
            <button key={i} className={`flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${i === 0 ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-elevated hover:text-foreground'}`}>
              <span className="flex items-center gap-2"><Folder className="w-4 h-4" /> {folder}</span>
              {i === 0 && <span className="text-xs opacity-50 font-mono">{documents.length}</span>}
            </button>
          ))}
        </div>

        {/* Document Grid */}
        <div className="col-span-3 bg-surface border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border bg-elevated/50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Size</th>
                  <th className="px-6 py-4 font-medium">Date Uploaded</th>
                  <th className="px-6 py-4 font-medium">AI Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                      Loading documents...
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      No documents found in the corpus.<br/>Upload PDF files to start chatting.
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {documents.map(doc => (
                      <motion.tr 
                        key={doc.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-elevated/50 transition-colors group"
                      >
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${doc.status === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-primary/10 text-primary'}`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-foreground truncate max-w-[200px]" title={doc.filename}>
                            {doc.filename}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                          {formatBytes(doc.size_bytes)}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {doc.status === 'indexed' && (
                            <span className="px-2 py-1 rounded text-[10px] uppercase tracking-wider font-semibold bg-success/10 text-success border border-success/20">
                              Indexed ({doc.chunk_count} chunks)
                            </span>
                          )}
                          {doc.status === 'processing' && (
                            <span className="px-2 py-1 rounded text-[10px] uppercase tracking-wider font-semibold bg-warning/10 text-warning border border-warning/20 flex items-center gap-1 w-fit">
                              <Loader2 className="w-3 h-3 animate-spin" /> Processing
                            </span>
                          )}
                          {doc.status === 'error' && (
                            <span className="px-2 py-1 rounded text-[10px] uppercase tracking-wider font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                              Error
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(doc.id)}
                            className="text-muted-foreground hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Document"
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
