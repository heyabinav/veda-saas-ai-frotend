"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Search, Command, File, ArrowRight } from "lucide-react";

export type CommandDef = {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  keywords?: string;
};

export default function CommandPalette({
  mode,
  commands,
  files,
  onRunCommand,
  onOpenFile,
  onClose,
}: {
  mode: "commands" | "files" | null;
  commands: CommandDef[];
  files: string[];
  onRunCommand: (id: string) => void;
  onOpenFile: (path: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const open = mode !== null;

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (mode === "files") {
      if (!q) return files;
      return files.filter((f) => f.toLowerCase().includes(q));
    }
    if (!q) return commands;
    return commands.filter((c) => (c.label + " " + (c.keywords ?? "")).toLowerCase().includes(q));
  }, [mode, query, commands, files]);

  const isCommands = mode === "commands";

  const run = (item: string | CommandDef) => {
    if (isCommands) onRunCommand((item as CommandDef).id);
    else onOpenFile(item as string);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[16vh]">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[#2a3348] bg-[#131826] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2.5 border-b border-[#1d2434] px-4 py-3">
          {isCommands ? (
            <Command className="h-4 w-4 text-indigo-400" />
          ) : (
            <File className="h-4 w-4 text-[#8b93a7]" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && items.length > 0) run(items[0]);
            }}
            placeholder={isCommands ? "Type a command or search..." : "Go to file..."}
            className="w-full bg-transparent text-[13.5px] text-[#e6e9f0] outline-none placeholder:text-[#5b6779]"
          />
          <kbd className="rounded border border-[#2a3348] bg-[#0d1017] px-1.5 py-0.5 text-[10px] text-[#8b93a7]">esc</kbd>
        </div>
        <div className="max-h-[46vh] overflow-y-auto p-1.5">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12px] text-[#5b6779]">No results found</div>
          ) : (
            items.map((item, i) => {
              const cmd = isCommands ? (item as CommandDef) : null;
              const label = cmd ? cmd.label : (item as string);
              const key = cmd ? cmd.id : (item as string);
              return (
                <button
                  key={key}
                  onClick={() => run(item)}
                  className={`group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[12.5px] transition-colors ${
                    i === 0 ? "bg-[#222b3f] text-white" : "text-[#aab4c5] hover:bg-[#1a2130] hover:text-white"
                  }`}
                >
                  {cmd ? (
                    <cmd.icon className="h-3.5 w-3.5 shrink-0 text-[#8b93a7]" />
                  ) : (
                    <File className="h-3.5 w-3.5 shrink-0 text-[#8b93a7]" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {cmd?.shortcut ? (
                    <kbd className="shrink-0 rounded border border-[#2a3348] bg-[#0d1017] px-1.5 py-0.5 text-[9.5px] text-[#8b93a7]">
                      {cmd.shortcut}
                    </kbd>
                  ) : (
                    !cmd && (
                      <ArrowRight className="h-3 w-3 shrink-0 text-[#4a5468] opacity-0 transition-opacity group-hover:opacity-100" />
                    )
                  )}
                </button>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between border-t border-[#1d2434] px-4 py-2 text-[10px] text-[#5b6779]">
          <span className="flex items-center gap-1">
            <Search className="h-3 w-3" />
            {items.length} {items.length === 1 ? "result" : "results"}
          </span>
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[#2a3348] bg-[#0d1017] px-1 py-px">↑</kbd>
              <kbd className="rounded border border-[#2a3348] bg-[#0d1017] px-1 py-px">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[#2a3348] bg-[#0d1017] px-1 py-px">↵</kbd>
              select
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}