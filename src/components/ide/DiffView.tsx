"use client";

import { useState } from "react";
import { X, Check, XCircle, GitPullRequest } from "lucide-react";
import type { DiffFile } from "./ide-data";

export default function DiffView({
  files,
  onAccept,
  onReject,
  onClose,
}: {
  files: DiffFile[];
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}) {
  const [active, setActive] = useState(0);
  const file = files[Math.min(active, files.length - 1)];
  const adds = files.reduce((n, f) => n + f.lines.filter((l) => l.sign === "+").length, 0);
  const removes = files.reduce((n, f) => n + f.lines.filter((l) => l.sign === "-").length, 0);
  const mods = files.reduce((n, f) => n + f.lines.filter((l) => l.sign === "~").length, 0);

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[#2a3348] bg-[#0f131b] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
        <header className="flex shrink-0 items-center gap-2 border-b border-[#1d2434] px-4 py-3">
          <GitPullRequest className="h-4 w-4 text-indigo-400" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[13px] font-semibold text-[#e6e9f0]">Review Diff — Apex AI</h2>
            <p className="text-[11px] text-[#5b6779]">
              {files.length} files changed · {adds} insertions · {removes} deletions · {mods} modified
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-[#8b93a7] transition-colors hover:bg-[#1a2130] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex shrink-0 gap-1 border-b border-[#1d2434] px-3 pt-2">
          {files.map((f, i) => (
            <button
              key={f.path}
              onClick={() => setActive(i)}
              className={`flex items-center gap-1.5 rounded-t-md px-3 py-1.5 text-[11.5px] transition-colors ${
                i === active ? "border border-b-0 border-[#2a3348] bg-[#0d1017] text-[#e6e9f0]" : "text-[#8b93a7] hover:text-white"
              }`}
            >
              <span className="font-mono text-[10px]">{f.path.split(".").pop()}</span>
              {f.path.split("/").pop()}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-[#0d1017] py-2 font-mono text-[12px]">
          <div className="px-3 pb-1 text-[10.5px] font-semibold text-[#5b6779]">
            {file.path}
          </div>
          {file.lines.map((line, i) => (
            <div
              key={i}
              className={`flex items-stretch whitespace-pre leading-[20px] ${
                line.sign === "+"
                  ? "bg-emerald-500/[0.07]"
                  : line.sign === "-"
                    ? "bg-red-500/[0.07]"
                    : line.sign === "~"
                      ? "bg-amber-500/[0.07]"
                      : ""
              }`}
            >
              <span
                className={`w-7 shrink-0 select-none pr-2 text-right font-bold ${
                  line.sign === "+"
                    ? "text-emerald-400"
                    : line.sign === "-"
                      ? "text-red-400"
                      : line.sign === "~"
                        ? "text-amber-400"
                        : "text-[#39445a]"
                }`}
              >
                {line.sign}
              </span>
              <span
                className={`truncate ${
                  line.sign === "+"
                    ? "text-emerald-200"
                    : line.sign === "-"
                      ? "text-red-200"
                      : line.sign === "~"
                        ? "text-amber-100"
                        : "text-[#9aa4b5]"
                }`}
              >
                {line.text || " "}
              </span>
            </div>
          ))}
        </div>

        <footer className="flex shrink-0 items-center gap-2 border-t border-[#1d2434] px-4 py-3">
          <button
            onClick={onAccept}
            className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            <Check className="h-3.5 w-3.5" />
            Accept Changes
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 rounded-md border border-[#2a3348] px-3.5 py-1.5 text-[12px] font-medium text-[#aab4c5] transition-colors hover:bg-[#1a2130] hover:text-white"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject All
          </button>
          <span className="ml-auto text-[11px] text-[#5b6779]">
            Changes apply to the working tree — commit when ready.
          </span>
        </footer>
      </div>
    </div>
  );
}