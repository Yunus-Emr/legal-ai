"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { BrainCircuit, Clock, Coins, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const tokenData = [
  { name: 'Mon', tokens: 4000 },
  { name: 'Tue', tokens: 3000 },
  { name: 'Wed', tokens: 2000 },
  { name: 'Thu', tokens: 2780 },
  { name: 'Fri', tokens: 1890 },
  { name: 'Sat', tokens: 2390 },
  { name: 'Sun', tokens: 3490 },
];

const riskData = [
  { name: 'High', value: 12 },
  { name: 'Medium', value: 45 },
  { name: 'Low', value: 120 },
];

export default function AnalyticsPage() {
  return (
    <div className="p-8 h-full flex flex-col font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">AI performance, token usage, and firm-wide efficiency metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-surface border-border card-lift">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div><p className="text-sm text-muted-foreground">Time Saved (Est.)</p><h3 className="text-2xl font-bold mt-1">1,240 hrs</h3></div>
              <div className="p-2 bg-primary/10 text-primary rounded-lg"><Clock className="w-5 h-5" /></div>
            </div>
            <p className="text-xs text-success mt-4 font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +12% this month</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border card-lift">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div><p className="text-sm text-muted-foreground">AI Token Usage</p><h3 className="text-2xl font-bold mt-1">4.2M</h3></div>
              <div className="p-2 bg-info/10 text-info rounded-lg"><Coins className="w-5 h-5" /></div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 font-medium"> Across 14 active seats</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border card-lift">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div><p className="text-sm text-muted-foreground">Contracts Analyzed</p><h3 className="text-2xl font-bold mt-1">842</h3></div>
              <div className="p-2 bg-ai-accent/10 text-ai-accent rounded-lg"><BrainCircuit className="w-5 h-5" /></div>
            </div>
            <p className="text-xs text-success mt-4 font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +5.4% this month</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border card-lift">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div><p className="text-sm text-muted-foreground">High Risk Flags</p><h3 className="text-2xl font-bold mt-1">12</h3></div>
              <div className="p-2 bg-danger/10 text-danger rounded-lg"><TrendingUp className="w-5 h-5" /></div>
            </div>
            <p className="text-xs text-danger mt-4 font-medium">Requires immediate review</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        {/* Token Usage Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-2">
          <Card className="bg-surface border-border h-full flex flex-col shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base font-medium">AI Token Consumption (7 Days)</CardTitle>
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

        {/* Risk Distribution */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="col-span-1">
          <Card className="bg-surface border-border h-full flex flex-col shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base font-medium">Risk Distribution Trends</CardTitle>
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
                      <Cell key={`cell-${index}`} fill={entry.name === 'High' ? '#EF4444' : entry.name === 'Medium' ? '#F59E0B' : '#10B981'} />
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
