"use client";

/**
 * Settings Page — İki Katmanlı Mimari (Çok Dilli Destek)
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Monitor,
  Bell,
  ShieldCheck,
  Moon,
  Sun,
  Laptop,
  Save,
  Loader2,
  CheckCircle2,
  Globe,
  BrainCircuit,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { authApi, type UpdateMePayload } from "@/lib/api";

/* ── Translations ──────────────────────────────────────────────────────── */
const TRANSLATIONS = {
  tr: {
    title: "Ayarlar",
    subtitle: "Hesap bilgilerinizi, görünüm tercihlerinizi ve bildirim ayarlarınızı yönetin.",
    tabAccount: "Hesabım",
    tabAppearance: "Görünüm",
    tabNotifications: "Bildirimler",
    tabSystem: "Sistem",
    profileInfo: "Profil Bilgileri",
    fullName: "Ad Soyad",
    email: "E-posta",
    changePassword: "Şifre Değiştir",
    currentPassword: "Mevcut Şifre",
    newPassword: "Yeni Şifre",
    confirmNewPassword: "Yeni Şifre Tekrar",
    save: "Kaydet",
    saving: "Kaydediliyor...",
    passwordMismatch: "Yeni şifreler eşleşmiyor.",
    profileSuccess: "Profil başarıyla güncellendi.",
    colorTheme: "Renk Teması",
    themeDark: "Koyu",
    themeLight: "Açık",
    themeSystem: "Sistem",
    themeSaved: "Tema kaydedildi.",
    interfaceLang: "Arayüz Dili",
    langNote: "Arayüz dili anlık olarak uygulanır ve tarayıcıda saklanır.",
    fontSize: "Yazı Tipi Boyutu",
    notifPrefs: "Bildirim Tercihleri",
    sysNotif: "Sistem Bildirimleri",
    notifAll: "Tüm Aktiviteler",
    notifImportant: "Yalnızca Önemli (Risk & Mention)",
    notifOff: "Kapalı",
    emailDigest: "E-posta Özeti",
    emailDigestDesc: "Haftalık aktivite özeti e-posta ile gönderilsin.",
    mentions: "Mention Bildirimleri",
    mentionsDesc: "Bir dosyada veya davada @mention aldığında bildirim al.",
    notifSaved: "Bildirim tercihleri kaydedildi.",
    aiConfig: "AI Model Yapılandırması",
    activeLlm: "Aktif LLM Modeli",
    maxTokens: "Maks. Token (Context Window)",
    maxTokensDesc: "Her istekte kullanılacak maksimum token sayısı.",
    hallucination: "Hallüsinasyon Önleme (Strict)",
    hallucinationDesc: "AI'ı yalnızca yüklü corpus'tan alıntı yapmaya zorla.",
    pii: "PII Maskeleme",
    piiDesc: "İsim ve kimlik bilgilerini LLM'e göndermeden önce otomatik maskele.",
    redaction: "Redaksiyon Logu",
    redactionDesc: "Tüm maskelenmiş alanları denetim kaydına ekle.",
    sysSaved: "Sistem ayarları güncellendi."
  },
  en: {
    title: "Settings",
    subtitle: "Manage your account info, appearance settings, and notification preferences.",
    tabAccount: "My Account",
    tabAppearance: "Appearance",
    tabNotifications: "Notifications",
    tabSystem: "System",
    profileInfo: "Profile Information",
    fullName: "Full Name",
    email: "Email Address",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    save: "Save Changes",
    saving: "Saving...",
    passwordMismatch: "New passwords do not match.",
    profileSuccess: "Profile updated successfully.",
    colorTheme: "Color Theme",
    themeDark: "Dark",
    themeLight: "Light",
    themeSystem: "System",
    themeSaved: "Theme saved.",
    interfaceLang: "Interface Language",
    langNote: "Interface language is applied instantly and saved in the browser.",
    fontSize: "Font Size",
    notifPrefs: "Notification Preferences",
    sysNotif: "System Notifications",
    notifAll: "All Activities",
    notifImportant: "Important Only (Risk & Mentions)",
    notifOff: "Disabled",
    emailDigest: "Email Digest",
    emailDigestDesc: "Send weekly activity digest to my email.",
    mentions: "Mention Notifications",
    mentionsDesc: "Get notified when you are @mentioned in a document or matter.",
    notifSaved: "Notification preferences saved.",
    aiConfig: "AI Model Configuration",
    activeLlm: "Active LLM Model",
    maxTokens: "Max Tokens (Context Window)",
    maxTokensDesc: "Maximum number of tokens to generate per request.",
    hallucination: "Anti-Hallucination Guardrails (Strict)",
    hallucinationDesc: "Force AI to only cite and answer using uploaded corpus.",
    pii: "PII Masking",
    piiDesc: "Automatically mask personal data before sending to LLM.",
    redaction: "Redaction Log",
    redactionDesc: "Log all redacted fields into the audit stream.",
    sysSaved: "System settings updated."
  },
  de: {
    title: "Einstellungen",
    subtitle: "Verwalten Sie Ihre Kontoinformationen, Darstellungseinstellungen und Benachrichtigungen.",
    tabAccount: "Mein Konto",
    tabAppearance: "Aussehen",
    tabNotifications: "Benachrichtigungen",
    tabSystem: "System",
    profileInfo: "Profilinformationen",
    fullName: "Vollständiger Name",
    email: "E-Mail-Adresse",
    changePassword: "Kennwort ändern",
    currentPassword: "Aktuelles Passwort",
    newPassword: "Neues Passwort",
    confirmNewPassword: "Neues Passwort bestätigen",
    save: "Änderungen speichern",
    saving: "Wird gespeichert...",
    passwordMismatch: "Neue Passwörter stimmen nicht überein.",
    profileSuccess: "Profil erfolgreich aktualisiert.",
    colorTheme: "Farbthema",
    themeDark: "Dunkel",
    themeLight: "Hell",
    themeSystem: "System",
    themeSaved: "Thema gespeichert.",
    interfaceLang: "Oberflächensprache",
    langNote: "Die Oberflächensprache wird sofort angewendet und im Browser gespeichert.",
    fontSize: "Schriftgröße",
    notifPrefs: "Benachrichtigungseinstellungen",
    sysNotif: "Systembenachrichtigungen",
    notifAll: "Alle Aktivitäten",
    notifImportant: "Nur Wichtig (Risiko & Erwähnungen)",
    notifOff: "Deaktiviert",
    emailDigest: "E-Mail-Zusammenfassung",
    emailDigestDesc: "Senden Sie eine wöchentliche Zusammenfassung an meine E-Mail.",
    mentions: "Erwähnungsbenachrichtigungen",
    mentionsDesc: "Benachrichtigen, wenn Sie in einem Dokument @erwähnt werden.",
    notifSaved: "Benachrichtigungseinstellungen gespeichert.",
    aiConfig: "KI-Modellkonfiguration",
    activeLlm: "Aktives KI-Modell",
    maxTokens: "Max. Token (Kontextfenster)",
    maxTokensDesc: "Maximale Anzahl an Token pro Anfrage.",
    hallucination: "Anti-Halluzinations-Leitplanken",
    hallucinationDesc: "KI zwingen, nur aus hochgeladenen Dokumenten zu zitieren.",
    pii: "PII-Maskierung",
    piiDesc: "Personenbezogene Daten vor dem Senden an das LLM maskieren.",
    redaction: "Schwärzungsprotokoll",
    redactionDesc: "Protokollieren aller geschwärzten Felder im Audit-Stream.",
    sysSaved: "Systemeinstellungen aktualisiert."
  }
};

/* ── Types ─────────────────────────────────────────────────────────────── */
type Theme = "dark" | "light" | "system";
type NotifLevel = "all" | "important" | "none";
type Lang = "en" | "tr" | "de";

interface Prefs {
  theme: Theme;
  lang: Lang;
  fontSize: number;
  notifications: NotifLevel;
  emailDigest: boolean;
  mentions: boolean;
}

const PREF_KEY = "lexai_prefs";

function loadPrefs(): Prefs {
  if (typeof window === "undefined")
    return { theme: "dark", lang: "tr", fontSize: 14, notifications: "all", emailDigest: true, mentions: true };
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) || "null") || {
      theme: "dark", lang: "tr", fontSize: 14, notifications: "all", emailDigest: true, mentions: true,
    };
  } catch {
    return { theme: "dark", lang: "tr", fontSize: 14, notifications: "all", emailDigest: true, mentions: true };
  }
}

function savePrefs(p: Prefs) {
  localStorage.setItem(PREF_KEY, JSON.stringify(p));
}

/* ── Toggle Component ──────────────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-200 shadow-inner ${
        checked ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

/* ── Toast ─────────────────────────────────────────────────────────────── */
function InlineAlert({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg text-sm border ${
        type === "success"
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          : "bg-rose-500/10 border-rose-500/30 text-rose-400"
      }`}
    >
      {type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const isAdmin = user?.role === "admin";

  /* Profile form */
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileAlert, setProfileAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  /* Preferences */
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [prefsSaved, setPrefsSaved] = useState(false);

  /* Active Translation Dictionary */
  const t = TRANSLATIONS[prefs.lang] || TRANSLATIONS.tr;

  /* Sync name/email when user loads */
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  /* Apply theme class to <html> */
  useEffect(() => {
    const root = document.documentElement;
    if (prefs.theme === "dark") {
      root.classList.add("dark");
    } else if (prefs.theme === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      prefersDark ? root.classList.add("dark") : root.classList.remove("dark");
    }
  }, [prefs.theme]);

  /* System Settings State */
  const [systemPrefs, setSystemPrefs] = useState({
    model: "gpt-4o",
    maxTokens: 2048,
    strictHallucination: true,
    piiMasking: true,
    redactionLog: false,
  });
  const [sysSaving, setSysSaving] = useState(false);
  const [sysSaved, setSysSaved] = useState(false);

  const handleSaveSystem = () => {
    setSysSaving(true);
    setTimeout(() => {
      setSysSaving(false);
      setSysSaved(true);
      setTimeout(() => setSysSaved(false), 3000);
    }, 800);
  };

  const updatePref = <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    savePrefs(updated);
    setPrefsSaved(true);
    // Dispatch custom event to notify other components/pages immediately
    window.dispatchEvent(new Event("lexai_prefs_changed"));
    setTimeout(() => setPrefsSaved(false), 2000);
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileAlert(null);

    if (newPw && newPw !== confirmPw) {
      setProfileAlert({ type: "error", msg: t.passwordMismatch });
      setProfileSaving(false);
      return;
    }

    try {
      const payload: UpdateMePayload = {
        name,
        email,
        current_password: currentPw || undefined,
        new_password: newPw || undefined,
      };
      const res = await authApi.updateMe(payload);
      if (res?.data) setUser(res.data);
      setProfileAlert({ type: "success", msg: t.profileSuccess });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      setProfileAlert({
        type: "error",
        msg: err?.response?.data?.detail || "Error updating profile.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "dark", label: t.themeDark, icon: <Moon className="w-5 h-5" /> },
    { value: "light", label: t.themeLight, icon: <Sun className="w-5 h-5" /> },
    { value: "system", label: t.themeSystem, icon: <Laptop className="w-5 h-5" /> },
  ];

  return (
    <div className="p-6 lg:p-8 h-full overflow-y-auto font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>

        <Tabs defaultValue="account" className="flex flex-col gap-4">
          <TabsList className="bg-elevated border border-border self-start h-11 p-1">
            <TabsTrigger value="account" className="data-[state=active]:glass-panel data-[state=active]:text-primary h-full px-5 flex items-center gap-2 text-sm">
              <User className="w-4 h-4" /> {t.tabAccount}
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:glass-panel data-[state=active]:text-primary h-full px-5 flex items-center gap-2 text-sm">
              <Monitor className="w-4 h-4" /> {t.tabAppearance}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:glass-panel data-[state=active]:text-primary h-full px-5 flex items-center gap-2 text-sm">
              <Bell className="w-4 h-4" /> {t.tabNotifications}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="system" className="data-[state=active]:glass-panel data-[state=active]:text-primary h-full px-5 flex items-center gap-2 text-sm">
                <BrainCircuit className="w-4 h-4" /> {t.tabSystem}
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── TAB 1: Hesabım ─────────────────────────────────────────────── */}
          <TabsContent value="account">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Avatar & Name */}
              <Card className="glass-panel border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> {t.profileInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary select-none">
                      {name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user?.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">{t.fullName}</label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-elevated border-border text-foreground"
                        placeholder={t.fullName}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">{t.email}</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-elevated border-border text-foreground"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Password */}
              <Card className="glass-panel border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-warning" /> {t.changePassword}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">{t.currentPassword}</label>
                    <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="bg-elevated border-border text-foreground" placeholder="••••••••" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">{t.newPassword}</label>
                      <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="bg-elevated border-border text-foreground" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">{t.confirmNewPassword}</label>
                      <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="bg-elevated border-border text-foreground" placeholder="••••••••" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {profileAlert && <InlineAlert type={profileAlert.type} msg={profileAlert.msg} />}

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={profileSaving} className="bg-primary hover:bg-primary/90 text-white px-6">
                  {profileSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {profileSaving ? t.saving : t.save}
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* ── TAB 2: Görünüm ─────────────────────────────────────────────── */}
          <TabsContent value="appearance">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Theme */}
              <Card className="glass-panel border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base">{t.colorTheme}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    {themeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updatePref("theme", opt.value)}
                        className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer relative ${
                          prefs.theme === opt.value
                            ? "border-primary bg-primary/5"
                            : "border-border bg-elevated hover:border-primary/40"
                        }`}
                      >
                        {prefs.theme === opt.value && (
                          <CheckCircle2 className="w-4 h-4 text-primary absolute top-2 right-2" />
                        )}
                        <div className={prefs.theme === opt.value ? "text-primary" : "text-muted-foreground"}>
                          {opt.icon}
                        </div>
                        <span className={`text-sm font-medium ${prefs.theme === opt.value ? "text-primary" : "text-foreground"}`}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  {prefsSaved && (
                    <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {t.themeSaved}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Language */}
              <Card className="glass-panel border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" /> {t.interfaceLang}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <select
                    value={prefs.lang}
                    onChange={(e) => updatePref("lang", e.target.value as Lang)}
                    className="w-full max-w-xs bg-elevated border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="tr">Türkçe (TR)</option>
                    <option value="en">English (US)</option>
                    <option value="de">Deutsch (DE)</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-2">{t.langNote}</p>
                </CardContent>
              </Card>

              {/* Font Size */}
              <Card className="glass-panel border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base">{t.fontSize}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground w-4 font-bold">A</span>
                    <input
                      type="range"
                      min={12}
                      max={18}
                      step={1}
                      value={prefs.fontSize}
                      onChange={(e) => updatePref("fontSize", Number(e.target.value))}
                      className="flex-1 accent-primary h-2"
                    />
                    <span className="text-lg text-muted-foreground w-4 font-bold">A</span>
                    <span className="text-sm text-muted-foreground font-mono w-8">{prefs.fontSize}px</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── TAB 3: Bildirimler ──────────────────────────────────────────── */}
          <TabsContent value="notifications">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="glass-panel border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" /> {t.notifPrefs}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">{t.sysNotif}</label>
                    <select
                      value={prefs.notifications}
                      onChange={(e) => updatePref("notifications", e.target.value as NotifLevel)}
                      className="w-full max-w-xs bg-elevated border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="all">{t.notifAll}</option>
                      <option value="important">{t.notifImportant}</option>
                      <option value="none">{t.notifOff}</option>
                    </select>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-4 bg-elevated rounded-xl border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.emailDigest}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.emailDigestDesc}</p>
                      </div>
                      <Toggle checked={prefs.emailDigest} onChange={(v) => updatePref("emailDigest", v)} />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-elevated rounded-xl border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.mentions}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.mentionsDesc}</p>
                      </div>
                      <Toggle checked={prefs.mentions} onChange={(v) => updatePref("mentions", v)} />
                    </div>
                  </div>

                  {prefsSaved && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {t.notifSaved}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── TAB 4: Sistem (Yalnızca Admin) ──────────────────────────────── */}
          {isAdmin && (
            <TabsContent value="system">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card className="glass-panel border-border">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-ai-accent" /> {t.aiConfig}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">{t.activeLlm}</label>
                      <select 
                        value={systemPrefs.model}
                        onChange={(e) => setSystemPrefs({ ...systemPrefs, model: e.target.value })}
                        className="w-full bg-elevated border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="gpt-3.5-turbo">gpt-3.5-turbo (OpenAI)</option>
                        <option value="gpt-4o">gpt-4o (OpenAI)</option>
                        <option value="gpt-4">gpt-4 (OpenAI)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">{t.maxTokens}</label>
                      <Input 
                        type="number" 
                        value={systemPrefs.maxTokens}
                        onChange={(e) => setSystemPrefs({ ...systemPrefs, maxTokens: parseInt(e.target.value) || 2048 })}
                        className="bg-elevated border-border max-w-xs text-foreground" 
                      />
                      <p className="text-xs text-muted-foreground mt-1">{t.maxTokensDesc}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-panel">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-warning" /> Prompt Guardrails
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-elevated rounded-xl border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.hallucination}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.hallucinationDesc}</p>
                      </div>
                      <Toggle checked={systemPrefs.strictHallucination} onChange={(v) => setSystemPrefs({ ...systemPrefs, strictHallucination: v })} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-elevated rounded-xl border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.pii}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.piiDesc}</p>
                      </div>
                      <Toggle checked={systemPrefs.piiMasking} onChange={(v) => setSystemPrefs({ ...systemPrefs, piiMasking: v })} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-elevated rounded-xl border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.redaction}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.redactionDesc}</p>
                      </div>
                      <Toggle checked={systemPrefs.redactionLog} onChange={(v) => setSystemPrefs({ ...systemPrefs, redactionLog: v })} />
                    </div>
                    
                    <div className="pt-4 flex items-center justify-between border-t border-border mt-6">
                      {sysSaved ? (
                         <p className="text-xs text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {t.sysSaved}
                        </p>
                      ) : <div />}
                      <Button onClick={handleSaveSystem} disabled={sysSaving} className="bg-primary hover:bg-primary/90 text-white">
                        {sysSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {t.save}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
