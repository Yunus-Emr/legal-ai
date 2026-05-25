"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Send, FileText, Download, Sparkles, Network, Paperclip,
  ThumbsUp, ThumbsDown, ChevronDown, BookOpen, Scale, CheckCircle2,
  ArrowRight, Plus, Trash2, MessageSquare, Folder, CornerDownLeft
} from "lucide-react";
import { type Source, chatApi, documentsApi, Document } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useChat } from "@/hooks/useChat";
import { useAuthStore } from "@/store/authStore";

const DEFAULT_GUEST_DOCUMENTS: Document[] = [
  {
    id: "4857-is-kanunu",
    filename: "4857_Sayili_Is_Kanunu.pdf",
    size_bytes: 485700,
    chunk_count: 42,
    status: "indexed",
    created_at: new Date().toISOString(),
    user_id: null
  },
  {
    id: "6098-borclar-kanunu",
    filename: "6098_Sayili_Turk_Borclar_Kanunu.pdf",
    size_bytes: 609800,
    chunk_count: 85,
    status: "indexed",
    created_at: new Date().toISOString(),
    user_id: null
  },
  {
    id: "6102-ticaret-kanunu",
    filename: "6102_Sayili_Turk_Ticaret_Kanunu.pdf",
    size_bytes: 610200,
    chunk_count: 120,
    status: "indexed",
    created_at: new Date().toISOString(),
    user_id: null
  }
];

const LEGAL_DOCUMENTS_TEXT: Record<string, { title: string, articles: { num: string, title: string, body: string }[] }> = {
  "4857-is-kanunu": {
    title: "4857 Sayılı İş Kanunu",
    articles: [
      {
        num: "Madde 1",
        title: "Amaç ve Kapsam",
        body: "Bu Kanunun amacı, işverenler ile bir iş sözleşmesine dayanarak çalıştırılan işçilerin çalışma şartları ve çalışma ortamına ilişkin hak ve sorumluluklarını düzenlemektir."
      },
      {
        num: "Madde 17",
        title: "Süreli Fesih ve Bildirim Şartları",
        body: "Belirsiz süreli iş sözleşmelerinin feshinden önce durumun diğer tarafa bildirilmesi gerekir. İş sözleşmeleri; işi altı aydan az sürmüş olan işçi için bildirimin diğer tarafa yapılmasından başlayarak iki hafta sonra, altı aydan birbuçuk yıla kadar sürmüş olan işçi için dört hafta sonra, birbuçuk yıldan üç yıla kadar sürmüş olan işçi için altı hafta sonra, üç yıldan fazla sürmüş işçi için sekiz hafta sonra feshedilmiş sayılır."
      },
      {
        num: "Madde 25",
        title: "İşverenin Haklı Nedenle Derhal Fesih Hakkı",
        body: "Süresi belirli olsun veya olmasın işveren, aşağıda yazılı hallerde iş sözleşmesini sürenin bitiminden önce veya bildirim süresini beklemeksizin feshedebilir:\nI- Sağlık sebepleri...\nII- Ahlak ve iyi niyet kurallarına uymayan haller ve benzerleri:\na) İş sözleşmesi yapıldığı sırada bu sözleşmenin esaslı noktalarından biri için yalan söylemek...\ne) İşçinin, işverenin güvenini kötüye kullanmak, hırsızlık yapmak, işverenin meslek sırlarını ortaya atmak gibi doğruluk ve bağlılığa uymayan davranışlarda bulunması.\ng) İşçinin işverenden izin almaksızın veya haklı bir sebebe dayanmaksızın ardı ardına iki işgünü veya bir ay içinde iki defa herhangi bir tatil gününden sonraki iş günü, yahut bir ayda üç işgünü işine devam etmemesi."
      },
      {
        num: "Madde 41",
        title: "Fazla Çalışma Ücreti",
        body: "Ülkenin genel yararları yahut işin niteliği veya üretimin artırılması gibi nedenlerle fazla çalışma yapılabilir. Fazla çalışma, Kanunda yazılı koşullar çerçevesinde, haftalık kırkbeş saati aşan çalışmalardır. Her bir saat fazla çalışma için verilecek ücret normal çalışma ücretinin saat başına düşen miktarının yüzde elli yükseltilmesiyle ödenir."
      },
      {
        num: "Madde 53",
        title: "Yıllık Ücretli İzin Hakkı",
        body: "İşyerinde işe başladığı günden itibaren, deneme süresi de içinde olmak üzere, en az bir yıl çalışmış olan işçilere yıllık ücretli izin verilir. Yıllık ücretli izin hakkından vazgeçilemez. İşçilere verilecek yıllık ücretli izin süresi, hizmet süresi; bir yıldan beş yıla kadar olanlara ondört günden, beş yıldan fazla onbeş yıldan az olanlara yirmi günden, onbeş yıl ve daha fazla olanlara yirmialtı günden az olamaz."
      }
    ]
  },
  "6098-borclar-kanunu": {
    title: "6098 Sayılı Türk Borçlar Kanunu",
    articles: [
      {
        num: "Madde 1",
        title: "Sözleşmenin Kurulması",
        body: "Sözleşme, tarafların iradelerini karşılıklı ve birbirine uygun olarak açıklamalarıyla kurulur. İrade açıklaması, açık veya örtülü olabilir."
      },
      {
        num: "Madde 2",
        title: "İkinci Derecedeki Noktalar",
        body: "Taraflar sözleşmenin esaslı noktalarında uyuşurlarsa, ikinci derecedeki noktalar üzerinde durulmamış olsa bile, sözleşme kurulmuş sayılır."
      },
      {
        num: "Madde 112",
        title: "Borcun İfa Edilmemesi - Genel Tazminat",
        body: "Borç hiç veya gereği gibi ifa edilmezse borçlu, kendisine hiçbir kusurun yüklenemeyeceğini ispat etmedikçe, alacaklının bundan doğan zararını gidermekle yükümlüdür."
      },
      {
        num: "Madde 125",
        title: "Temerrüdün Hükümleri",
        body: "Borçlunun temerrüdü üzerine alacaklı, her zaman borcun ifasını ve gecikme tazminatı isteme hakkına sahiptir. Alacaklı, ayrıca borcun ifasından vazgeçtiğini ve borcun ifa edilmemesinden doğan zararının giderilmesini isteyebilir veya sözleşmeden dönebilir."
      }
    ]
  },
  "6102-ticaret-kanunu": {
    title: "6102 Sayılı Türk Ticaret Kanunu",
    articles: [
      {
        num: "Madde 12",
        title: "Tacir Sıfatı",
        body: "Bir ticari işletmeyi, kısmen de olsa, kendi adına işleten kişiye tacir denir. Bir ticari işletmeyi kurup açtığını, sirküler, gazete, radyo, televizyon ve diğer ilan araçlarıyla halka bildirmiş veya işletmesini ticaret siciline tescil ettirerek durumu ilan etmiş olan kimse, fiilen işletmeye başlamamış olsa bile tacir sayılır."
      },
      {
        num: "Madde 18",
        title: "Basiretli İş İnsanı Gibi Davranma Yükümlülüğü",
        body: "Her tacirin, ticaretine ait bütün faaliyetlerinde basiretli bir iş insanı gibi hareket etmesi gerekir. Tacirler, aralarındaki ticari işlerde kanunen öngörülen ihbar ve ihtarları noter aracılığıyla, taahhütlü mektupla, telgrafla veya güvenli elektronik imza kullanarak kayıtlı elektronik posta sistemiyle yaparlar."
      }
    ]
  }
};

function CircularGauge({ score, size = 64, strokeWidth = 6 }: { score: number, size?: number, strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = score > 70 ? "#EF4444" : score > 40 ? "#F59E0B" : "#10B981";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-border" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
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

function renderCleanPrompt(content: string): string {
  return content
    .split("\n")
    .filter(line => {
      const trimmed = line.trim();
      return !(trimmed.startsWith("[") && trimmed.endsWith("]"));
    })
    .join("\n")
    .trim();
}

function renderMarkdown(text: string) {
  if (!text) return null;

  const lines = text.split("\n");
  let inList = false;
  let listItems: React.ReactNode[] = [];
  const elements: React.ReactNode[] = [];

  const parseInlineStyles = (lineText: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(lineText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(lineText.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={match.index} className="font-extrabold text-foreground bg-primary/5 px-1 rounded">
          {match[1]}
        </strong>
      );
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < lineText.length) {
      parts.push(lineText.substring(lastIndex));
    }

    return parts.length > 0 ? parts : lineText;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("###")) {
      if (inList) {
        elements.push(
          <ul key={`list-${idx}`} className="list-disc pl-5 my-3 space-y-1 text-sm text-muted-foreground">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      elements.push(
        <h4 key={idx} className="text-sm font-bold text-foreground mt-4 mb-2 border-b border-border/40 pb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-3.5 bg-primary/70 rounded-full inline-block shrink-0" />
          {parseInlineStyles(trimmed.replace(/^###\s*/, ""))}
        </h4>
      );
    } else if (trimmed.startsWith("##")) {
      if (inList) {
        elements.push(
          <ul key={`list-${idx}`} className="list-disc pl-5 my-3 space-y-1 text-sm text-muted-foreground">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      elements.push(
        <h3 key={idx} className="text-base font-bold text-foreground mt-5 mb-3 flex items-center gap-2">
          <span className="w-2 h-4 bg-primary rounded-full inline-block shrink-0" />
          {parseInlineStyles(trimmed.replace(/^##\s*/, ""))}
        </h3>
      );
    } else if (trimmed.startsWith("-") || trimmed.startsWith("•") || (trimmed.match(/^\d+\.\s/) && inList)) {
      inList = true;
      const cleanedText = trimmed.replace(/^[-•]\s*/, "").replace(/^\d+\.\s*/, "");
      listItems.push(
        <li key={idx} className="text-sm leading-relaxed text-foreground/80 list-item pl-1">
          {parseInlineStyles(cleanedText)}
        </li>
      );
    } else if (trimmed === "") {
      if (inList) {
        elements.push(
          <ul key={`list-${idx}`} className="list-disc pl-5 my-3 space-y-1 text-sm text-muted-foreground">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    } else {
      if (inList) {
        elements.push(
          <ul key={`list-${idx}`} className="list-disc pl-5 my-3 space-y-1 text-sm text-muted-foreground">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      elements.push(
        <p key={idx} className="text-sm leading-relaxed my-2 text-foreground/80 whitespace-pre-line font-normal">
          {parseInlineStyles(line)}
        </p>
      );
    }
  });

  if (inList && listItems.length > 0) {
    elements.push(
      <ul key={`list-final`} className="list-disc pl-5 my-3 space-y-1 text-sm text-muted-foreground">
        {listItems}
      </ul>
    );
  }

  return <div className="space-y-1">{elements}</div>;
}

export default function AICanvasPage() {
  const { user } = useAuthStore();
  const isGuest = !user || user.role === "guest" || (typeof window !== "undefined" && (localStorage.getItem("lexai_guest") === "true" || document.cookie.includes("lexai_guest=true")));

  const [input, setInput] = useState("");
  const [mode, setMode] = useState("Contract Review");
  const [jurisdiction, setJurisdiction] = useState("Türk Hukuku");
  const [activeSource, setActiveSource] = useState<Source | null>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [activeDocChunks, setActiveDocChunks] = useState<any[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  const { sessionId, messages, isStreaming, sources, error, sendMessage, clearChat, setSession } = useChat();
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadSessions = useCallback(() => {
    if (isGuest) {
      const stored = JSON.parse(localStorage.getItem("lexai_guest_sessions") || "[]");
      setChatSessions(stored);
    } else {
      setIsLoadingSessions(true);
      chatApi.sessions()
        .then(res => {
          setChatSessions(res.data.sessions || []);
          setIsLoadingSessions(false);
        })
        .catch(err => {
          console.error("Error loading sessions:", err);
          setIsLoadingSessions(false);
        });
    }
  }, [isGuest]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const prevStreamingRef = useRef(false);
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming) {
      loadSessions();
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming, loadSessions]);

  const handleNewChat = () => {
    clearChat();
  };

  const handleSelectSession = useCallback((sid: string) => {
    if (isGuest) {
      const history = JSON.parse(localStorage.getItem(`lexai_guest_history_${sid}`) || "[]");
      setSession(sid, history);
    } else {
      chatApi.history(sid)
        .then(res => {
          const mapped = res.data.history.map((h: any) => ({
            role: h.role,
            content: h.content,
            created_at: h.created_at
          }));
          setSession(sid, mapped);
        })
        .catch(err => {
          console.error("Error loading session:", err);
        });
    }
  }, [isGuest, setSession]);

  // Session active state restoration across dashboard/page navigations
  useEffect(() => {
    const savedSessionId = sessionStorage.getItem("lexai_active_session_id");
    if (savedSessionId) {
      handleSelectSession(savedSessionId);
    }
  }, [handleSelectSession]);

  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem("lexai_active_session_id", sessionId);
    } else {
      sessionStorage.removeItem("lexai_active_session_id");
    }
  }, [sessionId]);

  const handleDeleteSession = (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    const confirmMsg = "Bu sohbeti silmek istediğinizden emin misiniz?";
    if (!window.confirm(confirmMsg)) return;

    if (isGuest) {
      const stored = JSON.parse(localStorage.getItem("lexai_guest_sessions") || "[]");
      const filtered = stored.filter((s: any) => s.session_id !== sid);
      localStorage.setItem("lexai_guest_sessions", JSON.stringify(filtered));
      localStorage.removeItem(`lexai_guest_history_${sid}`);
      setChatSessions(filtered);
      if (sessionId === sid) {
        clearChat();
      }
    } else {
      chatApi.delete(sid)
        .then(() => {
          setChatSessions(prev => prev.filter(s => s.session_id !== sid));
          if (sessionId === sid) {
            clearChat();
          }
        })
        .catch(err => {
          console.error("Error deleting session:", err);
        });
    }
  };

  useEffect(() => {
    if (isGuest && !isStreaming && messages.length > 0 && sessionId) {
      localStorage.setItem(`lexai_guest_history_${sessionId}`, JSON.stringify(messages));
      
      const storedSessions = JSON.parse(localStorage.getItem("lexai_guest_sessions") || "[]");
      const exists = storedSessions.find((s: any) => s.session_id === sessionId);
      if (!exists) {
        const firstUserMsg = messages.find(m => m.role === "user")?.content || "Sohbet";
        const cleanTitle = firstUserMsg.replace(/^\[Role:.*\]\n?/, "");
        const title = cleanTitle.substring(0, 35) + (cleanTitle.length > 35 ? "..." : "");
        const newSession = {
          session_id: sessionId,
          title: title,
          last_activity: new Date().toISOString()
        };
        const updated = [newSession, ...storedSessions];
        localStorage.setItem("lexai_guest_sessions", JSON.stringify(updated));
        setChatSessions(updated);
      } else {
        const updated = storedSessions.map((s: any) => 
          s.session_id === sessionId 
            ? { ...s, last_activity: new Date().toISOString() } 
            : s
        );
        localStorage.setItem("lexai_guest_sessions", JSON.stringify(updated));
        setChatSessions(updated);
      }
    }
  }, [isStreaming, messages, sessionId, isGuest]);

  useEffect(() => {
    if (isGuest) {
      setDocuments(DEFAULT_GUEST_DOCUMENTS);
      setIsLoadingDocs(false);
    } else {
      documentsApi.list().then(res => {
        setDocuments([...DEFAULT_GUEST_DOCUMENTS, ...res.data.documents]);
        setIsLoadingDocs(false);
      }).catch(err => {
        console.error(err);
        setDocuments(DEFAULT_GUEST_DOCUMENTS);
        setIsLoadingDocs(false);
      });
    }
  }, [isGuest]);

  useEffect(() => {
    if (!selectedDoc) {
      setActiveDocChunks([]);
      return;
    }

    if (selectedDoc.id in LEGAL_DOCUMENTS_TEXT) {
      const docText = LEGAL_DOCUMENTS_TEXT[selectedDoc.id];
      const guestChunks = docText.articles.map((art, idx) => ({
        chunk_id: `${selectedDoc.id}-${idx}`,
        page: idx + 1,
        text: `${art.num} - ${art.title}\n\n${art.body}`,
        num: art.num,
        title: art.title,
        body: art.body
      }));
      setActiveDocChunks(guestChunks);
      return;
    }

    setIsLoadingChunks(true);
    documentsApi.chunks(selectedDoc.id)
      .then(res => {
        const chunks = res.data.chunks || [];
        const mapped = chunks.map((chunk: any, idx: number) => {
          const firstLine = chunk.text.split("\n")[0] || "";
          let num = `P. ${chunk.page || idx + 1}`;
          let title = firstLine.length > 30 ? firstLine.substring(0, 30) + "..." : firstLine || `Bölüm ${idx + 1}`;
          let body = chunk.text;

          const maddeMatch = chunk.text.match(/^(Madde\s+\d+|Kısım\s+[A-Z0-9]+|Bölüm\s+\d+)/i);
          if (maddeMatch) {
            num = maddeMatch[1];
            const lines = chunk.text.split("\n");
            title = lines[0].replace(maddeMatch[0], "").replace(/^[.:\-\s]+/, "").trim();
            if (!title) {
              title = lines[1] || `Detay`;
            }
            body = lines.slice(1).join("\n").trim();
          }

          return {
            chunk_id: chunk.chunk_id,
            page: chunk.page || idx + 1,
            num,
            title,
            body
          };
        });
        setActiveDocChunks(mapped);
        setIsLoadingChunks(false);
      })
      .catch(err => {
        console.error("Error fetching document chunks:", err);
        setActiveDocChunks([
          {
            chunk_id: "error",
            page: 1,
            num: "Hata",
            title: "Yüklenemedi",
            body: "Dokümanın metin parçaları sunucudan alınırken bir hata oluştu veya henüz indekslenmedi."
          }
        ]);
        setIsLoadingChunks(false);
      });
  }, [selectedDoc]);


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

      // Simulate credit cost deduction ($0.05 per AI query)
      if (typeof window !== "undefined") {
        const currentSpent = Number(localStorage.getItem("lexai_spent_amount") || "1157.85");
        localStorage.setItem("lexai_spent_amount", (currentSpent + 0.05).toString());
        window.dispatchEvent(new Event("lexai_budget_changed"));
      }
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

        {/* Panel 1: ChatGPT-style Sidebar (Left) */}
        <ResizablePanel
          defaultSize={18}
          minSize={12}
          maxSize={25}
          className="bg-slate-950 border-r border-slate-900 text-slate-200 flex flex-col p-4 shrink-0 relative"
        >
          {/* Yeni Sohbet Button */}
          <Button
            onClick={handleNewChat}
            className="w-full justify-start gap-2 bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 rounded-lg text-xs font-semibold py-5 transition-all mb-4 shadow-sm group"
          >
            <Plus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            Yeni Sohbet
          </Button>

          {/* History ScrollArea */}
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2 flex items-center gap-1.5 select-none">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                Geçmiş Sohbetler
              </div>

              {isLoadingSessions ? (
                <div className="space-y-2 px-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 bg-slate-900/40 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : chatSessions.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic px-2">
                  Henüz geçmiş sohbet yok.
                </p>
              ) : (
                chatSessions.map((session) => {
                  const isActive = sessionId === session.session_id;
                  return (
                    <div
                      key={session.session_id}
                      onClick={() => handleSelectSession(session.session_id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between gap-2 group cursor-pointer border ${isActive
                          ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_12px_rgba(59,111,232,0.15)]"
                          : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"
                        }`}
                    >
                      <div className="flex items-center gap-2 truncate flex-1">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-primary" : "text-slate-600 group-hover:text-slate-500"}`} />
                        <span className="truncate font-sans font-normal">{session.title || "Sohbet"}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(e, session.session_id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400 transition-all shrink-0 animate-in fade-in duration-200"
                        title="Sohbeti Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors relative z-20" />

        {/* Panel 2: Collapsible Document Reader (Middle, only shown if selectedDoc is set) */}
        {selectedDoc && (
          <>
            <ResizablePanel defaultSize={48} minSize={30} maxSize={70} className="bg-surface/50 flex flex-col relative">
              <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-surface shrink-0 z-10">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-medium font-mono truncate max-w-xs">
                    {selectedDoc.filename}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-success/10 text-success border border-success/20">
                    {selectedDoc.status === 'indexed' ? 'Ready' : 'Processing'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground" onClick={() => window.open(`/api/v1/documents/${selectedDoc.id}/download`, '_blank')}>
                    <Download className="w-3.5 h-3.5 mr-2" />
                    İndir
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelectedDoc(null)}>
                    Kapat
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4 bg-transparent">
                <div className="flex flex-col h-full bg-white text-slate-900 rounded-xl shadow-lg border border-slate-200 overflow-hidden min-h-[750px] font-sans">
                  {/* Reader Header */}
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 font-sans">
                          {selectedDoc.filename}
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          {(selectedDoc.size_bytes / 1024).toFixed(1)} KB • {selectedDoc.chunk_count} Vektör Parçası
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                        RAG HAZIR
                      </span>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:text-slate-700" onClick={() => setSelectedDoc(null)}>
                        Kapat
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-1 overflow-hidden">
                    {/* Left Column: Article Quick Nav */}
                    <div className="w-48 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto shrink-0 flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Kanun Maddeleri</span>
                      {isLoadingChunks ? (
                        <p className="text-xs text-slate-400 animate-pulse">Yükleniyor...</p>
                      ) : activeDocChunks.map((art, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const el = document.getElementById(`art-${idx}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors truncate"
                        >
                          <span className="font-bold text-rose-600 block text-[10px] font-mono">{art.num}</span>
                          {art.title}
                        </button>
                      ))}
                    </div>

                    {/* Main Content Area: PDF Paper view */}
                    <div className="flex-1 bg-slate-100 p-6 overflow-y-auto flex justify-center">
                      <div className="w-full max-w-2xl bg-white shadow-md border border-slate-200 rounded-lg p-8 min-h-[900px] text-slate-800 font-serif leading-relaxed relative self-start">
                        <div className="absolute top-6 right-6 text-[9px] font-bold text-slate-300 font-mono tracking-widest select-none">
                          LEXAI OFFICIAL READER
                        </div>

                        <h2 className="text-center font-bold text-base text-slate-900 border-b pb-4 mb-6 font-sans">
                          {selectedDoc.filename}
                        </h2>

                        <div className="space-y-6">
                          {isLoadingChunks ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mb-4" />
                              <p className="text-sm">Doküman metni yükleniyor...</p>
                            </div>
                          ) : activeDocChunks.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-12">Bu dokümanda hiç metin parçası bulunamadı.</p>
                          ) : (
                            activeDocChunks.map((art, idx) => (
                              <div key={idx} id={`art-${idx}`} className="scroll-mt-4">
                                <h4 className="font-bold text-sm text-slate-900 font-sans flex items-center gap-2 mb-1.5">
                                  <span className="text-rose-600 font-mono text-[10px] px-1.5 py-0.5 bg-rose-50 rounded">
                                    {art.num}
                                  </span>
                                  {art.title}
                                </h4>
                                <p className="text-xs text-slate-700 whitespace-pre-wrap pl-3 border-l border-slate-200">
                                  {art.body}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </ResizablePanel>
            <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors relative z-20" />
          </>
        )}

        {/* Panel 3: Main AI Chat Panel */}
        <ResizablePanel defaultSize={selectedDoc ? 34 : 82} minSize={30} className="bg-surface flex flex-col relative z-10 shadow-2xl">

          {/* Main Top Header: Dynamic Dropdown Selector */}
          <div className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0 glass-panel bg-surface/80 backdrop-blur-md">
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

            <div className="flex items-center gap-3">
              {/* Dynamic Document Reference Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2 border-border/80 bg-background text-xs font-semibold hover:bg-elevated transition-colors shadow-sm">
                    <BookOpen className="w-4 h-4 text-rose-500" />
                    {selectedDoc ? selectedDoc.filename : "Yasal Referans Belgesi Ekle"}
                    <ChevronDown className="w-3.5 h-3.5 opacity-55" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-elevated border-border text-foreground max-h-96 overflow-y-auto shadow-2xl p-1 rounded-xl">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest p-3 block border-b border-border/50">
                    BELGE SEÇİN (RAG İÇİN)
                  </span>
                  {documents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">Belge bulunamadı.</div>
                  ) : (
                    documents.map(doc => (
                      <DropdownMenuItem
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className="p-3 focus:bg-primary/10 cursor-pointer flex flex-col items-start gap-0.5 border-b border-border/20 last:border-b-0 rounded-lg"
                      >
                        <span className="font-semibold text-xs text-foreground truncate w-full">{doc.filename}</span>
                        <span className="text-[10px] text-muted-foreground">{(doc.size_bytes / 1024).toFixed(1)} KB • {doc.chunk_count} parça</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider shadow-sm select-none">
                <Scale className="w-3.5 h-3.5 text-rose-500" />
                Türk Hukuku
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-6 bg-background relative overflow-y-auto" ref={scrollRef}>
            <div className={`flex flex-col gap-6 pb-4 ${selectedDoc ? "w-full" : "max-w-3xl mx-auto"}`}>

              {/* Messages */}
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-60">
                  <Sparkles className="w-10 h-10 mb-4 text-[#7C3AED] animate-pulse" />
                  <p className="text-sm font-medium tracking-wide">LegalAI Yapay Zeka Hukuk Danışmanı</p>
                  <p className="text-xs text-muted-foreground mt-2 max-w-sm text-center">
                    Gelişmiş RAG altyapısı ile kanunları ve belgeleri inceler, hukuki mütalaaları anında ve referanslarıyla oluşturur.
                  </p>
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
                          <div className="w-6 h-6 rounded bg-[#7C3AED]/20 flex items-center justify-center border border-[#7C3AED]/30 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                          </div>
                        )}
                        <span className={`text-xs font-semibold ${isUser ? "text-muted-foreground" : "text-foreground uppercase tracking-wider"}`}>
                          {isUser ? user?.name || "User" : "LegalAI"}
                        </span>
                        {isUser && (
                          <div className="w-6 h-6 rounded bg-elevated flex items-center justify-center border border-border text-[10px] font-bold shadow-sm">
                            {user?.name ? getInitials(user.name) : "US"}
                          </div>
                        )}
                      </div>

                      {/* Message Content */}
                      {isUser ? (
                        <div className="glass-panel border border-border p-4 rounded-2xl rounded-tr-none text-sm text-foreground shadow-sm max-w-[85%] font-sans whitespace-pre-wrap">
                          {renderCleanPrompt(msg.content)}
                        </div>
                      ) : (
                        <div className="ai-glow rounded-2xl rounded-tl-none mt-1 w-full shadow-md">
                          <div className="glass-panel p-5 rounded-2xl rounded-tl-none text-sm leading-relaxed text-foreground/90 font-sans min-h-12">
                            {msg.content ? (
                              renderMarkdown(msg.content)
                            ) : (
                              isStreaming && index === messages.length - 1 ? <TypingDots /> : ""
                            )}

                            {/* Sources (only show on last assistant msg if sources exist) */}
                            {!isStreaming && index === messages.length - 1 && sources.length > 0 && (
                              <div className="mt-5 pt-4 border-t border-border/50">
                                <div className="flex items-center gap-2 text-xs font-bold text-[#A8B2C7] uppercase tracking-wider mb-3 select-none">
                                  <BookOpen className="w-3.5 h-3.5 text-primary" /> ATIFTA BULUNULAN KAYNAKLAR
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {sources.map((src, i) => (
                                    <div
                                      key={i}
                                      onClick={() => setActiveSource(src)}
                                      className="flex items-center gap-3 p-3 bg-[#0C1222] border border-border/80 rounded-xl hover:border-rose-500/50 cursor-pointer transition-all duration-200 group shadow-sm hover:shadow-[0_0_12px_rgba(239,68,68,0.06)]"
                                    >
                                      {/* PDF Icon Badge */}
                                      <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white transition-colors shrink-0">
                                        <FileText className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-semibold text-foreground truncate">{src.document_name}</p>
                                        <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">
                                          {src.page ? `Sayfa ${src.page}` : "Genel"} • Skor: %{((src.score || 0) * 100).toFixed(0)}
                                        </p>
                                      </div>
                                      <div className="text-[10px] text-primary group-hover:translate-x-0.5 transition-transform shrink-0 font-medium flex items-center gap-0.5">
                                        Oku <ArrowRight className="w-3 h-3" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
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
                <div className="text-red-400 text-sm text-center p-3 bg-red-400/10 rounded-xl border border-red-500/20 shadow-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 glass-panel rounded-none border-x-0 border-b-0 shrink-0">
            <div className={`relative flex flex-col gap-2 glass-panel rounded-xl border border-border p-2 focus-within:ring-1 focus-within:ring-[#7C3AED] focus-within:border-[#7C3AED] transition-all shadow-inner ${selectedDoc ? "w-full" : "max-w-3xl mx-auto"}`}>

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
                <div className="flex items-center gap-1 select-none">
                  <span className="text-[10px] text-muted-foreground/60 font-mono pl-1">
                    Enter key to send, Shift+Enter for new line
                  </span>
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
            <div className="mt-2 text-[10px] text-center text-muted-foreground/50 font-mono tracking-tight select-none">
              AI-generated content may be inaccurate. Review before filing.
            </div>
          </div>
        </ResizablePanel>

      </ResizablePanelGroup>
      {/* PDF Source Details Modal */}
      <AnimatePresence>
        {activeSource && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0C1222] border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex justify-between items-center bg-[#090D1A]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground truncate max-w-md">
                      {activeSource.document_name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                      {activeSource.page ? `Sayfa ${activeSource.page}` : "Sayfa Belirtilmemiş"} • Eşleşme Skoru: %{((activeSource.score || 0) * 100).toFixed(0)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSource(null)}
                  className="text-muted-foreground hover:text-foreground text-sm font-semibold p-2 hover:bg-elevated rounded-lg transition-colors"
                >
                  Kapat
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#090D1A]/50">
                <div className="bg-[#121A2F]/80 border border-border/80 rounded-xl p-5 leading-relaxed text-sm text-foreground/95 whitespace-pre-wrap font-serif">
                  {activeSource.text || "Bu bölümün metin içeriği yüklenemedi."}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border bg-[#0C1222] flex justify-end">
                <Button
                  onClick={() => setActiveSource(null)}
                  className="bg-primary hover:bg-primary/95 text-white text-xs font-semibold px-5 h-9"
                >
                  Anladım, Kapat
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}