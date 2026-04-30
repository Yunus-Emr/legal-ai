"use client";

import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Send, FileText, Download, Sparkles, Network, Paperclip, 
  ThumbsUp, ThumbsDown, ChevronDown, BookOpen, Scale, CheckCircle2 
} from "lucide-react";
import { motion } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function CircularGauge({ score, size = 64, strokeWidth = 6 }: { score: number, size?: number, strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = score > 70 ? "#EF4444" : score > 40 ? "#F59E0B" : "#10B981";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-border" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-sm font-bold font-mono" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex space-x-1.5 p-2 px-3 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-full w-fit">
      <motion.div className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0 }} />
      <motion.div className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }} />
      <motion.div className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }} />
    </div>
  );
}

export default function AICanvasPage() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("Contract Review");
  const [jurisdiction, setJurisdiction] = useState("New York, USA");

  return (
    <div className="h-full flex flex-col bg-background font-sans">
      {/* @ts-ignore - known React 19 compat issue with react-resizable-panels prop types */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        
        {/* Left Panel: 60% Document / Canvas */}
        <ResizablePanel defaultSize={60} minSize={30} className="bg-surface/50 flex flex-col relative">
          <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-surface shrink-0 z-10">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium font-mono">Master_Service_Agreement_v4.pdf</span>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-elevated text-muted-foreground border border-border">
                Read Only
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                <Download className="w-3.5 h-3.5 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-8 bg-[#0A0E1A]">
            <div className="max-w-3xl mx-auto bg-white/5 shadow-sm border border-border rounded-xl p-10 min-h-[800px] text-foreground font-serif">
              <h1 className="text-2xl mb-6 font-semibold">MASTER SERVICE AGREEMENT</h1>
              <p className="text-sm leading-loose text-muted-foreground mb-4">
                This Master Service Agreement (the "Agreement") is entered into as of October 1, 2024 (the "Effective Date"), by and between TechCorp Inc., a Delaware corporation ("Provider"), and Global Logistics LLC, a New York limited liability company ("Client").
              </p>
              
              <h2 className="text-lg mt-8 mb-4 text-[#7C3AED] font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 4. LIMITATION OF LIABILITY
              </h2>
              <div className="relative group">
                <div className="absolute -inset-2 bg-[#7C3AED]/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-sm leading-loose relative z-10 p-3 border-l-2 border-[#7C3AED] bg-[#7C3AED]/10 rounded-r-lg">
                  4.2. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT. THE TOTAL LIABILITY OF THE PROVIDER UNDER THIS AGREEMENT SHALL NOT EXCEED THE TOTAL FEES PAID BY THE CLIENT IN THE SIX (6) MONTHS PRECEDING THE CLAIM.
                </p>
              </div>
              
              <h2 className="text-lg mt-8 mb-4 font-semibold">5. INDEMNIFICATION</h2>
              <p className="text-sm leading-loose text-muted-foreground mb-4">
                Client agrees to indemnify and hold harmless Provider from and against any claims, damages, liabilities, costs, and expenses arising out of Client's use of the Services in violation of this Agreement.
              </p>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors relative z-20" />

        {/* Right Panel: 40% AI Sidecar */}
        <ResizablePanel defaultSize={40} minSize={30} className="bg-surface flex flex-col border-l border-border relative z-10 shadow-2xl">
          
          {/* Sidecar Header (Modes & Jurisdiction) */}
          <div className="h-[auto] min-h-12 border-b border-border flex flex-wrap items-center justify-between px-4 py-2 shrink-0 glass-panel">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
              <DropdownMenu>
                {/* @ts-ignore */}
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-sm font-medium text-foreground hover:bg-elevated px-2">
                    {mode} <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-elevated border-border text-foreground">
                  {["General", "Contract Review", "Legal Research", "Drafting", "Compliance"].map(m => (
                    <DropdownMenuItem key={m} onClick={() => setMode(m)} className="focus:bg-primary/20 cursor-pointer">
                      {m}
                      {mode === m && <CheckCircle2 className="w-4 h-4 ml-auto text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <DropdownMenu>
              {/* @ts-ignore */}
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground px-2 font-mono">
                  <Scale className="w-3.5 h-3.5 mr-2" />
                  {jurisdiction} <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-elevated border-border text-foreground">
                <DropdownMenuItem onClick={() => setJurisdiction("New York, USA")}>New York, USA</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setJurisdiction("Delaware, USA")}>Delaware, USA</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setJurisdiction("California, USA")}>California, USA</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setJurisdiction("London, UK")}>London, UK</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ScrollArea className="flex-1 p-4 bg-background relative">
            <div className="flex flex-col gap-6 max-w-full pb-4">
              
              {/* AI Risk Score Overview (Contract Analysis specific) */}
              {mode === "Contract Review" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 p-4 bg-elevated border border-border rounded-xl">
                  <CircularGauge score={82} size={54} />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Contract Risk Score: High</h3>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-danger"></div> 3 Liabilities</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-warning"></div> 2 Missing Clauses</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* AI Message */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#7C3AED]/20 flex items-center justify-center border border-[#7C3AED]/30">
                    <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                  </div>
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Analysis Complete</span>
                </div>
                
                {/* AI Glow Card */}
                <div className="ai-glow rounded-xl rounded-tl-none mt-1">
                  <div className="glass-panel p-4 rounded-xl rounded-tl-none text-sm leading-relaxed text-foreground/90 font-sans">
                    I've reviewed the <strong>Limitation of Liability (Section 4.2)</strong>. The current liability cap is set to 6 months of preceding fees <sup className="text-primary font-bold cursor-pointer hover:underline">[1]</sup>.
                    <br /><br />
                    <span className="text-destructive font-medium">Warning:</span> This deviates from the firm's standard playbook which requires a 12-month cap for Tier-1 enterprise clients like Global Logistics <sup className="text-primary font-bold cursor-pointer hover:underline">[2]</sup>.
                    
                    {/* Sources Drawer */}
                    <div className="mt-4 p-3 bg-black/40 rounded-lg border border-border">
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                        <BookOpen className="w-3.5 h-3.5" /> SOURCES
                      </div>
                      <ul className="space-y-2">
                        <li className="text-[11px] flex gap-2">
                          <span className="text-primary font-bold">[1]</span>
                          <span className="text-muted-foreground font-mono">Master_Service_Agreement_v4.pdf (Page 3)</span>
                        </li>
                        <li className="text-[11px] flex gap-2">
                          <span className="text-primary font-bold">[2]</span>
                          <span className="text-muted-foreground font-mono">Firm_Playbook_v2.1.docx (Liability Caps, Sec 3.b)</span>
                        </li>
                      </ul>
                    </div>

                    {/* Action Buttons (Accept/Reject) */}
                    <div className="flex items-center gap-2 mt-4">
                      <Button size="sm" className="bg-success/20 hover:bg-success/30 text-success border border-success/30 h-8 text-xs font-semibold px-3">
                        Accept Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="hover:bg-danger/10 text-danger border border-transparent hover:border-danger/20 h-8 text-xs font-semibold px-3">
                        Reject
                      </Button>
                    </div>

                    {/* Feedback */}
                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/50">
                      <button className="p-1.5 text-muted-foreground hover:text-success hover:bg-success/10 rounded transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded transition-colors">
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* User Message */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col gap-2 items-end"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Atty. Yilmaz</span>
                  <div className="w-6 h-6 rounded bg-elevated flex items-center justify-center border border-border text-[10px] font-bold">
                    YI
                  </div>
                </div>
                <div className="bg-[#1A2235] border border-border p-4 rounded-xl rounded-tr-none text-sm text-foreground shadow-sm max-w-[85%] font-sans">
                  Draft a revision for Section 4.2 that aligns with the 12-month playbook standard. Maintain the carve-outs for gross negligence.
                </div>
              </motion.div>

              {/* AI Typing Indicator */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded bg-[#7C3AED]/20 flex items-center justify-center border border-[#7C3AED]/30 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                </div>
                <div className="pt-1">
                  <TypingDots />
                  <span className="text-[10px] text-muted-foreground mt-1 ml-1 block uppercase tracking-widest font-mono">Drafting Clause...</span>
                </div>
              </motion.div>

            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 glass-panel rounded-none border-x-0 border-b-0 shrink-0">
            <div className="relative flex flex-col gap-2 bg-[#0A0E1A] rounded-xl border border-border p-2 focus-within:ring-1 focus-within:ring-[#7C3AED] focus-within:border-[#7C3AED] transition-all shadow-inner">
              
              <Textarea 
                placeholder="Instruct AI Co-Counsel... (Type '/' for commands)" 
                className="min-h-[44px] max-h-[200px] bg-transparent border-0 focus-visible:ring-0 resize-none p-2 text-sm"
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              
              <div className="flex items-center justify-between pt-2 border-t border-border/50 px-1">
                <div className="flex items-center gap-1">
                  <Tooltip>
                    {/* @ts-ignore */}
<TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Attach Document</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    {/* @ts-ignore */}
<TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg">
                        <BookOpen className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Search Case Law</TooltipContent>
                  </Tooltip>
                </div>

                <Button size="icon" className="shrink-0 rounded-lg h-8 w-8 bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white btn-scale">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-center text-muted-foreground/50 font-mono tracking-tight">
              AI-generated content may be inaccurate. Review before filing.
            </div>
          </div>
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}
