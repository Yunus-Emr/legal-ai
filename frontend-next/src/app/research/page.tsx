"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Scale, BookOpen, AlertCircle } from "lucide-react";

export default function ResearchPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-[#0A0E1A] relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
      
      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center">
        <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,111,232,0.2)]">
          <Scale className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-semibold mb-2 tracking-tight">Legal Research Engine</h1>
        <p className="text-muted-foreground mb-8 text-center max-w-xl">Search across case law, statutes, and your firm's private corpus using natural language.</p>

        <div className="w-full relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-ai-accent rounded-xl blur opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
          <div className="relative flex items-center bg-surface border border-border rounded-xl shadow-lg p-2">
            <Search className="w-5 h-5 text-muted-foreground ml-3" />
            <Input 
              placeholder="E.g., What is the precedent for implied warranties in SaaS contracts in Delaware?" 
              className="border-0 bg-transparent focus-visible:ring-0 text-base py-6 w-full"
            />
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6 h-12 ml-2 font-medium">Research</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 w-full">
          <button className="flex items-start gap-3 p-4 bg-elevated border border-border rounded-xl hover:border-primary/50 transition-colors text-left group">
            <BookOpen className="w-5 h-5 text-ai-accent mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-medium text-sm text-foreground">Query Case Law</h3>
              <p className="text-xs text-muted-foreground mt-1">Search the global legal database.</p>
            </div>
          </button>
          <button className="flex items-start gap-3 p-4 bg-elevated border border-border rounded-xl hover:border-primary/50 transition-colors text-left group">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-medium text-sm text-foreground">Firm Precedents</h3>
              <p className="text-xs text-muted-foreground mt-1">Search past matters and memos.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
