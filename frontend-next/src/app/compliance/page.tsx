"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, CheckCircle } from "lucide-react";

export default function CompliancePage() {
  return (
    <div className="p-8 h-full flex flex-col font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Compliance Monitoring</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time regulatory tracking and firm compliance status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-surface border-border">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-3 bg-success/10 rounded-xl"><CheckCircle className="w-6 h-6 text-success" /></div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">GDPR & Data Privacy</h3>
              <p className="text-sm text-muted-foreground mt-1">All current contracts meet GDPR requirements. 0 active violations.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-3 bg-warning/10 rounded-xl"><AlertTriangle className="w-6 h-6 text-warning" /></div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">SOC2 Certification</h3>
              <p className="text-sm text-muted-foreground mt-1">Annual audit pending. 3 internal policies need review before Q4.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
