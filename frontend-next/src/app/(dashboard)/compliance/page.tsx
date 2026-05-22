"use client";

/**
 * Compliance Page — Admin Only
 *
 * Yasal uyum, regülasyon takibi ve iç denetim durumu.
 * RoleGuard ile korunur.
 */

import { useState } from "react";
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
  FileText,
  RefreshCw,
  TrendingUp,
  Scale,
  Globe,
  Building,
} from "lucide-react";
import { motion } from "framer-motion";
import { RoleGuard } from "@/components/auth/RoleGuard";

/* ── Static compliance data (until backend endpoint is built) ─────────── */
const FRAMEWORKS = [
  {
    name: "KVKK / GDPR",
    status: "Compliant",
    score: 94,
    lastAudit: "2026-04-15",
    openIssues: 0,
    icon: Globe,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
  },
  {
    name: "SOC 2 Type II",
    status: "In Progress",
    score: 71,
    lastAudit: "2026-03-10",
    openIssues: 3,
    icon: Building,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
  },
  {
    name: "ISO 27001",
    status: "Compliant",
    score: 88,
    lastAudit: "2026-02-20",
    openIssues: 1,
    icon: ShieldCheck,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
  },
  {
    name: "Baro Mesleki Etik",
    status: "Action Required",
    score: 55,
    lastAudit: "2026-01-08",
    openIssues: 5,
    icon: Scale,
    color: "text-danger",
    bg: "bg-danger/10",
    border: "border-danger/30",
  },
];

const ISSUES = [
  { id: "ISS-001", framework: "SOC 2", title: "Şifre Politikası Güncellenmeli", severity: "High", status: "Open", due: "2026-06-01", owner: "IT Ekibi" },
  { id: "ISS-002", framework: "SOC 2", title: "Log Retention 90 Güne Çıkarılmalı", severity: "Medium", status: "Open", due: "2026-06-15", owner: "DevOps" },
  { id: "ISS-003", framework: "SOC 2", title: "3. Taraf Erişim İncelemesi", severity: "Medium", status: "In Review", due: "2026-05-30", owner: "Hukuk" },
  { id: "ISS-004", framework: "Baro Mesleki Etik", title: "Çıkar Çatışması Beyan Formu Eksik", severity: "High", status: "Open", due: "2026-05-25", owner: "Ortaklar" },
  { id: "ISS-005", framework: "Baro Mesleki Etik", title: "Vekâletname Kayıt Prosedürü", severity: "High", status: "Open", due: "2026-06-10", owner: "Sekreterya" },
  { id: "ISS-006", framework: "ISO 27001", title: "Risk Değerlendirme Raporu Güncellenmeli", severity: "Low", status: "In Review", due: "2026-07-01", owner: "Risk Ekibi" },
];

const SEVERITY_COLORS: Record<string, string> = {
  High: "text-danger bg-danger/10 border-danger/30",
  Medium: "text-warning bg-warning/10 border-warning/30",
  Low: "text-success bg-success/10 border-success/30",
};

const STATUS_COLORS: Record<string, string> = {
  Open: "text-danger",
  "In Review": "text-warning",
  Resolved: "text-success",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Open: <XCircle className="w-3.5 h-3.5" />,
  "In Review": <Clock className="w-3.5 h-3.5" />,
  Resolved: <CheckCircle className="w-3.5 h-3.5" />,
};

/* ── Score Ring ────────────────────────────────────────────────────────── */
function ScoreRing({ score, size = 60 }: { score: number; size?: number }) {
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = r * 2 * Math.PI;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={sw} fill="none" className="text-border" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={sw} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-700 ease-out" />
      </svg>
      <span className="absolute text-xs font-bold font-mono" style={{ color }}>{score}</span>
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────────────────── */
function ComplianceContent() {
  const [filter, setFilter] = useState<"All" | "Open" | "In Review">("All");
  const [issues, setIssues] = useState(ISSUES);
  const [refreshing, setRefreshing] = useState(false);

  const openCount = issues.filter((i) => i.status === "Open").length;
  const filteredIssues = filter === "All" ? issues : issues.filter((i) => i.status === filter);

  const handleResolve = (id: string) => {
    setIssues(issues.map(i => i.id === id ? { ...i, status: "Resolved" } : i));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setIssues(ISSUES); // reset to mock
      setRefreshing(false);
    }, 800);
  };

  return (
    <div className="p-6 lg:p-8 h-full overflow-y-auto font-sans">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Compliance Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Yasal uyum durumu, regülasyon takibi ve açık bulgular.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="border-border text-muted-foreground hover:text-foreground">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Yenile
        </Button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Framework", value: FRAMEWORKS.length, icon: ShieldCheck, color: "text-primary bg-primary/10" },
          { label: "Compliant", value: FRAMEWORKS.filter((f) => f.status === "Compliant").length, icon: CheckCircle, color: "text-success bg-success/10" },
          { label: "Open Issues", value: openCount, icon: AlertTriangle, color: "text-warning bg-warning/10" },
          { label: "Avg Score", value: `${Math.round(FRAMEWORKS.reduce((s, f) => s + f.score, 0) / FRAMEWORKS.length)}%`, icon: TrendingUp, color: "text-primary bg-primary/10" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className="bg-surface border-border">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="frameworks">
        <TabsList className="bg-elevated border border-border self-start h-10 p-1 mb-6">
          <TabsTrigger value="frameworks" className="data-[state=active]:bg-surface data-[state=active]:text-primary h-full px-4 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Frameworks
          </TabsTrigger>
          <TabsTrigger value="issues" className="data-[state=active]:bg-surface data-[state=active]:text-primary h-full px-4 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Açık Bulgular
            {openCount > 0 && (
              <span className="ml-1 bg-danger/20 text-danger text-[10px] font-bold px-1.5 rounded-full">{openCount}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* FRAMEWORKS TAB */}
        <TabsContent value="frameworks">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FRAMEWORKS.map((fw, i) => (
              <motion.div key={fw.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Card className={`bg-surface border ${fw.border} transition-all hover:shadow-md`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${fw.bg}`}>
                          <fw.icon className={`w-5 h-5 ${fw.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{fw.name}</h3>
                          <p className="text-xs text-muted-foreground">Son denetim: {new Date(fw.lastAudit).toLocaleDateString("tr-TR")}</p>
                        </div>
                      </div>
                      <ScoreRing score={fw.score} />
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge className={`text-[10px] px-2 py-0.5 border font-semibold uppercase tracking-wide ${
                        fw.status === "Compliant" ? "bg-success/10 text-success border-success/30" :
                        fw.status === "In Progress" ? "bg-warning/10 text-warning border-warning/30" :
                        "bg-danger/10 text-danger border-danger/30"
                      }`}>
                        {fw.status === "Compliant" ? <CheckCircle className="w-3 h-3 mr-1 inline" /> :
                         fw.status === "In Progress" ? <Clock className="w-3 h-3 mr-1 inline" /> :
                         <AlertTriangle className="w-3 h-3 mr-1 inline" />}
                        {fw.status}
                      </Badge>
                      {fw.openIssues > 0 && (
                        <span className="text-xs text-danger font-medium flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> {fw.openIssues} açık bulgu
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
        <TabsContent value="issues">
          {/* Filter pills */}
          <div className="flex gap-2 mb-4">
            {(["All", "Open", "In Review"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                  filter === f
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <Card className="bg-surface border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-elevated text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-5 py-3 font-medium">Issue</th>
                    <th className="px-5 py-3 font-medium">Framework</th>
                    <th className="px-5 py-3 font-medium">Severity</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Due / Owner</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-elevated/30 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{issue.title}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{issue.id}</p>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{issue.framework}</td>
                      <td className="px-5 py-4">
                        <Badge variant="outline" className={`text-[10px] uppercase border ${SEVERITY_COLORS[issue.severity]}`}>
                          {issue.severity}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium flex items-center gap-1.5 ${STATUS_COLORS[issue.status]}`}>
                          {STATUS_ICONS[issue.status]} {issue.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <Clock className="w-3.5 h-3.5" /> {new Date(issue.due).toLocaleDateString("tr-TR")}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-5">{issue.owner}</p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {issue.status !== "Resolved" ? (
                          <Button variant="ghost" size="sm" onClick={() => handleResolve(issue.id)} className="text-xs text-primary hover:text-primary hover:bg-primary/10">
                            Resolve
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 mr-4">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredIssues.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground text-sm">
                        Bu filtreye uygun bulgu bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
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
