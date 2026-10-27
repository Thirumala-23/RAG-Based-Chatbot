"use client";

import React, { useState, useRef, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

// Dynamically load KaTeX script from CDN
let katexPromise: Promise<any> | null = null;

function loadKaTeX(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject("SSR");
  if ((window as any).katex) return Promise.resolve((window as any).katex);

  if (!katexPromise) {
    katexPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js";
      script.async = true;
      script.onload = () => {
        resolve((window as any).katex);
      };
      script.onerror = (err) => {
        katexPromise = null;
        reject(err);
      };
      document.head.appendChild(script);
    });
  }
  return katexPromise;
}

export function MathRenderer({ expr, block = false }: { expr: string; block?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [katexLoaded, setKatexLoaded] = useState<boolean>(
    typeof window !== "undefined" && !!(window as any).katex
  );

  useEffect(() => {
    if (!katexLoaded) {
      loadKaTeX()
        .then(() => setKatexLoaded(true))
        .catch((err) => console.error("Failed to load KaTeX from CDN:", err));
    }
  }, [katexLoaded]);

  useEffect(() => {
    if (katexLoaded && ref.current) {
      try {
        const katex = (window as any).katex;
        if (katex) {
          katex.render(expr, ref.current, {
            displayMode: block,
            throwOnError: false,
          });
        }
      } catch (err) {
        console.error("KaTeX rendering error:", err);
      }
    }
  }, [expr, block, katexLoaded]);

  if (!katexLoaded) {
    return <span className="font-mono text-xs opacity-60">{expr}</span>;
  }

  return <span ref={ref} />;
}

function parseMarkdown(text: string, isUser = false): React.ReactNode {
  if (!text) return "";
  
  let cleanText = text.trim();
  
  // Strip leading block markers like ```markdown or """markdown
  const leadingMarkers = ["```markdown", "```", '"""markdown', '"""'];
  let cleaned = true;
  while (cleaned) {
    cleaned = false;
    for (const marker of leadingMarkers) {
      if (cleanText.toLowerCase().startsWith(marker)) {
        cleanText = cleanText.substring(marker.length).trim();
        cleaned = true;
      }
    }
  }
  
  // Strip trailing block markers
  cleaned = true;
  while (cleaned) {
    cleaned = false;
    for (const marker of ["```", '"""']) {
      if (cleanText.endsWith(marker)) {
        cleanText = cleanText.substring(0, cleanText.length - marker.length).trim();
        cleaned = true;
      }
    }
  }

  // Split into lines
  const lines = cleanText.split("\n");
  
  const renderedElements: React.ReactNode[] = [];
  let equationLines: string[] = [];
  let inEquationBlock = false;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim();

    // Check for single-line block equation
    if (line.startsWith("\\[") && line.endsWith("\\]")) {
      const expr = line.slice(2, -2).trim();
      renderedElements.push(
        <div 
          key={`eq-${idx}`} 
          className="my-3.5 mx-auto max-w-lg p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center text-sm text-[var(--text-primary)] shadow-sm select-all relative overflow-x-auto"
        >
          <div className="absolute top-1.5 left-2 text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-sans select-none">
            Equation
          </div>
          <div className="text-center pt-2 select-all leading-relaxed w-full">
            <MathRenderer expr={expr} block={true} />
          </div>
        </div>
      );
      continue;
    }

    if (line.startsWith("$$") && line.endsWith("$$") && line.length > 4) {
      const expr = line.slice(2, -2).trim();
      renderedElements.push(
        <div 
          key={`eq-${idx}`} 
          className="my-3.5 mx-auto max-w-lg p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center text-sm text-[var(--text-primary)] shadow-sm select-all relative overflow-x-auto"
        >
          <div className="absolute top-1.5 left-2 text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-sans select-none">
            Equation
          </div>
          <div className="text-center pt-2 select-all leading-relaxed w-full">
            <MathRenderer expr={expr} block={true} />
          </div>
        </div>
      );
      continue;
    }

    // Check for beginning of block equation
    if (line === "\\[" || line === "$$") {
      inEquationBlock = true;
      equationLines = [];
      continue;
    }

    // Check for end of block equation
    if (line === "\\]" || line === "$$") {
      inEquationBlock = false;
      const equationText = equationLines.join("\n");
      renderedElements.push(
        <div 
          key={`eq-${idx}`} 
          className="my-3.5 mx-auto max-w-lg p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center text-sm text-[var(--text-primary)] shadow-sm select-all relative overflow-x-auto"
        >
          <div className="absolute top-1.5 left-2 text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-sans select-none">
            Equation
          </div>
          <div className="text-center pt-2 select-all leading-relaxed w-full">
            <MathRenderer expr={equationText} block={true} />
          </div>
        </div>
      );
      continue;
    }

    if (inEquationBlock) {
      equationLines.push(line);
      continue;
    }

    // 1. Headers (e.g. ## Header)
    const headerMatch = lines[idx].match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      const parsedContent = parseInlineMarkdown(content, isUser);
      const colorClass = isUser ? "text-white" : "text-[var(--text-primary)]";
      if (level === 1) {
        renderedElements.push(<h1 key={idx} className={`text-xl font-bold mt-4 mb-2 ${colorClass}`}>{parsedContent}</h1>);
      } else if (level === 2) {
        renderedElements.push(<h2 key={idx} className={`text-lg font-bold mt-4 mb-2 ${colorClass}`}>{parsedContent}</h2>);
      } else {
        renderedElements.push(<h3 key={idx} className={`text-base font-bold mt-3 mb-1 ${colorClass}`}>{parsedContent}</h3>);
      }
      continue;
    }

    // 2. Bullet list items (e.g. * item or - item)
    const listMatch = lines[idx].match(/^[\*\-]\s+(.*)$/);
    if (listMatch) {
      const colorClass = isUser ? "text-white" : "text-[var(--text-primary)]";
      renderedElements.push(
        <li key={idx} className={`ml-4 list-disc my-1 leading-relaxed ${colorClass}`}>
          {parseInlineMarkdown(listMatch[1], isUser)}
        </li>
      );
      continue;
    }

    // 3. Plain paragraphs (or empty space)
    if (lines[idx].trim() === "") {
      renderedElements.push(<div key={idx} className="h-2.5" />);
      continue;
    }

    const colorClass = isUser ? "text-white" : "text-[var(--text-primary)]";
    renderedElements.push(
      <p key={idx} className={`my-2 leading-relaxed ${colorClass}`}>
        {parseInlineMarkdown(lines[idx], isUser)}
      </p>
    );
  }

  // Fallback if equation block was left unclosed at the end of the stream
  if (inEquationBlock && equationLines.length > 0) {
    renderedElements.push(
      <div 
        key="eq-fallback" 
        className="my-3.5 mx-auto max-w-lg p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center text-sm text-[var(--text-primary)] shadow-sm relative overflow-x-auto"
      >
        <div className="absolute top-1.5 left-2 text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-sans">
          Equation
        </div>
        <div className="text-center pt-2 w-full">
          <MathRenderer expr={equationLines.join("\n")} block={true} />
        </div>
      </div>
    );
  }

  return renderedElements;
}

function parseInlineMarkdown(text: string, isUser = false): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  const result: React.ReactNode[] = [];
  
  parts.forEach((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const colorClass = isUser ? "text-white" : "text-[var(--text-primary)]";
      result.push(
        <strong key={`b-${idx}`} className={`font-bold ${colorClass}`}>
          {part.slice(2, -2)}
        </strong>
      );
    } else {
      const mathParts = part.split(/(\\\(.*?\\\))/g);
      mathParts.forEach((subPart, sIdx) => {
        if (subPart.startsWith("\\(") && subPart.endsWith("\\)")) {
          const mathExpr = subPart.slice(2, -2);
          result.push(
            <span key={`math-${idx}-${sIdx}`} className={`mx-0.5 inline-block align-middle select-all ${isUser ? "text-white" : ""}`}>
              <MathRenderer expr={mathExpr} block={false} />
            </span>
          );
        } else {
          result.push(subPart);
        }
      });
    }
  });
  
  return result;
}

interface Citation {
  sentence_id: number;
  text: string;
  page_number: number;
  bbox: number[];
  type: string;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
  imageUrls?: string[];
  loading?: boolean;
  timestamp?: string;
}

interface ChatInterfaceProps {
  onDocumentLoaded: (id: string, filename: string, totalPages: number) => void;
  onCitationClicked: (page: number, text: string, bbox: number[]) => void;
  activeDocumentId: string | null;
  userName?: string;
}

export default function ChatInterface({ onDocumentLoaded, onCitationClicked, activeDocumentId, userName = "User" }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [streaming, setStreaming] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  const [isListening, setIsListening] = useState<boolean>(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");

  const toggleSpeech = (text: string, index: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (speakingIndex === index) {
        setSpeakingIndex(null);
        return;
      }
    }

    setSpeakingIndex(index);
    
    // Clean text: strip markdown characters and LaTeX math blocks for cleaner pronunciation
    let cleanText = text
      .replace(/[\*\#\`\_]/g, "")
      .replace(/\\\[[\s\S]*?\\\]/g, "")
      .replace(/\\\(.*?\\\)/g, "");
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => {
      setSpeakingIndex(null);
    };
    utterance.onerror = () => {
      setSpeakingIndex(null);
    };
    window.speechSynthesis.speak(utterance);
  };

  // Web Speech API Speech-to-Text
  const startDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? " " : "") + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Load chat history on document switch
  useEffect(() => {
    if (!activeDocumentId) {
      setMessages([]);
      return;
    }
    const saved = localStorage.getItem(`chat_history_${activeDocumentId}`);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([]);
    }
  }, [activeDocumentId]);

  // Persist chat history on change and notify sidebar
  useEffect(() => {
    if (activeDocumentId) {
      localStorage.setItem(`chat_history_${activeDocumentId}`, JSON.stringify(messages));
      window.dispatchEvent(new Event("chat_history_updated"));
    }
  }, [messages, activeDocumentId]);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    
    // Live progress callback
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.success) {
            onDocumentLoaded(data.pdf_id, data.filename, data.total_pages);
            setMessages([
              {
                role: "assistant",
                text: `Successfully uploaded and parsed **${data.filename}** (${data.total_pages} pages). You can ask strict document-grounded questions now!`
              }
            ]);
          } else {
            alert(data.detail || "Failed to process PDF file.");
          }
        } catch (err) {
          console.error("JSON parsing error:", err);
          alert("Invalid response from server.");
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          alert(data.detail || `Upload failed with status code ${xhr.status}`);
        } catch {
          alert(`Upload failed with status code ${xhr.status}`);
        }
      }
      setUploading(false);
    };

    xhr.onerror = () => {
      alert("Network error occurred during file upload.");
      setUploading(false);
    };

    xhr.open("POST", `${API_URL}/upload`);
    xhr.withCredentials = true;
    xhr.send(formData);
  };

  const handleDeleteChat = async (index: number) => {
    let userMsgIndex = index;
    let assistantMsgIndex = index + 1;
    
    const userMsg = messages[userMsgIndex];
    if (!userMsg || userMsg.role !== "user") return;
    
    const assistantMsg = messages[assistantMsgIndex];
    
    try {
      await fetch(`${API_URL}/delete_chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdf_id: activeDocumentId,
          question: userMsg.text
        })
      });
    } catch (err) {
      console.error("Failed to delete chat from backend:", err);
    }
    
    setMessages(prev => {
      const list = [...prev];
      if (assistantMsg && assistantMsg.role === "assistant") {
        list.splice(assistantMsgIndex, 1);
      }
      list.splice(userMsgIndex, 1);
      return list;
    });
  };

  const handleSaveAndReload = async (index: number, newText: string) => {
    if (!newText.trim() || streaming) return;
    
    setEditingIndex(null);
    
    // Delete this user question (and response) from database
    const oldMsg = messages[index];
    if (oldMsg) {
      try {
        await fetch(`${API_URL}/delete_chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdf_id: activeDocumentId,
            question: oldMsg.text
          })
        });
      } catch (err) {
        console.error("Failed to delete chat on reload:", err);
      }
    }
    
    // Reset conversation: slice out this turn and all subsequent turns
    const keptMessages = messages.slice(0, index);
    setMessages(keptMessages);
    
    // Set input and programmatically submit
    setInput(newText);
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    }, 50);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeDocumentId || streaming) return;

    const userText = input;
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userText, timestamp: timeStr }]);
    setStreaming(true);

    // Append typing indicator
    setMessages(prev => [...prev, { role: "assistant", text: "", loading: true, timestamp: timeStr }]);

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question: userText, document_id: activeDocumentId }),
      });

      if (!response.ok || !response.body) throw new Error("Failed to stream chat.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let completeText = "";
      let citations: Citation[] = [];

      // Remove loading state
      setMessages(prev => prev.slice(0, -1));

      // Append blank assistant bubble for streaming tokens
      setMessages(prev => [...prev, { role: "assistant", text: "", timestamp: timeStr }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const rawData = line.substring(6).trim();
            if (rawData === "[DONE]") continue;

            const parsed = JSON.parse(rawData);
            if (parsed.type === "token") {
              completeText += parsed.text;
              setMessages(prev => {
                const list = [...prev];
                if (list.length > 0) {
                  list[list.length - 1] = { role: "assistant", text: completeText, timestamp: timeStr };
                }
                return list;
              });
            } else if (parsed.type === "citations") {
              citations = parsed.citations;
              const imageUrls = parsed.image_urls;
              setMessages(prev => {
                const list = [...prev];
                if (list.length > 0) {
                  list[list.length - 1] = { role: "assistant", text: completeText, citations, imageUrls, timestamp: timeStr };
                }
                return list;
              });
            } else if (parsed.type === "error") {
              completeText = parsed.text;
              setMessages(prev => {
                const list = [...prev];
                if (list.length > 0) {
                  list[list.length - 1] = { role: "assistant", text: completeText, timestamp: timeStr };
                }
                return list;
              });
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)] p-6">
      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center px-4 py-8">
            {/* Center Brand Logo */}
            <div className="group cursor-pointer mb-5">
              <svg className="w-14 h-14 shadow-xl shadow-sky-500/10 transition-all duration-500 ease-out group-hover:scale-90" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="url(#logo-grad-center)" />
                <path 
                  d="M16 8l3 5 5 3-5 3-3 5-3-5-5-3 5-3 3-5z" 
                  fill="white" 
                  className="transition-transform origin-center duration-700 ease-out group-hover:rotate-[30deg]" 
                />
                <defs>
                  <linearGradient id="logo-grad-center" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38bdf8" />
                    <stop stopColor="#0284c7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Dynamic Greeting with User Name */}
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2 animate-fade-in">
              {getGreeting()} , {userName}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Start by uploading your documents to chat and extract grounded answers.
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div 
                key={i} 
                className={`flex gap-3 items-start w-full group ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* Action buttons (Left of User Message) */}
                {isUser && (
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 items-center self-center shrink-0">
                    {/* Edit Button */}
                    <button
                      onClick={() => {
                        setEditingIndex(i);
                        setEditText(m.text);
                      }}
                      className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-sky)] hover:bg-[var(--bg-panel)] rounded-xl transition cursor-pointer border border-transparent hover:border-[var(--border-color)] shadow-sm"
                      title="Edit question"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteChat(i)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-panel)] rounded-xl transition cursor-pointer border border-transparent hover:border-[var(--border-color)] shadow-sm"
                      title="Delete question and answer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Bot Icon (Left of Bot Message) */}
                {!isUser && (
                  <div className="h-8.5 w-8.5 shrink-0 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-[var(--accent-sky)] shadow-sm">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096L3 15.094m6.094-1.09L7.5 12m3 0l1.22 4.88m-1.22-4.88L15 9.813M9 3l.813 5.096L15 9m-5.187 0L12 7.5m0 0L9.813 1.5M12 7.5l3-3.5m0 0L21 9" />
                    </svg>
                  </div>
                )}

                {/* Bubble & Timestamp column wrapper */}
                <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[78%] relative`}>
                  {isUser && editingIndex === i ? (
                    /* Inline Editor for Question */
                    <div className="flex flex-col gap-2 bg-[var(--bg-panel)] border border-[var(--border-color)] p-3 rounded-2xl w-80 shadow-md">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-transparent border-0 outline-none text-[var(--text-primary)] text-sm resize-none"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2 border-t border-[var(--border-color)] pt-2 shrink-0">
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="px-2.5 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-xs hover:bg-[var(--bg-panel)] cursor-pointer text-[var(--text-primary)]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveAndReload(i, editText)}
                          className="px-2.5 py-1 bg-[var(--accent-sky)] hover:bg-[var(--accent-sky-hover)] text-white rounded-lg text-xs cursor-pointer font-semibold"
                        >
                          Save & Reload
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Standard Message Bubble */
                    <div 
                      className={`rounded-2xl text-sm shadow-sm transition-all duration-300 relative group ${
                        isUser 
                          ? "bg-[var(--accent-sky)] text-white px-4 py-3" 
                          : m.loading
                            ? "bg-[var(--bg-panel)] border border-[var(--border-color)] px-3 py-2 w-14 flex items-center justify-center min-h-[36px]"
                            : "bg-[var(--bg-panel)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 pr-8"
                      }`}
                    >
                      {/* Speaker controls for TTS (appear only after generation completes) */}
                      {!isUser && !m.loading && !(streaming && i === messages.length - 1) && m.text.trim() !== "" && (
                        <button
                          onClick={() => toggleSpeech(m.text, i)}
                          className={`absolute top-2.5 right-2.5 p-1 rounded-lg transition-all cursor-pointer ${
                            speakingIndex === i
                              ? "opacity-100 text-[var(--accent-sky)] bg-[var(--bg-card)] border border-[var(--border-color)]"
                              : "opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--accent-sky)] hover:bg-[var(--bg-card)]"
                          }`}
                          title={speakingIndex === i ? "Stop speaking" : "Speak answer"}
                        >
                          {speakingIndex === i ? (
                            <svg className="w-3.5 h-3.5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            </svg>
                          )}
                        </button>
                      )}
                      {m.loading ? (
                        <div className="flex items-center gap-1.5 py-1 px-0.5">
                          <span className="h-2 w-2 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="h-2 w-2 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="h-2 w-2 bg-[var(--text-muted)] rounded-full animate-bounce"></span>
                        </div>
                      ) : (
                        <div>
                          <div>{parseMarkdown(m.text, isUser)}</div>
                          
                          {/* Render Extracted PDF Diagrams/Images */}
                          {m.imageUrls && m.imageUrls.length > 0 && (
                            <div className="mt-3.5 space-y-3">
                              {m.imageUrls.map((url, idx) => (
                                <div key={idx} className="relative rounded-xl overflow-hidden border border-[var(--border-color)] bg-black/5 shadow-sm max-w-md">
                                  <img 
                                    src={url} 
                                    alt="Extracted PDF Diagram" 
                                    className="w-full object-contain max-h-64 cursor-zoom-in hover:brightness-95 transition"
                                    onClick={() => window.open(url, "_blank")}
                                  />
                                  <div className="absolute bottom-2 right-2 bg-black/60 text-white font-mono text-[9px] px-2 py-0.5 rounded select-none">
                                    Diagram {idx + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Render Citations as clickable tags */}
                          {m.citations && m.citations.length > 0 && (() => {
                            // Deduplicate cited pages list
                            const uniquePages = m.citations.reduce((acc: Citation[], current) => {
                              const exists = acc.find(item => item.page_number === current.page_number);
                              if (!exists) acc.push(current);
                              return acc;
                            }, []);

                            return (
                              <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex flex-wrap gap-2">
                                <span className="text-[11px] text-[var(--text-muted)] w-full mb-1">Cited Pages:</span>
                                {uniquePages.map((c, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => onCitationClicked(c.page_number, c.text || m.text || "", c.bbox)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-card)] hover:bg-[var(--bg-panel)] border border-[var(--border-color)] hover:border-[var(--border-color-focus)] rounded-lg text-xs text-[var(--text-primary)] font-mono transition cursor-pointer"
                                    title={`Click to open page ${c.page_number} in native PDF viewer`}
                                  >
                                    <svg className="w-3.5 h-3.5 text-[var(--accent-sky)]" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                    </svg>
                                    Page {c.page_number}
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Render Timestamp outside and below dialogue box */}
                  {m.timestamp && !m.loading && !(streaming && i === messages.length - 1) && m.text.trim() !== "" && (
                    <span className="text-[10px] text-[var(--text-muted)] mt-1.5 px-2 select-none font-mono">
                      {m.timestamp}
                    </span>
                  )}
                </div>

                {/* User Icon (Right of User Message) */}
                {isUser && (
                  <div className="h-8.5 w-8.5 shrink-0 rounded-xl bg-[var(--accent-sky)]/10 border border-[var(--accent-sky)]/25 flex items-center justify-center text-[var(--accent-sky)] font-bold text-xs shadow-sm select-none">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={feedEndRef} />
      </div>

      {/* Sleek inline upload progress card above the input bar */}
      {uploading && (
        <div className="w-full max-w-md mx-auto mb-3 p-3 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl shadow-sm flex items-center gap-3.5 animate-pulse">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-sky-500/10 flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-[var(--accent-sky)] animate-bounce" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1 text-[11px] font-medium text-[var(--text-primary)]">
              <span className="truncate">Uploading PDF Manual...</span>
              <span className="font-semibold text-[var(--accent-sky)]">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent-sky)] transition-all duration-350 ease-out" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSend} className="flex items-center gap-3 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl p-2.5 shadow-sm transition-colors duration-300">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] rounded-lg transition cursor-pointer flex items-center justify-center border border-[var(--border-color)] bg-[var(--bg-main)]/50 shrink-0"
          title="Upload Docs (+)"
        >
          {uploading ? (
            <span className="h-5 w-5 border-2 border-[var(--accent-sky)] border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <svg className="w-5 h-5 text-[var(--accent-sky)]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
        
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={activeDocumentId ? "Ask a strict document-grounded question..." : "Upload a PDF manual using the + button to start chatting..."}
          className="flex-1 bg-transparent border-0 outline-none text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] px-2"
          disabled={streaming || !activeDocumentId}
        />

        {/* Mic dictation button */}
        <button
          type="button"
          onClick={startDictation}
          disabled={!activeDocumentId}
          className={`p-2 rounded-lg transition cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
            isListening 
              ? "bg-red-500/10 text-red-500 animate-pulse border border-red-500/20" 
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
          }`}
          title="Voice input"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </button>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!input.trim() || streaming || !activeDocumentId}
          className="p-2 bg-[var(--accent-sky)] hover:bg-[var(--accent-sky-hover)] disabled:bg-[var(--bg-card)] text-white disabled:text-[var(--text-muted)] rounded-lg transition cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
      
      {/* Hidden file input tag */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept=".pdf" 
        onChange={handleUpload} 
        className="hidden" 
      />
    </div>
  );
}
