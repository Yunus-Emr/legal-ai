"use client";

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
} from "lucide-react";
import { analyticsApi, type DashboardStats, type ActivityItem } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

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

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [statsRes, activityRes] = await Promise.all([
        analyticsApi.dashboard(),
        analyticsApi.activity(),
      ]);
      setStats(statsRes.data);
      setActivity(activityRes.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Otomatik yenile — 60s
    const interval = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      label: "Total Documents",
      value: stats ? stats.total_documents.toLocaleString() : "—",
      icon: BriefcaseIcon,
      trend: stats ? "In knowledge base" : "Loading...",
      alert: false,
    },
    {
      label: "Pending Reviews",
      value: "12",
      icon: FileText,
      trend: "Requires attention",
      alert: true,
    },
    {
      label: "AI Queries",
      value: stats ? stats.total_queries.toLocaleString() : "—",
      icon: Activity,
      trend: stats ? "Total queries" : "Loading...",
      alert: false,
    },
    {
      label: "Avg Response",
      value: stats ? `${Math.round(stats.avg_response_time_ms)}ms` : "—",
      icon: Clock,
      trend: "AI response time",
      alert: false,
    },
  ];

  return (
    <div className="p-6 lg:p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user?.name
              ? `Welcome back, ${user.name.split(" ")[0]}. Here's your platform overview.`
              : "Enterprise overview of matters, AI tasks, and intelligence metrics."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#1A2235] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <ShieldCheck className="w-4 h-4" />
            System Health: Optimal
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
                <Card className="bg-surface border-border shadow-sm hover:border-primary/20 transition-colors">
                  <CardContent className="p-6">
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
                            ? "bg-destructive/10 text-destructive"
                            : "bg-[#1A2235] text-muted-foreground"
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
                label: "Indexed Chunks",
                value: stats ? stats.total_chunks.toLocaleString() : "—",
                color: "text-[#10B981]",
                bg: "bg-[#10B981]/10",
              },
              {
                icon: Zap,
                label: "Queries Today",
                value: stats ? stats.total_queries.toLocaleString() : "—",
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                icon: Activity,
                label: "Avg Latency",
                value: stats ? `${Math.round(stats.avg_response_time_ms)}ms` : "—",
                color: "text-[#F59E0B]",
                bg: "bg-[#F59E0B]/10",
              },
            ].map((item) => (
              <Card key={item.label} className="bg-surface border-border shadow-sm">
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
          <Card className="bg-surface border-border flex-1 shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                Urgent Matter Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 hover:bg-[#1A2235]/50 transition-colors flex items-start gap-4 cursor-pointer group"
                  >
                    <div className="mt-1 w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20 shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        Discrepancy found in Limitation of Liability clause
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        The recently uploaded &quot;Vendor_Agreement_v{i}.pdf&quot; contains a
                        liability cap that contradicts the master service agreement standard
                        terms (Section 4.2).
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        <span className="text-foreground">Matter:</span> Global Logistics
                        <span className="text-foreground ml-2">Confidence:</span> {92 + i}%
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
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
          <Card className="bg-surface border-border flex-1 shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Activity className="w-5 h-5 text-muted-foreground" />
                Intelligence Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <ActivitySkeleton />
              ) : activity.length > 0 ? (
                <div className="space-y-6">
                  {activity.map((act, idx) => (
                    <div key={idx} className="relative pl-6">
                      {/* Timeline line */}
                      {idx < activity.length - 1 && (
                        <div className="absolute left-[9px] top-5 bottom-[-16px] w-px bg-border" />
                      )}
                      {/* Dot */}
                      <div
                        className={`absolute left-0 top-1.5 w-5 h-5 rounded-full border-2 border-[#111827] flex items-center justify-center ${getActivityStatusColor(act.type)}`}
                      >
                        <div className="w-1.5 h-1.5 bg-[#111827] rounded-full" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground">{act.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-muted-foreground capitalize">
                            {act.type}
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
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Start querying documents to see feed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
