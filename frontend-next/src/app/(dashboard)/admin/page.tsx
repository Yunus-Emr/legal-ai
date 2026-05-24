"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Settings,
  Shield,
  CreditCard,
  Plug,
  Search,
  Plus,
  Loader2,
  CheckCircle2,
  Save,
  AlertCircle,
  ToggleLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { adminApi, type AdminUser } from "@/lib/api";
import { RoleGuard } from "@/components/auth/RoleGuard";

/* ── Functional Toggle ──────────────────────────────────────────────────── */
function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function AdminContent() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [togglingUser, setTogglingUser] = useState<string | null>(null);

  /* AI Config state */
  const [aiConfig, setAiConfig] = useState({
    model: "gpt-4o",
    maxTokens: 2048,
    hallucination: true,
    piiMasking: true,
  });
  const [savingAi, setSavingAi] = useState(false);
  const [savedAi, setSavedAi] = useState(false);

  /* Security config state */
  const [secConfig, setSecConfig] = useState({
    enforce2fa: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, configRes] = await Promise.all([
          adminApi.users(),
          adminApi.config(),
        ]);
        setUsers(usersRes.data);
        const cfg = configRes.data;
        setConfig(cfg);
        if (cfg) {
          setAiConfig((prev) => ({
            ...prev,
            model: cfg.llm_model || prev.model,
            maxTokens: cfg.max_tokens || prev.maxTokens,
          }));
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Admin verileri alınamadı.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleUserActive = async (user: AdminUser) => {
    setTogglingUser(user.id);
    try {
      await adminApi.updateUser(user.id, { is_active: !user.isActive });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: !u.isActive } : u
        )
      );
    } catch {
      // silently fail
    } finally {
      setTogglingUser(null);
    }
  };

  const handleToggleUserRole = async (user: AdminUser) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    setTogglingUser(user.id);
    try {
      await adminApi.updateUser(user.id, { role: newRole });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, role: newRole } : u
        )
      );
    } catch {
    } finally {
      setTogglingUser(null);
    }
  };

  const handleSaveAiConfig = async () => {
    setSavingAi(true);
    try {
      await adminApi.updateConfig({
        llm_model: aiConfig.model,
        max_tokens: aiConfig.maxTokens,
      });
      setSavedAi(true);
      setTimeout(() => setSavedAi(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Konfigürasyon güncellenemedi.");
    } finally {
      setSavingAi(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const filteredUsers = users.filter(
    (u) =>
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 h-full flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        Admin verileri yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <div className="flex items-center gap-3 text-danger bg-danger/10 border border-danger/20 rounded-xl px-6 py-4">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col font-sans overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enterprise-grade management: Security, AI Configuration, and RBAC.
        </p>
      </div>

      <Tabs defaultValue="users" className="flex-1 flex flex-col">
        <TabsList className="bg-elevated border border-border self-start mb-6 h-12 p-1">
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-surface data-[state=active]:text-primary h-full px-6 flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Users
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="data-[state=active]:bg-surface data-[state=active]:text-primary h-full px-6 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" /> AI Config
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-surface data-[state=active]:text-primary h-full px-6 flex items-center gap-2"
          >
            <Shield className="w-4 h-4" /> Security
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="data-[state=active]:bg-surface data-[state=active]:text-primary h-full px-6 flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" /> Billing
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="data-[state=active]:bg-surface data-[state=active]:text-primary h-full px-6 flex items-center gap-2"
          >
            <Plug className="w-4 h-4" /> Integrations
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          {/* ── USERS TAB ────────────────────────────────────────── */}
          <TabsContent value="users" className="m-0 h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-6"
            >
              <div className="flex justify-between items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Ad veya e-posta ile ara..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 w-[360px] bg-surface border-border"
                  />
                </div>
                <Button className="bg-primary text-white">
                  <Plus className="w-4 h-4 mr-2" /> Kullanıcı Davet Et
                </Button>
              </div>

              <div className="border border-border rounded-xl bg-surface overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-elevated text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-medium">Kullanıcı</th>
                      <th className="px-6 py-4 font-medium">Rol (RBAC)</th>
                      <th className="px-6 py-4 font-medium">Durum</th>
                      <th className="px-6 py-4 font-medium">Kayıt</th>
                      <th className="px-6 py-4 font-medium text-right">
                        Eylemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-elevated/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleUserRole(u)}
                            disabled={togglingUser === u.id}
                            className={`px-2 py-1 border rounded-md text-xs font-semibold uppercase transition-colors hover:opacity-80 ${
                              u.role === "admin"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : "bg-primary/10 text-primary border-primary/20"
                            }`}
                            title="Rolü değiştirmek için tıkla"
                          >
                            {togglingUser === u.id ? (
                              <Loader2 className="w-3 h-3 animate-spin inline" />
                            ) : (
                              u.role
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Toggle
                              checked={u.isActive}
                              onChange={() => handleToggleUserActive(u)}
                              disabled={togglingUser === u.id}
                            />
                            <span className="text-xs text-muted-foreground">
                              {u.isActive ? "Aktif" : "Devre Dışı"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs font-mono">
                          {formatDate(u.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:bg-primary/10 text-xs"
                          >
                            Düzenle
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-10 text-center text-muted-foreground"
                        >
                          {userSearch
                            ? `"${userSearch}" ile eşleşen kullanıcı bulunamadı.`
                            : "Kullanıcı bulunamadı."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </TabsContent>

          {/* ── AI CONFIG TAB ──────────────────────────────────── */}
          <TabsContent value="ai" className="m-0 h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Card className="bg-surface border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-5 h-5 text-ai-accent" /> Model
                    Seçimi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Birincil Hukuki Model
                    </label>
                    <select
                      value={aiConfig.model}
                      onChange={(e) =>
                        setAiConfig({ ...aiConfig, model: e.target.value })
                      }
                      className="w-full bg-elevated border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="gpt-3.5-turbo">gpt-3.5-turbo (OpenAI)</option>
                      <option value="gpt-4o">gpt-4o (OpenAI)</option>
                      <option value="gpt-4">gpt-4 (OpenAI)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Maks. Token (Context Window)
                    </label>
                    <Input
                      type="number"
                      value={aiConfig.maxTokens}
                      onChange={(e) =>
                        setAiConfig({
                          ...aiConfig,
                          maxTokens: parseInt(e.target.value) || 2048,
                        })
                      }
                      className="bg-elevated border-border"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Her istekte kullanılacak maksimum token sayısı.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-surface border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-5 h-5 text-warning" /> Prompt
                    Guardrails
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-elevated rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Hallüsinasyon Önleme (Strict)
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        AI'yı yalnızca yüklü corpus'tan alıntı yapmaya zorla.
                      </p>
                    </div>
                    <Toggle
                      checked={aiConfig.hallucination}
                      onChange={(v) =>
                        setAiConfig({ ...aiConfig, hallucination: v })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-elevated rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        PII Maskeleme
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Kişisel verileri LLM'e göndermeden önce otomatik maskele.
                      </p>
                    </div>
                    <Toggle
                      checked={aiConfig.piiMasking}
                      onChange={(v) =>
                        setAiConfig({ ...aiConfig, piiMasking: v })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="md:col-span-2 flex justify-end items-center gap-4">
                {savedAi && (
                  <span className="flex items-center gap-1.5 text-sm text-success">
                    <CheckCircle2 className="w-4 h-4" /> Ayarlar kaydedildi.
                  </span>
                )}
                <Button
                  onClick={handleSaveAiConfig}
                  disabled={savingAi}
                  className="bg-primary text-white"
                >
                  {savingAi ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {savingAi ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* ── SECURITY TAB ───────────────────────────────────── */}
          <TabsContent value="security" className="m-0 h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-6"
            >
              <Card className="bg-surface border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" /> Enterprise
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">
                          Firma Geneli 2FA Zorunluluğu
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Tüm kullanıcılara TOTP veya donanım anahtarı zorunlu.
                        </p>
                      </div>
                      <Toggle
                        checked={secConfig.enforce2fa}
                        onChange={(v) =>
                          setSecConfig({ ...secConfig, enforce2fa: v })
                        }
                      />
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">SSO Yapılandırması</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          SAML / OAuth (Okta, Azure AD, Google Workspace).
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="border-border text-xs">
                        Configure SSO
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-surface border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base">
                    System Audit Logs (SOC2)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-elevated text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                      <tr>
                        <th className="px-6 py-3 font-medium">Event</th>
                        <th className="px-6 py-3 font-medium">User</th>
                        <th className="px-6 py-3 font-medium">IP Address</th>
                        <th className="px-6 py-3 font-medium">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono text-xs">
                      {[
                        { event: "Model Config Changed", cls: "text-warning", user: "Atty. Yilmaz", ip: "192.168.1.109", ts: "2026-05-20 21:05:12" },
                        { event: "Successful Login", cls: "text-success", user: "Sarah Connor", ip: "45.32.12.11", ts: "2026-05-20 20:45:00" },
                        { event: "Failed 2FA Attempt", cls: "text-danger", user: "Unknown", ip: "104.22.45.6", ts: "2026-05-20 19:12:33" },
                        { event: "Document Deleted", cls: "text-warning", user: "Admin", ip: "192.168.1.1", ts: "2026-05-21 09:00:01" },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-elevated/30 transition-colors">
                          <td className={`px-6 py-3 ${row.cls}`}>{row.event}</td>
                          <td className="px-6 py-3">{row.user}</td>
                          <td className="px-6 py-3 text-muted-foreground">{row.ip}</td>
                          <td className="px-6 py-3 text-muted-foreground">{row.ts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── BILLING TAB ────────────────────────────────────── */}
          <TabsContent value="billing" className="m-0 h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <Card className="col-span-2 bg-surface border-border">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" /> Mevcut Plan
                    </h2>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">
                      Enterprise Tier
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">
                    $4,999
                    <span className="text-sm text-muted-foreground font-normal">
                      / month
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Renews November 1, 2026. 14 of 20 seats utilized.
                  </p>
                  <Button variant="outline" className="border-border hover:bg-elevated">
                    Manage Subscription
                  </Button>
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
                    <span className="text-xs text-success">Ödendi ✓</span>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full mt-4 bg-elevated hover:bg-primary/10 text-primary border border-border"
                  >
                    PDF İndir
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── INTEGRATIONS TAB ───────────────────────────────── */}
          <TabsContent value="integrations" className="m-0 h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {[
                {
                  name: "Slack",
                  desc: "Dava güncellemeleri ve AI bildirimlerini Slack kanallarına gönderin.",
                  connected: true,
                  icon: "💬",
                },
                {
                  name: "DocuSign",
                  desc: "Taslak sözleşmeleri doğrudan DocuSign'a gönderin.",
                  connected: false,
                  icon: "✍️",
                },
                {
                  name: "Microsoft 365",
                  desc: "Word dokümanlarını ve Outlook e-postalarını entegre edin.",
                  connected: false,
                  icon: "🔵",
                },
                {
                  name: "Google Workspace",
                  desc: "Google Docs ve Drive ile senkronize çalışın.",
                  connected: false,
                  icon: "🟢",
                },
              ].map((intg) => (
                <Card key={intg.name} className="bg-surface border-border">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="text-3xl shrink-0">{intg.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground">{intg.name}</h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                            intg.connected
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-border/50 text-muted-foreground border-border"
                          }`}
                        >
                          {intg.connected ? "Connected" : "Not connected"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        {intg.desc}
                      </p>
                      <Button
                        size="sm"
                        variant={intg.connected ? "outline" : "default"}
                        className={
                          intg.connected
                            ? "border-border text-xs"
                            : "bg-primary text-white text-xs"
                        }
                      >
                        {intg.connected ? "Manage" : "Connect"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={["admin"]} redirectTo="/">
      <AdminContent />
    </RoleGuard>
  );
}
