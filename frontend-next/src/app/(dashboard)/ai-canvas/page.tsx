"use client";

import { useState, useRef, useEffect } from "react";
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
import { useChat } from "@/hooks/useChat";
import { useAuthStore } from "@/store/authStore";
import { documentsApi, Document } from "@/lib/api";

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

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function AICanvasPage() {
  const { user } = useAuthStore();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("Contract Review");
  const [jurisdiction, setJurisdiction] = useState("New York, USA");
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  const { messages, isStreaming, sources, error, sendMessage } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    documentsApi.list().then(res => {
      setDocuments(res.data.documents);
      setIsLoadingDocs(false);
    }).catch(err => {
      console.error(err);
      setIsLoadingDocs(false);
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isStreaming) {
      // Append mode and selected document to the prompt so the backend knows
      let enrichedPrompt = `[Role: ${mode}, Jurisdiction: ${jurisdiction}]\n`;
      if (selectedDoc) {
        enrichedPrompt += `[Primary Context Document: ${selectedDoc.filename}]\n`;
      }
      enrichedPrompt += input.trim();
      
      sendMessage(enrichedPrompt);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-background font-sans">
      {/* @ts-expect-error - known React 19 compat issue with react-resizable-panels prop types */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        
        {/* Left Panel: 60% Document / Canvas */}
        <ResizablePanel defaultSize={60} minSize={30} className="bg-surface/50 flex flex-col relative">
          <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-surface shrink-0 z-10">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium font-mono">
                {selectedDoc ? selectedDoc.filename : "Select a Document from Corpus"}
              </span>
              {selectedDoc && (
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-success/10 text-success border border-success/20">
                  {selectedDoc.status === 'indexed' ? 'Ready' : 'Processing'}
                </span>
              )}
            </div>
            {selectedDoc && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground" onClick={() => window.open(`/api/v1/documents/${selectedDoc.id}/download`, '_blank')}>
                  <Download className="w-3.5 h-3.5 mr-2" />
                  Download Original
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelectedDoc(null)}>
                  Close
                </Button>
              </div>
            )}
          </div>
          
          <ScrollArea className="flex-1 p-8 bg-transparent">
            {!selectedDoc ? (
              <div className="max-w-3xl mx-auto space-y-4">
                <h2 className="text-xl font-semibold mb-6">Your Corpus</h2>
                {isLoadingDocs ? (
                  <p className="text-muted-foreground animate-pulse">Loading documents...</p>
                ) : documents.length === 0 ? (
                  <div className="p-8 border border-dashed border-border rounded-xl text-center text-muted-foreground">
                    No documents found. Go to the Documents tab to upload some.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map(doc => (
                      <div 
                        key={doc.id} 
                        onClick={() => setSelectedDoc(doc)}
                        className="p-4 bg-surface border border-border rounded-xl hover:border-primary/50 cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(59,111,232,0.1)] group"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <FileText className="w-5 h-5" />
                          </div>
                          <p className="font-medium truncate flex-1">{doc.filename}</p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-xs text-muted-foreground">{(doc.size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                          <span className="text-xs px-2 py-1 bg-elevated rounded font-mono">{doc.chunk_count} chunks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-3xl mx-auto bg-white/5 shadow-sm border border-border rounded-xl p-10 min-h-[800px] text-foreground font-serif">
                <div className="flex items-center justify-center h-full min-h-[400px] flex-col opacity-50">
                  <FileText className="w-16 h-16 mb-4 text-muted-foreground" />
                  <p className="text-center font-sans">
                    {selectedDoc.filename} is loaded in the AI context.<br/>
                    <span className="text-sm mt-2 block">You can now query specific provisions on the right panel.</span>
                  </p>
                </div>
              </div>
            )}
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
                {/* @ts-expect-error */}
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
              {/* @ts-expect-error */}
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

          <div className="flex-1 p-4 bg-background relative overflow-y-auto" ref={scrollRef}>
            <div className="flex flex-col gap-6 max-w-full pb-4">
              
              {/* Messages */}
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground opacity-50">
                  <Sparkles className="w-8 h-8 mb-4 text-[#7C3AED]" />
                  <p className="text-sm">Instruct AI Co-Counsel below...</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}
                    >
                      {/* Avatar Row */}
                      <div className="flex items-center gap-2">
                        {!isUser && (
                          <div className="w-6 h-6 rounded bg-[#7C3AED]/20 flex items-center justify-center border border-[#7C3AED]/30">
                            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                          </div>
                        )}
                        <span className={`text-xs font-medium ${isUser ? "text-muted-foreground" : "text-foreground font-semibold uppercase tracking-wider"}`}>
                          {isUser ? user?.name || "User" : "LexAI"}
                        </span>
                        {isUser && (
                          <div className="w-6 h-6 rounded bg-elevated flex items-center justify-center border border-border text-[10px] font-bold">
                            {user?.name ? getInitials(user.name) : "US"}
                          </div>
                        )}
                      </div>
                      
                      {/* Message Content */}
                      {isUser ? (
                        <div className="glass-panel border border-border p-4 rounded-xl rounded-tr-none text-sm text-foreground shadow-sm max-w-[85%] font-sans whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="ai-glow rounded-xl rounded-tl-none mt-1 w-full">
                          <div className="glass-panel p-4 rounded-xl rounded-tl-none text-sm leading-relaxed text-foreground/90 font-sans whitespace-pre-wrap min-h-12">
                            {msg.content || (isStreaming && index === messages.length - 1 ? <TypingDots /> : "")}
                            
                            {/* Sources (only show on last assistant msg if sources exist) */}
                            {!isStreaming && index === messages.length - 1 && sources.length > 0 && (
                              <div className="mt-4 p-3 bg-black/40 rounded-lg border border-border">
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                                  <BookOpen className="w-3.5 h-3.5" /> SOURCES
                                </div>
                                <ul className="space-y-2">
                                  {sources.map((src, i) => (
                                    <li key={i} className="text-[11px] flex gap-2">
                                      <span className="text-primary font-bold">[{i+1}]</span>
                                      <span className="text-muted-foreground font-mono">{src.document_name} {src.page ? `(Page ${src.page})` : ""}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Feedback */}
                            {!isStreaming && (
                              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/50">
                                <button className="p-1.5 text-muted-foreground hover:text-success hover:bg-success/10 rounded transition-colors">
                                  <ThumbsUp className="w-4 h-4" />
                                </button>
                                <button className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded transition-colors">
                                  <ThumbsDown className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
              
              {/* AI Error */}
              {error && (
                <div className="text-red-400 text-sm text-center p-2 bg-red-400/10 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 glass-panel rounded-none border-x-0 border-b-0 shrink-0">
            <div className="relative flex flex-col gap-2 glass-panel rounded-xl border border-border p-2 focus-within:ring-1 focus-within:ring-[#7C3AED] focus-within:border-[#7C3AED] transition-all shadow-inner">
              
              <Textarea 
                placeholder="Instruct AI Co-Counsel... (Type '/' for commands)" 
                className="min-h-[44px] max-h-[200px] bg-transparent border-0 focus-visible:ring-0 resize-none p-2 text-sm"
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
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

                <Button 
                  size="icon" 
                  className="shrink-0 rounded-lg h-8 w-8 bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white btn-scale"
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                >
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
