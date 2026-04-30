"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Activity, 
  Clock, 
  AlertCircle,
  Gavel,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

const stats = [
  { label: "Active Matters", value: "24", icon: BriefcaseIcon, trend: "+3 this week" },
  { label: "Pending Reviews", value: "12", icon: FileText, trend: "Requires attention", alert: true },
  { label: "AI Insights Gen.", value: "1,492", icon: Activity, trend: "High confidence" },
  { label: "Time Saved (hrs)", value: "184", icon: Clock, trend: "Last 30 days" },
];

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

const recentActivities = [
  { id: 1, action: "AI Contextual Analysis completed", matter: "Acquisition of TechCorp", time: "10 min ago", status: "success" },
  { id: 2, action: "Clause extraction warning: Indemnification", matter: "Smith vs Global Logistics", time: "45 min ago", status: "warning" },
  { id: 3, action: "New corpus indexed", matter: "Q3 Vendor Contracts", time: "2 hours ago", status: "info" },
  { id: 4, action: "Drafting: Motion for Summary Judgment", matter: "Estate of Doe", time: "4 hours ago", status: "info" },
];

export default function Dashboard() {
  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise overview of matters, AI tasks, and intelligence metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
          <ShieldCheck className="w-4 h-4" />
          System Health: Optimal
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="bg-surface border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <h3 className="text-3xl font-semibold mt-2 text-foreground">{stat.value}</h3>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.alert ? 'bg-destructive/10 text-destructive' : 'bg-elevated text-muted-foreground'}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className={stat.alert ? 'text-destructive font-medium' : 'text-primary font-medium'}>
                    {stat.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid: 12-column system */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Span: 8 columns */}
        <motion.div 
          className="col-span-12 xl:col-span-8 flex flex-col gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-surface border-border flex-1 shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Gavel className="w-5 h-5 text-muted-foreground" />
                Urgent Matter Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 hover:bg-elevated/50 transition-colors flex items-start gap-4 cursor-pointer group">
                    <div className="mt-1 w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20 shrink-0"></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        Discrepancy found in Limitation of Liability clause
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        The recently uploaded &quot;Vendor_Agreement_v3.pdf&quot; contains a liability cap that contradicts the master service agreement standard terms (Section 4.2).
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        <span className="text-foreground">Matter:</span> Global Logistics
                        <span className="text-foreground ml-2">Confidence:</span> 94%
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Span: 4 columns */}
        <motion.div 
          className="col-span-12 xl:col-span-4 flex flex-col gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-surface border-border flex-1 shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Activity className="w-5 h-5 text-muted-foreground" />
                Intelligence Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-6">
                {recentActivities.map((act) => (
                  <div key={act.id} className="relative pl-6">
                    {/* Timeline Line */}
                    <div className="absolute left-[9px] top-2 bottom-[-16px] w-px bg-border last:hidden"></div>
                    {/* Timeline Dot */}
                    <div className={`absolute left-0 top-1.5 w-5 h-5 rounded-full border-2 border-surface flex items-center justify-center
                      ${act.status === 'warning' ? 'bg-destructive' : act.status === 'success' ? 'bg-primary' : 'bg-muted-foreground'}
                    `}>
                      <div className="w-1.5 h-1.5 bg-surface rounded-full"></div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-foreground">{act.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-muted-foreground">{act.matter}</span>
                        <span className="text-[10px] text-muted-foreground/60">•</span>
                        <span className="text-[10px] text-muted-foreground/80">{act.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
