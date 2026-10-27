"use client";

import React, { useState, useEffect } from "react";
import ChatInterface from "./ChatInterface";
import PDFViewer from "./PDFViewer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

interface DocumentItem {
  id: string;
  filename: string;
  totalPages: number;
}

interface SplitWorkspaceProps {
  userName: string;
  onLogout: () => void;
}

export default function SplitWorkspace({ userName, onLogout }: SplitWorkspaceProps) {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [showPdfPanel, setShowPdfPanel] = useState<boolean>(false);
  const [pdfHighlightText, setPdfHighlightText] = useState<string>("");
  
  // Document and History States
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [historyTrigger, setHistoryTrigger] = useState<number>(0);

  // Load uploaded documents from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("uploaded_documents");
    if (saved) {
      const parsed = JSON.parse(saved);
      setDocuments(parsed);
      // Focus the first document if available, but DO NOT open the PDF panel by default
      if (parsed.length > 0) {
        setDocumentId(parsed[0].id);
        setExpandedDocs({ [parsed[0].id]: true });
      }
    }

    // Refresh history when chats change
    const handleHistoryUpdate = () => {
      setHistoryTrigger(prev => prev + 1);
    };
    window.addEventListener("chat_history_updated", handleHistoryUpdate);
    return () => window.removeEventListener("chat_history_updated", handleHistoryUpdate);
  }, []);

  const handleDocumentLoaded = (id: string, filename: string, totalPages: number) => {
    const newDoc = { id, filename, totalPages };
    setDocuments(prev => {
      const updated = [...prev.filter(d => d.id !== id), newDoc];
      localStorage.setItem("uploaded_documents", JSON.stringify(updated));
      return updated;
    });
    setDocumentId(id);
    setExpandedDocs(prev => ({ ...prev, [id]: true }));
  };

  const handleDocumentDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    localStorage.setItem("uploaded_documents", JSON.stringify(updated));
    localStorage.removeItem(`chat_history_${id}`);
    
    if (documentId === id) {
      const nextDoc = updated[0]?.id || null;
      setDocumentId(nextDoc);
    }
  };

  const toggleExpandDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDocs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to extract questions from localStorage history
  const getQuestionsForDocument = (docId: string): Array<{ text: string; page?: number; citationText?: string; bbox?: number[] }> => {
    const saved = localStorage.getItem(`chat_history_${docId}`);
    if (!saved) return [];
    try {
      const messages = JSON.parse(saved);
      const questions: Array<{ text: string; page?: number; citationText?: string; bbox?: number[] }> = [];
      
      messages.forEach((msg: any, idx: number) => {
        if (msg.role === "user") {
          const nextMsg = messages[idx + 1];
          let page: number | undefined;
          let citationText: string | undefined;
          let bbox: number[] | undefined;
          
          if (nextMsg && nextMsg.role === "assistant" && nextMsg.citations && nextMsg.citations.length > 0) {
            page = nextMsg.citations[0].page_number;
            citationText = nextMsg.citations[0].text;
            bbox = nextMsg.citations[0].bbox;
          }
          
          questions.push({ text: msg.text, page, citationText, bbox });
        }
      });
      return questions;
    } catch {
      return [];
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)] font-sans transition-colors duration-300">
      
      {/* 1. Left Sidebar Workspace Tree (20% width) */}
      <div className="w-[20%] h-full flex flex-col bg-[#071d37] border-r border-[#1e293b]/40 text-slate-200 select-none">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-[#1e293b]/40 bg-black/10">
          <svg className="w-7 h-7 shrink-0 shadow-lg shadow-sky-500/10" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#logo-grad-sidebar)" />
            <path d="M16 8l3 5 5 3-5 3-3 5-3-5-5-3 5-3 3-5z" fill="white" />
            <defs>
              <linearGradient id="logo-grad-sidebar" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop stopColor="#0284c7" />
              </linearGradient>
            </defs>
          </svg>
          <span className="font-semibold text-sm tracking-tight truncate text-slate-100">AskVerse</span>
        </header>

        {/* Collapsible Workspace Tree list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Grounded PDF Chatrooms
          </span>
          {documents.length === 0 ? (
            <div className="text-xs text-slate-400 py-4 px-3 border border-dashed border-slate-700 bg-black/20 rounded-xl text-center">
              No active workspaces. Upload a PDF to begin.
            </div>
          ) : (
            documents.map(doc => {
              const questions = getQuestionsForDocument(doc.id);
              const isExpanded = !!expandedDocs[doc.id];
              const isActive = documentId === doc.id;

              return (
                <div key={doc.id} className="space-y-1 group">
                  {/* Document Node */}
                  <div
                    onClick={() => {
                      setDocumentId(doc.id);
                      setExpandedDocs(prev => ({ ...prev, [doc.id]: true }));
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                      isActive 
                        ? "bg-[#0b2b4e] border-sky-500/50 text-white shadow-sm" 
                        : "border-transparent text-slate-300 hover:bg-[#0b2b4e]/50 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <button 
                        onClick={(e) => toggleExpandDoc(doc.id, e)}
                        className="p-0.5 text-slate-400 hover:text-white transition"
                      >
                        <svg 
                           className={`w-3 h-3 transform transition-transform ${isExpanded ? "rotate-90" : ""}`} 
                          fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                      <svg className="w-4 h-4 text-sky-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span className="truncate" title={doc.filename}>{doc.filename}</span>
                    </div>
                    <button
                      onClick={(e) => handleDocumentDelete(doc.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-red-400 p-1 text-slate-400 rounded transition shrink-0 cursor-pointer font-bold text-sm leading-none"
                      title="Delete Workspace"
                    >
                      &times;
                    </button>
                  </div>
 
                  {/* Collapsible Questions List */}
                  {isExpanded && questions.length > 0 && (
                    <div className="pl-5 border-l border-slate-700 ml-4.5 space-y-1.5 pt-1">
                      {questions.map((q, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setDocumentId(doc.id);
                            if (q.page) {
                              setPdfPage(q.page);
                              setPdfHighlightText(q.citationText || q.text);
                              setShowPdfPanel(true);
                            }
                          }}
                          className="px-2.5 py-1.5 text-[10px] text-slate-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer truncate transition font-normal"
                          title={q.text}
                        >
                          ? {q.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer / Logout */}
        <footer className="p-4 border-t border-[#1e293b]/40 bg-black/10 mt-auto">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/35 rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Logout
          </button>
        </footer>
      </div>

      {/* 2. Middle Chat & Controls Pane */}
      <div className={`flex flex-col h-full border-r border-[var(--border-color)] transition-all duration-300 ${
        showPdfPanel && documentId ? "w-[40%]" : "w-[80%]"
      }`}>
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-panel)]">
          <div className="flex items-center gap-2 overflow-hidden mr-4">
            {documentId ? (
              <span className="text-xs text-[var(--text-secondary)] font-medium truncate">
                PDF has been uploaded and conversing with{" "}
                <button
                  onClick={() => {
                    setPdfPage(1);
                    setShowPdfPanel(true);
                  }}
                  className="text-[var(--accent-sky)] font-semibold hover:underline cursor-pointer focus:outline-none"
                >
                  {documents.find(d => d.id === documentId)?.filename}
                </button>
              </span>
            ) : (
              <span className="text-xs text-[var(--text-muted)] font-medium">
                No active document
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2.5 shrink-0">
            {documentId && (
              <button
                onClick={() => setShowPdfPanel(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-panel)] text-xs text-[var(--text-primary)] font-semibold transition cursor-pointer select-none"
                title={showPdfPanel ? "Collapse PDF Viewer" : "Expand PDF Viewer"}
              >
                <svg className="w-4 h-4 text-[var(--accent-sky)]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  {showPdfPanel ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5L2.25 12m0 0l6.75 6.75M2.25 12h18.75" />
                  )}
                </svg>
                {showPdfPanel ? "Hide PDF" : "Show PDF"}
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          <ChatInterface 
            onDocumentLoaded={handleDocumentLoaded}
            onCitationClicked={(page, text) => {
              setPdfPage(page);
              setPdfHighlightText(text);
              setShowPdfPanel(true);
            }}
            activeDocumentId={documentId}
            userName={userName}
          />
        </div>
      </div>

      {/* 3. Right Embedded Native PDF Pane */}
      {showPdfPanel && documentId && (
        <div className="w-[40%] h-full flex flex-col bg-[var(--bg-main)]">
          <PDFViewer 
            documentId={documentId} 
            pageNumber={pdfPage} 
            highlightText={pdfHighlightText} 
          />
        </div>
      )}
    </div>
  );
}
