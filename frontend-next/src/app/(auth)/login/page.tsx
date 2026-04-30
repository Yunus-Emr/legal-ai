"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scale, Lock, Mail, KeyRound, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login API call
    setTimeout(() => {
      setIsLoading(false);
      router.push("/");
    }, 1000);
  };

  return (
    <div className="flex h-screen w-full bg-[#1E293B] text-[#F8FAFC] font-sans selection:bg-[#3B6FE8]/30">
      
      {/* LEFT PANE: Branding & Abstract AI Mesh */}
      <div className="hidden lg:flex w-[45%] flex-col justify-between p-12 relative overflow-hidden bg-[#151D29] border-r border-[#334155]">
        {/* Abstract AI Logic Mesh Background */}
        <div className="absolute inset-0 z-0 opacity-40">
          <motion.div 
            className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#3B6FE8]/20 blur-[100px]"
            animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#7C3AED]/10 blur-[120px]"
            animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        </div>

        {/* Header / Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B6FE8] to-[#1E2D45] flex items-center justify-center shadow-lg border border-[#3B6FE8]/30">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-2xl tracking-tight font-semibold text-white">LexAI</span>
        </div>

        {/* Value Proposition */}
        <div className="relative z-10 max-w-md">
          <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-6 text-white font-medium tracking-tight">
            Enterprise Legal Intelligence.
          </h1>
          <p className="text-[#94A3B8] text-lg leading-relaxed">
            Secure, scalable, and highly accurate AI co-counsel designed exclusively for top-tier law firms and corporate legal departments.
          </p>
        </div>

        {/* Bottom Trust Badge */}
        <div className="relative z-10 flex items-center gap-3 text-sm font-medium text-[#94A3B8] bg-[#1E293B]/50 w-fit px-4 py-2 rounded-full border border-[#334155] backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4 text-success" />
          System Health: Fully Operational
        </div>
      </div>

      {/* RIGHT PANE: Minimalist Login Gateway */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[420px] flex flex-col">
          
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-semibold tracking-tight text-white mb-2">Welcome Back</h2>
            <p className="text-sm text-[#94A3B8]">Please enter your corporate credentials to access the secure portal.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" aria-label="Login Form">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[#E2E8F0] block">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <Input 
                  id="email"
                  type="email" 
                  required
                  placeholder="name@lawfirm.com"
                  className="pl-10 h-12 bg-[#151D29] border-[#334155] focus-visible:ring-[#3B6FE8] text-white rounded-xl shadow-inner transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-required="true"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-[#E2E8F0] block">Password</label>
                <Link href="#" className="text-xs font-medium text-[#3B6FE8] hover:text-[#5B8FF8] transition-colors focus:outline-none focus:underline" tabIndex={0}>
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <Input 
                  id="password"
                  type="password" 
                  required
                  placeholder="••••••••••••"
                  className="pl-10 h-12 bg-[#151D29] border-[#334155] focus-visible:ring-[#3B6FE8] text-white rounded-xl shadow-inner transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-required="true"
                />
              </div>
            </div>

            {/* Main Submit */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-[#3B6FE8] hover:bg-[#2A52BE] text-white font-medium rounded-xl shadow-[0_0_15px_rgba(59,111,232,0.3)] transition-all flex items-center justify-center group"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In Securely <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8" aria-hidden="true">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#334155]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#1E293B] px-3 text-[#94A3B8] font-medium tracking-wider uppercase">Or continue with SSO</span>
            </div>
          </div>

          {/* SSO Options */}
          <div className="space-y-3">
            <Button variant="outline" className="w-full h-11 bg-[#151D29] border-[#334155] hover:bg-[#1E293B] hover:border-[#475569] text-[#E2E8F0] justify-center gap-3 rounded-lg font-medium transition-colors">
              <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M10 0H0V10H10V0Z" fill="#F25022"/><path d="M21 0H11V10H21V0Z" fill="#7FBA00"/><path d="M10 11H0V21H10V11Z" fill="#00A4EF"/><path d="M21 11H11V21H21V11Z" fill="#FFB900"/></svg>
              Continue with Microsoft 365
            </Button>
            <Button variant="outline" className="w-full h-11 bg-[#151D29] border-[#334155] hover:bg-[#1E293B] hover:border-[#475569] text-[#E2E8F0] justify-center gap-3 rounded-lg font-medium transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google Workspace
            </Button>
            <Button variant="outline" className="w-full h-11 bg-[#151D29] border-[#334155] hover:bg-[#1E293B] hover:border-[#475569] text-[#E2E8F0] justify-center gap-3 rounded-lg font-medium transition-colors">
              <Lock className="w-4 h-4 text-[#94A3B8]" />
              Enterprise SSO (SAML/Okta)
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 pt-6 border-t border-[#334155] flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#94A3B8]">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true"/>
              SOC 2 Type II & GDPR Compliant
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-[#475569]"></div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#94A3B8]">
              <KeyRound className="w-3.5 h-3.5" aria-hidden="true"/>
              2FA Enforced Security
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
