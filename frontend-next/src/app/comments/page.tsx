"use client";

import { MessageSquare } from "lucide-react";

export default function CommentsPage() {
  return (
    <div className="p-8 h-full flex flex-col font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Global Comments</h1>
        <p className="text-sm text-muted-foreground mt-1">Recent discussions across all documents and cases.</p>
      </div>

      <div className="flex-1 bg-surface border border-border rounded-xl p-6">
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-elevated border border-border rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-primary">Sarah Connor <span className="text-muted-foreground font-normal">on</span> MSA_TechCorp_v4.pdf</span>
              <span className="text-xs text-muted-foreground">10 mins ago</span>
            </div>
            <p className="text-sm text-foreground">I updated the indemnification clause based on the AI's risk assessment. Please review.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
