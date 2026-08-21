"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { AnimatePresence, motion } from "framer-motion";
import {
  GitBranch,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Wifi,
  Columns2,
  Map,
  PanelLeft,
  PanelRight,
  Plus,
  Search,
  MoreHorizontal,
  Settings,
  User,
  Blocks,
  ChevronsUpDown,
  Sparkles,
  Wrench,
  Shuffle,
  Wand2,
  FlaskConical,
  X,
  Check,
  GitPullRequest,
  Terminal,
  Save,
  Command,
  FileCode,
  FilePlus2,
  FolderPlus,
  ChevronRight,
  Loader2,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Info,
  FolderOpen,
} from "lucide-react";
import ApexLogo from "@/components/ide/ApexLogo";
import FileTree from "@/components/ide/FileTree";
import CodeEditor from "@/components/ide/CodeEditor";
import ApexChat from "@/components/ide/ApexChat";
import DiffView from "@/components/ide/DiffView";
import CommandPalette, { type CommandDef } from "@/components/ide/CommandPalette";
import WelcomeScreen from "@/components/ide/WelcomeScreen";
import {
  SAMPLE_TREE,
  FILE_CONTENTS,
  FILE_MARKERS,
  AI_TOOL_STEPS,
  READ_TOOL_STEPS,
  DIFF_SUMMARY,
  DIFF_FILES,
  MODELS,
  WORKSPACES,
  SUGGESTIONS,
  type FileNode,
  type FileMarker,
  type ChatMessage,
  type ToolStep,
  type DiffSummaryLine,
  type DiffFile,
  type Toast,
} from "@/components/ide/ide-data";

const uid = () => Math.random().toString(36).slice(2, 10);

const INITIAL_EXPANDED = new Set([
  "vedaapex",
  "vedaapex/src",
  "vedaapex/src/app",
  "vedaapex/src/components",
  "vedaapex/src/lib",
  "vedaapex/public",
]);

function collectFiles(nodes: FileNode[]): string[] {
  const out: string[] = [];
  const walk = (list: FileNode[]) => {
    list.forEach((n) => {
      if (n.type === "file") out.push(n.path);
      else if (n.children) walk(n.children);
    });
  };
  walk(nodes);
  return out;
}

function sortNodes(nodes: FileNode[]): FileNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function addNode(nodes: FileNode[], parentPath: string | null, node: FileNode): FileNode[] {
  return nodes.map((n) => {
    if (parentPath === null && n.path === "vedaapex" && n.type === "folder") {
      return { ...n, children: sortNodes([...(n.children ?? []), node]) };
    }
    if (n.path === parentPath && n.type === "folder") {
      return { ...n, children: sortNodes([...(n.children ?? []), node]) };
    }
    if (n.children) return { ...n, children: addNode(n.children, parentPath, node) };
    return n;
  });
}

function removeNode(nodes: FileNode[], path: string): FileNode[] {
  return nodes
    .filter((n) => n.path !== path)
    .map((n) => (n.children ? { ...n, children: removeNode(n.children, path) } : n));
}

function renameNode(nodes: FileNode[], path: string, newName: string): FileNode[] {
  return nodes.map((n) => {
    if (n.path === path) {
      const parent = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
      const newPath = parent ? `${parent}/${newName}` : newName;
      const children = n.children
        ? n.children.map((c) => renamePath(c, path, newPath))
        : n.children;
      return { ...n, name: newName, path: newPath, children };
    }
    if (n.children) return { ...n, children: renameNode(n.children, path, newName) };
    return n;
  });
}

function renamePath(node: FileNode, oldPrefix: string, newPrefix: string): FileNode {
  const newPath = node.path.startsWith(oldPrefix)
    ? newPrefix + node.path.slice(oldPrefix.length)
    : node.path;
  return {
    ...node,
    path: newPath,
    children: node.children ? node.children.map((c) => renamePath(c, oldPrefix, newPrefix)) : node.children,
  };
}

export default function IdePage() {
  const [projectOpen, setProjectOpen] = useState(true);
  const [opening, setOpening] = useState<"open" | "clone" | "create" | "remote" | null>(null);
  const [tree, setTree] = useState<FileNode[]>(SAMPLE_TREE);
  const [content, setContent] = useState<Record<string, string>>(FILE_CONTENTS);
  const [markers, setMarkers] = useState<Record<string, FileMarker[]>>(FILE_MARKERS);
  const [modified, setModified] = useState<Set<string>>(new Set(["vedaapex/src/app/globals.css"]));
  const [untracked, setUntracked] = useState<Set<string>>(new Set(["vedaapex/public/favicon.svg"]));
  const [openTabs, setOpenTabs] = useState<string[]>(["vedaapex/src/app/page.tsx"]);
  const [activePath, setActivePath] = useState<string | null>("vedaapex/src/app/page.tsx");
  const [expanded, setExpanded] = useState<Set<string>>(INITIAL_EXPANDED);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [editorLoading, setEditorLoading] = useState<string | null>(null);
  const [split, setSplit] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [explorerVisible, setExplorerVisible] = useState(true);
  const [aiVisible, setAiVisible] = useState(true);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [mobileExplorer, setMobileExplorer] = useState(false);
  const [mobileAi, setMobileAi] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState("vedaapex");
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [explorerMoreOpen, setExplorerMoreOpen] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [paletteMode, setPaletteMode] = useState<"commands" | "files" | null>(null);
  const [model, setModel] = useState("Apex 2.1");
  const [mode, setMode] = useState<"auto" | "agent">("auto");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      text: "Hi! I'm Apex AI, your coding agent for vedaapex. I can build, fix, explain, refactor, or test code in this workspace. What should we work on?",
    },
  ]);
  const [streaming, setStreaming] = useState(false);
  const [tools, setTools] = useState<ToolStep[]>([]);
  const [diff, setDiff] = useState<DiffSummaryLine[] | null>(null);
  const [diffFiles, setDiffFiles] = useState<DiffFile[] | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [busy, setBusy] = useState<"open" | "clone" | "create" | "remote" | null>(null);

  const flowToken = useRef(0);
  const timers = useRef<number[]>([]);
  const typingTimer = useRef<number | null>(null);
  const handlers = useRef<Record<string, () => void>>({});

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, ms);
    timers.current.push(id);
    return id;
  };

  const toast = (text: string, kind: Toast["kind"] = "info") => {
    const id = uid();
    setToasts((t) => [...t, { id, kind, text }]);
    schedule(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };

  useEffect(() => () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    if (typingTimer.current !== null) window.clearInterval(typingTimer.current);
  }, []);

  const allFiles = useMemo(() => collectFiles(tree), [tree]);

  const errorCount = useMemo(
    () => Object.values(markers).flat().filter((m) => m.type === "error").length,
    [markers]
  );
  const warningCount = useMemo(
    () => Object.values(markers).flat().filter((m) => m.type === "warning").length,
    [markers]
  );

  const loadProject = (kind: "open" | "clone" | "create", name?: string) => {
    setTree(SAMPLE_TREE);
    setContent(FILE_CONTENTS);
    setMarkers(FILE_MARKERS);
    setModified(new Set(["vedaapex/src/app/globals.css"]));
    setUntracked(new Set(["vedaapex/public/favicon.svg"]));
    setExpanded(INITIAL_EXPANDED);
    setOpenTabs(["vedaapex/src/app/page.tsx"]);
    setActivePath("vedaapex/src/app/page.tsx");
    setProjectOpen(true);
    setOpening(null);
    setBusy(null);
    toast(
      kind === "clone"
        ? `Cloned ${name ?? "repository"} successfully`
        : kind === "create"
          ? "Created new project — vedaapex"
          : "Opened vedaapex",
      "success"
    );
  };

  const resetToWelcome = () => {
    setProjectOpen(false);
    setOpenTabs([]);
    setActivePath(null);
    setAiMenuOpen(false);
    toast("Starting a new project — choose a location below", "info");
  };

  const handleWelcomeAction = (action: "open" | "clone" | "create" | "remote") => {
    if (busy === "clone" && action === "create") {
      setBusy(null);
      return;
    }
    if (busy === "remote" && action === "remote") {
      setBusy(null);
      toast("Connecting to remote workspace...", "info");
      schedule(() => toast("Connected to remote workspace", "success"), 1400);
      return;
    }
    if (busy === "remote" && action === "create") {
      setBusy(null);
      return;
    }
    setBusy(action);
    if (action === "open") schedule(() => loadProject("open"), 900);
    if (action === "create") schedule(() => loadProject("create"), 1200);
  };

  const handleClone = (url: string) => {
    setBusy(null);
    toast(`Cloning ${url}...`, "info");
    schedule(() => loadProject("clone", url.split("/").pop()?.replace(".git", "")), 1500);
  };

  const openFile = (path: string) => {
    setProjectOpen(true);
    if (!content[path] && !FILE_CONTENTS[path]) {
      setContent((c) => ({ ...c, [path]: "" }));
    }
    setOpenTabs((t) => (t.includes(path) ? t : [...t, path]));
    setActivePath(path);
    setSelectedPath(path);
    setEditorLoading(path);
    schedule(() => setEditorLoading((cur) => (cur === path ? null : cur)), 380);
    const parts = path.split("/").slice(0, -1);
    let acc = "";
    const parents = new Set<string>();
    parts.forEach((p) => {
      acc = acc ? `${acc}/${p}` : p;
      parents.add(acc);
    });
    setExpanded((prev) => {
      const next = new Set(prev);
      parents.forEach((p) => next.add(p));
      return next;
    });
  };

  const closeTab = (path: string) => {
    setOpenTabs((t) => {
      const next = t.filter((p) => p !== path);
      if (activePath === path) {
        const fallback = next[next.length - 1] ?? null;
        setActivePath(fallback);
      }
      return next;
    });
  };

  const handleEdit = (newContent: string) => {
    if (!activePath) return;
    setContent((c) => ({ ...c, [activePath]: newContent }));
    setModified((m) => new Set(m).add(activePath));
  };

  const saveActive = () => {
    if (!activePath) return;
    setModified((m) => {
      const next = new Set(m);
      next.delete(activePath);
      return next;
    });
    toast(`Saved ${activePath.split("/").pop()}`, "success");
  };

  const renameTreeItem = (path: string, newName: string) => {
    setRenaming(null);
    if (!newName) return;
    const current = treeName(path);
    if (newName === current) return;
    const parent = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    const newPath = parent ? `${parent}/${newName}` : newName;
    setTree((t) => renameNode(t, path, newName));
    setContent((c) => {
      const next = { ...c };
      if (c[path] !== undefined) {
        next[newPath] = c[path];
        delete next[path];
      }
      return next;
    });
    setMarkers((m) => {
      if (!m[path]) return m;
      const next = { ...m };
      next[newPath] = m[path];
      delete next[path];
      return next;
    });
    setModified((m) => {
      const next = new Set(m);
      if (next.has(path)) {
        next.delete(path);
        next.add(newPath);
      }
      return next;
    });
    setUntracked((u) => {
      const next = new Set(u);
      if (next.has(path)) {
        next.delete(path);
        next.add(newPath);
      }
      return next;
    });
    setOpenTabs((t) => t.map((p) => (p === path ? newPath : p)));
    setActivePath((a) => (a === path ? newPath : a));
    toast(`Renamed to ${newName}`, "success");
  };

  const treeName = (path: string) => path.split("/").pop() ?? path;

  const deleteTreeItem = (path: string) => {
    setTree((t) => removeNode(t, path));
    setContent((c) => {
      const next = { ...c };
      delete next[path];
      return next;
    });
    setMarkers((m) => {
      const next = { ...m };
      delete next[path];
      return next;
    });
    setOpenTabs((t) => {
      const next = t.filter((p) => p !== path);
      if (activePath === path) setActivePath(next[next.length - 1] ?? null);
      return next;
    });
    toast(`Deleted ${treeName(path)}`, "success");
  };

  const copyPath = (path: string) => {
    void navigator.clipboard?.writeText(path).catch(() => undefined);
    toast("Path copied to clipboard", "success");
  };

  const newFileAt = (folderPath: string | null) => {
    const parent = folderPath ?? "vedaapex";
    let name = "untitled.tsx";
    let i = 2;
    while (allFiles.includes(`${parent}/${name}`)) {
      name = `untitled-${i}.tsx`;
      i += 1;
    }
    const path = `${parent}/${name}`;
    setTree((t) => addNode(t, parent, { name, path, type: "file" }));
    setContent((c) => ({ ...c, [path]: "" }));
    setOpenTabs((t) => [...t, path]);
    setActivePath(path);
    setRenaming(path);
    setSearchOpen(false);
  };

  const newFolderAt = (folderPath: string | null) => {
    const parent = folderPath ?? "vedaapex";
    const path = `${parent}/new-folder`;
    setTree((t) => addNode(t, parent, { name: "new-folder", path, type: "folder", children: [] }));
    setExpanded((e) => new Set(e).add(parent));
    setRenaming(path);
  };

  const runTypeCheck = () => {
    setTools((t) => [...t, ...AI_TOOL_STEPS.map((s) => ({ ...s, state: "done" as const }))]);
    toast("Type check passed · 0 errors, 2 warnings", "success");
  };

  const acceptDiff = () => {
    setModified((m) => new Set(m).add("vedaapex/src/components/Login.tsx"));
    setMarkers((m) => {
      const next = { ...m };
      delete next["vedaapex/src/components/Login.tsx"];
      return next;
    });
    setDiff(null);
    setDiffFiles(null);
    toast("Applied changes to 2 files", "success");
  };

  const rejectDiff = () => {
    setDiff(null);
    setDiffFiles(null);
    toast("Changes rejected — working tree unchanged", "error");
  };

  const stopStream = () => {
    flowToken.current += 1;
    if (typingTimer.current !== null) {
      window.clearInterval(typingTimer.current);
      typingTimer.current = null;
    }
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setStreaming(false);
  };

  const send = (prompt: string) => {
    if (streaming) return;
    const lower = prompt.toLowerCase();
    const kind =
      /explain|what does|how does|describe/.test(lower)
        ? "read"
        : /fix|error|bug|broken|warn/.test(lower)
          ? "fix"
          : /refactor|clean|extract|reuse/.test(lower)
            ? "refactor"
            : /test/.test(lower)
              ? "test"
              : /generate|create|write|new file/.test(lower)
                ? "generate"
                : "build";

    const replies: Record<string, string> = {
      build: "I'll inspect the existing authentication architecture first, then implement the page using your current components and styling system.",
      read: "I analyzed the current state of the repository. The entry point renders Login when there is no session, then switches to the ChatPanel + Sidebar layout once a user signs in. Auth state is held locally — no backend calls yet.",
      fix: "I found 1 type error in src/components/Login.tsx — useState<boolean> was initialized with a string, which strict mode rejects. I fixed the initializer and re-ran the type checker. Everything passes now.",
      refactor: "I refactored the login form: extracted the duplicated responsive markup into AuthCard, simplified the submit handler and removed the unused import. The public API of the component is unchanged.",
      generate: "I generated a new hook src/lib/useAuth.ts with login, logout and session persistence. It follows the existing fetch and error-handling patterns in this repository.",
      test: "I wrote a test suite for src/lib/utils.ts covering cn() and formatDate(), including falsy arguments, deduplication and locale formatting edge cases.",
    };

    const asstId = uid();
    setMessages((m) => [...m, { id: uid(), role: "user", text: prompt }, { id: asstId, role: "assistant", text: "" }]);
    setDiff(null);
    setStreaming(true);
    const reply = replies[kind] ?? replies.build;
    const token = ++flowToken.current;
    let i = 0;
    typingTimer.current = window.setInterval(() => {
      i += 3;
      setMessages((m) => m.map((x) => (x.id === asstId ? { ...x, text: reply.slice(0, i) } : x)));
      if (i >= reply.length && typingTimer.current !== null) {
        window.clearInterval(typingTimer.current);
        typingTimer.current = null;
        if (token !== flowToken.current) return;
        runTools(kind, token);
      }
    }, 18);
  };

  const runTools = (kind: string, token: number) => {
    const steps = kind === "read" ? READ_TOOL_STEPS : AI_TOOL_STEPS;
    setTools(steps.map((s) => ({ ...s, state: "pending" })));
    let idx = 0;
    const next = () => {
      if (token !== flowToken.current) return;
      if (idx >= steps.length) {
        finish(kind, token);
        return;
      }
      setTools((t) => t.map((s, j) => (j === idx ? { ...s, state: "running" } : s)));
      schedule(() => {
        if (token !== flowToken.current) return;
        setTools((t) => t.map((s, j) => (j === idx ? { ...s, state: "done" } : s)));
        idx += 1;
        next();
      }, 560);
    };
    next();
  };

  const finish = (kind: string, token: number) => {
    if (token !== flowToken.current) return;
    setStreaming(false);
    if (kind === "read") {
      toast("Analysis complete", "info");
      return;
    }
    if (kind === "fix") {
      setMarkers((m) => {
        const next = { ...m };
        delete next["vedaapex/src/components/Login.tsx"];
        return next;
      });
      setModified((m) => new Set(m).add("vedaapex/src/components/Login.tsx"));
      setDiff(DIFF_SUMMARY);
      toast("Fixed 1 type error in Login.tsx", "success");
      return;
    }
    if (kind === "generate") {
      const path = "vedaapex/src/lib/useAuth.ts";
      setTree((t) =>
        addNode(t, "vedaapex/src/lib", {
          name: "useAuth.ts",
          path,
          type: "file",
        })
      );
      setContent((c) => ({ ...c, [path]: GENERATED_USE_AUTH }));
      setOpenTabs((t) => [...t, path]);
      setActivePath(path);
      setDiff([{ sign: "+", text: "Generated src/lib/useAuth.ts" }]);
      toast("Generated src/lib/useAuth.ts", "success");
      return;
    }
    if (kind === "test") {
      const path = "vedaapex/src/lib/utils.test.ts";
      setTree((t) =>
        addNode(t, "vedaapex/src/lib", {
          name: "utils.test.ts",
          path,
          type: "file",
        })
      );
      setContent((c) => ({ ...c, [path]: GENERATED_UTILS_TEST }));
      setOpenTabs((t) => [...t, path]);
      setActivePath(path);
      setDiff([{ sign: "+", text: "Generated src/lib/utils.test.ts" }]);
      toast("Generated src/lib/utils.test.ts", "success");
      return;
    }
    setModified((m) => {
      const next = new Set(m);
      next.add("vedaapex/src/components/Login.tsx");
      next.add("vedaapex/src/app/globals.css");
      return next;
    });
    setDiff(DIFF_SUMMARY);
    toast("Apex AI finished · 2 files changed", "success");
  };

  const aiAction = (action: "explain" | "fix" | "refactor" | "generate" | "test") => {
    setAiMenuOpen(false);
    const prompts: Record<string, string> = {
      explain: `Explain what ${activePath?.split("/").pop() ?? "this file"} does`,
      fix: "Fix the type error in Login.tsx",
      refactor: "Refactor the login form and remove duplication",
      generate: "Generate a useAuth hook for session management",
      test: "Write tests for utils.ts",
    };
    send(prompts[action]);
  };

  const commands: CommandDef[] = useMemo(
    () => [
      { id: "command-palette", label: "Command Palette", icon: Command, shortcut: "Ctrl+Shift+P", keywords: "palette commands" },
      { id: "go-to-file", label: "Go to File", icon: FileCode, shortcut: "Ctrl+P", keywords: "open file" },
      { id: "new-file", label: "New File", icon: FilePlus2, keywords: "untitled create" },
      { id: "new-project", label: "New Project", icon: Plus, keywords: "reset welcome" },
      { id: "open-folder", label: "Open Folder", icon: FolderOpen, keywords: "project workspace" },
      { id: "toggle-explorer", label: "Toggle Explorer", icon: PanelLeft, shortcut: "Ctrl+B", keywords: "sidebar" },
      { id: "toggle-ai", label: "Toggle AI Panel", icon: PanelRight, shortcut: "Ctrl+J", keywords: "chat assistant" },
      { id: "toggle-split", label: "Toggle Split Editor", icon: Columns2, keywords: "split view" },
      { id: "toggle-minimap", label: "Toggle Minimap", icon: Map, keywords: "map" },
      { id: "accept-changes", label: "Accept AI Changes", icon: Check, keywords: "apply diff" },
      { id: "reject-changes", label: "Reject AI Changes", icon: X, keywords: "discard diff" },
      { id: "review-diff", label: "Review Diff", icon: GitPullRequest, keywords: "changes diff" },
      { id: "type-check", label: "Run Type Check", icon: Terminal, keywords: "tsc errors" },
      { id: "save-file", label: "Save File", icon: Save, shortcut: "Ctrl+S", keywords: "save" },
      { id: "close-tabs", label: "Close All Tabs", icon: X, keywords: "close" },
      { id: "clear-chat", label: "Clear AI Chat", icon: Sparkles, keywords: "new chat" },
      { id: "source-control", label: "Source Control", icon: GitBranch, keywords: "git" },
      { id: "extensions", label: "Extensions", icon: Blocks, keywords: "plugins" },
      { id: "settings", label: "Settings", icon: Settings, keywords: "preferences" },
    ],
    []
  );

  const runCommand = (id: string) => {
    setPaletteMode(null);
    switch (id) {
      case "command-palette":
        setPaletteMode("commands");
        break;
      case "go-to-file":
        setPaletteMode("files");
        break;
      case "new-file":
        newFileAt("vedaapex");
        break;
      case "new-project":
        resetToWelcome();
        break;
      case "open-folder":
        setBusy("open");
        schedule(() => loadProject("open"), 900);
        break;
      case "toggle-explorer":
        setExplorerVisible((v) => !v);
        break;
      case "toggle-ai":
        setAiVisible((v) => !v);
        break;
      case "toggle-split":
        setSplit((v) => !v);
        break;
      case "toggle-minimap":
        setShowMinimap((v) => !v);
        break;
      case "accept-changes":
        if (diff) acceptDiff();
        else toast("No pending AI changes", "info");
        break;
      case "reject-changes":
        if (diff) rejectDiff();
        else toast("No pending AI changes", "info");
        break;
      case "review-diff":
        if (diff) setDiffFiles(DIFF_FILES);
        else toast("No pending AI changes", "info");
        break;
      case "type-check":
        runTypeCheck();
        break;
      case "save-file":
        saveActive();
        break;
      case "close-tabs":
        setOpenTabs([]);
        setActivePath(null);
        break;
      case "clear-chat":
        setMessages([
          { id: uid(), role: "assistant", text: "New conversation started. What should we build next?" },
        ]);
        setTools([]);
        setDiff(null);
        toast("Started a new conversation", "success");
        break;
      case "source-control":
        toast("Source control panel opens in the full desktop app", "info");
        break;
      case "extensions":
        toast("3 extensions available · 2 updates pending", "info");
        break;
      case "settings":
        toast("Settings are read-only in this preview", "info");
        break;
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "p" && !e.shiftKey) {
        e.preventDefault();
        setPaletteMode((m) => (m === "files" ? null : "files"));
        return;
      }
      if ((mod && e.key.toLowerCase() === "k") || (mod && e.shiftKey && e.key.toLowerCase() === "p")) {
        e.preventDefault();
        setPaletteMode((m) => (m === "commands" ? null : "commands"));
        return;
      }
      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setExplorerVisible((v) => !v);
        setMobileExplorer((v) => !v);
        return;
      }
      if (mod && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setAiVisible((v) => !v);
        setMobileAi((v) => !v);
        return;
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveActive();
        return;
      }
      if (mod && e.key === "`") {
        e.preventDefault();
        toast("Terminal opens in the full desktop app — Ctrl+`", "info");
        return;
      }
      if (e.key === "Escape") {
        setPaletteMode(null);
        setAiMenuOpen(false);
        setWorkspaceOpen(false);
        setExplorerMoreOpen(false);
        setRenaming(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const editorContent = activePath ? (content[activePath] ?? "") : "";
  const activeName = activePath?.split("/").pop() ?? "";

  const explorerPanel = (
    <div className="flex h-full min-h-0 flex-col bg-[#12151d]">
      <div className="shrink-0 border-b border-[#1d2434] px-3 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <ApexLogo size={22} />
          <span className="text-[13px] font-bold tracking-tight text-[#e6e9f0]">ApexCode</span>
          <span className="rounded-full border border-[#2a3348] bg-[#161d2b] px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-[#5b6779]">
            IDE
          </span>
          <div className="relative ml-auto">
            <button
              onClick={() => setWorkspaceOpen((v) => !v)}
              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-[#8b93a7] transition-colors hover:bg-[#1a2130] hover:text-white"
            >
              <span className="max-w-[72px] truncate">{workspace}</span>
              <ChevronsUpDown className="h-3 w-3" />
            </button>
            {workspaceOpen && (
              <>
                <div className="fixed inset-0 z-[60]" onMouseDown={() => setWorkspaceOpen(false)} />
                <div className="absolute right-0 top-8 z-[61] w-44 overflow-hidden rounded-lg border border-[#2a3348] bg-[#151a26] p-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                  {WORKSPACES.map((w) => (
                    <button
                      key={w}
                      onClick={() => {
                        setWorkspace(w);
                        setWorkspaceOpen(false);
                        toast(`Switched workspace — ${w}`, "success");
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                        w === workspace ? "bg-indigo-600/15 text-indigo-200" : "text-[#c6cddb] hover:bg-[#222b3f] hover:text-white"
                      }`}
                    >
                      <GitBranch className="h-3 w-3 text-[#8b93a7]" />
                      <span className="flex-1 truncate">{w}</span>
                      {w === workspace && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                  <div className="my-1 border-t border-[#232c3e]" />
                  <button
                    onClick={() => {
                      setWorkspaceOpen(false);
                      resetToWelcome();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-[#c6cddb] hover:bg-[#222b3f] hover:text-white"
                  >
                    <FolderOpen className="h-3 w-3" />
                    Open Folder…
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          <button
            onClick={resetToWelcome}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-2 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
          </button>
          <button
            onClick={() => {
              setSearchOpen((v) => !v);
              if (searchOpen) setSearchFilter("");
            }}
            title="Search files"
            className={`rounded-md p-1.5 transition-colors ${searchOpen ? "bg-[#222b3f] text-white" : "text-[#8b93a7] hover:bg-[#1a2130] hover:text-white"}`}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="shrink-0 border-b border-[#1d2434] p-2">
          <div className="flex items-center gap-2 rounded-md border border-[#2a3348] bg-[#0d1017] px-2 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-[#5b6779]" />
            <input
              autoFocus
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const first = allFiles.filter((f) => f.toLowerCase().includes(searchFilter.toLowerCase()))[0];
                  if (first) {
                    openFile(first);
                    setSearchOpen(false);
                    setSearchFilter("");
                  }
                }
              }}
              placeholder="Search files..."
              className="w-full bg-transparent text-[12px] text-[#e6e9f0] outline-none placeholder:text-[#5b6779]"
            />
            <button onClick={() => setSearchOpen(false)} className="text-[#5b6779] hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex shrink-0 items-center justify-between px-3 pb-1 pt-2.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6779]">Explorer</span>
        <div className="relative">
          <button
            onClick={() => setExplorerMoreOpen((v) => !v)}
            title="More actions"
            className="rounded-md p-1 text-[#8b93a7] transition-colors hover:bg-[#1a2130] hover:text-white"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {explorerMoreOpen && (
            <>
              <div className="fixed inset-0 z-[60]" onMouseDown={() => setExplorerMoreOpen(false)} />
              <div className="absolute right-0 top-7 z-[61] w-44 overflow-hidden rounded-lg border border-[#2a3348] bg-[#151a26] p-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                {[
                  { label: "New File", icon: FilePlus2, fn: () => newFileAt(null) },
                  { label: "New Folder", icon: FolderPlus, fn: () => newFolderAt(null) },
                  { label: "Collapse All", icon: ChevronRight, fn: () => setExpanded(new Set()) },
                  { label: "Refresh Workspace", icon: RotateCcw, fn: () => toast("Workspace refreshed", "info") },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setExplorerMoreOpen(false);
                      item.fn();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-[#c6cddb] transition-colors hover:bg-[#222b3f] hover:text-white"
                  >
                    <item.icon className="h-3.5 w-3.5 text-[#8b93a7]" />
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <FileTree
        nodes={tree}
        expanded={expanded}
        activePath={activePath}
        modified={modified}
        untracked={untracked}
        filter={searchFilter}
        renaming={renaming}
        onToggle={(p) =>
          setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(p)) next.delete(p);
            else next.add(p);
            return next;
          })
        }
        onOpenFile={openFile}
        onSelect={setSelectedPath}
        onRenameCommit={renameTreeItem}
        onRenameCancel={() => setRenaming(null)}
        onRenameStart={(p) => setRenaming(p)}
        onDelete={deleteTreeItem}
        onCopyPath={copyPath}
        onNewFile={newFileAt}
        onNewFolder={newFolderAt}
      />

      <div className="flex shrink-0 flex-col border-t border-[#1d2434]">
        <button
          onClick={() => toast("Source control — 1 modified file, 1 untracked file", "info")}
          className="flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-[#9aa4b5] transition-colors hover:bg-[#181f2d] hover:text-[#e6e9f0]"
        >
          <GitBranch className="h-4 w-4" />
          Source Control
          <span className="ml-auto rounded-full bg-[#222b3f] px-1.5 text-[10px] font-semibold text-[#8b93a7]">
            {modified.size + untracked.size}
          </span>
        </button>
        <button
          onClick={() => toast("3 extensions available · 2 updates pending", "info")}
          className="flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-[#9aa4b5] transition-colors hover:bg-[#181f2d] hover:text-[#e6e9f0]"
        >
          <Blocks className="h-4 w-4" />
          Extensions
          <span className="ml-auto rounded-full bg-[#222b3f] px-1.5 text-[10px] font-semibold text-[#8b93a7]">3</span>
        </button>
        <button
          onClick={() => toast("Settings are read-only in this preview", "info")}
          className="flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-[#9aa4b5] transition-colors hover:bg-[#181f2d] hover:text-[#e6e9f0]"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <button
          onClick={() => toast("Signed in as dev@apexcode.ai · Pro plan", "info")}
          className="flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-[#9aa4b5] transition-colors hover:bg-[#181f2d] hover:text-[#e6e9f0]"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600/70 text-[8.5px] font-bold text-white">
            DA
          </span>
          Account
        </button>
      </div>
    </div>
  );

  const editorArea = (
    <div className="flex h-full min-h-0 flex-col bg-[#0d1017]">
      <div className="flex h-9 shrink-0 items-stretch border-b border-[#1d2434] bg-[#0f131b]">
        <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto no-scrollbar">
          {openTabs.length === 0 && (
            <div className="flex items-center px-3 text-[11.5px] text-[#5b6779]">No files open</div>
          )}
          {openTabs.map((path) => {
            const isActive = path === activePath;
            const isDirty = modified.has(path);
            return (
              <div
                key={path}
                onClick={() => openFile(path)}
                className={`group flex min-w-0 max-w-[200px] cursor-pointer items-center gap-1.5 border-r border-[#1d2434] px-3 text-[11.5px] transition-colors ${
                  isActive ? "bg-[#0d1017] text-[#e6e9f0] shadow-[inset_0_2px_0_0_#6366f1]" : "text-[#8b93a7] hover:bg-[#141a26] hover:text-[#c6cddb]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${isDirty ? "bg-amber-400" : isActive ? "bg-indigo-400" : "bg-transparent"}`}
                />
                <span className="truncate">{path.split("/").pop()}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(path);
                  }}
                  className="ml-0.5 shrink-0 rounded p-0.5 text-[#4a5468] opacity-0 transition-opacity hover:bg-[#222b3f] hover:text-white group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 border-l border-[#1d2434] px-1.5">
          <button
            onClick={() => setSplit((v) => !v)}
            title="Split editor"
            className={`rounded-md p-1.5 transition-colors ${split ? "bg-[#222b3f] text-white" : "text-[#8b93a7] hover:bg-[#1a2130] hover:text-white"}`}
          >
            <Columns2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowMinimap((v) => !v)}
            title="Toggle minimap"
            className={`rounded-md p-1.5 transition-colors ${showMinimap ? "bg-[#222b3f] text-white" : "text-[#8b93a7] hover:bg-[#1a2130] hover:text-white"}`}
          >
            <Map className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setExplorerVisible((v) => !v);
              setMobileExplorer((v) => !v);
            }}
            title="Toggle explorer"
            className="rounded-md p-1.5 text-[#8b93a7] transition-colors hover:bg-[#1a2130] hover:text-white"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setAiVisible((v) => !v);
              setMobileAi((v) => !v);
            }}
            title="Toggle AI panel"
            className="rounded-md p-1.5 text-[#8b93a7] transition-colors hover:bg-[#1a2130] hover:text-white"
          >
            <PanelRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {activePath && (
        <div className="flex h-8 shrink-0 items-center gap-2 border-b border-[#1d2434] bg-[#0f131b] px-3">
          <div className="flex min-w-0 flex-1 items-center gap-1 text-[11px] text-[#8b93a7]">
            <span className="font-medium text-[#5b6779]">vedaapex</span>
            {activePath
              .replace("vedaapex/", "")
              .split("/")
              .map((seg, i, arr) => (
                <span key={i} className="flex min-w-0 items-center gap-1">
                  <ChevronRight className="h-3 w-3 shrink-0 text-[#39445a]" />
                  <span className={i === arr.length - 1 ? "truncate font-medium text-[#c6cddb]" : "truncate"}>{seg}</span>
                </span>
              ))}
          </div>
          <div className="relative">
            <button
              onClick={() => setAiMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[11px] font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Apex AI
              <ChevronRight className={`h-3 w-3 transition-transform ${aiMenuOpen ? "rotate-90" : ""}`} />
            </button>
            {aiMenuOpen && (
              <>
                <div className="fixed inset-0 z-[60]" onMouseDown={() => setAiMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-[61] w-44 overflow-hidden rounded-lg border border-[#2a3348] bg-[#151a26] p-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                  {(
                    [
                      { label: "Explain", icon: Sparkles, fn: () => aiAction("explain") },
                      { label: "Fix", icon: Wrench, fn: () => aiAction("fix") },
                      { label: "Refactor", icon: Shuffle, fn: () => aiAction("refactor") },
                      { label: "Generate", icon: Wand2, fn: () => aiAction("generate") },
                      { label: "Test", icon: FlaskConical, fn: () => aiAction("test") },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setAiMenuOpen(false);
                        item.fn();
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-[#c6cddb] transition-colors hover:bg-[#222b3f] hover:text-white"
                    >
                      <item.icon className="h-3.5 w-3.5 text-indigo-300" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1">
        {!projectOpen ? (
          <WelcomeScreen
            busy={busy}
            onAction={handleWelcomeAction}
            onClone={handleClone}
            onOpenTerminalHint={() => toast("Terminal opens in the full desktop app — Ctrl+`", "info")}
          />
        ) : openTabs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#0d1017] px-6 text-center">
            <FileCode className="h-10 w-10 text-[#2a3348]" />
            <div>
              <p className="text-[14px] font-semibold text-[#8b93a7]">No file open</p>
              <p className="mt-1 text-[12px] text-[#5b6779]">Select a file from the explorer or ask Apex AI to build something.</p>
            </div>
            <button
              onClick={() => openFile("vedaapex/src/app/page.tsx")}
              className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Open page.tsx
            </button>
          </div>
        ) : activePath ? (
          <div className={`flex h-full ${split ? "gap-px" : ""}`}>
            <div className="min-w-0 flex-1">
              <CodeEditor
                key={`a-${activePath}`}
                path={activePath}
                content={editorContent}
                markers={markers[activePath] ?? []}
                activeLine={cursor.line}
                onCursorChange={(line, col) => setCursor({ line, col })}
                onEdit={handleEdit}
                onRequestAi={aiAction}
                showMinimap={showMinimap}
                loading={editorLoading === activePath}
              />
            </div>
            {split && (
              <div className="min-w-0 flex-1 border-l border-[#1d2434]">
                <CodeEditor
                  key={`b-${activePath}`}
                  path={activePath}
                  content={editorContent}
                  markers={markers[activePath] ?? []}
                  activeLine={cursor.line}
                  onCursorChange={(line, col) => setCursor({ line, col })}
                  onEdit={handleEdit}
                  onRequestAi={aiAction}
                  showMinimap={false}
                  loading={editorLoading === activePath}
                />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );

  const aiPanel = (
    <ApexChat
      messages={messages}
      streaming={streaming}
      onStop={stopStream}
      tools={tools}
      diff={diff}
      onAccept={acceptDiff}
      onReject={rejectDiff}
      onReview={() => diff && setDiffFiles(DIFF_FILES)}
      onSend={send}
      onNewChat={runCommand.bind(null, "clear-chat")}
      onExpand={() => setAiExpanded(true)}
      onClose={() => {
        setAiVisible(false);
        setMobileAi(false);
        setAiExpanded(false);
      }}
      onToast={toast}
      model={model}
      onModelChange={(m) => {
        setModel(m);
        toast(`Model switched to ${m}`, "success");
      }}
      mode={mode}
      onModeChange={setMode}
      mentionFiles={allFiles}
      suggestions={SUGGESTIONS}
    />
  );

  const statusBar = (
    <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-[#1d2434] bg-[#0f131b] px-3 text-[10.5px] text-[#8b93a7]">
      <span className="flex items-center gap-1.5 font-medium text-[#aab4c5]">
        <GitBranch className="h-3 w-3" />
        main
      </span>
      <button onClick={() => toast("Syncing with origin/main...", "info")} className="flex items-center gap-1 transition-colors hover:text-white">
        <RefreshCw className="h-3 w-3" />
        <span className="hidden sm:inline">0 ↓ 1 ↑</span>
      </button>
      <button
        onClick={() => toast(`${errorCount} error${errorCount === 1 ? "" : "s"} in workspace`, errorCount ? "error" : "info")}
        className={`hidden items-center gap-1 transition-colors hover:text-white sm:flex ${errorCount > 0 ? "text-red-400" : ""}`}
      >
        <AlertCircle className="h-3 w-3" />
        {errorCount}
      </button>
      <button
        onClick={() => toast(`${warningCount} warnings in workspace`, warningCount ? "info" : "success")}
        className={`hidden items-center gap-1 transition-colors hover:text-white sm:flex ${warningCount > 0 ? "text-amber-400" : ""}`}
      >
        <AlertTriangle className="h-3 w-3" />
        {warningCount}
      </button>
      <span className="ml-auto flex items-center gap-3">
        <span className="hidden md:inline">TypeScript</span>
        <span className="hidden md:inline">UTF-8</span>
        <span className="hidden sm:inline">Spaces: 2</span>
        <span className="font-mono">
          Ln {cursor.line}, Col {cursor.col}
        </span>
        <span className="flex items-center gap-1 text-emerald-400">
          <Wifi className="h-3 w-3" />
          <span className="hidden sm:inline">Online</span>
        </span>
        <span className="flex items-center gap-1.5 text-indigo-300">
          <Sparkles className="h-3 w-3" />
          <span className="hidden sm:inline">Apex AI · {model}</span>
          <span className={`h-1.5 w-1.5 rounded-full sm:hidden ${streaming ? "animate-pulse bg-indigo-400" : "bg-emerald-400"}`} />
        </span>
      </span>
    </footer>
  );

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden bg-[#0d1017] text-[#c6cddb]"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif" }}
    >
      <div className="min-h-0 flex-1">
        <div className="hidden h-full lg:block">
          <Group
            orientation="horizontal"
            id="apex-ide"
            defaultLayout={{ explorer: 21, editor: 56, ai: 23 }}
          >
            {explorerVisible && <Panel id="explorer" minSize={14} maxSize={34}>{explorerPanel}</Panel>}
            {explorerVisible && <Separator />}
            <Panel id="editor" minSize={30}>{editorArea}</Panel>
            {aiVisible && <Separator />}
            {aiVisible && <Panel id="ai" minSize={20} maxSize={45}>{aiPanel}</Panel>}
          </Group>
        </div>
        <div className="h-full lg:hidden">{editorArea}</div>
      </div>

      <AnimatePresence>
        {mobileExplorer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileExplorer(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {mobileExplorer && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-y-0 left-0 z-[71] w-[300px] max-w-[85vw] border-r border-[#1d2434] bg-[#12151d] shadow-2xl lg:hidden"
          >
            {explorerPanel}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileAi && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileAi(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {mobileAi && (
          <motion.div
            initial={{ x: 440 }}
            animate={{ x: 0 }}
            exit={{ x: 440 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-[71] w-full border-l border-[#1d2434] bg-[#0f131b] shadow-2xl sm:w-[420px] lg:hidden"
          >
            {aiPanel}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[85] border border-[#1d2434] bg-[#0f131b]"
          >
            <ApexChat
              messages={messages}
              streaming={streaming}
              onStop={stopStream}
              tools={tools}
              diff={diff}
              onAccept={acceptDiff}
              onReject={rejectDiff}
              onReview={() => diff && setDiffFiles(DIFF_FILES)}
              onSend={send}
              onNewChat={runCommand.bind(null, "clear-chat")}
              onExpand={() => setAiExpanded(false)}
              onClose={() => {
                setAiExpanded(false);
                setAiVisible(false);
              }}
              onToast={toast}
              model={model}
              onModelChange={(m) => {
                setModel(m);
                toast(`Model switched to ${m}`, "success");
              }}
              mode={mode}
              onModeChange={setMode}
              mentionFiles={allFiles}
              suggestions={SUGGESTIONS}
              expanded
            />
          </motion.div>
        )}
      </AnimatePresence>

      {statusBar}

      <CommandPalette
        mode={paletteMode}
        commands={commands}
        files={allFiles}
        onRunCommand={runCommand}
        onOpenFile={(path) => {
          setPaletteMode(null);
          openFile(path);
        }}
        onClose={() => setPaletteMode(null)}
      />

      {diffFiles && (
        <DiffView
          files={diffFiles}
          onAccept={() => {
            acceptDiff();
            setDiffFiles(null);
          }}
          onReject={() => {
            rejectDiff();
            setDiffFiles(null);
          }}
          onClose={() => setDiffFiles(null)}
        />
      )}

      <div className="pointer-events-none fixed right-3 top-3 z-[120] flex w-[320px] max-w-[calc(100vw-24px)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              className="pointer-events-auto flex items-start gap-2 rounded-lg border border-[#2a3348] bg-[#151a26] px-3 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
            >
              {t.kind === "success" ? (
                <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-emerald-400" />
              ) : t.kind === "error" ? (
                <XCircle className="mt-px h-4 w-4 shrink-0 text-red-400" />
              ) : (
                <Info className="mt-px h-4 w-4 shrink-0 text-indigo-400" />
              )}
              <span className="min-w-0 flex-1 text-[11.5px] leading-relaxed text-[#c6cddb]">{t.text}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="shrink-0 text-[#5b6779] transition-colors hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

const GENERATED_USE_AUTH = `import { useCallback, useEffect, useState } from "react";

type Session = { user: string; token: string } | null;

export function useAuth() {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("apex_session");
    if (raw) {
      try {
        setSession(JSON.parse(raw));
      } catch {
        setSession(null);
      }
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as Session;
      if (res.ok && data) {
        localStorage.setItem("apex_session", JSON.stringify(data));
        setSession(data);
      }
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("apex_session");
    setSession(null);
  }, []);

  return { session, loading, login, logout };
}`;

const GENERATED_UTILS_TEST = `import { describe, expect, it } from "vitest";
import { cn, formatDate } from "./utils";

describe("cn", () => {
  it("joins truthy classes", () => {
    expect(cn("a", false, "b", null, "c")).toBe("a b c");
  });

  it("returns an empty string for falsy input", () => {
    expect(cn(false, undefined, null)).toBe("");
  });
});

describe("formatDate", () => {
  it("formats a date with month, day and year", () => {
    const date = new Date(2026, 7, 20);
    expect(formatDate(date)).toMatch(/Aug 20, 2026/);
  });
});`;