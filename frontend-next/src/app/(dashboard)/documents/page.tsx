"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UploadCloud, FileText, Filter, Folder, MoreVertical } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="p-8 h-full flex flex-col font-sans">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Document Corpus</h1>
          <p className="text-sm text-muted-foreground mt-1">Centralized legal knowledge base and firm-wide document repository.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white"><UploadCloud className="w-4 h-4 mr-2"/> Upload Files</Button>
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
        <div className="col-span-1 bg-surface border border-border rounded-xl p-4 flex flex-col gap-2 overflow-y-auto">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Folders</h3>
          {["All Documents", "M&A Deals", "Employment Contracts", "Litigation Evidence", "Firm Templates", "Archived"].map((folder, i) => (
            <button key={i} className={`flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${i === 0 ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-elevated hover:text-foreground'}`}>
              <span className="flex items-center gap-2"><Folder className="w-4 h-4" /> {folder}</span>
              <span className="text-xs opacity-50">12</span>
            </button>
          ))}
        </div>

        {/* Document Grid */}
        <div className="col-span-3 bg-surface border border-border rounded-xl p-6 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Size</th>
                <th className="pb-3 font-medium">Date Uploaded</th>
                <th className="pb-3 font-medium">AI Status</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <tr key={i} className="hover:bg-elevated/50 transition-colors group">
                  <td className="py-4 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><FileText className="w-4 h-4" /></div>
                    <span className="font-medium text-foreground">MSA_TechCorp_v{i}.pdf</span>
                  </td>
                  <td className="py-4 text-muted-foreground">{(i * 1.2).toFixed(1)} MB</td>
                  <td className="py-4 text-muted-foreground">Oct {i + 10}, 2024</td>
                  <td className="py-4">
                    <span className="px-2 py-1 rounded text-[10px] uppercase tracking-wider font-semibold bg-success/10 text-success border border-success/20">Indexed</span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-muted-foreground hover:text-foreground"><MoreVertical className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
