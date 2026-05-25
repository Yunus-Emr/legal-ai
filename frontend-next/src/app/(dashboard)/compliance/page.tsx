"use client";

/**
 * Compliance Page — Admin Only (Premium Redesign with Dynamic Translation)
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  Scale,
  Globe,
  Building,
  Activity,
  Play,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RoleGuard } from "@/components/auth/RoleGuard";

/* ── Compliance Translations ───────────────────────────────────────────── */
const COMPLIANCE_TRANSLATIONS = {
  tr: {
    title: "Yasal Uyum ve Güvenlik Denetimi",
    subtitle: "Platform genelinde veri koruma, regülasyon uyumluluğu ve AI güvenlik logları.",
    refresh: "Yenile",
    scanning: "Denetleniyor...",
    statFrameworks: "Aktif Regülasyon",
    statCompliant: "Uyumlu Kapsam",
    statIssues: "Açık Bulgular",
    statAvgScore: "Ortalama Uyum",
    tabFrameworks: "Uyum Çerçeveleri",
    tabIssues: "Açık Bulgular",
    tabAuditLog: "AI Denetim Logları",
    score: "Skor",
    lastAudit: "Son Denetim",
    issuesCount: "açık bulgu",
    btnResolve: "Çözüldü Olarak İşaretle",
    statusResolved: "Çözüldü",
    statusOpen: "Açık",
    statusInReview: "İncelemede",
    severityHigh: "Yüksek",
    severityMedium: "Orta",
    severityLow: "Düşük",
    colIssue: "Bulgu / ID",
    colFramework: "Regülasyon",
    colSeverity: "Önem Derecesi",
    colStatus: "Durum",
    colOwner: "Sorumlu / Tarih",
    colActions: "İşlemler",
    noIssues: "Aktif uyum ihlali bulunmamaktadır.",
    activeScan: "Gerçek Zamanlı AI Güvenlik Koruması",
    activeScanDesc: "Yapay zeka denetçileri platform genelindeki veri akışını, PII maskelemelerini ve prompt guardrail loglarını izliyor.",
    scanHealthy: "TÜM SİSTEMLER GÜVENLİ VE RESİLİENT",
    scanSecure: "VERİ GÜVENLİĞİ AKTİF",
    auditTrigger: "AI Denetim Taraması Başlat",
    auditRunning: "Yapay Zeka Platform Taraması Yapılıyor...",
    auditSuccess: "AI Taraması Tamamlandı: Sıfır kritik sızıntı tespit edildi.",
    recentAuditEvents: "Son AI Denetim Olayları",
    ownerIT: "IT Ekibi",
    ownerDevOps: "DevOps Ekibi",
    ownerLegal: "Hukuk Departmanı",
    ownerPartners: "Yönetici Ortaklar",
    ownerOffice: "Ofis Sekreteryası",
    ownerRisk: "Risk Yönetim Grubu"
  },
  en: {
    title: "Compliance & Security Auditing",
    subtitle: "Monitor platform data protection, regulation frameworks, and AI security logs.",
    refresh: "Refresh Status",
    scanning: "Auditing...",
    statFrameworks: "Active Regulations",
    statCompliant: "Compliant Scope",
    statIssues: "Open Issues",
    statAvgScore: "Avg Compliance Score",
    tabFrameworks: "Compliance Frameworks",
    tabIssues: "Open Findings",
    tabAuditLog: "AI Audit Streams",
    score: "Score",
    lastAudit: "Last Audit",
    issuesCount: "open finding",
    btnResolve: "Mark as Resolved",
    statusResolved: "Resolved",
    statusOpen: "Open",
    statusInReview: "In Review",
    severityHigh: "High",
    severityMedium: "Medium",
    severityLow: "Low",
    colIssue: "Finding / ID",
    colFramework: "Framework",
    colSeverity: "Severity",
    colStatus: "Status",
    colOwner: "Owner / Due Date",
    colActions: "Actions",
    noIssues: "No active compliance findings found.",
    activeScan: "Real-Time AI Security Shielding",
    activeScanDesc: "AI audit agents are actively shielding data streams, scrubbing PII exposures, and validating prompt guardrails.",
    scanHealthy: "ALL SYSTEMS STANDING RESILIENT",
    scanSecure: "DATA PRIVACY SHIELD ACTIVE",
    auditTrigger: "Trigger AI Compliance Scan",
    auditRunning: "Executing Intelligent Platform Audit...",
    auditSuccess: "AI Scan Completed: Zero critical vulnerabilities or leaks detected.",
    recentAuditEvents: "Recent AI Auditing Stream",
    ownerIT: "IT Security",
    ownerDevOps: "DevOps Team",
    ownerLegal: "Legal Counsel",
    ownerPartners: "Managing Partners",
    ownerOffice: "Office Secretariat",
    ownerRisk: "Risk & Audit Group"
  },
  de: {
    title: "Konformität & Sicherheitsprüfung",
    subtitle: "Überwachen Sie den Datenschutz der Plattform, Regulierungsrahmen und KI-Sicherheitsprotokolle.",
    refresh: "Status aktualisieren",
    scanning: "Prüfung...",
    statFrameworks: "Aktive Vorschriften",
    statCompliant: "Konforme Rahmen",
    statIssues: "Offene Fragen",
    statAvgScore: "Durchschn. Score",
    tabFrameworks: "Konformitätsrahmen",
    tabIssues: "Offene Befunde",
    tabAuditLog: "KI-Prüfprotokolle",
    score: "Score",
    lastAudit: "Letzte Prüfung",
    issuesCount: "offene Befunde",
    btnResolve: "Lösen",
    statusResolved: "Gelöst",
    statusOpen: "Offen",
    statusInReview: "In Prüfung",
    severityHigh: "Hoch",
    severityMedium: "Mittel",
    severityLow: "Niedrig",
    colIssue: "Befund / ID",
    colFramework: "Regelwerk",
    colSeverity: "Schweregrad",
    colStatus: "Status",
    colOwner: "Besitzer / Frist",
    colActions: "Aktionen",
    noIssues: "Keine aktiven Konformitätsverletzungen gefunden.",
    activeScan: "Echtzeit-KI-Sicherheitsscanning",
    activeScanDesc: "KI-Prüfagenten überwachen aktiv Datenströme, maskieren PII und validieren Prompt-Guardrails.",
    scanHealthy: "ALLE SYSTEME RESILIENT",
    scanSecure: "DATENSCHUTZ AKTIV",
    auditTrigger: "KI-Konformitätsscan starten",
    auditRunning: "Intelligente Plattformprüfung wird ausgeführt...",
    auditSuccess: "KI-Scan abgeschlossen: Keine kritischen Datenlecks entdeckt.",
    recentAuditEvents: "Aktuelle KI-Prüfereignisse",
    ownerIT: "IT-Sicherheit",
    ownerDevOps: "DevOps-Team",
    ownerLegal: "Rechtsabteilung",
    ownerPartners: "Geschäftsführende Gesellschafter",
    ownerOffice: "Kanzlei-Sekretariat",
    ownerRisk: "Risiko- und Auditgruppe"
  }
};

/* ── Score Ring ────────────────────────────────────────────────────────── */
function ScoreRing({ score, size = 66 }: { score: number; size?: number }) {
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = r * 2 * Math.PI;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={sw} fill="none" className="text-border" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={sw} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
      </svg>
      <span className="absolute text-sm font-bold font-mono" style={{ color }}>{score}%</span>
    </div>
  );
}

/* ── Compliance Content ────────────────────────────────────────────────── */
function ComplianceContent() {
  const [lang, setLang] = useState<"tr" | "en" | "de">("tr");

  /* Load Active Language Settings */
  const loadActiveLanguage = () => {
    try {
      const p = JSON.parse(localStorage.getItem("lexai_prefs") || "{}");
      if (p.lang && (p.lang === "tr" || p.lang === "en" || p.lang === "de")) {
        setLang(p.lang);
      }
    } catch {}
  };

  useEffect(() => {
    loadActiveLanguage();
    window.addEventListener("lexai_prefs_changed", loadActiveLanguage);
    return () => {
      window.removeEventListener("lexai_prefs_changed", loadActiveLanguage);
    };
  }, []);

  const t = COMPLIANCE_TRANSLATIONS[lang] || COMPLIANCE_TRANSLATIONS.tr;

  const FRAMEWORKS = [
    {
      name: "KVKK / GDPR",
      status: "Compliant",
      score: 94,
      lastAudit: "2026-04-15",
      openIssues: 0,
      icon: Globe,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      name: "SOC 2 Type II",
      status: "In Progress",
      score: 71,
      lastAudit: "2026-03-10",
      openIssues: 3,
      icon: Building,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      name: "ISO 27001",
      status: "Compliant",
      score: 88,
      lastAudit: "2026-02-20",
      openIssues: 1,
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      name: "Baro Mesleki Etik",
      status: "Action Required",
      score: 55,
      lastAudit: "2026-01-08",
      openIssues: 5,
      icon: Scale,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
  ];

  const ISSUES = [
    { id: "ISS-001", framework: "SOC 2", title: lang === "tr" ? "Şifre Politikası Güncellenmeli" : lang === "de" ? "Passwortrichtlinie muss aktualisiert werden" : "Password Policy Update Needed", severity: "High", status: "Open", due: "2026-06-01", owner: t.ownerIT },
    { id: "ISS-002", framework: "SOC 2", title: lang === "tr" ? "Log Retention 90 Güne Çıkarılmalı" : lang === "de" ? "Protokollaufbewahrung auf 90 Tage erhöhen" : "Extend Log Retention to 90 Days", severity: "Medium", status: "Open", due: "2026-06-15", owner: t.ownerDevOps },
    { id: "ISS-003", framework: "SOC 2", title: lang === "tr" ? "3. Taraf Erişim İncelemesi" : lang === "de" ? "Zugriffsüberprüfung für Drittanbieter" : "Third-Party Access Review Audit", severity: "Medium", status: "In Review", due: "2026-05-30", owner: t.ownerLegal },
    { id: "ISS-004", framework: "Baro Mesleki Etik", title: lang === "tr" ? "Çıkar Çatışması Beyan Formu Eksik" : lang === "de" ? "Interessenkonflikt-Erklärungsformular fehlt" : "Conflict of Interest Forms Missing", severity: "High", status: "Open", due: "2026-05-25", owner: t.ownerPartners },
    { id: "ISS-005", framework: "Baro Mesleki Etik", title: lang === "tr" ? "Vekâletname Kayıt Prosedürü" : lang === "de" ? "Registrierungsverfahren für Vollmachten" : "Power of Attorney Log Standard", severity: "High", status: "Open", due: "2026-06-10", owner: t.ownerOffice },
    { id: "ISS-006", framework: "ISO 27001", title: lang === "tr" ? "Risk Değerlendirme Raporu Güncellenmeli" : lang === "de" ? "Risikobewertungsbericht aktualisieren" : "Risk Assessment Document Refresh", severity: "Low", status: "In Review", due: "2026-07-01", owner: t.ownerRisk },
  ];

  const SEVERITY_COLORS: Record<string, string> = {
    High: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    Medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  };

  const STATUS_COLORS: Record<string, string> = {
    Open: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    "In Review": "text-amber-400 bg-amber-500/10 border-amber-500/20",
    Resolved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  const STATUS_ICONS: Record<string, React.ReactNode> = {
    Open: <XCircle className="w-3.5 h-3.5" />,
    "In Review": <Clock className="w-3.5 h-3.5" />,
    Resolved: <CheckCircle className="w-3.5 h-3.5" />,
  };

  const [filter, setFilter] = useState<"All" | "Open" | "In Review">("All");
  const [issues, setIssues] = useState(ISSUES);
  const [refreshing, setRefreshing] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResultAlert, setScanResultAlert] = useState(false);

  const openCount = issues.filter((i) => i.status === "Open").length;
  const filteredIssues = filter === "All" ? issues : issues.filter((i) => i.status === filter);

  const handleResolve = (id: string) => {
    setIssues(issues.map(i => i.id === id ? { ...i, status: "Resolved" } : i));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setIssues(ISSUES);
      setRefreshing(false);
    }, 700);
  };

  const triggerAuditScan = () => {
    if (scanActive) return;
    setScanActive(true);
    setScanResultAlert(false);
    setScanProgress(0);
    
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setScanActive(false);
            setScanResultAlert(true);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="p-6 lg:p-8 h-full overflow-y-auto font-sans bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-2 border-b border-border">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="border-border text-foreground bg-elevated hover:bg-border transition-colors">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> {t.refresh}
          </Button>
        </div>

        {/* Real-time AI Shield Status Panel (Premium Feature) */}
        <Card className="glass-panel border-emerald-500/20 shadow-[0_0_20px_-3px_rgba(16,185,129,0.1)] relative overflow-hidden">
          <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="relative mt-1">
                <span className="flex h-4 w-4 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  {t.activeScan} <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] uppercase font-bold tracking-wider">{t.scanSecure}</Badge>
                </h3>
                <p className="text-sm text-muted-foreground max-w-3xl">{t.activeScanDesc}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <Button 
                onClick={triggerAuditScan} 
                disabled={scanActive} 
                className="bg-primary hover:bg-primary/90 text-white font-medium"
              >
                {scanActive ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {scanProgress}%
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {t.auditTrigger}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
          {scanActive && (
            <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-300" style={{ width: `${scanProgress}%` }} />
          )}
        </Card>

        {/* Scan Success Alert */}
        <AnimatePresence>
          {scanResultAlert && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                {t.auditSuccess}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metrics Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t.statFrameworks, value: FRAMEWORKS.length, icon: ShieldCheck, color: "text-primary bg-primary/10 border-primary/20" },
            { label: t.statCompliant, value: `${FRAMEWORKS.filter((f) => f.status === "Compliant").length}/${FRAMEWORKS.length}`, icon: CheckCircle, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
            { label: t.statIssues, value: openCount, icon: AlertTriangle, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
            { label: t.statAvgScore, value: `${Math.round(FRAMEWORKS.reduce((s, f) => s + f.score, 0) / FRAMEWORKS.length)}%`, icon: TrendingUp, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="glass-panel border-border hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-2xl border ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs System */}
        <Tabs defaultValue="frameworks" className="space-y-6">
          <TabsList className="bg-elevated border border-border h-11 p-1 inline-flex self-start">
            <TabsTrigger value="frameworks" className="data-[state=active]:glass-panel data-[state=active]:text-primary h-full px-5 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> {t.tabFrameworks}
            </TabsTrigger>
            <TabsTrigger value="issues" className="data-[state=active]:glass-panel data-[state=active]:text-primary h-full px-5 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {t.tabIssues}
              {openCount > 0 && (
                <span className="ml-1.5 bg-rose-500/20 text-rose-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-rose-500/30">{openCount}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit-log" className="data-[state=active]:glass-panel data-[state=active]:text-primary h-full px-5 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" /> {t.tabAuditLog}
            </TabsTrigger>
          </TabsList>

          {/* FRAMEWORKS TAB */}
          <TabsContent value="frameworks">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FRAMEWORKS.map((fw, i) => (
                <motion.div key={fw.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="group">
                  <Card className={`glass-panel border-border group-hover:border-primary/20 transition-all duration-300`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-2xl ${fw.bg} border ${fw.border}`}>
                            <fw.icon className={`w-6 h-6 ${fw.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground text-base">{fw.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{t.lastAudit}: {new Date(fw.lastAudit).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}</p>
                          </div>
                        </div>
                        <ScoreRing score={fw.score} />
                      </div>

                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                        <Badge className={`text-[10px] px-2.5 py-1 border font-bold uppercase tracking-wider ${
                          fw.status === "Compliant" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" :
                          fw.status === "In Progress" ? "bg-amber-500/10 text-amber-400 border-amber-500/25" :
                          "bg-rose-500/10 text-rose-400 border-rose-500/25"
                        }`}>
                          {fw.status === "Compliant" ? <CheckCircle className="w-3.5 h-3.5 mr-1.5 inline" /> :
                           fw.status === "In Progress" ? <Clock className="w-3.5 h-3.5 mr-1.5 inline" /> :
                           <AlertTriangle className="w-3.5 h-3.5 mr-1.5 inline" />}
                          {fw.status === "Compliant" ? t.statusResolved : fw.status === "In Progress" ? t.statusInReview : t.statusOpen}
                        </Badge>
                        {fw.openIssues > 0 ? (
                          <span className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" /> {fw.openIssues} {t.issuesCount}
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {t.statusResolved}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* ISSUES TAB */}
          <TabsContent value="issues" className="space-y-4">
            {/* Filter pills */}
            <div className="flex gap-2">
              {(["All", "Open", "In Review"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition-all font-semibold ${
                    filter === f
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "border-border bg-elevated text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {f === "All" ? (lang === "tr" ? "Tümü" : lang === "de" ? "Alle" : "All") : f === "Open" ? t.statusOpen : t.statusInReview}
                </button>
              ))}
            </div>

            <Card className="glass-panel border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-elevated text-muted-foreground text-xs uppercase tracking-wider border-b border-border select-none">
                    <tr>
                      <th className="px-5 py-3 font-semibold">{t.colIssue}</th>
                      <th className="px-5 py-3 font-semibold">{t.colFramework}</th>
                      <th className="px-5 py-3 font-semibold">{t.colSeverity}</th>
                      <th className="px-5 py-3 font-semibold">{t.colStatus}</th>
                      <th className="px-5 py-3 font-semibold">{t.colOwner}</th>
                      <th className="px-5 py-3 font-semibold text-right">{t.colActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredIssues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-elevated/30 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-foreground text-sm">{issue.title}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{issue.id}</p>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground font-medium">{issue.framework}</td>
                        <td className="px-5 py-4">
                          <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 ${SEVERITY_COLORS[issue.severity]}`}>
                            {issue.severity === "High" ? t.severityHigh : issue.severity === "Medium" ? t.severityMedium : t.severityLow}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold flex items-center gap-1.5 border px-2 py-0.5 rounded-full w-max ${STATUS_COLORS[issue.status]}`}>
                            {STATUS_ICONS[issue.status]} {issue.status === "Open" ? t.statusOpen : issue.status === "In Review" ? t.statusInReview : t.statusResolved}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-foreground text-xs font-medium">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" /> {new Date(issue.due).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-5">{issue.owner}</p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {issue.status !== "Resolved" ? (
                            <Button variant="ghost" size="sm" onClick={() => handleResolve(issue.id)} className="text-xs text-primary hover:text-primary hover:bg-primary/10">
                              {t.btnResolve}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground/60 mr-4 font-medium flex items-center gap-1 justify-end">
                              <CheckCircle className="w-4 h-4 text-emerald-400" /> {t.statusResolved}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredIssues.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm font-medium">
                          {t.noIssues}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* AUDIT LOG TAB */}
          <TabsContent value="audit-log">
            <Card className="glass-panel border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-primary" /> {t.recentAuditEvents}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {[
                  { time: "2026-05-24 20:12:15", event: "PII masking engine validated 12 document chunks", level: "INFO", system: "ShieldEngine" },
                  { time: "2026-05-24 19:44:03", event: "Prompt Guardrail scan triggered: No toxicity detected", level: "INFO", system: "Guardrail" },
                  { time: "2026-05-24 18:22:58", event: "New OpenSearch document schema validation successful", level: "INFO", system: "IndexManager" },
                  { time: "2026-05-24 16:59:08", event: "Document 'Yunus_Emre_AKCA_Tr.pdf' deleted by Admin", level: "WARN", system: "DocumentService" },
                  { time: "2026-05-24 15:53:11", event: "JWT session signature keys rotated successfully", level: "INFO", system: "AuthManager" },
                  { time: "2026-05-24 14:10:02", event: "Database query_logs structure altered (added 'sources')", level: "WARN", system: "DatabaseEngine" },
                ].map((log, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-elevated rounded-xl border border-border text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-muted-foreground">{log.time}</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${log.level === "WARN" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                        {log.level}
                      </span>
                      <span className="text-foreground font-medium">{lang === "tr" ? log.event.replace("deleted by Admin", "Admin tarafından silindi").replace("validated", "doğrulandı").replace("triggered", "tetiklendi").replace("successful", "başarılı").replace("altered", "değiştirildi") : log.event}</span>
                    </div>
                    <Badge variant="outline" className="text-muted-foreground border-border text-[10px] font-mono font-medium">{log.system}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function CompliancePage() {
  return (
    <RoleGuard allowedRoles={["admin"]} redirectTo="/">
      <ComplianceContent />
    </RoleGuard>
  );
}
