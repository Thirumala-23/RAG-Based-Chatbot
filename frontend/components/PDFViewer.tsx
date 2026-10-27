"use client";

import React from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

interface PDFViewerProps {
  documentId: string;
  pageNumber: number;
  highlightText?: string;
}

export default function PDFViewer({ documentId, pageNumber, highlightText }: PDFViewerProps) {
  const cleanHighlight = highlightText
    ? highlightText
        .replace(/["']/g, "")
        .split(/\s+/)
        .slice(0, 3)
        .join(" ")
        .trim()
    : "";

  const iframeSrc = cleanHighlight
    ? `${API_URL}/view_pdf/${documentId}?page=${pageNumber}&highlight=${encodeURIComponent(cleanHighlight)}#page=${pageNumber}`
    : `${API_URL}/view_pdf/${documentId}#page=${pageNumber}`;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)]">
      {/* Header Info Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-panel)]/40 text-xs font-semibold text-[var(--text-secondary)] select-none">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--accent-sky)]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
          <span>Embedded PDF Document Viewer</span>
        </div>
        <span className="font-mono text-[10px] bg-[var(--bg-card)] border border-[var(--border-color)] px-2 py-0.5 rounded text-[var(--text-muted)]">
          Target Page: {pageNumber}
        </span>
      </div>

      {/* Embedded Iframe */}
      <div className="flex-1 bg-[var(--bg-main)] overflow-hidden relative">
        <iframe
          key={`${documentId}-${pageNumber}-${cleanHighlight}`}
          src={iframeSrc}
          className="w-full h-full border-none bg-[var(--bg-main)]"
          title="Browser Native PDF Viewer"
        />
      </div>
    </div>
  );
}
