"use client";

import { useState } from "react";
import {
  FolderOpen,
  GitBranch,
  Plus,
  Globe,
  Loader2,
  X,
  Command,
  ArrowRight,
} from "lucide-react";
import ApexLogo from "./ApexLogo";

const SHORTCUTS = [
  { keys: ["Ctrl", "Shift", "P"], label: "Command Palette" },
  { keys: ["Ctrl", "P"], label: "Go to File" },
  { keys: ["Ctrl", "B"], label: "Toggle Explorer" },
  { keys: ["Ctrl", "J"], label: "Toggle AI Panel" },
  { keys: ["Ctrl", "S"], label: "Save File" },
  { keys: ["Ctrl", "`"], label: "Open Terminal" },
];

export default function WelcomeScreen({
  busy,
  onAction,
  onClone,
  onOpenTerminalHint,
}: {
  busy: "open" | "clone" | "create" | "remote" | null;
  onAction: (action: "open" | "clone" | "create" | "remote") => void;
  onClone: (url: string) => void;
  onOpenTerminalHint: () => void;
}) {
  const [cloneUrl, setCloneUrl] = useState("https://github.com/veda/apex-starter.git");

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-y-auto bg-[#0d1017] px-6">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#2a3348] bg-[#131826] shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
          <ApexLogo size={40} />
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-[#e6e9f0]">Welcome to ApexCode</h1>
        <p className="mt-1.5 text-[13.5px] text-[#8b93a7]">Your AI-powered development workspace.</p>

        <div className="mt-8 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center">
          <PrimaryAction
            icon={FolderOpen}
            label="Open Folder"
            busy={busy === "open"}
            onClick={() => onAction("open")}
          />
          <PrimaryAction
            icon={GitBranch}
            label="Clone Repository"
            busy={busy === "clone"}
            onClick={() => onAction("clone")}
          />
          <PrimaryAction
            icon={Plus}
            label="Create Project"
            busy={busy === "create"}
            onClick={() => onAction("create")}
          />
        </div>

        <button
          onClick={() => onAction("remote")}
          className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-indigo-300 transition-colors hover:text-indigo-200"
        >
          <Globe className="h-3.5 w-3.5" />
          Connect Remote Workspace
          <ArrowRight className="h-3 w-3" />
        </button>

        <div className="mx-auto mt-10 max-w-md rounded-xl border border-[#1d2434] bg-[#11151f] p-4">
          <div className="mb-2.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#5b6779]">
            <Command className="h-3 w-3" />
            Keyboard shortcuts
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            {SHORTCUTS.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-2 text-left">
                <span className="truncate text-[11.5px] text-[#aab4c5]">{s.label}</span>
                <span className="flex shrink-0 items-center gap-1">
                  {s.keys.map((k) => (
                    <kbd
                      key={k}
                      onClick={s.label === "Open Terminal" ? onOpenTerminalHint : undefined}
                      className="cursor-default rounded border border-[#2a3348] bg-[#0d1017] px-1.5 py-0.5 text-[9.5px] text-[#8b93a7]"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-[10.5px] text-[#4a5468]">ApexCode 3.0 · preview build · dark mode</p>
      </div>

      {busy === "clone" && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onAction("create")} />
          <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-[#2a3348] bg-[#131826] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between border-b border-[#1d2434] px-4 py-3">
              <h2 className="text-[13px] font-semibold text-[#e6e9f0]">Clone Repository</h2>
              <button onClick={() => onAction("create")} className="rounded-md p-1 text-[#8b93a7] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#5b6779]">
                Repository URL
              </label>
              <input
                value={cloneUrl}
                onChange={(e) => setCloneUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && cloneUrl.trim()) onClone(cloneUrl.trim());
                }}
                className="w-full rounded-lg border border-[#2a3348] bg-[#0d1017] px-3 py-2 text-[12.5px] text-[#e6e9f0] outline-none focus:border-indigo-500/60"
                placeholder="https://github.com/user/repo.git"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => onAction("create")}
                  className="rounded-md border border-[#2a3348] px-3 py-1.5 text-[12px] text-[#aab4c5] hover:bg-[#1a2130] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onClone(cloneUrl.trim())}
                  disabled={!cloneUrl.trim()}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  Clone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {busy === "remote" && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onAction("create")} />
          <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-[#2a3348] bg-[#131826] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between border-b border-[#1d2434] px-4 py-3">
              <h2 className="text-[13px] font-semibold text-[#e6e9f0]">Connect Remote Workspace</h2>
              <button onClick={() => onAction("create")} className="rounded-md p-1 text-[#8b93a7] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-[12px] leading-relaxed text-[#aab4c5]">
                Connect to a remote workspace over SSH or a codespace URL. ApexCode keeps your files, AI context and
                tooling in sync.
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => onAction("create")}
                  className="rounded-md border border-[#2a3348] px-3 py-1.5 text-[12px] text-[#aab4c5] hover:bg-[#1a2130] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onAction("remote")}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-indigo-500"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PrimaryAction({
  icon: Icon,
  label,
  busy,
  onClick,
}: {
  icon: typeof FolderOpen;
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#2a3348] bg-[#131826] px-4 py-2.5 text-[12.5px] font-medium text-[#e6e9f0] transition-all hover:border-indigo-500/50 hover:bg-[#161d2b] disabled:opacity-70 sm:w-auto"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin text-indigo-400" /> : <Icon className="h-4 w-4 text-indigo-300" />}
      {busy ? "Loading..." : label}
    </button>
  );
}