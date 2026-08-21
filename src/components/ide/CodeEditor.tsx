"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Sparkles, Wand2, Loader2 } from "lucide-react";
import {
  tokenizeLine,
  computeFoldRanges,
  firstTokenColor,
  INTELLISENSE,
  type FileMarker,
} from "./ide-data";

const LINE_H = 20;
const CH_W = 8;
const PAD_L = 16;

type Row = { type: "line"; index: number } | { type: "fold"; start: number; end: number };

function buildRows(folded: Set<number>, ranges: Array<[number, number]>, maxIndex: number): Row[] {
  const rows: Row[] = [];
  let i = 0;
  while (i < maxIndex) {
    const fold = ranges.find(([s]) => s === i && folded.has(s));
    if (fold) {
      rows.push({ type: "fold", start: fold[0], end: fold[1] });
      i = Math.min(fold[1] + 1, maxIndex);
    } else {
      rows.push({ type: "line", index: i });
      i += 1;
    }
  }
  return rows;
}

export default function CodeEditor({
  path,
  content,
  markers,
  activeLine,
  onCursorChange,
  onEdit,
  onRequestAi,
  showMinimap,
  loading,
}: {
  path: string;
  content: string;
  markers: FileMarker[];
  activeLine: number;
  onCursorChange: (line: number, col: number) => void;
  onEdit: (content: string) => void;
  onRequestAi: (action: "explain" | "fix" | "refactor" | "generate" | "test") => void;
  showMinimap: boolean;
  loading: boolean;
}) {
  const lines = useMemo(() => content.split("\n"), [content]);
  const tokenized = useMemo(() => lines.map((l) => tokenizeLine(l)), [lines]);
  const ranges = useMemo(() => computeFoldRanges(lines), [lines]);
  const [folded, setFolded] = useState<Set<number>>(new Set());
  const rows = useMemo(() => buildRows(folded, ranges, lines.length), [folded, ranges, lines.length]);
  const gutterRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const caretRef = useRef<number | null>(null);
  const [intel, setIntel] = useState<{
    x: number;
    y: number;
    items: string[];
    index: number;
    wordStart: number;
    wordLen: number;
  } | null>(null);

  const maxChars = useMemo(() => Math.max(...lines.map((l) => l.length), 1), [lines]);
  const codeWidth = maxChars * CH_W + PAD_L + 16;
  const contentHeight = lines.length * LINE_H;
  const markerMap = useMemo(() => {
    const m = new Map<number, FileMarker>();
    markers.forEach((mk) => m.set(mk.line, mk));
    return m;
  }, [markers]);

  const lineColAt = (sel: number): { line: number; col: number } => {
    let line = 0;
    let col = sel;
    let idx = content.indexOf("\n");
    while (idx !== -1 && idx < sel) {
      line += 1;
      col = sel - idx - 1;
      idx = content.indexOf("\n", idx + 1);
    }
    return { line, col };
  };

  useEffect(() => {
    const ta = taRef.current;
    if (ta && caretRef.current !== null) {
      ta.focus();
      ta.setSelectionRange(caretRef.current, caretRef.current);
      caretRef.current = null;
    }
  }, [content]);

  const reportCursor = (ta: HTMLTextAreaElement) => {
    const { line, col } = lineColAt(ta.selectionStart);
    onCursorChange(line + 1, col + 1);
  };

  const openIntel = (ta: HTMLTextAreaElement) => {
    const sel = ta.selectionStart;
    const before = content.slice(0, sel);
    const match = before.match(/[a-zA-Z_$][\w$]*$/);
    const wordStart = match ? sel - match[0].length : sel;
    const prefix = match ? match[0] : "";
    const all = INTELLISENSE[path] ?? [];
    const items = all.filter((s) => s.toLowerCase().includes(prefix.toLowerCase()));
    if (items.length === 0) {
      setIntel(null);
      return;
    }
    const { line, col } = lineColAt(sel);
    setIntel({
      x: PAD_L + col * CH_W,
      y: line * LINE_H + LINE_H + 4,
      items,
      index: 0,
      wordStart,
      wordLen: sel - wordStart,
    });
  };

  const selectIntel = () => {
    if (!intel) return;
    const ta = taRef.current;
    if (!ta) return;
    const item = intel.items[intel.index];
    const next = content.slice(0, intel.wordStart) + item + content.slice(intel.wordStart + intel.wordLen);
    caretRef.current = intel.wordStart + item.length;
    onEdit(next);
    setIntel(null);
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-2.5 bg-white p-5">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="h-[13px] animate-pulse rounded-sm"
            style={{
              width: `${40 + ((i * 37) % 55)}%`,
              background: i % 3 === 0 ? "#f1f5f9" : "#e2e8f0",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 bg-white text-[13px] font-mono">
      <div
        ref={gutterRef}
        className="w-12 shrink-0 overflow-hidden select-none border-r border-[#e2e8f0] bg-white text-right"
      >
        <div style={{ height: contentHeight }}>
          {rows.map((row) =>
            row.type === "line" ? (
              <div
                key={row.index}
                className={`relative flex h-[20px] items-center justify-end pr-1.5 text-[11px] leading-[20px] ${
                  activeLine === row.index + 1 ? "bg-[#e0e7ff] text-[#1e293b]" : "text-[#94a3b8]"
                }`}
              >
                {ranges.some(([s]) => s === row.index) && (
                  <button
                    onClick={() => {
                      const r = ranges.find(([s]) => s === row.index);
                      if (!r) return;
                      setFolded((prev) => {
                        const next = new Set(prev);
                        if (next.has(row.index)) next.delete(row.index);
                        else next.add(row.index);
                        return next;
                      });
                    }}
                    className="absolute left-0 top-0 flex h-full w-4 items-center justify-center text-[#94a3b8] hover:text-[#1e293b]"
                  >
                    <ChevronRight className={`h-3 w-3 transition-transform ${folded.has(row.index) ? "rotate-90" : ""}`} />
                  </button>
                )}
                <span>{row.index + 1}</span>
                {markerMap.has(row.index + 1) && (
                  <span
                    title={markerMap.get(row.index + 1)?.message}
                    className={`absolute right-0.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${
                      markerMap.get(row.index + 1)?.type === "error" ? "bg-red-500" : "bg-amber-400"
                    }`}
                  />
                )}
              </div>
            ) : (
              <button
                key={`fold-${row.start}`}
                onClick={() =>
                  setFolded((prev) => {
                    const next = new Set(prev);
                    next.delete(row.start);
                    return next;
                  })
                }
                className="flex h-[20px] w-full items-center gap-1 pl-3 text-left text-[11px] leading-[20px] text-[#94a3b8] hover:text-[#1e293b]"
              >
                <ChevronRight className="h-3 w-3 rotate-90 text-[#94a3b8]" />
                {row.end - row.start + 1} lines folded
              </button>
            )
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
        }}
        className="relative min-w-0 flex-1 overflow-auto"
      >
        <pre
          className="pointer-events-none absolute left-0 top-0 z-0 m-0 whitespace-pre"
          style={{ width: codeWidth, height: contentHeight, paddingLeft: PAD_L, fontSize: 13, lineHeight: `${LINE_H}px` }}
        >
          {rows.map((row) =>
            row.type === "line" ? (
              <div
                key={row.index}
                className={activeLine === row.index + 1 ? "bg-[#e0e7ff]" : ""}
              >
                {tokenized[row.index].map((t, i) => (
                  <span key={i} style={{ color: t.color }}>
                    {t.text || " "}
                  </span>
                ))}
                {tokenized[row.index].length === 0 ? "\u00A0" : null}
              </div>
            ) : (
              <div key={`fold-${row.start}`} className="text-[#94a3b8]">
                {"\u00A0\u00A0\u00A0\u00A0"}({row.end - row.start + 1} lines hidden)
              </div>
            )
          )}
        </pre>
        {folded.size === 0 && (
          <textarea
            ref={taRef}
            value={content}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            wrap="off"
            onChange={(e) => onEdit(e.target.value)}
            onKeyDown={(e) => {
              const ta = e.currentTarget;
              if (intel) {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  setIntel((prev) =>
                    prev ? { ...prev, index: (prev.index + (e.key === "ArrowDown" ? 1 : -1) + prev.items.length) % prev.items.length } : prev
                  );
                  return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  selectIntel();
                  return;
                }
                if (e.key === "Escape") {
                  setIntel(null);
                  return;
                }
              }
              if (e.key === "Tab") {
                e.preventDefault();
                const sel = ta.selectionStart;
                const next = content.slice(0, sel) + "  " + content.slice(ta.selectionEnd);
                caretRef.current = sel + 2;
                onEdit(next);
                return;
              }
              if (e.key.length === 1 && /[a-zA-Z.]/.test(e.key)) {
                const sel = ta.selectionStart;
                const before = content.slice(0, sel);
                const match = before.match(/[a-zA-Z_$][\w$]*$/);
                const word = match ? match[0] : "";
                if (e.key === "." || word.length >= 2) {
                  openIntel(ta);
                } else {
                  setIntel(null);
                }
              }
            }}
            onKeyUp={(e) => reportCursor(e.currentTarget)}
            onClick={(e) => reportCursor(e.currentTarget)}
            onBlur={() => {
              if (intel) setTimeout(() => setIntel(null), 120);
            }}
            className="absolute left-0 top-0 z-10 resize-none overflow-hidden whitespace-pre border-0 bg-transparent text-transparent caret-[#4f46e5] outline-none"
            style={{
              width: codeWidth,
              height: contentHeight,
              paddingLeft: PAD_L,
              fontSize: 13,
              lineHeight: `${LINE_H}px`,
              fontFamily: "inherit",
            }}
          />
        )}
        {intel && (
          <div
            className="absolute z-30 w-72 overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.15)]"
            style={{ left: Math.min(intel.x, 240), top: intel.y }}
          >
            <div className="flex items-center gap-1.5 border-b border-[#e2e8f0] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              Apex IntelliSense
            </div>
            {intel.items.map((item, i) => (
              <button
                key={item}
                onClick={() => selectIntel()}
                onMouseEnter={() => setIntel((prev) => (prev ? { ...prev, index: i } : prev))}
                className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12.5px] transition-colors ${
                  i === intel.index ? "bg-[#f1f5f9] text-[#1e293b]" : "text-[#64748b]"
                }`}
              >
                <Wand2 className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                <span className="flex-1 truncate">{item}</span>
                <span className="text-[10px] text-[#94a3b8]">identifier</span>
              </button>
            ))}
            <div className="flex items-center justify-between border-t border-[#e2e8f0] px-2.5 py-1 text-[10px] text-[#94a3b8]">
              <span>{intel.items.length} suggestions</span>
              <span className="flex items-center gap-1">
                <Loader2 className="h-2.5 w-2.5 animate-spin" /> Apex
              </span>
            </div>
          </div>
        )}
      </div>

      {showMinimap && (
        <div
          className="relative w-14 shrink-0 cursor-pointer overflow-hidden border-l border-[#e2e8f0] bg-[#f8fafc]"
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const line = Math.floor(y / 4);
            if (scrollRef.current) scrollRef.current.scrollTop = line * LINE_H - 150;
          }}
        >
          <div style={{ height: lines.length * 4 }}>
            {lines.map((line, i) => {
              const mk = markerMap.get(i + 1);
              const color = mk ? (mk.type === "error" ? "#f87171" : "#fbbf24") : firstTokenColor(line);
              return (
                <div
                  key={i}
                  className="mx-[3px] rounded-[1px]"
                  style={{ height: 3, marginBottom: 1, background: color, opacity: activeLine === i + 1 ? 1 : 0.75 }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}