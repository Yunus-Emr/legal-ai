import { useState, useRef, useCallback } from "react";
import { getToken } from "@/lib/auth";
import { API_BASE_URL, type ChatMessage, type Source } from "@/lib/api";

export interface ChatSession {
  sessionId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  sources: Source[];
  error: string | null;
  sendMessage: (query: string, options?: { retrieval_mode?: string }) => Promise<void>;
  clearChat: () => void;
  setSession: (id: string, initialMessages?: ChatMessage[]) => void;
  thoughts: string[];
}

export function useChat(): ChatSession {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [thoughts, setThoughts] = useState<string[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (query: string, options?: { retrieval_mode?: string }) => {
    if (!query.trim()) return;

    setError(null);
    setIsStreaming(true);
    setSources([]);
    setThoughts([]);

    // Add user message to UI immediately
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    
    // Add an empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const token = getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/stream`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            query,
            session_id: sessionId,
            retrieval_mode: options?.retrieval_mode || "hybrid",
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Chat API error: ${response.statusText}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = ""; // Buffer to accumulate partial lines

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          
          // Process full messages (separated by \n\n in SSE)
          let lines = buffer.split("\n");
          
          // Keep the last partial line in the buffer
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;
            
            const dataStr = trimmedLine.slice("data: ".length);
            if (!dataStr.trim()) continue;
            
            try {
              const data = JSON.parse(dataStr);
              
              if (data.type === "session" && data.session_id) {
                setSessionId(data.session_id);
              } else if (data.type === "thought" && data.thought !== undefined) {
                setThoughts((prev) => [...prev, data.thought]);
              } else if (data.type === "token" && data.token !== undefined) {
                setMessages((prev) => {
                  if (prev.length === 0) return prev;
                  const newMsgs = [...prev];
                  const lastIndex = newMsgs.length - 1;
                  const last = newMsgs[lastIndex];
                  if (last && last.role === "assistant") {
                    newMsgs[lastIndex] = {
                      ...last,
                      content: last.content + data.token,
                    };
                  }
                  return newMsgs;
                });
              } else if (data.type === "sources" && data.sources) {
                setSources(data.sources);
              } else if (data.type === "error") {
                setError(data.message);
              } else if (data.type === "done") {
                // Done event
              }
            } catch (e) {
              console.warn("Failed to parse SSE JSON chunk:", dataStr);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Chat error:", err);
        setError(err.message || "An error occurred");
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [sessionId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setSources([]);
    setError(null);
    setThoughts([]);
  }, []);

  const setSession = useCallback((id: string, initialMessages: ChatMessage[] = []) => {
    setSessionId(id);
    setMessages(initialMessages);
    setSources([]);
    setError(null);
    setThoughts([]);
  }, []);

  return {
    sessionId,
    messages,
    isStreaming,
    sources,
    error,
    sendMessage,
    clearChat,
    setSession,
    thoughts,
  };
}
