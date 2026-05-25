"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { AlertCircle, ArrowLeft, ArrowRight, Mail, Scale } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      await authApi.forgotPassword(email);
      // Her zaman başarılı göstereceğiz (timing attack önlemi olarak API 202 döner)
      setStatus("success");
      setMessage("Eğer bu email adresi sistemlerimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderilmiştir.");
    } catch {
      setStatus("error");
      setMessage("Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0A0E1A] text-[#F8FAFC] font-sans selection:bg-[#3B6FE8]/30 overflow-hidden items-center justify-center relative">
      {/* Abstract Background Elements (simplified from login) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none hidden md:block">
        <motion.div
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#3B6FE8]/15 blur-[100px]"
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(59,111,232,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,111,232,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 bg-[#111827]/80 backdrop-blur-xl border border-[#1E2D45] rounded-3xl shadow-2xl">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B6FE8] to-[#1E2D45] flex items-center justify-center shadow-lg border border-[#3B6FE8]/30">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl tracking-tight font-semibold text-white">LegalAI</span>
        </div>

        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-6">
                <Mail className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">Email Gönderildi</h2>
              <p className="text-[#94A3B8] mb-8">{message}</p>
              <Button
                onClick={() => router.push("/login")}
                className="w-full bg-[#3B6FE8] hover:bg-[#2A52BE] text-white"
              >
                Giriş Sayfasına Dön
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h2 className="text-2xl font-semibold tracking-tight text-white mb-2 text-center">
                Şifremi Unuttum
              </h2>
              <p className="text-sm text-[#94A3B8] text-center mb-8">
                Lütfen kayıtlı kurumsal e-posta adresinizi girin. Size bir şifre sıfırlama bağlantısı göndereceğiz.
              </p>

              {status === "error" && (
                <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-[#E2E8F0] block">
                    E-posta Adresi
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="name@lawfirm.com"
                      className="pl-10 h-12 bg-[#0A0E1A] border-[#1E2D45] focus-visible:ring-[#3B6FE8] text-white rounded-xl shadow-inner transition-colors"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={status === "loading"}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={status === "loading" || !email}
                  className="w-full h-12 bg-[#3B6FE8] hover:bg-[#2A52BE] text-white font-medium rounded-xl shadow-[0_0_20px_rgba(59,111,232,0.25)] transition-all flex items-center justify-center group"
                >
                  {status === "loading" ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Gönderiliyor...</span>
                    </div>
                  ) : (
                    <>
                      Bağlantı Gönder
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm font-medium text-[#94A3B8] hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Giriş sayfasına dön
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
