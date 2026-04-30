"use client";

import { Button } from "@/components/ui/button";
import { Edit3, Sparkles, Send } from "lucide-react";

export default function DraftingPage() {
  return (
    <div className="h-full flex flex-col font-sans">
      <div className="h-14 border-b border-border flex items-center px-6 bg-surface shrink-0">
        <Edit3 className="w-4 h-4 text-primary mr-2" />
        <h1 className="font-semibold text-sm">AI Drafting Studio</h1>
      </div>
      
      <div className="flex-1 flex p-6 gap-6 bg-background">
        <div className="w-1/3 flex flex-col gap-4">
          <div className="bg-surface border border-border p-4 rounded-xl flex-1 flex flex-col">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-ai-accent"/> Prompt Generator</h3>
            <textarea className="w-full flex-1 bg-elevated border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" placeholder="E.g., Draft a mutual NDA for a software acquisition under Delaware law..."></textarea>
            <Button className="mt-4 w-full bg-ai-accent hover:bg-ai-accent/90 text-white"><Send className="w-4 h-4 mr-2"/> Generate Draft</Button>
          </div>
        </div>
        
        <div className="flex-1 bg-surface border border-border rounded-xl p-8 overflow-y-auto shadow-inner">
          <div className="max-w-2xl mx-auto font-serif text-muted-foreground opacity-50 flex items-center justify-center h-full text-center">
            Your generated legal document will appear here.
          </div>
        </div>
      </div>
    </div>
  );
}
