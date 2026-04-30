"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Moon, Sun, ShieldCheck, Laptop, BrainCircuit, Globe, Bell, LogOut, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  return (
    <div className="p-8 h-full flex flex-col font-sans max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your enterprise environment, security, and AI preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 flex-1">
        
        {/* Navigation Sidebar */}
        <div className="col-span-1 space-y-2">
          <button className="w-full text-left px-4 py-3 bg-primary/10 border-l-2 border-primary text-primary font-medium rounded-r-lg flex items-center gap-3">
            <Monitor className="w-4 h-4" /> Preferences
          </button>
          <button className="w-full text-left px-4 py-3 text-muted-foreground hover:bg-elevated hover:text-foreground font-medium rounded-lg flex items-center gap-3 transition-colors">
            <BrainCircuit className="w-4 h-4" /> AI Behavior
          </button>
          <button className="w-full text-left px-4 py-3 text-muted-foreground hover:bg-elevated hover:text-foreground font-medium rounded-lg flex items-center gap-3 transition-colors">
            <ShieldCheck className="w-4 h-4" /> Security & 2FA
          </button>
          <button className="w-full text-left px-4 py-3 text-muted-foreground hover:bg-elevated hover:text-foreground font-medium rounded-lg flex items-center gap-3 transition-colors">
            <Laptop className="w-4 h-4" /> Active Sessions
          </button>
        </div>

        {/* Content Area */}
        <div className="col-span-3 space-y-6 pb-10">
          
          {/* Appearance & Language */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-6">
            <Card className="bg-surface border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base">Appearance</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex-1 border-2 border-primary bg-background rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5"></div>
                    <Moon className="w-6 h-6 text-primary" />
                    <span className="text-sm font-medium">Dark Mode</span>
                    <CheckCircle2 className="w-4 h-4 absolute top-2 right-2 text-primary" />
                  </div>
                  <div className="flex-1 border-2 border-border bg-[#F8FAFC] rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                    <Sun className="w-6 h-6 text-slate-800" />
                    <span className="text-sm font-medium text-slate-800">Light Mode</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base">Localization</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2"><Globe className="w-4 h-4"/> Interface Language</label>
                  <select className="w-full bg-elevated border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>Turkish (TR)</option>
                    <option>German (DE)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2"><Bell className="w-4 h-4"/> Notifications</label>
                  <select className="w-full bg-elevated border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>All Activity</option>
                    <option>Important Only (Mentions & Risks)</option>
                    <option>None</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Settings */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-surface border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-ai-accent"/> AI Verbosity & Citations</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-3">Response Detail Level</label>
                  <div className="flex bg-elevated rounded-lg p-1 border border-border">
                    <button className="flex-1 py-1.5 text-sm font-medium text-muted-foreground rounded-md hover:text-foreground transition-all">Concise (Summary)</button>
                    <button className="flex-1 py-1.5 text-sm font-medium bg-surface text-primary shadow rounded-md border border-primary/20">Balanced</button>
                    <button className="flex-1 py-1.5 text-sm font-medium text-muted-foreground rounded-md hover:text-foreground transition-all">Comprehensive (Full Legal Analysis)</button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground block mb-3">Citation Format Style</label>
                  <select className="w-full bg-elevated border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>Bluebook / Harvard Legal Style</option>
                    <option>Inline Numeric (e.g., [1])</option>
                    <option>Standard Footnotes</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security & Active Sessions */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-surface border-border">
              <CardHeader className="border-b border-border flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-success"/> Device Sessions & History</CardTitle>
                <Button size="sm" variant="outline" className="border-border text-xs h-7 text-muted-foreground">Sign out all other devices</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  <div className="p-4 flex items-center justify-between bg-primary/5">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-surface border border-border rounded-lg"><Monitor className="w-5 h-5 text-primary" /></div>
                      <div>
                        <p className="text-sm font-medium text-foreground">MacBook Pro (macOS) <span className="ml-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded uppercase tracking-wider">Current Session</span></p>
                        <p className="text-xs text-muted-foreground mt-1">Istanbul, Turkey • Chrome • IP: 192.168.1.109</p>
                      </div>
                    </div>
                    <span className="text-xs text-success font-medium">Active Now</span>
                  </div>
                  
                  <div className="p-4 flex items-center justify-between hover:bg-elevated/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-surface border border-border rounded-lg"><Laptop className="w-5 h-5 text-muted-foreground" /></div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Windows 11 PC</p>
                        <p className="text-xs text-muted-foreground mt-1">London, UK • Edge • IP: 45.32.12.11</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground font-mono">Last active: 2 hours ago</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"><LogOut className="w-4 h-4"/></Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
