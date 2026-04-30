"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Settings, Shield, CreditCard, Plug, Search, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminPage() {
  return (
    <div className="p-8 h-full flex flex-col font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Enterprise-grade management: Security, AI Configuration, and RBAC.</p>
      </div>

      <Tabs defaultValue="users" className="flex-1 flex flex-col">
        <TabsList className="bg-elevated border border-border self-start mb-6 h-12 p-1">
          <TabsTrigger value="users" className="data-[state=active]:bg-surface data-[state=active]:text-primary h-full px-6 flex items-center gap-2"><Users className="w-4 h-4"/> Users</TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-surface data-[state=active]:text-primary h-full px-6 flex items-center gap-2"><Settings className="w-4 h-4"/> AI Config</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-surface data-[state=active]:text-primary h-full px-6 flex items-center gap-2"><Shield className="w-4 h-4"/> Security</TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-surface data-[state=active]:text-primary h-full px-6 flex items-center gap-2"><CreditCard className="w-4 h-4"/> Billing</TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-surface data-[state=active]:text-primary h-full px-6 flex items-center gap-2"><Plug className="w-4 h-4"/> Integrations</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          {/* USERS TAB */}
          <TabsContent value="users" className="m-0 h-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search users by name or email..." className="pl-9 w-[400px] bg-surface" />
                </div>
                <Button className="bg-primary text-white"><Plus className="w-4 h-4 mr-2"/> Invite User</Button>
              </div>

              <div className="border border-border rounded-lg bg-surface overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-elevated text-muted-foreground text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">User</th>
                      <th className="px-6 py-4 font-medium">Role (RBAC)</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Last Login</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { name: "Atty. Yilmaz", email: "yilmaz@firm.com", role: "Super Admin", status: "Active", login: "2 mins ago" },
                      { name: "Sarah Connor", email: "s.connor@firm.com", role: "Partner", status: "Active", login: "1 hour ago" },
                      { name: "John Doe", email: "j.doe@firm.com", role: "Associate", status: "Inactive", login: "3 days ago" }
                    ].map((u, i) => (
                      <tr key={i} className="hover:bg-elevated/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-semibold">{u.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground'}`}></div>
                            <span className="text-muted-foreground">{u.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{u.login}</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary">Edit</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </TabsContent>

          {/* AI CONFIG TAB */}
          <TabsContent value="ai" className="m-0 h-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-6">
              <Card className="bg-surface border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base flex items-center gap-2"><Settings className="w-5 h-5 text-ai-accent" /> Model Selection</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Primary Legal Model</label>
                    <select className="w-full bg-elevated border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                      <option>GPT-4 Legal Fine-tuned</option>
                      <option>Claude 3.5 Sonnet (Legal Context)</option>
                      <option>LexAI Custom LLM (Self-hosted)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Knowledge Base Injection Limit</label>
                    <Input type="number" defaultValue="250000" className="bg-elevated border-border" />
                    <p className="text-xs text-muted-foreground mt-1">Tokens per request context window.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-surface border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base flex items-center gap-2"><Shield className="w-5 h-5 text-warning" /> Prompt Guardrails</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-elevated rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">Hallucination Prevention (Strict)</p>
                      <p className="text-xs text-muted-foreground">Force AI to only cite explicitly from uploaded corpus.</p>
                    </div>
                    <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer shadow-inner">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-elevated rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">PII Masking</p>
                      <p className="text-xs text-muted-foreground">Auto-redact client names and SSNs before sending to LLM.</p>
                    </div>
                    <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer shadow-inner">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* SECURITY TAB */}
          <TabsContent value="security" className="m-0 h-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <Card className="bg-surface border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Enterprise Security</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Enforce 2FA Firm-wide</p>
                        <p className="text-xs text-muted-foreground mt-1">Require all users to use TOTP or Hardware keys.</p>
                      </div>
                      <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer shadow-inner">
                        <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">SSO Configuration</p>
                        <p className="text-xs text-muted-foreground mt-1">SAML / OAuth (Okta, Azure AD, Google Workspace).</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-border">Configure SSO</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-surface border-border flex-1">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base">System Audit Logs (SOC2)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-elevated text-muted-foreground text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3 font-medium">Event</th>
                        <th className="px-6 py-3 font-medium">User</th>
                        <th className="px-6 py-3 font-medium">IP Address</th>
                        <th className="px-6 py-3 font-medium">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono text-xs">
                      <tr>
                        <td className="px-6 py-3 text-warning">Model Config Changed</td>
                        <td className="px-6 py-3">Atty. Yilmaz</td>
                        <td className="px-6 py-3 text-muted-foreground">192.168.1.109</td>
                        <td className="px-6 py-3 text-muted-foreground">2026-04-30 21:05:12</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-3 text-success">Successful Login</td>
                        <td className="px-6 py-3">Sarah Connor</td>
                        <td className="px-6 py-3 text-muted-foreground">45.32.12.11</td>
                        <td className="px-6 py-3 text-muted-foreground">2026-04-30 20:45:00</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-3 text-danger">Failed 2FA Attempt</td>
                        <td className="px-6 py-3">Unknown</td>
                        <td className="px-6 py-3 text-muted-foreground">104.22.45.6</td>
                        <td className="px-6 py-3 text-muted-foreground">2026-04-30 19:12:33</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* BILLING & INTEGRATIONS TABS */}
          <TabsContent value="billing" className="m-0 h-full">
            <div className="flex items-center justify-center h-full text-muted-foreground">Billing module UI coming soon.</div>
          </TabsContent>
          <TabsContent value="integrations" className="m-0 h-full">
            <div className="flex items-center justify-center h-full text-muted-foreground">Integrations (Slack, DocuSign) UI coming soon.</div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
