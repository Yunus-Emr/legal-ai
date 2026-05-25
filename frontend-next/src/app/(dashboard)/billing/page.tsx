"use client";

/**
 * Premium Billing & Budget Control Center
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  Download,
  Plus,
  Users,
  Loader2,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";

export default function BillingPage() {
  /* Premium Billing Interactive States */
  const [budgetLimit, setBudgetLimit] = useState(5000);
  const [spentAmount, setSpentAmount] = useState(1157.85);
  const [topUpAmount, setTopUpAmount] = useState("500");
  const [isRefilling, setIsRefilling] = useState(false);
  const [refillSuccess, setRefillSuccess] = useState(false);
  const [seatsCount, setSeatsCount] = useState(14);
  const [isAddingSeat, setIsAddingSeat] = useState(false);

  const syncBudget = () => {
    if (typeof window !== "undefined") {
      const storedLimit = localStorage.getItem("lexai_budget_limit");
      const storedSpent = localStorage.getItem("lexai_spent_amount");
      if (storedLimit) setBudgetLimit(Number(storedLimit));
      else localStorage.setItem("lexai_budget_limit", "5000");

      if (storedSpent) setSpentAmount(Number(storedSpent));
      else localStorage.setItem("lexai_spent_amount", "1157.85");
    }
  };

  useEffect(() => {
    syncBudget();
    window.addEventListener("lexai_budget_changed", syncBudget);
    return () => window.removeEventListener("lexai_budget_changed", syncBudget);
  }, []);

  const handleRefill = () => {
    setIsRefilling(true);
    setTimeout(() => {
      setIsRefilling(false);
      const newSpent = Math.max(0, spentAmount - Number(topUpAmount));
      setSpentAmount(newSpent);
      localStorage.setItem("lexai_spent_amount", newSpent.toString());
      window.dispatchEvent(new Event("lexai_budget_changed"));
      setRefillSuccess(true);
      setTimeout(() => setRefillSuccess(false), 3000);
    }, 1000);
  };

  const handleAddSeat = () => {
    setIsAddingSeat(true);
    setTimeout(() => {
      setIsAddingSeat(false);
      setSeatsCount((prev) => prev + 1);
    }, 800);
  };

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col font-sans overflow-y-auto bg-background text-foreground">
      {/* Page Header */}
      <div className="mb-8 shrink-0">
        <h1 className="text-3xl font-semibold tracking-tight text-gradient">Billing & Invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your LegalAI Enterprise subscription, API usage budget, and user licenses.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        {/* Left 2 columns: AI Usage Budget & Seat Control */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-surface border-border overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-ai-accent" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" /> AI Limit & Kredi Kontrolü
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    OpenAI API ve arama tüketimi aylık bütçe havuzunuz.
                  </p>
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">
                  Enterprise Tier
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-elevated/40 p-4 rounded-xl border border-border">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Kalan Bütçe</span>
                  <span className="text-3xl font-extrabold text-foreground mt-1 block">
                    ${(budgetLimit - spentAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    Toplam aylık limit: ${budgetLimit.toLocaleString()} USD
                  </span>
                </div>

                <div className="bg-elevated/40 p-4 rounded-xl border border-border flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Kredi Tüketim Oranı</span>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-border/40 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (spentAmount / budgetLimit) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold">
                        {Math.round((spentAmount / budgetLimit) * 100)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-2">
                    Harcanan: ${spentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </span>
                </div>
              </div>

              {/* Interactive Slider to Adjust Quota */}
              <div className="bg-elevated/20 p-5 rounded-xl border border-border/60 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-foreground">Aylık Limit Belirle</span>
                  <span className="text-sm font-mono font-bold text-primary">${budgetLimit.toLocaleString()} USD</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={10000}
                  step={500}
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-border/50 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-mono">
                  <span>Min: $1,000</span>
                  <span>Max: $10,000</span>
                </div>
              </div>

              {/* Top-up Widget */}
              <div className="flex flex-col md:flex-row items-center gap-4 bg-elevated/40 p-4 rounded-xl border border-border">
                <div className="flex-1">
                  <span className="text-xs font-semibold text-foreground block">Hızlı Bakiye Ekle</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Kurumsal kredi kartınızdan anında bakiye yükleyin.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="bg-surface border-border pl-6 pr-2 h-9 text-xs font-semibold"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleRefill}
                    disabled={isRefilling}
                    className="bg-primary text-white text-xs whitespace-nowrap shrink-0 h-9 font-semibold"
                  >
                    {isRefilling ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : null}
                    Kredi Yükle
                  </Button>
                </div>
              </div>
              {refillSuccess && (
                <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Bakiye başarıyla yüklendi, bütçe güncellendi!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Seat Control */}
          <Card className="bg-surface border-border">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Kullanıcı Lisans Kontrolü
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ekibinize yeni lisanslar ekleyin veya atamaları yönetin.
                  </p>
                </div>
                <span className="text-xs font-bold text-foreground bg-elevated px-2.5 py-1 rounded-lg border border-border/50">
                  {seatsCount} / 20 Seats
                </span>
              </div>

              <div className="flex items-center gap-4 p-4 bg-elevated/30 rounded-xl border border-border/60">
                <div className="flex-1 bg-border/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${(seatsCount / 20) * 100}%` }}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleAddSeat}
                  disabled={isAddingSeat || seatsCount >= 20}
                  className="bg-primary text-white text-xs shrink-0"
                >
                  {isAddingSeat ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                  Lisans Ekle
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Usage breakdown & Invoice */}
        <div className="space-y-6">
          <Card className="bg-surface border-border">
            <CardHeader className="border-b border-border py-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Kredi Harcama Kırılımı
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[
                { name: "GPT-4o API (Legal Brain)", amount: spentAmount * 0.67, pct: 67, color: "bg-primary" },
                { name: "OpenSearch Vector Storage", amount: spentAmount * 0.20, pct: 20, color: "bg-emerald-500" },
                { name: "Legal Document Parser & OCR", amount: spentAmount * 0.13, pct: 13, color: "bg-warning" }
              ].map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-foreground">{item.name}</span>
                    <span className="text-muted-foreground font-semibold">${item.amount.toFixed(2)} ({item.pct}%)</span>
                  </div>
                  <div className="bg-border/30 h-1.5 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-surface border-border">
            <CardContent className="p-6 flex flex-col h-full justify-between">
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Son Fatura
                </h2>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground">Mayıs 2026</span>
                  <span className="text-sm font-medium">$4,999.00</span>
                </div>
                <span className="text-xs text-success bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full font-bold">Ödendi ✓</span>
              </div>
              <Button
                variant="ghost"
                className="w-full mt-6 bg-elevated hover:bg-primary/10 text-primary border border-border text-xs"
              >
                <Download className="w-4 h-4 mr-2" /> PDF İndir
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
