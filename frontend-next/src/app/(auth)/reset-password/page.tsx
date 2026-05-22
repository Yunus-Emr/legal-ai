"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Geçersiz sıfırlama linki. Lütfen tekrar isteyin.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 8) {
      setMessage("Şifre en az 8 karakter olmalı.");
      return;
    }
    setStatus("loading");
    try {
      await authApi.resetPassword(token, password);
      setStatus("success");
      setMessage("Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...");
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setStatus("error");
      setMessage("Token geçersiz veya süresi dolmuş. Lütfen tekrar şifre sıfırlama isteyin.");
    }
  };

  return (
    <div className="w-full max-w-md bg-[#111827] border border-border rounded-2xl p-8 shadow-xl">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Yeni Şifre Belirle</h1>
      <p className="text-sm text-muted-foreground mb-6">En az 8 karakter ve 1 rakam içermeli.</p>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${status === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
          {message}
        </div>
      )}

      {status !== "success" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Yeni Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-[#0A0E1A] border border-border rounded-lg px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Şifre Tekrar</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              className="w-full bg-[#0A0E1A] border border-border rounded-lg px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={status === "loading" || !token}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Güncelleniyor..." : "Şifremi Güncelle"}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-muted-foreground mt-4">
        <a href="/login" className="text-primary hover:underline">Giriş sayfasına dön</a>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md bg-[#111827] border border-border rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
          Yükleniyor...
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
