"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Globe, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PortalPage() {
  return (
    <div className="p-8 h-full flex flex-col font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Client Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage external sharing and client-facing documents.</p>
      </div>

      <Card className="bg-surface border-border max-w-2xl">
        <CardContent className="p-8 flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Secure Deal Room Active</h2>
            <p className="text-sm text-muted-foreground mb-4">The client portal is currently hosting 3 active matters with 12 external stakeholders.</p>
            <Button className="bg-primary text-white hover:bg-primary/90">Open Portal Settings <ArrowUpRight className="w-4 h-4 ml-2"/></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
