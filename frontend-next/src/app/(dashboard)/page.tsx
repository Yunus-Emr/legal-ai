"use client";

/**
 * Main Dashboard — Dynamic Translation and Premium Aesthetics
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Activity,
  Clock,
  ChevronRight,
  ShieldCheck,
  Database,
  Zap,
  RefreshCw,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

import { analyticsApi, type DashboardStats, type ActivityItem } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { RoleGuard } from "@/components/auth/RoleGuard";

/* ── Dashboard Translations ────────────────────────────────────────────── */
const TRANSLATIONS = {
  tr: {
    welcome: "Tekrar hoş geldin",
    subtitle: "Kullanıcı paneline ve kurumsal zeka metriklerine genel bakış.",
    health: "Sistem Durumu: Optimal",
    totalDocs: "Toplam Doküman",
    indexedChunks: "Vektör Parçaları",
    aiQueries: "AI Sorguları",
    avgResponse: "Ort. Yanıt Süresi",
    inKb: "Bilgi bankasında",
    embeddings: "Vektör yerleştirmeleri",
    queriesDesc: "Toplam sorgu",
    latencyDesc: "AI yanıt süresi",
    matterInsights: "Kritik Hukuki Analizler",
    discrepancyTitle: "Sorumluluk Sınırlandırması maddesinde tutarsızlık tespit edildi",
    discrepancyDesc: "Son yüklenen Tedarikçi Sözleşmesi ana sözleşme standart maddesiyle (Bölüm 4.2) çelişen bir sorumluluk üst sınırı içeriyor.",
    matterLabel: "Dosya:",
    confidenceLabel: "Güven Oranı:",
    globalLogistics: "Küresel Lojistik",
    intelligenceFeed: "Zeka Olay Akışı",
    noActivity: "Yakın zamanda olay gerçekleşmedi",
    startQuerying: "Akışı görmek için doküman sorgulamaya başlayın.",
    justNow: "az önce",
    minAgo: "dakika önce",
    hrsAgo: "saat önce",
    daysAgo: "gün önce",
    offlineBanner: "Backend bağlantısı kurulamadı. Sistem çevrimdışı modda çalışıyor. API sunucusunun çalıştığından emin olun."
  },
  en: {
    welcome: "Welcome back",
    subtitle: "Here's your enterprise overview and intelligence metrics.",
    health: "System Health: Optimal",
    totalDocs: "Total Documents",
    indexedChunks: "Indexed Chunks",
    aiQueries: "AI Queries",
    avgResponse: "Avg Response",
    inKb: "In knowledge base",
    embeddings: "Vector embeddings",
    queriesDesc: "Total queries",
    latencyDesc: "AI response time",
    matterInsights: "Urgent Matter Insights",
    discrepancyTitle: "Discrepancy found in Limitation of Liability clause",
    discrepancyDesc: "The recently uploaded Vendor Agreement contains a liability cap that contradicts the master service agreement standard terms (Section 4.2).",
    matterLabel: "Matter:",
    confidenceLabel: "Confidence:",
    globalLogistics: "Global Logistics",
    intelligenceFeed: "Intelligence Feed",
    noActivity: "No recent activity",
    startQuerying: "Start querying documents to see feed",
    justNow: "just now",
    minAgo: "min ago",
    hrsAgo: "hours ago",
    daysAgo: "days ago",
    offlineBanner: "Backend connection could not be established. Operating in offline fallback mode."
  }
};

function BriefcaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function StatSkeleton() {
  return (
    <div className="animate-pulse">
      <Card className="bg-surface border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-8 w-16 bg-muted rounded" />
            </div>
            <div className="w-9 h-9 bg-muted rounded-lg" />
          </div>
          <div className="mt-4 h-3 w-32 bg-muted rounded" />
        </CardContent>
      </Card>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative pl-6">
          <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-48 bg-muted rounded" />
            <div className="h-2 w-32 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getActivityStatusColor(type: string): string {
  if (type === "query") return "bg-primary";
  if (type === "upload") return "bg-[#10B981]";
  if (type === "delete") return "bg-destructive";
  return "bg-muted-foreground";
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);
  const [lang, setLang] = useState<"tr" | "en">("tr");

  /* Dynamic Translation Hook */
  useEffect(() => {
    const loadLang = () => {
      try {
        const p = JSON.parse(localStorage.getItem("lexai_prefs") || "{}");
        if (p.lang === "tr" || p.lang === "en") setLang(p.lang);
      } catch {}
    };
    loadLang();
    window.addEventListener("lexai_prefs_changed", loadLang);
    return () => window.removeEventListener("lexai_prefs_changed", loadLang);
  }, []);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;

  const timeAgo = (isoString: string): string => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t.justNow;
    if (mins < 60) return `${mins} ${t.minAgo}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ${t.hrsAgo}`;
    return `${Math.floor(hrs / 24)} ${t.daysAgo}`;
  };

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [statsRes, activityRes, insightsRes] = await Promise.all([
        analyticsApi.dashboard(),
        analyticsApi.activity(),
        analyticsApi.insights(),
      ]);
      setStats(statsRes.data);
      setActivity(activityRes.data);
      setInsights(insightsRes.data);
      setBackendOffline(false);
    } catch (err: any) {
      const isNetworkErr = !err?.response;
      if (isNetworkErr) {
        setBackendOffline(true);
        console.warn("[Dashboard] Backend unreachable — running in offline mode.");
      } else {
        console.error("Dashboard fetch error:", err);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleReset = async () => {
    const confirmMsg = lang === "tr" 
      ? "Tüm sorgu loglarını ve ortalama yanıt süresi metriklerini sıfırlamak istediğinize emin misiniz?" 
      : "Are you sure you want to reset all query logs and average response time metrics?";
    if (!window.confirm(confirmMsg)) return;

    setIsResetting(true);
    try {
      await analyticsApi.reset();
      await fetchData(true);
    } catch (err) {
      console.error("Error resetting analytics:", err);
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      label: t.totalDocs,
      value: stats ? stats.total_documents.toLocaleString() : "—",
      icon: BriefcaseIcon,
      trend: t.inKb,
      alert: false,
    },
    {
      label: t.indexedChunks,
      value: stats ? stats.total_chunks.toLocaleString() : "—",
      icon: Database,
      trend: t.embeddings,
      alert: false,
    },
    {
      label: t.aiQueries,
      value: stats ? stats.total_queries.toLocaleString() : "—",
      icon: Activity,
      trend: t.queriesDesc,
      alert: false,
    },
    {
      label: t.avgResponse,
      value: stats 
        ? stats.avg_response_time_ms >= 1000 
          ? `${(stats.avg_response_time_ms / 1000).toFixed(2)}s` 
          : `${Math.round(stats.avg_response_time_ms)}ms`
        : "—",
      icon: Clock,
      trend: t.latencyDesc,
      alert: false,
    },
  ];

  return (
    <RoleGuard allowedRoles={["admin"]} redirectTo="/ai-canvas">
      <div className="p-6 lg:p-8 h-full overflow-y-auto bg-background text-foreground">
        {/* Backend offline banner */}
        {backendOffline && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-warning/10 border border-warning/30 text-warning text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              <strong>{t.offlineBanner}</strong>
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gradient">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.name
                ? `${t.welcome}, ${user.name.split(" ")[0]}. ${t.subtitle}`
                : t.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 transition-all disabled:opacity-50 shadow-sm"
              title={lang === "tr" ? "Metrikleri Sıfırla" : "Reset Metrics"}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
              <span>{lang === "tr" ? "Metrikleri Sıfırla" : "Reset Metrics"}</span>
            </button>
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#1A2235] border border-border transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 ai-glow">
              <ShieldCheck className="w-4 h-4" />
              {t.health}
            </div>
          </div>
        </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {isLoading
          ? [1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)
          : statCards.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
              >
                <Card className="glass-panel hover:border-primary/30 transition-colors card-lift relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.label}
                        </p>
                        <h3 className="text-3xl font-semibold mt-2 text-foreground">
                          {stat.value}
                        </h3>
                      </div>
                      <div
                        className={`p-2 rounded-lg ${
                          stat.alert
                            ? "bg-destructive/10 text-destructive shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                            : "bg-primary/10 text-primary shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                        }`}
                      >
                        <stat.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs">
                      <span
                        className={
                          stat.alert
                            ? "text-destructive font-medium"
                            : "text-primary font-medium"
                        }
                      >
                        {stat.trend}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: 8 columns — Quick Stats + Insights */}
        <motion.div
          className="col-span-12 xl:col-span-8 flex flex-col gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          {/* Knowledge Base Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: Database,
                label: t.indexedChunks,
                value: stats ? stats.total_chunks.toLocaleString() : "—",
                color: "text-[#10B981]",
                bg: "bg-[#10B981]/10",
              },
              {
                icon: Zap,
                label: lang === "tr" ? "Sorgular (Bugün)" : "Queries (Today)",
                value: stats ? stats.total_queries.toLocaleString() : "—",
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                icon: Clock,
                label: lang === "tr" ? "Gecikme Süresi" : "Avg Latency",
                value: stats ? `${Math.round(stats.avg_response_time_ms)}ms` : "—",
                color: "text-[#F59E0B]",
                bg: "bg-[#F59E0B]/10",
              },
            ].map((item) => (
              <Card key={item.label} className="glass-panel card-lift">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.bg}`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className={`text-lg font-semibold ${item.color}`}>{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Urgent Matter Insights */}
          <Card className="glass-panel flex-1">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2 text-gradient">
                <FileText className="w-5 h-5 text-muted-foreground" />
                {t.matterInsights}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {insights.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  {lang === "tr" ? "Henüz kritik analiz kaydı bulunamadı." : "No critical insights found yet."}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {insights.map((ins) => (
                    <div
                      key={ins.id}
                      className="p-4 hover:bg-[#1A2235]/50 transition-colors flex items-start gap-4 cursor-pointer group"
                    >
                      <div className="mt-1 w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20 shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {ins.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {ins.description}
                        </p>
                        <div className="mt-3 flex items-center gap-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                          <span className="text-foreground">{t.matterLabel}</span> {ins.matter_name}
                          <span className="text-foreground ml-2">{t.confidenceLabel}</span> {ins.confidence}%
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: 4 columns — Activity Feed */}
        <motion.div
          className="col-span-12 xl:col-span-4 flex flex-col gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="glass-panel flex-1">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2 text-gradient">
                <Activity className="w-5 h-5 text-muted-foreground" />
                {t.intelligenceFeed}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <ActivitySkeleton />
              ) : activity.length > 0 ? (
                <div className="space-y-6">
                  {activity.map((act, idx) => (
                    <div key={idx} className="relative pl-6">
                      {idx < activity.length - 1 && (
                        <div className="absolute left-[9px] top-5 bottom-[-16px] w-px bg-border" />
                      )}
                      <div
                        className={`absolute left-0 top-1.5 w-5 h-5 rounded-full border-2 border-[#111827] flex items-center justify-center ${getActivityStatusColor(act.type)}`}
                      >
                        <div className="w-1.5 h-1.5 bg-[#111827] rounded-full" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground">
                          {lang === "tr"
                            ? act.description
                                .replace("User", "Kullanıcı")
                                .replace("uploaded", "yükledi")
                                .replace("queried", "sorguladı")
                                .replace("deleted", "sildi")
                                .replace("documents", "dokümanları")
                            : act.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-muted-foreground capitalize">
                            {lang === "tr"
                              ? act.type.replace("query", "sorgu").replace("upload", "yükleme").replace("delete", "silme")
                              : act.type}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">•</span>
                          <span className="text-[10px] text-muted-foreground/80">
                            {timeAgo(act.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="w-8 h-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">{t.noActivity}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {t.startQuerying}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  </RoleGuard>
  );
}
