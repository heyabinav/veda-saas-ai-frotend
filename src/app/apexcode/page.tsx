"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PanelLeft,
  PanelRight,
  Folder,
  Search,
  GitBranch,
  Sparkles,
  Settings,
  FolderOpen,
  FolderPlus,
  Upload,
  RefreshCw,
  FileCode,
  FileText,
  Files,
  ChevronRight,
  X,
  Send,
  Loader2,
  Zap,
  Circle,
  Play,
  Code,
  Eye,
  GitCommitHorizontal,
  User,
  FilePlus2,
  AlertCircle,
  Paperclip,
} from "lucide-react";
import CodeEditor from "@/components/ide/CodeEditor";
import Image from "next/image";
import { THINKING_MESSAGES } from "@/lib/thinking-messages";
import {
  requestBuildFiles,
  extractJsonObject,
  formatAiAnswer,
  buildFallbackApp,
  buildTree,
  type GeneratedFile,
  type TreeNode,
} from "@/lib/apex-build";

type NodeKind = "file" | "folder";
type NodeSource = "local" | "sample" | "uploaded" | "generated";

type IdeNode = {
  name: string;
  path: string;
  kind: NodeKind;
  source: NodeSource;
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
  file?: File;
  content?: string;
  size?: number;
  children?: IdeNode[];
};

type Project = {
  id: string;
  name: string;
  source: NodeSource;
  nodes: IdeNode[];
  rootHandle?: FileSystemDirectoryHandle;
};

type Tab = { key: string; name: string };

type AiMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  files?: GeneratedFile[];
  error?: boolean;
};

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next", "build", ".cache", ".turbo"]);

const extOf = (path: string) => path.split(".").pop()?.toLowerCase() ?? "";
const fileNameOf = (path: string) => path.split("/").pop() ?? path;

function fileIcon(path: string) {
  const e = extOf(path);
  if (["js", "jsx", "ts", "tsx"].includes(e)) return { icon: FileCode, color: "text-[#e8c468]" };
  if (["html", "htm"].includes(e)) return { icon: FileCode, color: "text-[#f07c4f]" };
  if (["css", "scss", "less"].includes(e)) return { icon: FileCode, color: "text-[#8fb7f7]" };
  if (e === "json") return { icon: Files, color: "text-[#c9a15a]" };
  if (["md", "txt"].includes(e)) return { icon: FileText, color: "text-[#8b93a5]" };
  if (e === "py") return { icon: FileCode, color: "text-[#3572A5]" };
  if (["java", "kt", "kts"].includes(e)) return { icon: FileCode, color: "text-[#b07219]" };
  if (["cpp", "cc", "cxx", "hpp", "h", "c"].includes(e)) return { icon: FileCode, color: "text-[#f34b7d]" };
  if (["cs"].includes(e)) return { icon: FileCode, color: "text-[#239120]" };
  if (["go"].includes(e)) return { icon: FileCode, color: "text-[#00ADD8]" };
  if (["rs"].includes(e)) return { icon: FileCode, color: "text-[#dea584]" };
  if (["php"].includes(e)) return { icon: FileCode, color: "text-[#4F5D95]" };
  if (["rb"].includes(e)) return { icon: FileCode, color: "text-[#701516]" };
  if (["swift"].includes(e)) return { icon: FileCode, color: "text-[#ffac45]" };
  if (["dart"].includes(e)) return { icon: FileCode, color: "text-[#00B4AB]" };
  if (["sh", "bash", "zsh", "fish"].includes(e)) return { icon: FileCode, color: "text-[#89e051]" };
  if (["sql"].includes(e)) return { icon: FileCode, color: "text-[#e38c00]" };
  if (["xml", "svg"].includes(e)) return { icon: FileCode, color: "text-[#0060ac]" };
  if (["yaml", "yml"].includes(e)) return { icon: FileCode, color: "text-[#cb171e]" };
  if (["toml"].includes(e)) return { icon: FileCode, color: "text-[#9c4221]" };
  if (["ini", "cfg", "conf"].includes(e)) return { icon: FileCode, color: "text-[#d4d4d4]" };
  if (["dockerfile", "containerfile"].includes(e)) return { icon: FileCode, color: "text-[#2496ED]" };
  if (["vue", "svelte"].includes(e)) return { icon: FileCode, color: "text-[#42b883]" };
  if (["astro"].includes(e)) return { icon: FileCode, color: "text-[#FF5D01]" };
  if (["lua"].includes(e)) return { icon: FileCode, color: "text-[#000080]" };
  if (["pl", "pm"].includes(e)) return { icon: FileCode, color: "text-[#0298c3]" };
  if (["r"].includes(e)) return { icon: FileCode, color: "text-[#198CE7]" };
  if (["m", "mm"].includes(e)) return { icon: FileCode, color: "text-[#438eff]" };
  if (["fs", "fsx", "fsi"].includes(e)) return { icon: FileCode, color: "text-[#b845fc]" };
  if (["ex", "exs"].includes(e)) return { icon: FileCode, color: "text-[#a9e4f8]" };
  if (["erl", "hrl"].includes(e)) return { icon: FileCode, color: "text-[#B83998]" };
  if (["clj", "cljs", "cljc", "edn"].includes(e)) return { icon: FileCode, color: "text-[#db5855]" };
  if (["hs", "lhs"].includes(e)) return { icon: FileCode, color: "text-[#5e5086]" };
  if (["ml", "mli"].includes(e)) return { icon: FileCode, color: "text-[#ec6813]" };
  if (["nim"].includes(e)) return { icon: FileCode, color: "text-[#ffc200]" };
  if (["zig"].includes(e)) return { icon: FileCode, color: "text-[#ec915c]" };
  if (["v", "vh"].includes(e)) return { icon: FileCode, color: "text-[#4f87c4]" };
  if (["jl"].includes(e)) return { icon: FileCode, color: "text-[#9558b2]" };
  if (["scala", "sc", "sbt"].includes(e)) return { icon: FileCode, color: "text-[#DC322F]" };
  if (["groovy", "gvy", "gy", "gsh"].includes(e)) return { icon: FileCode, color: "text-[#e69f56]" };
  if (["ps1", "psm1", "psd1"].includes(e)) return { icon: FileCode, color: "text-[#012456]" };
  if (["bat", "cmd"].includes(e)) return { icon: FileCode, color: "text-[#C1F12E]" };
  return { icon: FileCode, color: "text-[#8b93a5]" };
}

function findNode(nodes: IdeNode[], path: string): IdeNode | null {
  for (const n of nodes) {
    if (n.path === path) return n;
    if (n.children) {
      const f = findNode(n.children, path);
      if (f) return f;
    }
  }
  return null;
}

function countFiles(nodes: IdeNode[]): number {
  let n = 0;
  for (const node of nodes) {
    if (node.kind === "file") n += 1;
    if (node.children) n += countFiles(node.children);
  }
  return n;
}

async function readDirHandle(dir: FileSystemDirectoryHandle, prefix: string, depth: number): Promise<IdeNode[]> {
  const out: IdeNode[] = [];
  const iter = (dir as unknown as { values(): AsyncIterableIterator<FileSystemHandle> }).values();
  for await (const entry of iter) {
    if (depth > 8 || out.length >= 700) break;
    if (entry.kind === "file") {
      const fh = entry as FileSystemFileHandle;
      let size: number | undefined;
      try {
        size = (await fh.getFile()).size;
      } catch {
        size = undefined;
      }
      out.push({
        name: entry.name,
        path: prefix ? `${prefix}/${entry.name}` : entry.name,
        kind: "file",
        source: "local",
        handle: fh,
        size,
      });
    } else {
      const name = entry.name;
      if (SKIP_DIRS.has(name)) continue;
      const dh = entry as FileSystemDirectoryHandle;
      const children = await readDirHandle(dh, prefix ? `${prefix}/${name}` : name, depth + 1);
      out.push({
        name,
        path: prefix ? `${prefix}/${name}` : name,
        kind: "folder",
        source: "local",
        handle: dh,
        children,
      });
    }
  }
  out.sort((a, b) =>
    a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "folder" ? -1 : 1
  );
  return out;
}

function buildTreeFromFiles(files: File[]): IdeNode[] {
  const root: IdeNode = { name: "", path: "", kind: "folder", source: "uploaded", children: [] };
  for (const f of files) {
    const path = f.webkitRelativePath && f.webkitRelativePath !== "" ? f.webkitRelativePath : f.name;
    const parts = path.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const fullPath = parts.slice(0, i + 1).join("/");
      let child = current.children?.find((c) => c.name === part);
      if (!child) {
        if (isFile) {
          child = { name: part, path: fullPath, kind: "file", source: "uploaded", file: f, size: f.size };
        } else {
          child = { name: part, path: fullPath, kind: "folder", source: "uploaded", children: [] };
        }
        current.children?.push(child);
      }
      current = child;
    }
  }
  const sortNodes = (nodes: IdeNode[]) => {
    nodes.sort((a, b) => a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "folder" ? -1 : 1);
    nodes.forEach((n) => n.children && sortNodes(n.children));
  };
  sortNodes(root.children!);
  return root.children ?? [];
}

function nodesFromFiles(files: File[]): IdeNode[] {
  return buildTreeFromFiles(files);
}

function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve) => {
    const all: FileSystemEntry[] = [];
    const batch = () => {
      reader.readEntries(
        (entries) => {
          if (!entries.length) return resolve(all);
          all.push(...entries);
          batch();
        },
        () => resolve(all)
      );
    };
    batch();
  });
}

async function walkEntry(entry: FileSystemEntry, prefix: string, depth: number, acc: IdeNode[]): Promise<void> {
  if (depth > 8) return;
  if (entry.isFile) {
    const fe = entry as FileSystemFileEntry;
    const file = await new Promise<File | null>((res) => fe.file(res, () => res(null)));
    if (!file) return;
    acc.push({
      name: entry.name,
      path: prefix ? `${prefix}/${entry.name}` : entry.name,
      kind: "file",
      source: "uploaded",
      file,
      size: file.size,
    });
    return;
  }
  const de = entry as FileSystemDirectoryEntry;
  const entries = await readAllEntries(de.createReader());
  const node: IdeNode = {
    name: entry.name,
    path: prefix ? `${prefix}/${entry.name}` : entry.name,
    kind: "folder",
    source: "uploaded",
    children: [],
  };
  acc.push(node);
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    await walkEntry(e, node.path, depth + 1, node.children!);
  }
}

async function loadNodeContent(node: IdeNode): Promise<string | null> {
  if (node.handle && node.handle.kind === "file") {
    try {
      return await (node.handle as FileSystemFileHandle).getFile().then((f) => f.text());
    } catch {
      return null;
    }
  }
  if (node.file) {
    try {
      return await node.file.text();
    } catch {
      return null;
    }
  }
  return typeof node.content === "string" ? node.content : null;
}

function mapGeneratedTree(nodes: TreeNode[], files: GeneratedFile[]): IdeNode[] {
  return nodes.map((n) => ({
    name: n.name,
    path: n.path,
    kind: n.type === "folder" ? ("folder" as const) : ("file" as const),
    source: "generated" as const,
    content: n.type === "file" ? files.find((f) => f.path === n.path)?.content : undefined,
    children: n.children ? mapGeneratedTree(n.children, files) : undefined,
  }));
}

const SUGGESTIONS = [
  "Build a to-do app",
  "Create a landing page",
  "Make a quiz app",
  "Build a weather app",
];

const AVAILABLE_MODELS = [
  { id: "apex-2.1", name: "Apex 2.1", premium: false },
  { id: "apex-2.2-low", name: "Apex 2.2 (Low)", premium: true },
  { id: "apex-2.2-high", name: "Apex 2.2 (High)", premium: true },
  { id: "apex-3", name: "ApexCode 3 (Apex 3.0)", premium: true },
] as const;

function canAccessModel(model: typeof AVAILABLE_MODELS[number]): boolean {
  if (!model.premium) return true;
  // In a real app, check user's subscription plan
  // For now, only free model is accessible
  return false;
}

export default function ApexCodeIde() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [contents, setContents] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [viewMode, setViewMode] = useState<"code" | "preview">("code");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);
  const [activeView, setActiveView] = useState<"explorer" | "search" | "git">("explorer");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [workspaceName, setWorkspaceName] = useState("vedaapex");
  const [composer, setComposer] = useState("");
  const [selectedModel, setSelectedModel] = useState("apex-2.1");
  const [aiMessages, setAiMessages] = useState<AiMsg[]>([]);
  const [generating, setGenerating] = useState(false);
  const [buildStep, setBuildStep] = useState(0);
  const [thinkingIdx, setThinkingIdx] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const aiScrollRef = useRef<HTMLDivElement>(null);
  const genIdRef = useRef(0);

  const selectedModelObj = AVAILABLE_MODELS.find((m) => m.id === selectedModel) ?? AVAILABLE_MODELS[0];

  const handleModelChange = (modelId: string) => {
    const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
    if (model && canAccessModel(model)) {
      setSelectedModel(modelId);
    } else if (model && model.premium) {
      showToast("This is a premium model. Upgrade to Pro to use it.");
    }
  };

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const resolveNode = useCallback(
    (key: string): IdeNode | null => {
      for (const p of projects) {
        const path = key.startsWith(`${p.id}::`) ? key.slice(p.id.length + 2) : null;
        if (path !== null) {
          const found = findNode(p.nodes, path);
          if (found) return found;
        }
      }
      return null;
    },
    [projects]
  );

  const isHtmlKey = useCallback((key: string) => {
    const e = extOf(key.split("::")[1] ?? key);
    return e === "html" || e === "htm";
  }, []);

  const openFile = useCallback(
    async (node: IdeNode, projectId: string) => {
      const key = `${projectId}::${node.path}`;
      setOpenTabs((prev) => (prev.some((t) => t.key === key) ? prev : [...prev, { key, name: node.name }]));
      setActiveKey(key);
      setViewMode("code");
      if (contents[key] === undefined && loadingKey !== key) {
        setLoadingKey(key);
        const text = await loadNodeContent(node);
        setLoadingKey((k) => (k === key ? null : k));
        setContents((prev) => ({ ...prev, [key]: text ?? "" }));
        if (text === null && node.source === "local") {
          showToast("Could not read file (binary or locked)");
        }
      }
    },
    [contents, loadingKey, showToast]
  );

  const editFile = useCallback((key: string, text: string) => {
    setContents((prev) => ({ ...prev, [key]: text }));
    setDirty((prev) => ({ ...prev, [key]: true }));
  }, []);

  const saveFile = useCallback(
    async (key: string) => {
      const node = resolveNode(key);
      const text = contents[key];
      if (!node || text === undefined) return;
      if (node.source === "local" && node.handle && node.handle.kind === "file") {
        try {
          const wh = await (node.handle as FileSystemFileHandle).createWritable();
          await wh.write(text);
          await wh.close();
          setDirty((prev) => ({ ...prev, [key]: false }));
          showToast(`Saved ${node.path}`);
          return;
        } catch {
          showToast("Could not write to file");
          return;
        }
      }
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = node.name;
      a.click();
      URL.revokeObjectURL(url);
      setDirty((prev) => ({ ...prev, [key]: false }));
      showToast(`Downloaded ${node.name}`);
    },
    [contents, resolveNode, showToast]
  );

  const closeTab = useCallback(
    (key: string) => {
      const idx = openTabs.findIndex((t) => t.key === key);
      const next = openTabs.filter((t) => t.key !== key);
      setOpenTabs(next);
      if (activeKey === key) {
        setActiveKey(next[idx]?.key ?? next[next.length - 1]?.key ?? null);
      }
    },
    [openTabs, activeKey]
  );

  const openFolder = useCallback(async () => {
    const w = window as unknown as {
      showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    };
    if (!w.showDirectoryPicker) {
      showToast("Folder picker is not supported here — use Upload instead");
      return;
    }
    try {
      const dir = await w.showDirectoryPicker();
      const nodes = await readDirHandle(dir, "", 0);
      if (!nodes.length) {
        showToast("Folder is empty");
        return;
      }
      setProjects((prev) => [
        ...prev.filter((p) => p.source !== "local"),
        { id: `local-${Date.now()}`, name: dir.name, source: "local", nodes, rootHandle: dir },
      ]);
      setWorkspaceName(dir.name);
      setSidebarOpen(true);
      setActiveView("explorer");
      showToast(`Opened ${dir.name}`);
    } catch {
      // user cancelled
    }
  }, [showToast]);

  const addProject = useCallback(
    (source: NodeSource, name: string, nodes: IdeNode[]) => {
      if (!nodes.length) return;
      setProjects((prev) => [
        ...prev.filter((p) => p.source !== source),
        { id: `${source}-${Date.now()}`, name, source, nodes },
      ]);
      showToast(`${name}: ${countFiles(nodes)} file${countFiles(nodes) === 1 ? "" : "s"}`);
    },
    [showToast]
  );

  const onUpload = useCallback(
    (files: FileList | null) => {
      if (!files || !files.length) return;
      addProject("uploaded", "Uploaded Files", nodesFromFiles(Array.from(files)));
    },
    [addProject]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const acc: IdeNode[] = [];
      const items = e.dataTransfer?.items;
      if (items && items.length) {
        for (const item of Array.from(items)) {
          const entry = item.webkitGetAsEntry?.();
          if (entry) await walkEntry(entry, "", 0, acc);
        }
      } else {
        const files = e.dataTransfer?.files;
        if (files && files.length) acc.push(...nodesFromFiles(Array.from(files)));
      }
      addProject("uploaded", "Uploaded Files", acc);
    },
    [addProject]
  );

  const refreshLocal = useCallback(async () => {
    const locals = projects.filter((p) => p.source === "local" && p.rootHandle);
    for (const p of locals) {
      const nodes = await readDirHandle(p.rootHandle!, "", 0);
      setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, nodes } : x)));
    }
    if (locals.length) showToast("Folder refreshed");
  }, [projects, showToast]);

  const handleGenerate = useCallback(
    async (prompt: string) => {
      const text = prompt.trim();
      if (!text || generating) return;
      const id = ++genIdRef.current;
      setAiMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text }]);
      setComposer("");
      setAiError(null);
      setGenerating(true);
      setBuildStep(1);
      window.setTimeout(() => {
        if (genIdRef.current === id) setBuildStep(2);
      }, 800);

      let files: GeneratedFile[] | null = null;
      let answer: string | null = null;
      let fallback = false;
      try {
        const res = await requestBuildFiles(text);
        files = res.files;
        const parsed = extractJsonObject(res.raw);
        answer = formatAiAnswer(res.raw, parsed);
      } catch (err: any) {
        if (err?.quota) {
          const msg = err.message || "AI usage is exhausted. Please try again later.";
          setAiError(msg);
          setAiMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text: msg, error: true }]);
          setGenerating(false);
          setBuildStep(0);
          return;
        }
        files = buildFallbackApp(text);
        fallback = true;
      }
      if (genIdRef.current !== id) return;

      if (files) {
        const projId = `gen-${Date.now()}`;
        const nodes = mapGeneratedTree(buildTree(files), files);
        setProjects((prev) => [
          ...prev.filter((p) => p.source !== "generated"),
          {
            id: projId,
            name: fallback ? "Generated · offline demo" : "Generated",
            source: "generated",
            nodes,
          },
        ]);
        const sel = files.find((f) => f.path.toLowerCase().endsWith(".html"))?.path ?? files[0].path;
        const key = `${projId}::${sel}`;
        setOpenTabs((prev) => (prev.some((t) => t.key === key) ? prev : [...prev, { key, name: fileNameOf(sel) }]));
        setActiveKey(key);
        setViewMode("code");
        setContents((prev) => ({
          ...prev,
          [key]: files.find((f) => f.path === sel)?.content ?? "",
        }));
        setAiMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: answer ?? `Generated ${files.length} file${files.length === 1 ? "" : "s"}`,
            files,
          },
        ]);
      }
      setGenerating(false);
      setBuildStep(3);
    },
    [generating]
  );

  const runPreview = useCallback(() => {
    if (!activeKey) return;
    if (isHtmlKey(activeKey)) {
      setViewMode("preview");
    } else {
      showToast("Preview is only available for HTML files");
    }
  }, [activeKey, isHtmlKey, showToast]);

  useEffect(() => {
    if (!generating) return;
    setThinkingIdx(0);
    const t = window.setInterval(
      () => setThinkingIdx((i) => (i + 1) % THINKING_MESSAGES.length),
      1600
    );
    return () => window.clearInterval(t);
  }, [generating]);

  useEffect(() => {
    aiScrollRef.current?.scrollTo({ top: aiScrollRef.current.scrollHeight });
  }, [aiMessages, generating]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "s") {
        e.preventDefault();
        if (activeKey) void saveFile(activeKey);
      } else if (k === "b") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      } else if (k === "j") {
        e.preventDefault();
        setAiOpen((v) => !v);
      } else if (k === "p") {
        e.preventDefault();
        setActiveView("search");
        setSidebarOpen(true);
        window.setTimeout(() => searchInputRef.current?.focus(), 60);
      } else if (k === "`") {
        e.preventDefault();
        setViewMode((m) => (m === "code" ? "preview" : "code"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeKey, saveFile]);

  const searchableFiles = useMemo(() => {
    const out: { key: string; name: string; path: string }[] = [];
    for (const p of projects) {
      const walk = (nodes: IdeNode[]) => {
        for (const n of nodes) {
          if (n.kind === "file") out.push({ key: `${p.id}::${n.path}`, name: n.name, path: n.path });
          if (n.children) walk(n.children);
        }
      };
      walk(p.nodes);
    }
    return out;
  }, [projects]);

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return searchableFiles;
    return searchableFiles.filter(
      (f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
    );
  }, [searchableFiles, searchQuery]);

  const activeNode = activeKey ? resolveNode(activeKey) : null;
  const dirtyFiles = openTabs.filter((t) => dirty[t.key]);
  const previewHtml =
    activeKey && viewMode === "preview" && isHtmlKey(activeKey)
      ? contents[activeKey] ?? ""
      : "";

  const renderNode = (node: IdeNode, projectId: string, depth: number) => {
    const fullKey = `${projectId}::${node.path}`;
    if (node.kind === "folder") {
      const isOpen = collapsed[fullKey] !== true;
      return (
        <div key={fullKey}>
          <button
            type="button"
            className="flex w-full items-center gap-1.5 text-[13px] leading-7 text-[#64748b] hover:bg-[#f1f5f9]"
            style={{ paddingLeft: `${6 + depth * 12}px` }}
            onClick={() => setCollapsed((c) => {
              const next = { ...c };
              if (!isOpen) {
                Object.keys(next).forEach((k) => {
                  if (k.startsWith(`${projectId}::`) && k !== fullKey) next[k] = true;
                });
              }
              next[fullKey] = !isOpen;
              return next;
            })}
          >
            <ChevronRight
              className={`h-3.5 w-3.5 shrink-0 text-[#94a3b8] transition-transform ${isOpen ? "rotate-90" : ""}`}
            />
            <FolderOpen className="h-4 w-4 shrink-0 text-[#4f46e5]" />
            <span className="truncate">{node.name}</span>
          </button>
          {isOpen && node.children?.map((c) => renderNode(c, projectId, depth + 1))}
        </div>
      );
    }
    const ic = fileIcon(node.path);
    const Icon = ic.icon;
    const active = activeKey === fullKey;
    return (
      <button
        key={fullKey}
        type="button"
        className={`flex w-full items-center gap-1.5 text-[13px] leading-7 ${
          active ? "bg-[#e0e7ff] text-[#1e293b]" : "text-[#64748b] hover:bg-[#f1f5f9]"
        }`}
        style={{ paddingLeft: `${22 + depth * 12}px` }}
        onClick={() => void openFile(node, projectId)}
      >
        <Icon className={`h-4 w-4 shrink-0 ${ic.color}`} />
        <span className="truncate">{node.name}</span>
        {dirty[fullKey] && <span className="ml-auto mr-2 h-2 w-2 shrink-0 rounded-full bg-[#e2c08d]" />}
      </button>
    );
  };

  const renderProject = (p: Project) => {
    const key = `proj-${p.id}`;
    const isOpen = collapsed[key] !== true;
    return (
      <div key={p.id} className="mb-1">
        <button
          type="button"
          className="flex w-full items-center gap-1 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b] hover:text-[#1e293b]"
          onClick={() => setCollapsed((c) => {
            const next = { ...c };
            if (!isOpen) {
              Object.keys(next).forEach((k) => {
                if (k.startsWith("proj-") && k !== key) next[k] = true;
              });
            }
            next[key] = !isOpen;
            return next;
          })}
        >
          <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
          <span className="truncate">{p.name}</span>
          <span className="ml-auto text-[10px] font-normal text-[#94a3b8]">{countFiles(p.nodes)}</span>
        </button>
        {isOpen && p.nodes.map((n) => renderNode(n, p.id, 0))}
      </div>
    );
  };

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-white text-[#1e293b]"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => void onDrop(e)}
    >
      {/* Title bar */}
      <header className="flex h-[38px] shrink-0 items-center gap-2 border-b border-[#e2e8f0] bg-white px-3">
        <button
          type="button"
          className="rounded p-1 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
          onClick={() => setSidebarOpen((v) => !v)}
          title="Toggle Sidebar (Ctrl+B)"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <Image src="/logo.svg" alt="VedaApex" width={28} height={28} className="h-7 w-7" />
        <span className="text-[13px] font-semibold tracking-tight text-[#1e293b]">VedaApex</span>
        <span className="hidden items-center gap-1 rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[11px] text-[#64748b] sm:flex">
          <Folder className="h-3 w-3" />
          {workspaceName}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className={`rounded p-1.5 hover:bg-[#f1f5f9] ${aiOpen ? "text-[#4f46e5]" : "text-[#64748b]"}`}
            onClick={() => setAiOpen((v) => !v)}
            title="Toggle Apex AI (Ctrl+J)"
          >
            <Sparkles className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
            onClick={runPreview}
            title="Run Preview"
          >
            <Play className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
            onClick={() => router.push("/settings")}
            title="Settings"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Backdrops for mobile drawers */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {aiOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/10 lg:hidden"
          onClick={() => setAiOpen(false)}
        />
      )}

      <div className="flex min-h-0 flex-1">
        {/* Activity bar */}
        <nav className="hidden w-[48px] shrink-0 flex-col items-center gap-1 border-r border-[#e2e8f0] bg-[#f8fafc] py-2 lg:flex">
          {(
            [
              { id: "explorer", icon: Folder, title: "Explorer" },
              { id: "search", icon: Search, title: "Search (Ctrl+P)" },
              { id: "git", icon: GitBranch, title: "Source Control" },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`flex h-10 w-10 items-center justify-center rounded-md border-l-2 ${
                  activeView === item.id
                    ? "border-[#4f46e5] bg-[#f1f5f9] text-[#1e293b]"
                    : "border-transparent text-[#64748b] hover:text-[#1e293b]"
                }`}
                onClick={() => {
                  setActiveView(item.id);
                  setSidebarOpen(true);
                }}
                title={item.title}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
          <div className="flex-1" />
          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-md border-l-2 ${
              aiOpen ? "border-[#4f46e5] bg-[#f1f5f9] text-[#1e293b]" : "border-transparent text-[#64748b] hover:text-[#1e293b]"
            }`}
            onClick={() => setAiOpen((v) => !v)}
            title="Apex AI (Ctrl+J)"
          >
            <Sparkles className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
            onClick={() => router.push("/settings")}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </nav>

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[260px] shrink-0 flex-col border-r border-[#e2e8f0] bg-[#f8fafc] transition-transform lg:static lg:z-auto lg:h-full lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#e2e8f0] px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
              {activeView === "explorer" ? "Explorer" : activeView === "search" ? "Search" : "Source Control"}
            </span>
            <button
              type="button"
              className="rounded p-1 text-[#64748b] hover:text-[#1e293b]"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {activeView === "explorer" && (
            <>
              <div className="flex items-center gap-1 border-b border-[#e2e8f0] px-2 py-1.5">
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded px-2 py-1 text-[12px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
                  onClick={() => void openFolder()}
                  title="Open Folder from your computer"
                >
                  <FolderOpen className="h-4 w-4" />
                  Open Folder
                </button>
                <button
                  type="button"
                  className="rounded p-1.5 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload Files"
                >
                  <Upload className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded p-1.5 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
                  onClick={() => void refreshLocal()}
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto py-1">
                {projects.length === 0 && (
                  <p className="px-3 py-4 text-[12px] text-[#64748b]">
                    No folders open. Open a folder, upload files, or ask Apex AI to generate code.
                  </p>
                )}
                {projects.map(renderProject)}
              </div>
              <div className="border-t border-[#e2e8f0] px-3 py-1.5 text-[11px] text-[#64748b]">
                Drop files or folders anywhere to open them
              </div>
            </>
          )}

          {activeView === "search" && (
            <div className="flex flex-col gap-2 p-2">
              <div className="flex items-center gap-2 rounded-md border border-[#e2e8f0] bg-white px-2 py-1.5">
                <Search className="h-3.5 w-3.5 shrink-0 text-[#64748b]" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files…"
                  className="w-full bg-transparent text-[13px] text-[#1e293b] outline-none placeholder:text-[#94a3b8]"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {filteredFiles.length === 0 && (
                  <p className="px-2 py-3 text-[12px] text-[#64748b]">No files match.</p>
                )}
                {filteredFiles.map((f) => {
                  const ic = fileIcon(f.path);
                  const Icon = ic.icon;
                  const active = activeKey === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      className={`flex w-full items-center gap-1.5 px-2 py-1 text-[13px] ${
                        active ? "bg-[#e0e7ff] text-[#1e293b]" : "text-[#64748b] hover:bg-[#f1f5f9]"
                      }`}
                      onClick={() => {
                        const node = resolveNode(f.key);
                        if (node) void openFile(node, f.key.split("::")[0]);
                      }}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${ic.color}`} />
                      <span className="truncate">{f.path}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeView === "git" && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="px-3 py-1 text-[12px] text-[#64748b]">
                Changes ({dirtyFiles.length})
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-2">
                {dirtyFiles.length === 0 && (
                  <p className="px-2 py-3 text-[12px] text-[#64748b]">
                    No unsaved changes. Edit a file to see it here.
                  </p>
                )}
                {dirtyFiles.map((t) => (
                  <div key={t.key} className="flex items-center gap-1.5 px-2 py-1 text-[13px] text-[#64748b]">
                    <span className="text-[#e2c08d]">M</span>
                    <span className="truncate">{t.name}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#e2e8f0] p-2">
                <button
                  type="button"
                  disabled={dirtyFiles.length === 0}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#4f46e5] px-2 py-1.5 text-[12px] font-medium text-white disabled:opacity-40"
                  onClick={() => {
                    const n = dirtyFiles.length;
                    setDirty({});
                    showToast(`Committed ${n} change${n === 1 ? "" : "s"} (demo)`);
                  }}
                >
                  <GitCommitHorizontal className="h-3.5 w-3.5" />
                  Commit
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Editor area */}
        <main className="flex min-w-0 flex-1 flex-col bg-white">
          {openTabs.length > 0 ? (
            <div className="flex h-[34px] shrink-0 items-center overflow-x-auto border-b border-[#e2e8f0] bg-[#f8fafc]">
              {openTabs.map((t) => {
                const active = t.key === activeKey;
                return (
                  <div
                    key={t.key}
                    className={`group flex h-full shrink-0 cursor-pointer items-center gap-1.5 border-r border-[#e2e8f0] px-3 text-[12px] ${
                      active ? "bg-white text-[#1e293b]" : "text-[#64748b] hover:text-[#1e293b]"
                    }`}
                    onClick={() => {
                      setActiveKey(t.key);
                      setViewMode("code");
                    }}
                  >
                    <span className={active ? "text-[#4f46e5]" : "text-[#94a3b8]"}>
                      {dirty[t.key] ? "●" : ""}
                    </span>
                    {t.name}
                    <button
                      type="button"
                      className="rounded p-0.5 text-[#64748b] opacity-0 hover:bg-[#f1f5f9] hover:text-[#1e293b] group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(t.key);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
              <div className="ml-auto flex shrink-0 items-center gap-1 pr-2">
                {activeKey && isHtmlKey(activeKey) && (
                  <button
                    type="button"
                    className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] ${
                      viewMode === "preview"
                        ? "bg-[#f1f5f9] text-[#4f46e5]"
                        : "text-[#64748b] hover:bg-[#f1f5f9]"
                    }`}
                    onClick={runPreview}
                  >
                    {viewMode === "preview" ? <Code className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {viewMode === "preview" ? "Code" : "Preview"}
                  </button>
                )}
                <button
                  type="button"
                  className="rounded px-2 py-1 text-[11px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
                  onClick={() => void saveFile(activeKey!)}
                  title="Save (Ctrl+S)"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-[34px] shrink-0 items-center border-b border-[#e2e8f0] bg-[#f8fafc] px-3 text-[12px] text-[#64748b]">
              No files open
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-hidden">
            {activeKey ? (
              viewMode === "preview" ? (
                <iframe
                  key={activeKey}
                  srcDoc={previewHtml}
                  title="Preview"
                  className="h-full w-full bg-white"
                  sandbox="allow-scripts allow-modals allow-forms allow-popups"
                />
              ) : (
                <CodeEditor
                  path={activeNode?.path ?? activeKey}
                  content={contents[activeKey] ?? ""}
                  markers={[]}
                  activeLine={cursor.line}
                  onCursorChange={(line, col) => setCursor({ line, col })}
                  onEdit={(text) => editFile(activeKey, text)}
                  onRequestAi={(action) => {
                    setAiOpen(true);
                    setComposer(
                      `${action} ${activeNode?.name ?? ""}`.trim()
                    );
                    window.setTimeout(() => composerRef.current?.focus(), 80);
                  }}
                  showMinimap
                  loading={loadingKey === activeKey}
                />
              )
            ) : (
  <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <Image src="/logo.svg" alt="VedaApex" width={48} height={48} className="h-12 w-12" />
                <h2 className="text-lg font-semibold text-[#1e293b]">VedaApex AI Workspace</h2>
                <p className="max-w-sm text-[13px] text-[#64748b]">
                  Open a folder from your computer, upload files, or ask Apex AI to generate a
                  complete app. Everything runs right here in your browser.
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md bg-[#4f46e5] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#6366f1]"
                    onClick={() => void openFolder()}
                  >
                    <FolderPlus className="h-4 w-4" />
                    Open Folder
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md border border-[#e2e8f0] px-3 py-1.5 text-[13px] text-[#64748b] hover:bg-[#f1f5f9]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Files
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md border border-[#e2e8f0] px-3 py-1.5 text-[13px] text-[#64748b] hover:bg-[#f1f5f9]"
                    onClick={() => {
                      setAiOpen(true);
                      window.setTimeout(() => composerRef.current?.focus(), 80);
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Ask Apex AI
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Apex AI panel */}
        {aiOpen && (
          <aside
            className={`fixed inset-y-0 right-0 z-40 flex w-[360px] shrink-0 flex-col border-l border-[#e2e8f0] bg-[#f8fafc] transition-transform lg:static lg:z-auto lg:h-full ${
              aiOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center gap-2 border-b border-[#e2e8f0] bg-white px-3 py-2">
              <Sparkles className="h-5 w-5 text-[#4f46e5]" />
              <span className="text-[14px] font-semibold text-[#1e293b]">Apex AI</span>
              <span className="ml-auto flex items-center gap-2">
                <select
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="text-[11px] bg-white border border-[#e2e8f0] rounded px-2 py-1 text-[#1e293b] focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                  disabled={generating}
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id} disabled={!canAccessModel(m)}>
                      {m.name} {m.premium && canAccessModel(m) === false ? "🔒" : ""}
                    </option>
                  ))}
                </select>
              </span>
              <button
                type="button"
                className="rounded p-1 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
                onClick={() => setAiOpen(false)}
              >
                <PanelRight className="h-4 w-4" />
              </button>
            </div>
            <div className="border-b border-[#e2e8f0] bg-white px-3 py-2 text-[11px] text-[#94a3b8]">
              {selectedModelObj.premium && !canAccessModel(selectedModelObj)
                ? "Upgrade to Pro to use this model"
                : `Model: ${selectedModelObj.name} · ${selectedModelObj.premium ? "Premium" : "Free"}`}
            </div>

            <div ref={aiScrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              {aiMessages.length === 0 && !generating && (
                <div className="space-y-3">
                  <p className="text-[12px] leading-relaxed text-[#64748b]">
                    Describe an app and Apex AI will generate the complete source files — HTML,
                    JS, CSS and a README. Generated files appear in the explorer as a new project.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="rounded-full border border-[#e2e8f0] px-2.5 py-1 text-[11px] text-[#64748b] hover:border-[#4f46e5] hover:text-[#1e293b]"
                        onClick={() => void handleGenerate(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {aiMessages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-lg rounded-br-sm bg-[#4f46e5] px-3 py-1.5 text-[12px] leading-relaxed text-white">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex justify-start">
                    <div
                      className={`max-w-[95%] rounded-lg rounded-bl-sm border px-3 py-1.5 text-[12px] leading-relaxed ${
                        m.error
                          ? "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]"
                          : "border-[#e2e8f0] bg-white text-[#334155]"
                      }`}
                    >
                      <p>{m.text}</p>
                      {m.files && (
                        <div className="mt-2 space-y-1">
                          {m.files.slice(0, 6).map((f) => {
                            const ic = fileIcon(f.path);
                            const Icon = ic.icon;
                            return (
                              <button
                                key={f.path}
                                type="button"
                                className="flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] text-[#64748b] hover:bg-[#f1f5f9]"
                                onClick={() => {
                                  const gen = projects.find((p) => p.source === "generated");
                                  if (!gen) return;
                                  const node = findNode(gen.nodes, f.path);
                                  if (node) void openFile(node, gen.id);
                                }}
                              >
                                <Icon className={`h-3 w-3 shrink-0 ${ic.color}`} />
                                <span className="truncate">{f.path}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {generating && (
                <div className="flex justify-start">
                  <div className="rounded-lg rounded-bl-sm border border-[#e2e8f0] bg-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4f46e5]" />
                      <span className="text-[12px] text-[#64748b]">
                        {THINKING_MESSAGES[thinkingIdx]}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      {[1, 2, 3].map((s) => (
                        <span
                          key={s}
                          className={`h-1 rounded-full transition-all ${
                            buildStep >= s ? "w-6 bg-[#7aa2f7]" : "w-2 bg-[#1d2434]"
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-[10px] text-[#64748b]">
                        {buildStep === 1 ? "Understanding prompt" : buildStep === 2 ? "Generating files" : "Done"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {aiError && (
                <div className="flex items-start gap-1.5 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[12px] text-[#b91c1c]">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {aiError}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-[#e2e8f0] p-3 bg-white">
              <div className="mb-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-2 text-[12px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b] hover:border-[#4f46e5] transition-colors"
                  title="Attach files"
                >
                  <Paperclip className="h-4 w-4" />
                  <span>Attach Files</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    onUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
                <div className="ml-auto flex items-center gap-1.5 text-[10px] text-[#94a3b8]">
                  <kbd className="px-1.5 py-0.5 rounded border border-[#e2e8f0] bg-[#f8fafc]">Enter</kbd>
                  <span>Send</span>
                  <kbd className="px-1.5 py-0.5 rounded border border-[#e2e8f0] bg-[#f8fafc]">Shift+Enter</kbd>
                  <span>New line</span>
                </div>
              </div>
              <div className="relative">
                <textarea
                  ref={composerRef}
                  rows={Math.min(8, Math.max(2, composer.split("\n").length))}
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleGenerate(composer);
                    }
                  }}
                  placeholder="Describe an app to build… (drag & drop files here)"
                  className="w-full min-h-[80px] max-h-64 resize-none bg-[#fafafa] border border-[#e2e8f0] rounded-xl px-4 py-3 text-[14px] text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-all"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer?.files || []);
                    if (files.length) onUpload(files as unknown as FileList);
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#94a3b8]">
                  Model: <strong>{selectedModelObj.name}</strong> {selectedModelObj.premium && !canAccessModel(selectedModelObj) && <span className="text-amber-500">(Premium - Upgrade required)</span>}
                </span>
                <button
                  type="button"
                  disabled={!composer.trim() || generating || (selectedModelObj.premium && !canAccessModel(selectedModelObj))}
                  className="flex items-center gap-2 rounded-lg bg-[#4f46e5] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#4338ca] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  onClick={() => void handleGenerate(composer)}
                  title={selectedModelObj.premium && !canAccessModel(selectedModelObj) ? "Upgrade to use this model" : "Send"}
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>{generating ? "Generating..." : "Send"}</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Status bar */}
      <footer className="flex h-[22px] shrink-0 items-center gap-3 border-t border-[#e2e8f0] bg-[#f8fafc] px-3 text-[11px] text-[#64748b]">
        <span className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          main
        </span>
        <span className="hidden items-center gap-1 sm:flex">
          <Circle className="h-2 w-2 fill-[#3ecf8e] text-[#3ecf8e]" />
          Sync
        </span>
        <span className="hidden md:inline">Errors 0 · Warnings 0</span>
        <span className="hidden lg:inline">TypeScript</span>
        <span className="hidden lg:inline">UTF-8</span>
        <span className="hidden lg:inline">Spaces: 2</span>
        <span>
          Ln {cursor.line}, Col {cursor.col}
        </span>
        <span className="ml-auto flex items-center gap-1">
          <Zap className="h-3 w-3 text-[#4f46e5]" />
          VedaApex · Apex 2.2 (High)
        </span>
      </footer>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 z-[60] -translate-x-1/2 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-[13px] text-[#1e293b] shadow-2xl">
          {toast}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          onUpload(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}