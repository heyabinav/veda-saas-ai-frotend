"use client";

import { useRef, useState } from "react";
import {
  Plus,
  X,
  Image as ImageIcon,
  Paperclip,
  AtSign,
  Wrench,
  ChevronDown,
  ChevronRight,
  Send,
  Square,
  Settings2,
  Maximize2,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  File,
  Sparkles,
} from "lucide-react";
import ApexLogo from "./ApexLogo";
import { MODELS, type ChatMessage, type DiffSummaryLine, type ToolStep } from "./ide-data";

type ApexChatProps = {
  messages: ChatMessage[];
  streaming: boolean;
  onStop: () => void;
  tools: ToolStep[];
  diff: DiffSummaryLine[] | null;
  onAccept: () => void;
  onReject: () => void;
  onReview: () => void;
  onSend: (text: string) => void;
  onNewChat: () => void;
  onExpand: () => void;
  onClose: () => void;
  onToast: (text: string, kind?: "info" | "success" | "error") => void;
  model: string;
  onModelChange: (m: string) => void;
  mode: "auto" | "agent";
  onModeChange: (m: "auto" | "agent") => void;
  mentionFiles: string[];
  suggestions: string[];
  expanded?: boolean;
};

type Chip = { id: string; kind: "file" | "image" | "mention"; name: string };

const toolStateIcon = (state: ToolStep["state"]) => {
  if (state === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />;
  if (state === "done") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  if (state === "error") return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  return <Clock className="h-3.5 w-3.5 text-[#4a5468]" />;
};

export default function ApexChat(props: ApexChatProps) {
  const {
    messages,
    streaming,
    onStop,
    tools,
    diff,
    onAccept,
    onReject,
    onReview,
    onSend,
    onNewChat,
    onExpand,
    onClose,
    onToast,
    model,
    onModelChange,
    mode,
    onModeChange,
    mentionFiles,
    suggestions,
    expanded,
  } = props;

  const [draft, setDraft] = useState("");
  const [chips, setChips] = useState<Chip[]>([]);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [toolsEnabled, setToolsEnabled] = useState(true);
  const [openPop, setOpenPop] = useState<"attach" | "model" | "mention" | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const adjust = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 144)}px`;
  };

  const send = () => {
    const text = draft.trim();
    if (!text || streaming) return;
    setDraft("");
    setChips([]);
    onSend(text);
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 30);
  };

  const addChip = (kind: Chip["kind"], name: string) => {
    setChips((c) => [...c, { id: `${kind}-${Date.now()}`, kind, name }]);
    setOpenPop(null);
  };

  const closePop = () => setOpenPop(null);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0f131b]">
      <header className="flex shrink-0 items-center gap-2 border-b border-[#1d2434] px-3 py-2">
        <ApexLogo size={20} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#e6e9f0]">
            Apex AI
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-emerald-400">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              {streaming ? "Working" : "Online"}
            </span>
          </div>
          <div className="text-[10px] text-[#5b6779]">{model} · reading repository</div>
        </div>
        <button onClick={onNewChat} title="New chat" className="rounded-md p-1.5 text-[#8b93a7] transition-colors hover:bg-[#1a2130] hover:text-white">
          <Plus className="h-4 w-4" />
        </button>
        <div className="relative">
          <button
            onClick={() => setOpenPop(openPop === "model" ? null : "model")}
            title="Select model"
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-[#8b93a7] transition-colors hover:bg-[#1a2130] hover:text-white"
          >
            {model}
            <ChevronDown className={`h-3 w-3 transition-transform ${openPop === "model" ? "rotate-180" : ""}`} />
          </button>
          {openPop === "model" && (
            <PopShell onClose={closePop}>
              <div className="px-2.5 pb-1 pt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#5b6779]">
                Model
              </div>
              {MODELS.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    onModelChange(m);
                    setOpenPop(null);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                    model === m ? "bg-indigo-600/15 text-indigo-200" : "text-[#c6cddb] hover:bg-[#222b3f] hover:text-white"
                  }`}
                >
                  <Sparkles className={`h-3 w-3 ${model === m ? "text-indigo-300" : "text-[#4a5468]"}`} />
                  <span className="flex-1">{m}</span>
                  {model === m && <span className="text-[9.5px] font-bold uppercase tracking-wider text-indigo-300">active</span>}
                </button>
              ))}
            </PopShell>
          )}
        </div>
        <button
          onClick={() => onToast("Apex AI settings are read-only in this preview", "info")}
          title="Settings"
          className="rounded-md p-1.5 text-[#8b93a7] transition-colors hover:bg-[#1a2130] hover:text-white"
        >
          <Settings2 className="h-4 w-4" />
        </button>
        <button onClick={onExpand} title={expanded ? "Exit fullscreen" : "Expand"} className="rounded-md p-1.5 text-[#8b93a7] transition-colors hover:bg-[#1a2130] hover:text-white">
          <Maximize2 className="h-4 w-4" />
        </button>
        <button onClick={onClose} title="Close panel" className="rounded-md p-1.5 text-[#8b93a7] transition-colors hover:bg-[#1a2130] hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="mx-auto max-w-[720px] space-y-4">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-xl rounded-br-sm bg-indigo-600/90 px-3 py-2 text-[12.5px] leading-relaxed text-white">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex gap-2.5">
                <ApexLogo size={22} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#8b93a7]">
                    Apex AI
                    <span className="font-normal normal-case tracking-normal text-[#4a5468]">· {model}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-[#c6cddb]">
                    {m.text}
                    {streaming && messages[messages.length - 1]?.id === m.id && (
                      <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-indigo-400 align-middle" />
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {tools.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-[#1d2434] bg-[#121724]">
              <button
                onClick={() => setToolsOpen((v) => !v)}
                className="flex w-full items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-[#8b93a7] transition-colors hover:bg-[#161d2b]"
              >
                <ChevronRight className={`h-3.5 w-3.5 transition-transform ${toolsOpen ? "rotate-90" : ""}`} />
                <Wrench className="h-3.5 w-3.5" />
                Tools
                <span className="text-[10px] font-normal text-[#4a5468]">
                  {tools.filter((t) => t.state === "done").length}/{tools.length} completed
                </span>
                <span className="ml-auto flex items-center gap-2">
                  {streaming && tools.some((t) => t.state === "running") && (
                    <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                  )}
                </span>
              </button>
              {toolsOpen && (
                <div className="space-y-px border-t border-[#1d2434] px-2 py-1.5">
                  {tools.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[11.5px]">
                      <t.icon className={`h-3.5 w-3.5 shrink-0 ${t.state === "done" ? "text-[#6b7a99]" : "text-[#4a5468]"}`} />
                      <span className={`flex-1 truncate ${t.state === "done" ? "text-[#aab4c5]" : t.state === "running" ? "text-[#e6e9f0]" : "text-[#5b6779]"}`}>
                        {t.label}
                      </span>
                      {toolStateIcon(t.state)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {diff && !streaming && (
            <div className="overflow-hidden rounded-lg border border-indigo-500/25 bg-[#121724]">
              <div className="flex items-center gap-1.5 border-b border-[#1d2434] px-3 py-2 text-[11px] font-semibold text-[#e6e9f0]">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Apex AI modified 2 files
              </div>
              <div className="space-y-0.5 px-3 py-2">
                {diff.map((line, i) => (
                  <div key={i} className="flex items-center gap-2 font-mono text-[11.5px] leading-5">
                    <span
                      className={`w-3 shrink-0 font-bold ${
                        line.sign === "+" ? "text-emerald-400" : line.sign === "-" ? "text-red-400" : "text-amber-400"
                      }`}
                    >
                      {line.sign}
                    </span>
                    <span
                      className={`truncate ${
                        line.sign === "+" ? "text-emerald-300" : line.sign === "-" ? "text-red-300" : "text-amber-200/90"
                      }`}
                    >
                      {line.text}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-[#1d2434] px-3 py-2.5">
                <button
                  onClick={onAccept}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-indigo-500"
                >
                  Accept Changes
                </button>
                <button
                  onClick={onReject}
                  className="rounded-md border border-[#2a3348] px-3 py-1.5 text-[11.5px] font-medium text-[#aab4c5] transition-colors hover:bg-[#1a2130] hover:text-white"
                >
                  Reject
                </button>
                <button
                  onClick={onReview}
                  className="ml-auto text-[11.5px] font-medium text-indigo-300 transition-colors hover:text-indigo-200"
                >
                  Review Diff
                </button>
              </div>
            </div>
          )}

          {messages.length <= 2 && !streaming && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="rounded-full border border-[#1d2434] bg-[#121724] px-3 py-1.5 text-[11.5px] text-[#8b93a7] transition-all hover:border-indigo-500/40 hover:text-indigo-200"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#1d2434] p-3">
        <div className="mx-auto max-w-[720px]">
          {chips.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span
                  key={c.id}
                  className="flex items-center gap-1.5 rounded-md border border-[#2a3348] bg-[#161d2b] px-2 py-1 text-[11px] text-[#aab4c5]"
                >
                  {c.kind === "image" ? (
                    <ImageIcon className="h-3 w-3 text-purple-400" />
                  ) : c.kind === "mention" ? (
                    <AtSign className="h-3 w-3 text-cyan-400" />
                  ) : (
                    <Paperclip className="h-3 w-3 text-indigo-400" />
                  )}
                  {c.name}
                  <button onClick={() => setChips((prev) => prev.filter((x) => x.id !== c.id))} className="text-[#5b6779] hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="rounded-xl border border-[#2a3348] bg-[#121724] transition-colors focus-within:border-indigo-500/50">
            <textarea
              ref={taRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                adjust();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask Apex AI to build, fix, explain, or modify your code..."
              rows={1}
              className="w-full resize-none bg-transparent px-3 pt-3 text-[12.5px] leading-6 text-[#e6e9f0] outline-none placeholder:text-[#5b6779]"
            />
            <div className="flex items-center gap-1 px-2 pb-2 pt-1">
              <div className="relative">
                <button
                  onClick={() => setOpenPop(openPop === "attach" ? null : "attach")}
                  title="Attach"
                  className={`rounded-md p-1.5 transition-colors ${openPop === "attach" ? "bg-[#222b3f] text-white" : "text-[#8b93a7] hover:bg-[#1a2130] hover:text-white"}`}
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                {openPop === "attach" && (
                  <PopShell onClose={closePop}>
                    {[
                      { label: "Upload file", kind: "file" as const, name: "design-spec.pdf" },
                      { label: "Upload image", kind: "image" as const, name: "screenshot.png" },
                      { label: "Paste clipboard", kind: "file" as const, name: "clipboard.txt" },
                    ].map((item) => (
                      <PopItem
                        key={item.label}
                        label={item.label}
                        onClick={() => addChip(item.kind, item.name)}
                      />
                    ))}
                  </PopShell>
                )}
              </div>
              <button
                onClick={() => addChip("image", "screenshot.png")}
                title="Attach image"
                className="rounded-md p-1.5 text-[#8b93a7] transition-colors hover:bg-[#1a2130] hover:text-white"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setOpenPop(openPop === "mention" ? null : "mention")}
                  title="Mention files"
                  className={`rounded-md p-1.5 transition-colors ${openPop === "mention" ? "bg-[#222b3f] text-white" : "text-[#8b93a7] hover:bg-[#1a2130] hover:text-white"}`}
                >
                  <AtSign className="h-4 w-4" />
                </button>
                {openPop === "mention" && (
                  <PopShell onClose={closePop}>
                    <div className="px-2.5 pb-1 pt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#5b6779]">
                      Mention files
                    </div>
                    {mentionFiles.map((f) => (
                      <PopItem key={f} label={f} icon={<File className="h-3 w-3 text-[#8b93a7]" />} onClick={() => addChip("mention", f)} />
                    ))}
                  </PopShell>
                )}
              </div>
              <button
                onClick={() => {
                  setToolsEnabled((v) => !v);
                  onToast(toolsEnabled ? "Tools disabled for next run" : "Tools enabled for next run", "info");
                }}
                title="Toggle tool execution"
                className={`rounded-md p-1.5 transition-colors ${toolsEnabled ? "text-indigo-300" : "text-[#4a5468]"}`}
              >
                <Wrench className="h-4 w-4" />
              </button>
              <div className="flex overflow-hidden rounded-md border border-[#2a3348]">
                {(["auto", "agent"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => onModeChange(m)}
                    className={`px-2 py-1 text-[10.5px] font-semibold capitalize transition-colors ${
                      mode === m ? "bg-indigo-600/90 text-white" : "bg-transparent text-[#8b93a7] hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <span className="ml-auto flex items-center gap-1 text-[10.5px] text-[#4a5468]">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                {model}
              </span>
              {streaming ? (
                <button
                  onClick={onStop}
                  title="Stop generating"
                  className="rounded-full bg-red-500/15 p-2 text-red-400 transition-colors hover:bg-red-500/25"
                >
                  <Square className="h-3.5 w-3.5" fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={send}
                  disabled={!draft.trim()}
                  title="Send (Enter)"
                  className="rounded-full bg-indigo-600 p-2 text-white transition-all hover:bg-indigo-500 disabled:bg-[#222b3f] disabled:text-[#4a5468]"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-[#4a5468]">
            Apex AI can make mistakes — review changes before accepting. Enter to send, Shift+Enter for a new line.
          </p>
        </div>
      </div>
    </div>
  );
}

function PopShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-[60]" onMouseDown={onClose} />
      <div className="absolute bottom-10 left-0 z-[61] w-56 overflow-hidden rounded-lg border border-[#2a3348] bg-[#151a26] p-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        {children}
      </div>
    </>
  );
}

function PopItem({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-[#c6cddb] transition-colors hover:bg-[#222b3f] hover:text-white"
    >
      {icon ?? <File className="h-3 w-3 text-[#8b93a7]" />}
      {label}
    </button>
  );
}