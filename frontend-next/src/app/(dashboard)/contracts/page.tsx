"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSignature, ArrowRight, BrainCircuit, Play } from "lucide-react";
import Link from "next/link";

export default function ContractsPage() {
  return (
    <div className="p-8 h-full flex flex-col font-sans">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Contract Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">Review, extract, and analyze contracts with AI Co-Counsel.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white"><Play className="w-4 h-4 mr-2"/> New Analysis</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Master Service Agreement v4", type: "MSA", risk: "High", status: "Needs Review", date: "Today" },
          { title: "Vendor Non-Disclosure", type: "NDA", risk: "Low", status: "Approved", date: "Yesterday" },
          { title: "Q3 Employment Contracts", type: "Employment", risk: "Medium", status: "In Progress", date: "Oct 12" },
        ].map((contract, i) => (
          <Card key={i} className="bg-surface border-border card-lift group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/10 rounded-lg"><FileSignature className="w-5 h-5 text-primary" /></div>
                <div className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${contract.risk === 'High' ? 'bg-danger/10 text-danger border border-danger/20' : contract.risk === 'Medium' ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-success/10 text-success border border-success/20'}`}>
                  {contract.risk} Risk
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{contract.title}</h3>
              <p className="text-xs text-muted-foreground mb-6">{contract.type} • {contract.date}</p>
              
              <Link href="/ai-canvas">
                <Button variant="outline" className="w-full bg-elevated border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors group-hover:border-primary/30">
                  Open in AI Canvas <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
