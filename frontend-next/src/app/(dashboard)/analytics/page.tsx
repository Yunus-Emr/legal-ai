"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { BrainCircuit, Clock, Coins, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { analyticsApi, DashboardStats } from "@/lib/api";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tokenData, setTokenData] = useState<any[]>([]);
  const [riskData, setRiskData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, trendsRes, responseTimeRes] = await Promise.all([
          analyticsApi.dashboard(),
          analyticsApi.queryTrends(),
          analyticsApi.responseTime()
        ]);

        setStats(statsRes.data);

        // Format trends for AreaChart
        const formattedTrends = trendsRes.data.map(d => ({
          name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
          tokens: d.queries * 150 // Assuming average 150 tokens per query for demonstration
        }));
        // If empty, provide some default shape
        setTokenData(formattedTrends.length > 0 ? formattedTrends : [
          { name: 'Mon', tokens: 0 }, { name: 'Tue', tokens: 0 }
        ]);

        // Format response times for BarChart (reusing riskData layout but for response times)
        const formattedResp = responseTimeRes.data.map(d => ({
          name: d.range,
          value: d.count
        }));
        setRiskData(formattedResp.length > 0 ? formattedResp : [
          { name: '0-1s', value: 0 }, { name: '1-2s', value: 0 }, { name: '5s+', value: 0 }
        ]);

      } catch (err: any) {
        setError(err.response?.data?.detail || "Analytics verileri alınamadı.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 h-full flex items-center justify-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading analytics...</div>;
  }

  if (error) {
    return <div className="p-8 h-full flex items-center justify-center text-red-400"><AlertCircle className="w-5 h-5 mr-2" /> {error}</div>;
  }

  return (
    <div className="p-8 h-full flex flex-col font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">AI performance, usage, and system metrics for {stats?.current_user_name}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-surface border-border card-lift">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div><p className="text-sm text-muted-foreground">Total Documents</p><h3 className="text-2xl font-bold mt-1">{stats?.total_documents || 0}</h3></div>
              <div className="p-2 bg-primary/10 text-primary rounded-lg"><Clock className="w-5 h-5" /></div>
            </div>
            <p className="text-xs text-success mt-4 font-medium flex items-center gap-1">Active Corpus</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border card-lift">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div><p className="text-sm text-muted-foreground">Vector Chunks</p><h3 className="text-2xl font-bold mt-1">{stats?.total_chunks || 0}</h3></div>
              <div className="p-2 bg-info/10 text-info rounded-lg"><Coins className="w-5 h-5" /></div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 font-medium"> Total Indexed</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border card-lift">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div><p className="text-sm text-muted-foreground">AI Queries</p><h3 className="text-2xl font-bold mt-1">{stats?.total_queries || 0}</h3></div>
              <div className="p-2 bg-ai-accent/10 text-ai-accent rounded-lg"><BrainCircuit className="w-5 h-5" /></div>
            </div>
            <p className="text-xs text-success mt-4 font-medium flex items-center gap-1">System wide usage</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border card-lift">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div><p className="text-sm text-muted-foreground">Avg Response Time</p><h3 className="text-2xl font-bold mt-1">{stats?.avg_response_time_ms || 0}ms</h3></div>
              <div className="p-2 bg-danger/10 text-warning rounded-lg"><TrendingUp className="w-5 h-5" /></div>
            </div>
            <p className="text-xs text-warning mt-4 font-medium">Generation speed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        {/* Token Usage Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-2">
          <Card className="bg-surface border-border h-full flex flex-col shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base font-medium">Estimated Token Consumption (7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tokenData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2D45" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1E2D45', borderRadius: '8px' }}
                    itemStyle={{ color: '#F8FAFC' }}
                  />
                  <Area type="monotone" dataKey="tokens" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Response Time Distribution */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="col-span-1">
          <Card className="bg-surface border-border h-full flex flex-col shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base font-medium">Response Time Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1E2D45" />
                  <XAxis type="number" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    cursor={{fill: '#1A2235'}}
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1E2D45', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === '5s+' ? '#EF4444' : entry.name === '1-2s' ? '#F59E0B' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
