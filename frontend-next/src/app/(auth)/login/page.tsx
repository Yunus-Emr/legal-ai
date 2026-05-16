"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scale, Lock, Mail, KeyRound, ShieldCheck, ArrowRight, AlertCircle, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setUser } = useAuthStore();
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        // 1) Login — backend httpOnly cookie'yi otomatik set ediyor
        const { data } = await authApi.login({ email, password });

        // 2) /me endpoint'inden kullanıcı bilgilerini al (cookie otomatik gönderilir)
        const meRes = await authApi.me();
        const user = meRes.data;

        // 3) Sadece user bilgisini store'a kaydet (token cookie'de saklı)
        setUser(user);
        setAuth(data.access_token, user); // Geriye dönük uyumluluk için

        // 4) Guest flag'i temizle
        document.cookie = "lexai_guest=; path=/; max-age=0";

      } else {
        // Register flow
        const { data } = await authApi.register({ name, email, password });

        const meRes = await authApi.me();
        const user = meRes.data;

        setUser(user);
        setAuth(data.access_token, user);
        document.cookie = "lexai_guest=; path=/; max-age=0";
      }

      // Dashboard'a yönlendir
      router.push("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (mode === "login" ? "Giriş başarısız. Email veya şifre hatalı." : "Kayıt başarısız. Bilgilerinizi kontrol edin.");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setIsLoading(true);
    // Guest çerezini ayarla
    document.cookie = `lexai_guest=true; path=/; max-age=${1 * 24 * 3600}; SameSite=Lax`;
    
    // Store'da pseudo-user oluştur
    setUser({
      id: "guest",
      name: "Guest User",
      email: "guest@lexai.local",
      role: "guest",
      is_active: true
    });

    router.push("/");
  };

  return (
    <div className="flex h-screen w-full bg-[#0A0E1A] text-[#F8FAFC] font-sans selection:bg-[#3B6FE8]/30 overflow-hidden">

      {/* LEFT PANE: Branding & Abstract AI Mesh */}
      <div className="hidden lg:flex w-[45%] flex-col justify-between p-12 relative bg-[#0D1424] border-r border-[#1E2D45]">
        {/* Abstract AI animated background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div
            className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#3B6FE8]/15 blur-[100px]"
            animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#7C3AED]/10 blur-[120px]"
            animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(59,111,232,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,111,232,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B6FE8] to-[#1E2D45] flex items-center justify-center shadow-lg border border-[#3B6FE8]/30">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl tracking-tight font-semibold text-white">LexAI</span>
        </div>

        {/* Value Proposition */}
        <motion.div
          className="relative z-10 max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-5xl leading-tight mb-6 text-white font-semibold tracking-tight">
            Enterprise Legal Intelligence.
          </h1>
          <p className="text-[#94A3B8] text-lg leading-relaxed">
            Secure, scalable, and highly accurate AI co-counsel designed exclusively
            for top-tier law firms and corporate legal departments.
          </p>

          {/* Feature bullets */}
          <div className="mt-8 space-y-3">
            {[
              "RAG-powered document analysis",
              "Real-time contract risk scoring",
              "Multi-jurisdiction compliance checks",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3 text-sm text-[#CBD5E1]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3B6FE8]" />
                {feat}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust Badge */}
        <div className="relative z-10 flex items-center gap-3 text-sm font-medium text-[#94A3B8] bg-[#1E293B]/50 w-fit px-4 py-2 rounded-full border border-[#334155] backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          SOC 2 Type II &amp; GDPR Compliant
        </div>
      </div>

      {/* RIGHT PANE: Login Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-[420px] flex flex-col my-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B6FE8] to-[#1E2D45] flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-semibold">LexAI</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col w-full"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-tight text-white mb-2">
                  {mode === "login" ? "Welcome Back" : "Create an Account"}
                </h2>
                <p className="text-sm text-[#94A3B8]">
                  {mode === "login" 
                    ? "Please enter your corporate credentials to access the secure portal."
                    : "Register to experience the most powerful legal AI assistant."}
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" aria-label={`${mode} Form`}>
                {mode === "register" && (
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-sm font-medium text-[#E2E8F0] block">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <Input
                        id="name"
                        type="text"
                        required
                        placeholder="John Doe"
                        className="pl-10 h-12 bg-[#111827] border-[#1E2D45] focus-visible:ring-[#3B6FE8] focus-visible:border-[#3B6FE8] text-white rounded-xl shadow-inner transition-colors"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-[#E2E8F0] block">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="name@lawfirm.com"
                      className="pl-10 h-12 bg-[#111827] border-[#1E2D45] focus-visible:ring-[#3B6FE8] focus-visible:border-[#3B6FE8] text-white rounded-xl shadow-inner transition-colors"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-required="true"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-[#E2E8F0] block">
                      Password
                    </label>
                    {mode === "login" && (
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-[#3B6FE8] hover:text-[#5B8FF8] transition-colors focus:outline-none focus:underline"
                        tabIndex={0}
                      >
                        Forgot Password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <Input
                      id="password"
                      type="password"
                      required
                      placeholder="••••••••••••"
                      className="pl-10 h-12 bg-[#111827] border-[#1E2D45] focus-visible:ring-[#3B6FE8] focus-visible:border-[#3B6FE8] text-white rounded-xl shadow-inner transition-colors"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-required="true"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-[#3B6FE8] hover:bg-[#2A52BE] text-white font-medium rounded-xl shadow-[0_0_20px_rgba(59,111,232,0.25)] transition-all flex items-center justify-center group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{mode === "login" ? "Authenticating..." : "Creating Account..."}</span>
                    </div>
                  ) : (
                    <>
                      {mode === "login" ? "Sign In Securely" : "Register"}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              {/* Mode Toggle */}
              <div className="mt-6 text-center text-sm text-[#94A3B8]">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setError(null);
                  }}
                  className="text-[#3B6FE8] font-medium hover:text-[#5B8FF8] transition-colors"
                  disabled={isLoading}
                >
                  {mode === "login" ? "Register now" : "Sign in here"}
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-8" aria-hidden="true">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1E2D45]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#0A0E1A] px-3 text-[#94A3B8] font-medium tracking-wider uppercase">
                    Or alternative access
                  </span>
                </div>
              </div>

              {/* Guest Options */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={handleGuestLogin}
                  className="w-full h-11 bg-transparent border border-[#3B6FE8]/30 hover:bg-[#3B6FE8]/10 text-[#3B6FE8] justify-center gap-3 rounded-lg font-medium transition-colors"
                  type="button"
                  disabled={isLoading}
                >
                  <User className="w-4 h-4" />
                  Continue as Guest
                </Button>

                {mode === "login" && (
                  <Button
                    variant="outline"
                    className="w-full h-11 bg-[#111827] border-[#1E2D45] hover:bg-[#1A2235] hover:border-[#3B6FE8]/40 text-[#E2E8F0] justify-center gap-3 rounded-lg font-medium transition-colors"
                    type="button"
                  >
                    <Lock className="w-4 h-4 text-[#94A3B8]" />
                    Enterprise SSO (SAML)
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Trust Indicators */}
          <div className="mt-10 pt-6 border-t border-[#1E2D45] flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#94A3B8]">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              SOC 2 Type II Compliant
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-[#475569]" />
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#94A3B8]">
              <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
              End-to-End Encrypted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
