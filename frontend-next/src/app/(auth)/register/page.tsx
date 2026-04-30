"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scale, Lock, Mail, KeyRound, ShieldCheck, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate register API call
    setTimeout(() => {
      setIsLoading(false);
      router.push("/login");
    }, 1000);
  };

  return (
    <div className="flex h-screen w-full bg-[#1E293B] text-[#F8FAFC] font-sans selection:bg-[#3B6FE8]/30 overflow-y-auto">
      
      {/* LEFT PANE: Branding & Abstract AI Mesh */}
      <div className="hidden lg:flex w-[45%] flex-col justify-between p-12 relative overflow-hidden bg-[#151D29] border-r border-[#334155] fixed h-screen">
        {/* Abstract AI Logic Mesh Background */}
        <div className="absolute inset-0 z-0 opacity-40">
          <motion.div 
            className="absolute top-[10%] left-[-20%] w-[500px] h-[500px] rounded-full bg-[#3B6FE8]/20 blur-[100px]"
            animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#7C3AED]/10 blur-[120px]"
            animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
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
            Join the Legal AI Revolution.
          </h1>
          <p className="text-[#94A3B8] text-lg leading-relaxed">
            Create an enterprise account to access mission-critical AI intelligence, automate contract reviews, and enhance your firm's productivity.
          </p>
        </div>

        {/* Bottom Trust Badge */}
        <div className="relative z-10 flex items-center gap-3 text-sm font-medium text-[#94A3B8] bg-[#1E293B]/50 w-fit px-4 py-2 rounded-full border border-[#334155] backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4 text-success" />
          Bank-Grade Encryption Applied
        </div>
      </div>

      {/* RIGHT PANE: Minimalist Register Gateway */}
      <div className="w-full lg:w-[55%] lg:ml-[45%] flex items-center justify-center p-6 sm:p-12 relative min-h-screen">
        <div className="w-full max-w-[420px] flex flex-col py-10">
          
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-semibold tracking-tight text-white mb-2">Create Account</h2>
            <p className="text-sm text-[#94A3B8]">Request access or set up your corporate profile.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5" aria-label="Registration Form">
            
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="text-sm font-medium text-[#E2E8F0] block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <Input 
                  id="fullName"
                  type="text" 
                  required
                  placeholder="e.g. Harvey Specter"
                  className="pl-10 h-12 bg-[#151D29] border-[#334155] focus-visible:ring-[#3B6FE8] text-white rounded-xl shadow-inner transition-colors"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  aria-required="true"
                />
              </div>
            </div>

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
              <p className="text-[11px] text-[#94A3B8] ml-1">Must use a corporate domain.</p>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-[#E2E8F0] block">Create Password</label>
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
                  minLength={12}
                />
              </div>
              <p className="text-[11px] text-[#94A3B8] ml-1">Minimum 12 characters required.</p>
            </div>

            {/* Main Submit */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-[#3B6FE8] hover:bg-[#2A52BE] text-white font-medium rounded-xl shadow-[0_0_15px_rgba(59,111,232,0.3)] transition-all flex items-center justify-center group mt-2"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Register Account <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
              )}
            </Button>
          </form>

          {/* Already have an account link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#94A3B8]">
              Already have an enterprise account?{" "}
              <Link href="/login" className="text-[#3B6FE8] hover:text-[#5B8FF8] font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>

          {/* Divider */}
          <div className="relative my-8" aria-hidden="true">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#334155]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#1E293B] px-3 text-[#94A3B8] font-medium tracking-wider uppercase">Or register via SSO</span>
            </div>
          </div>

          {/* SSO Options */}
          <div className="space-y-3">
            <Button variant="outline" className="w-full h-11 bg-[#151D29] border-[#334155] hover:bg-[#1E293B] hover:border-[#475569] text-[#E2E8F0] justify-center gap-3 rounded-lg font-medium transition-colors">
              <Lock className="w-4 h-4 text-[#94A3B8]" />
              Enterprise SSO (SAML/Okta)
            </Button>
          </div>

          {/* Terms and Privacy */}
          <div className="mt-10 text-center">
            <p className="text-xs text-[#64748B] max-w-xs mx-auto">
              By registering, you agree to our <Link href="#" className="text-[#94A3B8] hover:text-white underline underline-offset-2">Terms of Service</Link> and <Link href="#" className="text-[#94A3B8] hover:text-white underline underline-offset-2">Privacy Policy</Link>.
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
