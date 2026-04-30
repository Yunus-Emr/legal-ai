"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  return (
    <div className="p-8 h-full flex flex-col font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Billing & Invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your LexAI Enterprise subscription.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-2 bg-surface border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary"/> Current Plan</h2>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">Enterprise Tier</span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">$4,999<span className="text-sm text-muted-foreground font-normal"> / month</span></div>
            <p className="text-sm text-muted-foreground mb-6">Renews on November 1, 2026. 14 of 20 seats utilized.</p>
            <Button variant="outline" className="border-border hover:bg-elevated text-foreground">Manage Subscription</Button>
          </CardContent>
        </Card>

        <Card className="col-span-1 bg-surface border-border">
          <CardContent className="p-6 flex flex-col h-full justify-between">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Latest Invoice</h2>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-foreground">October 2026</span>
                <span className="text-sm font-medium">$4,999.00</span>
              </div>
              <span className="text-xs text-success flex items-center gap-1">Paid</span>
            </div>
            <Button variant="ghost" className="w-full mt-4 bg-elevated hover:bg-primary/10 text-primary border border-border"><Download className="w-4 h-4 mr-2"/> Download PDF</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
