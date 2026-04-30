"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Filter, LayoutGrid, List, KanbanSquare, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";

const CASES = [
  { id: "MAT-2024-081", title: "TechCorp M&A Deal", client: "TechCorp Inc.", type: "Corporate", status: "Active", risk: "High", updated: "2h ago" },
  { id: "MAT-2024-092", title: "Smith vs Global Logistics", client: "Global Logistics", type: "Litigation", status: "Discovery", risk: "Medium", updated: "1d ago" },
  { id: "MAT-2024-104", title: "Q3 Vendor Agreements", client: "Internal", type: "Compliance", status: "Review", risk: "Low", updated: "3d ago" },
];

export default function CasesPage() {
  const [view, setView] = useState("table");

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Cases</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage active matters, monitor risks, and coordinate legal teams.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white">New Matter</Button>
      </div>

      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search cases..." className="pl-9 w-[300px] bg-elevated border-border" />
          </div>
          <Button variant="outline" className="border-border bg-transparent hover:bg-elevated text-muted-foreground">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>

        <Tabs value={view} onValueChange={setView} className="w-auto">
          <TabsList className="bg-elevated border border-border">
            <TabsTrigger value="table"><List className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="kanban"><KanbanSquare className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="grid"><LayoutGrid className="w-4 h-4" /></TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto">
        {view === "table" && (
          <div className="border border-border rounded-lg bg-surface overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-elevated text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Matter ID</th>
                  <th className="px-6 py-4 font-medium">Title</th>
                  <th className="px-6 py-4 font-medium">Client</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">AI Risk Score</th>
                  <th className="px-6 py-4 font-medium">Last Updated</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {CASES.map((c, i) => (
                  <motion.tr 
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-elevated/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-muted-foreground">{c.id}</td>
                    <td className="px-6 py-4 font-medium text-foreground group-hover:text-primary transition-colors">{c.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{c.client}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          c.risk === 'High' ? 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                          c.risk === 'Medium' ? 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                          'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        }`}></div>
                        <span className="text-muted-foreground">{c.risk}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{c.updated}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 rounded hover:bg-background text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === "kanban" && (
          <div className="flex gap-6 h-full pb-4">
            {["Discovery", "Review", "Active", "Closed"].map((col) => (
              <div key={col} className="w-[300px] shrink-0 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{col}</h3>
                  <span className="text-xs bg-elevated px-2 py-0.5 rounded text-muted-foreground font-mono">
                    {CASES.filter(c => c.status === col || (col==='Active' && c.status==='Active')).length}
                  </span>
                </div>
                <div className="flex-1 bg-elevated/30 rounded-xl border border-border border-dashed p-3 space-y-3">
                  {CASES.filter(c => c.status === col || (col==='Active' && c.status==='Active')).map((c) => (
                    <Card key={c.id} className="bg-surface border-border card-lift cursor-pointer">
                      <CardContent className="p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono text-muted-foreground">{c.id}</span>
                          <div className={`w-2 h-2 rounded-full ${
                            c.risk === 'High' ? 'bg-danger' : c.risk === 'Medium' ? 'bg-warning' : 'bg-success'
                          }`}></div>
                        </div>
                        <h4 className="font-medium text-sm">{c.title}</h4>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{c.client}</span>
                          <span>{c.updated}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
