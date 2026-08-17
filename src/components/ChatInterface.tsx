"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  Search,
  Library,
  Image as ImageIcon,
  Video,
  Sparkles,
  ChevronDown,
  Plus,
  SlidersHorizontal,
  Mic,
  AudioLines,
  PanelLeft,
  SendHorizontal,
  X,
  Check,
  LogIn,
  Lock,
  Paperclip,
  Globe,
  SearchCode,
  ChevronRight,
  ChevronLeft,
  FileText,
  Download,
  Unlock,
  Blocks,
  Plug,
  Puzzle,
  FileImage,
  FileVideo,
  FileSpreadsheet,
  FileArchive,
  FileType,
  File as FileIcon,
  ShieldCheck,
  ExternalLink,
  Pencil,
  Copy,
  Share,
  ThumbsUp,
  ThumbsDown,
  Mail,
  Instagram,
  Twitter,
  } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MessageContent from "@/components/MessageContent";
import RequirementWizard from "@/components/RequirementWizard";
import { getClientAiSettings } from "@/lib/ai-settings";
import { useDropzone } from "react-dropzone";
import type { Chat, Folder, Message } from "@/types";
import {
  saveChatToSupabase,
  getChatsFromSupabase,
  deleteChatFromSupabase,
  saveFolderToSupabase,
  deleteFolderFromSupabase,
  getFoldersFromSupabase,
  getStoredChatsSync,
  getStoredFoldersSync,
  migrateGuestChatsToUser,
  chatsKey,
  foldersKey,
} from "@/lib/supabase/chat";
import { THINKING_MESSAGES } from "@/lib/thinking-messages";
import { ensureCloudSession, getLocalBackendUser, hasBackendToken } from "@/lib/chat-memory";
import OAuthModal from "@/components/OAuthModal";
import ConnectorLogo from "@/components/ConnectorLogo";
import {
  CONNECTORS,
  loadConnections,
  saveConnections,
  type Connector,
} from "@/config/connectors";

const HEADER_MODELS = [
  { name: "VedaApex", price: "free" },
  { name: "VedaApex Pro", price: "200" },
  { name: "VedaApex Ultra", price: "1000" },
  { name: "VedaApex Max", price: "500" }
];

const CUSTOM_CONNECTOR_PERMISSIONS = [
  { id: "read", label: "Read data", desc: "View files, data & settings" },
  { id: "write", label: "Create & update", desc: "Add or modify content" },
  { id: "execute", label: "Execute actions", desc: "Run API calls & automations" },
  { id: "profile", label: "Access user info", desc: "Read profile & account details" },
  { id: "delete", label: "Delete data", desc: "Remove content (dangerous)" },
];

const COMPOSER_MODELS = [
  { name: "Apex 2.1", price: "free" },
  { name: "Apex 2.2 (Low)", price: "200" },
  { name: "Apex 2.2 (High)", price: "500" },
  { name: "Apex 3.0 Ultra (Deep Coding Reasoning)", price: "1000" }
];

const canAccess = (plan: string | undefined, price: string) => {
  if (price === "free") return true;
  if (!plan) return false;
  if (price === "200") return ["200", "500", "1000"].includes(plan);
  if (price === "500") return ["500", "1000"].includes(plan);
  if (price === "1000") return plan === "1000";
  return false;
};

function getFileTypeIcon(file: File) {
  const t = file.type;
  const n = file.name.toLowerCase();
  if (t.startsWith("image/")) return <FileImage className="h-5 w-5 text-blue-500" />;
  if (t.startsWith("video/")) return <FileVideo className="h-5 w-5 text-purple-500" />;
  if (t.startsWith("audio/")) return <AudioLines className="h-5 w-5 text-amber-500" />;
  if (t === "application/pdf") return <FileText className="h-5 w-5 text-red-500" />;
  if (n.endsWith(".doc") || n.endsWith(".docx") || t.includes("word"))
    return <FileType className="h-5 w-5 text-blue-500" />;
  if (
    n.endsWith(".xls") ||
    n.endsWith(".xlsx") ||
    n.endsWith(".csv") ||
    t.includes("excel") ||
    t.includes("spreadsheet")
  )
    return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
  if (n.endsWith(".zip") || n.endsWith(".rar") || n.endsWith(".7z"))
    return <FileArchive className="h-5 w-5 text-amber-600" />;
  if (t.startsWith("text/")) return <FileText className="h-5 w-5 text-violet-500" />;
  return <FileIcon className="h-5 w-5 text-foreground/50" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMessageTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function sanitizeChatsForStorage(chats: Chat[]): Chat[] {
  return chats.map((chat) => ({
    ...chat,
    messages: chat.messages.map((m) => {
      if (m.role !== "user" || (!m.file && !m.files)) return m;
      const strip = (f: { name: string; type: string; dataUrl: string }) => ({
        name: f.name,
        type: f.type,
        dataUrl: "",
      });
      return {
        ...m,
        file: m.file ? strip(m.file) : m.file,
        files: m.files ? m.files.map(strip) : m.files,
      };
    }),
  }));
}

export default function ChatInterface({ initialChatId }: { initialChatId?: string }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(COMPOSER_MODELS[0].name);
  const [headerModel, setHeaderModel] = useState(HEADER_MODELS[0].name);
  const [modelOpen, setModelOpen] = useState(false);
  const [headerModelOpen, setHeaderModelOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [barDocked, setBarDocked] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState("Thinking...");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [shareOpenIdx, setShareOpenIdx] = useState<number | null>(null);
  const [instaCopied, setInstaCopied] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, "good" | "bad">>(() => {
    try {
      return JSON.parse(localStorage.getItem("vedaapex_response_feedback") ?? "{}");
    } catch {
      return {};
    }
  });
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const userId = user?.id ?? null;
  const chatsRef = useRef<Chat[]>([]);
  const loadedScopeRef = useRef<string | null>(null);
  const firstStorageRunRef = useRef(true);
  const customLogoInputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const toolsBtnRef = useRef<HTMLButtonElement>(null);
  const composerModelRef = useRef<HTMLDivElement>(null);
  const headerModelRef = useRef<HTMLDivElement>(null);
  const [promoCode, setPromoCode] = useState("");
  const [authResolved, setAuthResolved] = useState(false);
  const clickCountRef = useRef(0);
  const lastClickRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const [connectorSearch, setConnectorSearch] = useState("");
  const [showConnectorsHub, setShowConnectorsHub] = useState(false);
  const [connectorConnections, setConnectorConnections] = useState<Record<string, string>>({});
  const [connectorEnabled, setConnectorEnabled] = useState<Record<string, boolean>>({});
  const [customConnectors, setCustomConnectors] = useState<{ id: string; name: string; url: string; logo?: string; permissions?: string[] }[]>([]);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customAdded, setCustomAdded] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customLogo, setCustomLogo] = useState("");
  const [customLogoDragOver, setCustomLogoDragOver] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [connectorFailed, setConnectorFailed] = useState<string[]>([]);
  const [oauthFor, setOauthFor] = useState<Connector | null>(null);

  useEffect(() => {
    setConnectorConnections(loadConnections());
    try {
      const rawEnabled = localStorage.getItem("vedaapex-connector-enabled");
      if (rawEnabled) setConnectorEnabled(JSON.parse(rawEnabled));
      const rawCustom = localStorage.getItem("vedaapex-custom-connectors");
      if (rawCustom) setCustomConnectors(JSON.parse(rawCustom));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  useEffect(() => {
    const nextModel = getClientAiSettings(user?.user_metadata?.plan).defaultModel;
    setModel((current) => (current === COMPOSER_MODELS[0].name ? nextModel : current));
  }, [user]);

  const toggleConnectorEnabled = (id: string) => {
    setConnectorEnabled((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("vedaapex-connector-enabled", JSON.stringify(next));
      return next;
    });
  };

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setCustomLogo(String(reader.result));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCustomLogoFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setCustomLogo(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleCustomLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setCustomLogoDragOver(false);
    handleCustomLogoFile(e.dataTransfer.files?.[0]);
  };

  const toggleCustomPermission = (id: string) => {
    setCustomPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const addCustomConnector = () => {
    const name = customName.trim();
    if (!name) return;
    const url = customUrl.trim() || "http://127.0.0.1:3000";
    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `http://${url}`;
    const next = [
      ...customConnectors,
      {
        id: `custom-${Date.now()}`,
        name,
        url: normalizedUrl,
        logo: customLogo || undefined,
        permissions: customPermissions.length ? customPermissions : undefined,
      },
    ];
    setCustomConnectors(next);
    localStorage.setItem("vedaapex-custom-connectors", JSON.stringify(next));
    setCustomAdded(true);
    setTimeout(() => {
      setCustomModalOpen(false);
      setCustomAdded(false);
      setCustomName("");
      setCustomUrl("");
      setCustomLogo("");
      setCustomPermissions([]);
    }, 900);
  };

  const removeCustomConnector = (id: string) => {
    const next = customConnectors.filter((c) => c.id !== id);
    setCustomConnectors(next);
    localStorage.setItem("vedaapex-custom-connectors", JSON.stringify(next));
  };
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; file: File; url: string | null }[]>([]);
  const [previewItem, setPreviewItem] = useState<{ id: string; file: File; url: string } | null>(null);

  const [imgW, setImgW] = useState<number | null>(null);
  const [imgH, setImgH] = useState<number | null>(null);
  const [keepRatio, setKeepRatio] = useState(true);
  const naturalDimRef = useRef<{ w: number; h: number } | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (!atBottom) setShowDisclaimer(false);
  };
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isThinking) return;
    const interval = setInterval(() => {
      const random = Math.floor(Math.random() * THINKING_MESSAGES.length);
      setThinkingMessage(THINKING_MESSAGES[random]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isThinking]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, []);

  const MAX_ATTACHMENTS = 10;

  const { getRootProps: getDropRootProps, getInputProps: getDropInputProps, isDragActive: isDropActive } = useDropzone({
    accept: {
      "image/*": [],
      "video/*": [],
      "application/pdf": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
      "application/vnd.ms-excel": [],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
      "application/vnd.ms-powerpoint": [],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [],
      "text/plain": [],
      "text/csv": [],
      "application/rtf": [],
    },
    onDrop: (acceptedFiles) => {
      addFiles(acceptedFiles);
    },
    onDropRejected: (fileRejections) => {
      const exceedsLimit = fileRejections.some((rejection) =>
        rejection.errors.some((error) => error.code === "too-many-files")
      );
      if (exceedsLimit) {
        alert(`You can attach a maximum of ${MAX_ATTACHMENTS} files at a time.`);
      }
    },
    maxFiles: MAX_ATTACHMENTS,
    noClick: true,
  });

  const attachedFilesCountRef = useRef(0);

  useEffect(() => {
    attachedFilesCountRef.current = attachedFiles.length;
  }, [attachedFiles]);

  const addFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const current = attachedFilesCountRef.current;
      const remaining = MAX_ATTACHMENTS - current;
      if (remaining <= 0) {
        alert(`You already reached the limit — you can attach a maximum of ${MAX_ATTACHMENTS} files at a time.`);
        return;
      }
      if (files.length > remaining) {
        alert(
          `You can attach a maximum of ${MAX_ATTACHMENTS} files at a time. ${files.length - remaining} file${
            files.length - remaining > 1 ? "s" : ""
          } skipped.`
        );
      }
      const next = files.slice(0, remaining).map((file, idx) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${idx}`,
        file,
        url:
          file.type.startsWith("image/") || file.type.startsWith("video/")
            ? URL.createObjectURL(file)
            : null,
      }));
      setAttachedFiles((prev) => {
        const merged = [...prev, ...next];
        attachedFilesCountRef.current = merged.length;
        return merged;
      });
      setTimeout(autoResize, 0);
    },
    [autoResize]
  );

  const removeAttachedFileAt = (id: string) => {
    setAttachedFiles((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((a) => a.id !== id);
    });
    setTimeout(autoResize, 0);
  };

  const clearAttachedFiles = () => {
    setAttachedFiles((prev) => {
      prev.forEach((a) => {
        if (a.url) URL.revokeObjectURL(a.url);
      });
      return [];
    });
    setTimeout(autoResize, 0);
  };

  const openPreview = (item: { id: string; file: File; url: string | null }) => {
    setImgW(null);
    setImgH(null);
    naturalDimRef.current = null;
    setPreviewItem({
      id: item.id,
      file: item.file,
      url: item.url ?? URL.createObjectURL(item.file),
    });
  };

  const closePreview = () => {
    if (previewItem) URL.revokeObjectURL(previewItem.url);
    setPreviewItem(null);
    setImgW(null);
    setImgH(null);
    naturalDimRef.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewItem) closePreview();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewItem]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (plusMenuRef.current && !plusMenuRef.current.contains(t)) setPlusMenuOpen(false);
      if (
        toolsMenuRef.current &&
        !toolsMenuRef.current.contains(t) &&
        (!toolsBtnRef.current || !toolsBtnRef.current.contains(t))
      )
        setToolsOpen(false);
      if (composerModelRef.current && !composerModelRef.current.contains(t)) setModelOpen(false);
      if (headerModelRef.current && !headerModelRef.current.contains(t)) setHeaderModelOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleImgWidthChange = (w: number) => {
    setImgW(w);
    if (keepRatio && naturalDimRef.current) {
      setImgH(Math.max(1, Math.round((w * naturalDimRef.current.h) / naturalDimRef.current.w)));
    }
  };

  const handleImgHeightChange = (h: number) => {
    setImgH(h);
    if (keepRatio && naturalDimRef.current) {
      setImgW(Math.max(1, Math.round((h * naturalDimRef.current.w) / naturalDimRef.current.h)));
    }
  };

  const resetImgSize = () => {
    setImgW(null);
    setImgH(null);
    naturalDimRef.current = null;
  };

  const txtFileCountRef = useRef(0);

  useEffect(() => {
    if (input.trim().length > 1000) {
      txtFileCountRef.current += 1;
      const txtFile = new File(
        [input.trim()],
        `prompt-${txtFileCountRef.current}.txt`,
        { type: "text/plain" }
      );
      addFiles([txtFile]);
      setInput("");
      setTimeout(autoResize, 0);
    }
  }, [input, addFiles, autoResize]);

  const filteredConnectors = useMemo(() => {
    const needle = connectorSearch.trim().toLowerCase();
    if (!needle) return CONNECTORS;
    return CONNECTORS.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.tagline.toLowerCase().includes(needle) ||
        c.description.toLowerCase().includes(needle)
    );
  }, [connectorSearch]);

  const handleConnectorOauthSuccess = (c: Connector) => {
    const next = {
      ...connectorConnections,
      [c.id]: new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    setConnectorConnections(next);
    saveConnections(next);
    setConnectorEnabled((prev) => ({ ...prev, [c.id]: true }));
    localStorage.setItem(
      "vedaapex-connector-enabled",
      JSON.stringify({ ...connectorEnabled, [c.id]: true })
    );
    setConnectorFailed((prev) => prev.filter((id) => id !== c.id));
    setOauthFor(null);
  };

  const handleConnectorOauthFailed = (c: Connector) => {
    setConnectorFailed((prev) => (prev.includes(c.id) ? prev : [...prev, c.id]));
    setOauthFor(null);
  };

  const handleConnectorDisconnect = (c: Connector) => {
    if (!confirm(`Disconnect ${c.name}?`)) return;
    const next = { ...connectorConnections };
    delete next[c.id];
    setConnectorConnections(next);
    saveConnections(next);
  };

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickRef.current > 1000) clickCountRef.current = 0;
    clickCountRef.current++;
    lastClickRef.current = now;
    if (clickCountRef.current === 10) {
        setPromoModalOpen(true);
        clickCountRef.current = 0;
    }
  };

  const applyPromoCode = async () => {
    const promoMap: Record<string, string> = {
        "Aman_200": "200", "Ansh_200": "200", "Himanshu_200": "200", "Raman_200": "200", "Apex_200_2.1": "200",
        "Aman_500": "500", "Raman_500": "500", "Ansh_500": "500", "Himanshu_500": "500", "Apex_500_2.2": "500",
        "Aman_1000": "1000", "Raman_1000": "1000", "Ansh_1000": "1000", "Himanshu_1000": "1000", "Apex_10001_2.2": "1000"
    };
    
    const code = promoCode.trim();
    const newPlan = promoMap[code];
    
    if (newPlan && user) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          // Backend OAuth/email login (no Supabase session): persist locally.
          try {
            const savedUser = JSON.parse(window.localStorage.getItem("vedaapex_user") ?? "{}");
            if (savedUser && typeof savedUser === "object") savedUser.plan = newPlan;
            window.localStorage.setItem("vedaapex_user", JSON.stringify(savedUser));
          } catch (e) {
            console.error("Could not update local user plan:", e);
          }
          setUser(prev => prev ? {
            ...prev,
            user_metadata: { ...prev.user_metadata, plan: newPlan }
          } : null);
          document.cookie = `user_plan=${encodeURIComponent(newPlan)}; path=/; max-age=${365 * 24 * 60 * 60}`;
          window.dispatchEvent(new Event("vedaapex-user-updated"));
          alert("Plan upgraded successfully!");
          setPromoModalOpen(false);
          setPromoCode("");
        } else {
          const { data, error } = await supabase.auth.updateUser({
            data: { plan: newPlan }
          });

          if (error) {
            console.error("Supabase update error:", error);
            alert("Error: " + error.message);
          } else {
            // Update local user state immediately
            setUser(prev => prev ? {
              ...prev,
              user_metadata: { ...prev.user_metadata, plan: newPlan }
            } : null);
            document.cookie = `user_plan=${encodeURIComponent(newPlan)}; path=/; max-age=${365 * 24 * 60 * 60}`;

            alert("Plan upgraded successfully!");
            setPromoModalOpen(false);
            setPromoCode("");
          }
        }
    } else {
        alert("Invalid promo code");
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/c\/([^/]+)$/);
      if (match) {
        setActiveChatId(match[1]);
      } else {
        setActiveChatId(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Load messages when activeChatId changes or chats load
  useEffect(() => {
    if (activeChatId && chats.length > 0) {
      const activeChat = chats.find(c => c.id === activeChatId);
      if (activeChat) {
        setMessages(activeChat.messages);
      }
    } else if (!activeChatId) {
      setMessages([]);
    }
  }, [activeChatId, chats]);

  // Monitor auth state. Backend OAuth/email logins have no Supabase session,
  // so fall back to the saved "vedaapex_user" record to stay logged in.
  useEffect(() => {
    const applyUser = (supabaseUser: User | null) => {
      if (supabaseUser) {
        setUser(supabaseUser);
        return;
      }
      const local = getLocalBackendUser();
      if (local) {
        setUser({
          id: local.id,
          email: local.email || undefined,
          aud: "authenticated",
          app_metadata: {},
          user_metadata: {
            plan: local.plan,
            avatar: local.avatar,
            full_name: local.name,
            username: local.name,
          },
          created_at: new Date().toISOString(),
        } as User);
      } else {
        setUser(null);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      applyUser(data.session?.user ?? null);
      setAuthResolved(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      applyUser(session?.user ?? null);
      setAuthResolved(true);
    });

    const onUserUpdated = () => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) applyUser(null);
      });
    };
    window.addEventListener("vedaapex-user-updated", onUserUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("vedaapex-user-updated", onUserUpdated);
    };
  }, []);

  useEffect(() => {
    if (mounted && authResolved && !user) {
      const hasGuestSession = document.cookie.split("; ").some((c) => c.startsWith("guest_session="));
      if (!hasGuestSession) {
        // Set guest session for 1 year so they have access without login
        document.cookie = "guest_session=" + Date.now() + "; path=/; max-age=" + (365 * 24 * 60 * 60);
      }
    }
  }, [mounted, authResolved, user]);

  // Load state from localStorage (per-user scoped)
  useEffect(() => {
    let active = true;

    async function loadData() {
      if (user) {
        try {
          // Move guest chats into this user's bucket so history survives login
          await migrateGuestChatsToUser(user.id).catch(console.error);

          const [dbChats, dbFolders] = await Promise.all([
            getChatsFromSupabase(user.id).catch(() => []),
            getFoldersFromSupabase(user.id).catch(() => [])
          ]);

          if (!active) return;

          // Ensure default folder :C exists
          let finalFolders = dbFolders;

          // Ensure default folder :C exists
          if (finalFolders.length === 0) {
            const defaultFolder = { id: "folder-c", name: ":C" };
            finalFolders = [defaultFolder];
            await saveFolderToSupabase(defaultFolder, user.id).catch(console.error);
          }

          loadedScopeRef.current = user.id;
          setChats(dbChats);
          setFolders(finalFolders);
        } catch (e) {
          console.error("Failed to fetch data from Supabase", e);
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }
      setChatsLoading(false);
    }

    function loadFromLocalStorage() {
      setChats(getStoredChatsSync(null));
      setFolders(getStoredFoldersSync(null));
      loadedScopeRef.current = null;

      const savedFolders = getStoredFoldersSync(null);
      if (savedFolders.length === 0) {
        const defaultFolder = { id: "folder-c", name: ":C" };
        setFolders([defaultFolder]);
        localStorage.setItem(foldersKey(null), JSON.stringify([defaultFolder]));
      }
      setChatsLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [user]);

  // Backup saves to localStorage on local state changes (per-user scoped).
  // Skips the first run so a fresh mount never wipes previously saved chats,
  // and skips writes until the active storage scope has been loaded.
  useEffect(() => {
    if (firstStorageRunRef.current) {
      firstStorageRunRef.current = false;
      return;
    }
    if (loadedScopeRef.current !== userId) return;
    try {
      // Strip heavy base64 file payloads — they blow past the localStorage
      // quota (QuotaExceededError) when images/videos are attached.
      localStorage.setItem(chatsKey(userId), JSON.stringify(sanitizeChatsForStorage(chats)));
    } catch {
      // localStorage full or unavailable — skip the backup, never crash the app
    }
  }, [chats, userId]);

  useEffect(() => {
    if (firstStorageRunRef.current) return;
    if (loadedScopeRef.current !== userId) return;
    try {
      localStorage.setItem(foldersKey(userId), JSON.stringify(folders));
    } catch {
      // ignore storage errors
    }
  }, [folders, userId]);

  // Keep a live mirror of chats for imperative handlers (send/edit) so
  // state updates never run against a stale closure.
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  function openChat(id: string | null) {
    setActiveChatId(id);
    if (id) {
      window.history.pushState(null, "", `/c/${id}`);
    } else {
      window.history.pushState(null, "", "/");
    }
  }

  function newChat() {
    setActiveChatId(null);
    setInput("");
    setBarDocked(false);
    window.history.pushState(null, "", "/");
  }

  async function createFolder(name: string) {
    const newFolder: Folder = { id: Date.now().toString(), name };
    setFolders([...folders, newFolder]);
    await saveFolderToSupabase(newFolder, userId).catch(console.error);
  }

  async function deleteFolder(id: string) {
    setFolders(folders.filter(f => f.id !== id));
    const updatedChats = chats.map(c => c.folderId === id ? { ...c, folderId: undefined } : c);
    setChats(updatedChats);
    
    await deleteFolderFromSupabase(id, userId).catch(console.error);
    // Update orphaned chats to have no folder
    const orphanedChats = updatedChats.filter(c => c.folderId === undefined);
    await Promise.all(orphanedChats.map(c => saveChatToSupabase(c, userId).catch(console.error)));
  }

  async function deleteChat(id: string) {
    setChats(chats.filter(c => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
      setMessages([]);
      setBarDocked(false);
    }
    await deleteChatFromSupabase(id, userId).catch(console.error);
  }

  async function renameChat(id: string, newName: string) {
    const updatedChats = chats.map(c => c.id === id ? { ...c, name: newName } : c);
    setChats(updatedChats);
    const targetChat = updatedChats.find(c => c.id === id);
    if (targetChat) {
      await saveChatToSupabase(targetChat, userId).catch(console.error);
    }
  }

  async function renameFolder(id: string, newName: string) {
    const updatedFolders = folders.map(f => f.id === id ? { ...f, name: newName } : f);
    setFolders(updatedFolders);
    const targetFolder = updatedFolders.find(f => f.id === id);
    if (targetFolder) {
      await saveFolderToSupabase(targetFolder, userId).catch(console.error);
    }
  }

  async function moveChatToFolder(chatId: string, folderId?: string) {
    const updatedChats = chats.map(c => c.id === chatId ? { ...c, folderId } : c);
    setChats(updatedChats);
    const targetChat = updatedChats.find(c => c.id === chatId);
    if (targetChat) {
      await saveChatToSupabase(targetChat, userId).catch(console.error);
    }
  }

  function generateName(text: string) {
    const raw = text.trim().split("\n")[0].trim();
    const clean = raw.replace(/[^\w\s]/g, "").trim();
    if (!clean) return "New Chat";

    const greetings = ["hi", "hello", "hey", "hii", "heyy", "hlo", "helo", "hai", "namaste", "namaskar", "good morning", "good afternoon", "good evening", "good night", "hy", "hye", "hey there", "hello there", "hi there", "kaise ho", "kya haal", "namastey"];
    const lower = clean.toLowerCase();
    if (greetings.some(g => lower === g || lower.startsWith(g + " "))) {
      const after = clean.split(" ").slice(1).join(" ");
      if (!after || after.length < 3) return "New Chat";
      const words = after.split(" ").slice(0, 5);
      return words.join(" ").charAt(0).toUpperCase() + words.join(" ").slice(1);
    }

    const words = clean.split(" ").slice(0, 5);
    const title = words.join(" ").charAt(0).toUpperCase() + words.join(" ").slice(1);
    return title.length > 40 ? title.slice(0, 37) + "..." : title;
  }

  async function send() {
    let text = input.trim();
    if (!text && attachedFiles.length > 0) {
      const txtFile = attachedFiles.find((a) => a.file.type === "text/plain");
      if (txtFile) {
        text = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.readAsText(txtFile.file);
        });
      }
    }
    if (!text && attachedFiles.length === 0) return;

    const filesData = await Promise.all(
      attachedFiles.map(
        (a) =>
          new Promise<{ name: string; type: string; dataUrl: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: a.file.name,
                type: a.file.type,
                dataUrl: reader.result as string,
              });
            };
            reader.readAsDataURL(a.file);
          })
      )
    );

    const userMsg: Message = {
      role: "user",
      text,
      timestamp: Date.now(),
      file: filesData[0],
      files: filesData.length > 0 ? filesData : undefined,
    };
    const sentAt = userMsg.timestamp!;
    const currentMessages = [...messages, userMsg];

    // Immediate UI update
    setMessages(currentMessages);
    setInput("");
    setTimeout(() => {
      autoResize();
      scrollToBottom();
    }, 0);
    clearAttachedFiles();
    setIsThinking(true); // Start thinking animation
    setToolsOpen(false); // Close tools menu on send

    // Chat is created (and saved to history) IMMEDIATELY with the user's
    // first message — the sidebar shows it even before the AI replies, and
    // nothing is lost if the reply fails or the tab closes.
    let chatId = activeChatId;
    const existingChat = chatId ? chatsRef.current.find((c) => c.id === chatId) : undefined;
    const isNewChat = !existingChat;
    let chatSnapshot: Chat | undefined;
    if (!existingChat) {
      const newId = Date.now().toString();
      const defaultFolder = folders.find(f => f.name === ":C")?.id;
      chatSnapshot = {
        id: newId,
        name: "New Chat",
        messages: currentMessages,
        createdAt: Date.now(),
        folderId: defaultFolder,
      };
      setChats((prev) => [chatSnapshot!, ...prev]);
      if (!chatId) {
        setActiveChatId(newId);
        window.history.pushState(null, "", `/c/${newId}`);
      }
      chatId = newId;
    } else {
      chatSnapshot = { ...existingChat, messages: currentMessages };
    }
    await saveChatToSupabase(chatSnapshot, userId).catch(console.error);

    const assistantMsg = await fetchAssistantReply(text, sentAt, filesData);

    setIsThinking(false); // Stop thinking animation
    const nextMessages = [...currentMessages, assistantMsg];
    setMessages(nextMessages);
    setShowDisclaimer(true);

    const updatedChat = { ...chatSnapshot, messages: nextMessages };
    setChats((prev) => prev.map((c) => (c.id === chatId ? updatedChat : c)));
    await saveChatToSupabase(updatedChat, userId).catch(console.error);

    // Generate title via AI after first message
    if (isNewChat) {
      generateChatTitle(chatId!, text).catch(console.error);
    }
  }

  async function generateChatTitle(chatId: string, message: string) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      let token = sessionData.session?.access_token;
      if (!token) {
        try {
          const match = document.cookie.split("; ").find((c) => c.startsWith("auth_token="));
          if (match) token = decodeURIComponent(match.slice("auth_token=".length));
        } catch {
          // ignore cookie read errors
        }
      }
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/chat/generate-title", {
        method: "POST",
        headers,
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      const title = data?.title?.trim() || generateName(message);

      let updatedChat: Chat | undefined;
      setChats(prev => {
        const next = prev.map(c => c.id === chatId ? { ...c, name: title } : c);
        updatedChat = next.find(c => c.id === chatId);
        return next;
      });
      setTimeout(() => {
        if (updatedChat) {
          saveChatToSupabase(updatedChat, userId).catch(console.error);
        }
      }, 0);
    } catch {
      const fallback = generateName(message);
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, name: fallback } : c));
    }
  }

  async function fetchAssistantReply(
    text: string,
    sentAt: number,
    files?: { name: string; type: string; dataUrl: string }[]
  ): Promise<Message> {
    let assistantText = "AI Brain is unavailable right now.";

    const getAccuracy = (plan: string | undefined) => {
      if (!plan || plan === "free") return "50%";
      if (plan === "200") return "75%";
      if (plan === "500") return "90%";
      if (plan === "1000") return "100%";
      return "50%";
    };

    const { data: sessionData } = await supabase.auth.getSession();
    let token = sessionData.session?.access_token;
    if (!token) {
      try {
        const match = document.cookie.split("; ").find((c) => c.startsWith("auth_token="));
        if (match) token = decodeURIComponent(match.slice("auth_token=".length));
      } catch {
        // ignore cookie read errors
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      // Create/link a backend cloud chat session (Chat Memory) so history
      // survives across devices — only when the user is logged in.
      let cloudSessionId: string | null = null;
      if (activeChatId) {
        try {
          if (await hasBackendToken()) {
            cloudSessionId = await ensureCloudSession(activeChatId);
          }
        } catch (e) {
          console.warn("Cloud session setup failed:", e);
        }
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: text,
          chat_id: activeChatId,
          session_id: cloudSessionId,
          model,
          intent: "general",
          responseMode: "structured",
          accuracy: getAccuracy(user?.user_metadata?.plan),
          system_prompt: getClientAiSettings(user?.user_metadata?.plan).systemPrompt,
          file: files?.[0],
          files: files && files.length > 0 ? files : undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "AI Brain request failed");
      }

      assistantText =
        typeof data?.assistant_response === "string" && data.assistant_response.trim().length > 0
          ? data.assistant_response
          : typeof data?.response === "string" && data.response.trim().length > 0
            ? data.response
            : data?.quotaExceeded
              ? "AI usage is exhausted right now. Please try again later."
              : "AI Brain returned an empty response.";
    } catch (error) {
      console.error("Failed to send chat message", error);
      if (error instanceof Error && error.message) {
        assistantText = error.message;
      }
    }

    return {
      role: "assistant",
      text: assistantText,
      timestamp: Date.now(),
      durationMs: Date.now() - sentAt,
    };
  }

  const persistEditedMessages = (nextMessages: Message[]) => {
    setChats((prev) => {
      const currentChat = prev.find((c) => c.id === activeChatId);
      if (!currentChat) return prev;
      const updatedChat: Chat = {
        ...currentChat,
        messages: nextMessages,
      };
      saveChatToSupabase(updatedChat, userId).catch(console.error);
      return prev.map((c) => (c.id === activeChatId ? updatedChat : c));
    });
  };

  const handleEditStart = (i: number) => {
    const m = messages[i];
    if (!m) return;
    setEditingIndex(i);
    setEditingText(m.text);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditingText("");
  };

  const handleCopy = async (i: number) => {
    const text = messages[i]?.text;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx((cur) => (cur === i ? null : cur)), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const nativeShare = async (text: string) => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ text, url });
        return true;
      } catch (e) {
        // AbortError = user cancelled the native sheet; treat as handled
        if ((e as any)?.name === "AbortError") return true;
      }
    }
    return false;
  };

  const shareToWhatsApp = (text: string) => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`,
      "_blank",
    );
    setShareOpenIdx(null);
  };

  const shareToGmail = (text: string) => {
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
        "Shared from VedaApex",
      )}&body=${encodeURIComponent(text)}`,
      "_blank",
    );
    setShareOpenIdx(null);
  };

  const shareToInstagram = async (text: string) => {
    // Instagram has no public web share URL — use the native OS share sheet
    // (opens the Instagram app on mobile). Fallback: copy to clipboard.
    const shared = await nativeShare(text).catch(() => false);
    if (!shared) {
      try {
        await navigator.clipboard.writeText(text);
        setInstaCopied(true);
        setTimeout(() => setInstaCopied(false), 2000);
      } catch {
        // clipboard unavailable
      }
    }
    setShareOpenIdx(null);
  };

  const shareToX = (text: string) => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(
        typeof window !== "undefined" ? window.location.href : "",
      )}`,
      "_blank",
    );
    setShareOpenIdx(null);
  };

  const shareToReddit = (text: string) => {
    window.open(
      `https://www.reddit.com/submit?url=${encodeURIComponent(
        typeof window !== "undefined" ? window.location.href : "",
      )}&title=${encodeURIComponent(text.slice(0, 300))}`,
      "_blank",
    );
    setShareOpenIdx(null);
  };

  const handleFeedback = (i: number, rating: "good" | "bad") => {
    const m = messages[i];
    if (!m || m.role !== "assistant") return;
    const key = `${activeChatId}:${i}`;
    setFeedback((prev) => {
      const next = { ...prev };
      if (next[key] === rating) {
        delete next[key];
      } else {
        next[key] = rating;
      }
      try {
        localStorage.setItem("vedaapex_response_feedback", JSON.stringify(next));
      } catch {
        // storage full or unavailable
      }
      return next;
    });
  };

  const handleEditSave = async () => {
    if (editingIndex === null) return;
    const old = messages[editingIndex];
    if (!old || old.role !== "user") {
      handleEditCancel();
      return;
    }
    const newText = editingText.trim();
    if (!newText || newText === old.text) {
      handleEditCancel();
      return;
    }

    const updated = messages.map((m, idx) =>
      idx === editingIndex ? { ...m, text: newText } : m
    );
    const after = editingIndex + 1;
    const finalMessages = updated.slice(0, after);
    if (updated.length > after && updated[after].role === "assistant") {
      finalMessages.push(...updated.slice(after + 1));
    } else {
      finalMessages.push(...updated.slice(after));
    }

    setEditingIndex(null);
    setEditingText("");
    setMessages(finalMessages);
    persistEditedMessages(finalMessages);
    scrollToBottom();

    // Re-run the AI with the corrected question (user edits only)
    if (old.role === "user") {
      const files = old.files ?? (old.file ? [old.file] : undefined);
      setIsThinking(true);
      const sentAt = old.timestamp ?? Date.now();
      const assistantMsg = await fetchAssistantReply(newText, sentAt, files);
      setIsThinking(false);
      const withReply = [...finalMessages, assistantMsg];
      setMessages(withReply);
      persistEditedMessages(withReply);
      setShowDisclaimer(true);
      setTimeout(scrollToBottom, 0);
    }
  };

  const greeting = useMemo(() => {
    if (!mounted) return "Good day";
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, [mounted]);

  const displayName = useMemo(() => {
    if (user) return user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split("@")[0] || "User";
    if (!mounted) return "User";
    try {
      const cookieName = document.cookie
        .split("; ")
        .find((c) => c.startsWith("user_name="));
      if (cookieName) {
        const val = decodeURIComponent(cookieName.split("=").slice(1).join("="));
        if (val) return val;
      }
    } catch {
      // ignore cookie read errors
    }
    return "User";
  }, [user, mounted]);

  return (
    <div className="h-screen w-full">
      <div className="flex h-full w-full overflow-hidden bg-white">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          newChat={newChat}
          activeChatId={activeChatId}
          setActiveChat={openChat}
          chats={chats}
          chatsLoading={chatsLoading}
          deleteChat={deleteChat}
          renameChat={renameChat}
          onLogoClick={handleLogoClick}
        />

        {/* Main */}
        <main className="relative flex flex-1 flex-col min-h-0">
          {/* Chat header */}
          <div className="relative flex items-center justify-between px-4 sm:px-6 pt-5">
            <div className="flex items-center gap-6 md:gap-8 min-w-0">
                {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="rounded-md p-1.5 text-foreground/60 hover:bg-black/5 shrink-0"
                    aria-label="Show sidebar"
                    >
                    <PanelLeft className="h-[18px] w-[18px]" />
                </button>
                )}
                {/* Header Model Selector */}
                <div className="relative" ref={headerModelRef}>
                    <button
                        onClick={() => setHeaderModelOpen(!headerModelOpen)}
                        className="flex items-center gap-2 text-[15px] font-medium text-foreground/80 hover:text-foreground whitespace-nowrap"
                    >
                        <span className="truncate max-w-[130px] sm:max-w-none">{headerModel}</span>
                        <ChevronDown className="h-4 w-4 text-foreground/55 shrink-0" />
                    </button>
                    {headerModelOpen && (
                        <div className="absolute left-0 top-8 z-20 w-48 rounded-lg border border-black/10 bg-white p-1 shadow-lg">
                            {HEADER_MODELS.map((m) => {
                                const allowed = canAccess(user?.user_metadata?.plan, m.price);
                                return (
                                    <button
                                        key={m.name}
                                        onClick={() => {
                                            if (allowed) {
                                                setHeaderModel(m.name);
                                                setHeaderModelOpen(false);
                                            } else {
                                                router.push("/upgrade");
                                            }
                                        }}
                                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-black/5"
                                    >
                                        {m.name}
                                        {!allowed && <Lock className="h-3 w-3 text-foreground/40" />}
                                        {headerModel === m.name && allowed && <Check className="h-4 w-4 text-foreground/70" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            
            <Link href="/upgrade" className="shrink-0 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-full shadow hover:opacity-90 transition-all">
                Upgrade
            </Link>
          </div>

          {showConnectorsHub ? (
            <div className="scrollable-container flex-1 w-full overflow-y-auto px-6 md:px-12 py-8 bg-[#f5f5f7] dark:bg-[#121310] animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="max-w-4xl mx-auto">
                <button
                  onClick={() => setShowConnectorsHub(false)}
                  className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-6 transition-colors font-medium"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Chat
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold tracking-tight text-foreground/85">Browser Connectors</h2>
                      <button
                        onClick={() => setCustomModalOpen(true)}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-black/10 bg-white dark:bg-[#1a1b18] px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:text-foreground hover:border-black/20 transition-colors"
                      >
                        <Plug className="h-3.5 w-3.5 text-emerald-500" />
                        Add Custom
                      </button>
                    </div>
                    <p className="text-sm text-foreground/50 mt-2">Connect and launch integrations directly inside VedaApex workspace.</p>
                  </div>
                  
                  {/* Connector Search Option */}
                  <div className="relative w-full md:w-72 shrink-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-foreground/45" />
                    <input
                      type="text"
                      placeholder="Search connectors..."
                      value={connectorSearch}
                      onChange={(e) => setConnectorSearch(e.target.value)}
                      className="w-full bg-white dark:bg-black/15 border border-black/10 rounded-xl py-2.5 pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 text-foreground"
                    />
                    {connectorSearch && (
                      <button onClick={() => setConnectorSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/75">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Connected services */}
                {Object.keys(connectorConnections).length > 0 && (
                  <div className="mb-8">
                    <p className="text-xs font-medium uppercase tracking-wider text-foreground/40 mb-3">
                      Connected services
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {CONNECTORS.filter((c) => connectorConnections[c.id]).map((c) => (
                        <Link
                          key={c.id}
                          href={`/connectors/${c.id}`}
                          onClick={() => setShowConnectorsHub(false)}
                          className="flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/25 bg-white dark:bg-[#1a1b18] px-3.5 py-2 shadow-sm hover:shadow-md transition-all"
                        >
                          <span className="flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/25 bg-white dark:bg-[#1a1b18] px-3.5 py-2 shadow-sm hover:shadow-md transition-all">
                            <ConnectorLogo connector={c} size="sm" />
                            <span className="text-[13px] font-medium text-foreground/75">{c.name}</span>
                            <Check className="h-3 w-3 text-emerald-500" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grid of Connectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredConnectors.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-sm text-foreground/40 italic bg-white dark:bg-[#1a1b18] border border-black/5 rounded-2xl">
                      No connectors found
                    </div>
                  ) : (
                    filteredConnectors.map((c) => {
                      const isConnected = Boolean(connectorConnections[c.id]);
                      const isFailed = connectorFailed.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          className={`flex flex-col bg-white dark:bg-[#1a1b18] border rounded-2xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                            isConnected
                              ? "border-emerald-200 dark:border-emerald-500/25"
                              : "border-black/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-5">
                            <Link
                              href={`/connectors/${c.id}`}
                              onClick={() => setShowConnectorsHub(false)}
                              className="shrink-0"
                              aria-label={`Open ${c.name} details`}
                            >
                              <ConnectorLogo connector={c} size="md" />
                            </Link>
                            {isConnected ? (
                              <button
                                onClick={() => handleConnectorDisconnect(c)}
                                className="px-4 py-1.5 border border-black/10 text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold rounded-lg transition-colors"
                              >
                                Disconnect
                              </button>
                            ) : isFailed ? (
                              <button
                                onClick={() => setOauthFor(c)}
                                className="px-4 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 text-xs font-semibold rounded-lg transition-colors"
                              >
                                Reload
                              </button>
                            ) : (
                              <button
                                onClick={() => setOauthFor(c)}
                                className="px-4 py-1.5 bg-[#3b3b3b] dark:bg-white dark:text-black hover:opacity-85 text-white text-xs font-semibold rounded-lg transition-all"
                              >
                                Connect
                              </button>
                            )}
                          </div>
                          <Link href={`/connectors/${c.id}`} onClick={() => setShowConnectorsHub(false)}>
                            <h3 className="text-base font-bold text-foreground/85 hover:underline">
                              {c.name}
                            </h3>
                            <p className="text-xs text-foreground/50 mt-2.5 leading-relaxed flex-1">
                              {c.tagline}
                            </p>
                          </Link>
                        </div>
                      );
                    })
                  )}
                </div>
              {/* Custom connectors grid */}
                {(customConnectors.length > 0 || connectorSearch.trim()) && (
                  <div className="mt-10">
                    <p className="text-xs font-medium uppercase tracking-wider text-foreground/40 mb-3">
                      Custom connectors
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {customConnectors
                        .filter((cc) =>
                          connectorSearch.trim()
                            ? cc.name.toLowerCase().includes(connectorSearch.trim().toLowerCase())
                            : true
                        )
                        .map((cc) => (
                          <div
                            key={cc.id}
                            className="flex flex-col bg-white dark:bg-[#1a1b18] border border-black/5 rounded-2xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                          >
                            <div className="flex items-start gap-3 mb-4">
                              {cc.logo ? (
                                <img
                                  src={cc.logo}
                                  alt=""
                                  className="h-9 w-9 shrink-0 rounded-xl border border-black/10 bg-black/5 object-contain"
                                />
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-slate-600">
                                  <Puzzle className="h-4 w-4 text-white" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <h3 className="truncate text-base font-bold text-foreground/85">{cc.name}</h3>
                                <p className="mt-0.5 truncate text-xs text-foreground/50">{cc.url}</p>
                              </div>
                              <button
                                onClick={() => removeCustomConnector(cc.id)}
                                aria-label={`Remove ${cc.name}`}
                                className="shrink-0 rounded-lg p-1.5 text-foreground/30 hover:bg-black/5 hover:text-red-500 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            {cc.permissions && cc.permissions.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {cc.permissions.map((p) => (
                                  <span
                                    key={p}
                                    className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                                  >
                                    {CUSTOM_CONNECTOR_PERMISSIONS.find((x) => x.id === p)?.label ?? p}
                                  </span>
                                ))}
                              </div>
                            )}
                            <a
                              href={cc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-auto pt-4"
                            >
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#3b3b3b] px-4 py-2 text-xs font-semibold text-white hover:opacity-85 transition-opacity dark:bg-white dark:text-black">
                                Launch
                                <ExternalLink className="h-3 w-3" />
                              </span>
                            </a>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative flex flex-1 min-w-0 overflow-hidden">
              <div
                className="flex flex-1 flex-col items-center pl-6 pr-0 overflow-hidden min-w-0"
              >
              {messages.length === 0 ? (
                <div className="flex w-full max-w-[720px] flex-col items-center pt-24 md:pt-28">
                  <h1 className="text-center text-[28px] font-medium tracking-tight text-foreground/85 md:text-[32px]">
                    {greeting}, {displayName}
                  </h1>
                </div>
              ) : (
                <div ref={messagesContainerRef} onScroll={handleScroll} className="scrollable-container flex-1 w-full overflow-y-auto py-6 pb-40 min-h-0">
                  <div className="max-w-[720px] mx-auto flex flex-col justify-start min-h-0 space-y-6">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} ${m.role === "assistant" ? "relative animate-in fade-in slide-in-from-bottom-2 duration-300" : ""}`}
                    >
                      {m.role === "user" &&
                        (m.files?.length ? m.files : m.file ? [m.file] : [])
                          .filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"))
                          .map((f, fi) =>
                            f.type.startsWith("video/") ? (
                              <video
                                key={fi}
                                src={f.dataUrl}
                                muted
                                playsInline
                                onClick={() =>
                                  openPreview({
                                    id: `${f.name}-${fi}`,
                                    file: { name: f.name, type: f.type, size: 0 } as File,
                                    url: f.dataUrl,
                                  })
                                }
                                className="max-w-[200px] rounded-lg object-cover mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                              />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={fi}
                                src={f.dataUrl}
                                alt={f.name}
                                onClick={() =>
                                  openPreview({
                                    id: `${f.name}-${fi}`,
                                    file: { name: f.name, type: f.type, size: 0 } as File,
                                    url: f.dataUrl,
                                  })
                                }
                                className="max-w-[200px] rounded-lg object-cover mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                              />
                            ),
                          )}
                      <div
                        className={`max-w-[80%] text-[15px] ${
                          m.role === "user" || editingIndex === i
                            ? "bg-black/[0.06] text-foreground rounded-2xl px-4 py-2.5"
                            : "text-foreground/85"
                        }`}
                      >
                        {editingIndex === i ? (
                          <div>
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              autoFocus
                              rows={Math.min(6, Math.max(1, editingText.split("\n").length))}
                              className="w-full min-w-[220px] resize-none bg-transparent text-[15px] outline-none"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleEditSave();
                                }
                                if (e.key === "Escape") handleEditCancel();
                              }}
                            />
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                onClick={handleEditSave}
                                aria-label="Save edited message"
                                title="Save"
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 transition-colors hover:bg-emerald-500/25"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={handleEditCancel}
                                aria-label="Cancel editing"
                                title="Cancel"
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-foreground/50 transition-colors hover:bg-black/10"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : m.role === "assistant" ? (
                          <MessageContent
                            text={m.text}
                            onSendPrompt={(prompt) => {
                              setInput(prompt);
                              setTimeout(() => {
                                const textarea = document.querySelector<HTMLTextAreaElement>(
                                  'textarea[placeholder*="Ask"]',
                                );
                                textarea?.focus();
                              }, 0);
                            }}
                          />
                        ) : (
                          m.text
                        )}
                      </div>
                      <div
                        className={`relative mt-1 flex items-center gap-0.5 ${
                          m.role === "user" ? "justify-end" : ""
                        }`}
                      >
                        <button
                          onClick={() => handleCopy(i)}
                          aria-label="Copy message"
                          title="Copy"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-foreground/30 transition-colors hover:bg-black/5 hover:text-foreground/70"
                        >
                          {copiedIdx === i ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditStart(i)}
                          aria-label="Edit message"
                          title="Edit"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-foreground/30 transition-colors hover:bg-black/5 hover:text-foreground/70"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {m.role === "assistant" && (
                          <>
                            <button
                              onClick={() => setShareOpenIdx(shareOpenIdx === i ? null : i)}
                              aria-label="Share response"
                              title="Share"
                              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                                shareOpenIdx === i
                                  ? "bg-black/5 text-foreground/70"
                                  : "text-foreground/30 hover:bg-black/5 hover:text-foreground/70"
                              }`}
                            >
                              <Share className="h-3.5 w-3.5" />
                            </button>
                            {shareOpenIdx === i && (
                              <div className="absolute bottom-full left-0 z-50 mb-2 flex items-center gap-1 rounded-xl border border-black/[0.06] bg-white p-1.5 shadow-lg">
                                <button
                                  onClick={() => shareToWhatsApp(m.text)}
                                  aria-label="Share on WhatsApp"
                                  title="WhatsApp"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
                                >
                                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#25D366]">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
                                </button>
                                <button
                                  onClick={() => shareToGmail(m.text)}
                                  aria-label="Share on Gmail"
                                  title="Gmail"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
                                >
                                  <Mail className="h-4 w-4 text-red-500" />
                                </button>
                                <button
                                  onClick={() => shareToInstagram(m.text)}
                                  aria-label="Share on Instagram"
                                  title="Instagram"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
                                >
                                  {instaCopied ? (
                                    <Check className="h-4 w-4 text-emerald-600" />
                                  ) : (
                                    <Instagram className="h-4 w-4 text-pink-500" />
                                  )}
                                </button>
                                <button
                                  onClick={() => shareToX(m.text)}
                                  aria-label="Share on X"
                                  title="X (Twitter)"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
                                >
                                  <Twitter className="h-4 w-4 text-sky-500" />
                                </button>
                                <button
                                  onClick={() => shareToReddit(m.text)}
                                  aria-label="Share on Reddit"
                                  title="Reddit"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
                                >
                                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                                    r/
                                  </span>
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => handleFeedback(i, "good")}
                              aria-label="Good response"
                              title="Good response"
                              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                                feedback[`${activeChatId}:${i}`] === "good"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "text-foreground/30 hover:bg-black/5 hover:text-foreground/70"
                              }`}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(i, "bad")}
                              aria-label="Bad response"
                              title="Bad response"
                              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                                feedback[`${activeChatId}:${i}`] === "bad"
                                  ? "bg-red-500/10 text-red-500"
                                  : "text-foreground/30 hover:bg-black/5 hover:text-foreground/70"
                              }`}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                      {m.role === "user" && m.timestamp && (
                        <div className="mt-1 text-[10px] text-foreground/35 text-right">
                          {formatMessageTime(m.timestamp)}
                        </div>
                      )}
                    </div>
                  ))}
                  {shareOpenIdx !== null && (
                    <div className="fixed inset-0 z-40" onClick={() => setShareOpenIdx(null)} />
                  )}
                  {isThinking && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-3 rounded-2xl px-1 py-1">
                        <video
                          src="/logo_transparent.webm"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="h-14 w-14 shrink-0 object-contain"
                        />
                        <span className="text-[15px] text-foreground/50">{thinkingMessage}</span>
                      </div>
                    </div>
                  )}
                  {showDisclaimer && (
                    <div className="flex justify-center pt-4 pb-2">
                      <p className="text-[11px] text-foreground/25 text-center px-4">
                        VedaApex can make mistakes. Check important info.
                      </p>
                    </div>
                  )}
                  <div className="h-24" />
                </div>
                </div>
              )}

              {/* Composer - bottom on chat, inline near center on empty */}
              <div
                className={
                  messages.length === 0 && !input.trim() && !barDocked
                    ? "relative z-10 w-full max-w-[720px] mx-auto mt-6"
                    : "absolute bottom-0 left-0 right-0 w-full max-w-[720px] mx-auto pb-6 z-30 pointer-events-auto bg-gradient-to-t from-[var(--background)] via-[var(--background)]/95 to-transparent pt-3 px-3 sm:px-0"
                }
              >
                <div className="space-y-2">
                  {activeTool && (
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-black/[0.05] px-3 py-1 text-xs text-foreground/70">
                      {activeTool}
                      <button onClick={() => setActiveTool(null)} aria-label="Clear tool">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div
                    {...getDropRootProps()}
                    className={`rounded-3xl border transition-all relative ${
                      attachedFiles.length > 0 ? "px-4 py-4 sm:px-5 sm:py-5" : "px-3 py-3 sm:px-5 sm:py-4"
                    } ${
                      isDropActive
                        ? "border-blue-400 bg-blue-50/50"
                        : "border-black/[0.06] bg-white shadow-sm"
                    }`}
                  >
                  <input {...getDropInputProps()} />
                  {isDropActive && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-blue-50/80 z-10">
                      <span className="text-sm font-medium text-blue-600">Drop files here (images, videos, docs — up to 10)</span>
                    </div>
                  )}
                  {attachedFiles.length > 0 && (
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {attachedFiles.map((item) => (
                        <div key={item.id} className="relative group shrink-0">
                          <button
                            onClick={() => openPreview(item)}
                            title={`${item.file.name} — click to preview`}
                            className="flex h-12 items-center overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm cursor-pointer transition hover:border-black/20 text-left"
                          >
                            {item.url ? (
                              <span className="h-full w-16 shrink-0 overflow-hidden">
                                {item.file.type.startsWith("video/") ? (
                                  <video
                                    src={item.url}
                                    muted
                                    playsInline
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.url} alt={item.file.name} className="h-full w-full object-cover" />
                                )}
                              </span>
                            ) : (
                              <span className="flex h-full w-10 shrink-0 items-center justify-center bg-black/[0.04]">
                                {getFileTypeIcon(item.file)}
                              </span>
                            )}
                            <span className="flex min-w-0 flex-col pr-2.5 pl-2">
                              <span className="max-w-[130px] truncate text-xs font-medium text-foreground">
                                {item.file.name}
                              </span>
                              <span className="text-[10px] text-foreground/45">
                                {formatFileSize(item.file.size)}
                              </span>
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAttachedFileAt(item.id);
                            }}
                            className="absolute -top-2 -right-2 rounded-full bg-white p-0.5 shadow-sm border border-black/10 opacity-50 group-hover:opacity-100 transition-opacity"
                            aria-label={`Remove ${item.file.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                        {(() => {
                          const imgCount = attachedFiles.filter((a) => a.file.type.startsWith("image/")).length;
                          const vidCount = attachedFiles.filter((a) => a.file.type.startsWith("video/")).length;
                          const docCount = attachedFiles.length - imgCount - vidCount;
                          const parts: string[] = [];
                          if (imgCount > 0) parts.push(`${imgCount} image${imgCount > 1 ? "s" : ""}`);
                          if (vidCount > 0) parts.push(`${vidCount} video${vidCount > 1 ? "s" : ""}`);
                          if (docCount > 0) parts.push(`${docCount} file${docCount > 1 ? "s" : ""}`);
                          return parts.join(" · ");
                        })()}
                      </span>
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      autoResize();
                      if (e.target.value.trim()) setBarDocked(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    onFocus={() => {
                      setShowDisclaimer(false);
                      scrollToBottom();
                    }}
                    rows={1}
                    className="w-full bg-transparent text-[15px] text-foreground placeholder:text-foreground/25 focus:outline-none resize-none overflow-hidden"
                    placeholder={activeTool ? `Ask in ${activeTool}...` : "Ask anything"}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="relative flex items-center gap-1">
                      <input
                        ref={fileRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          e.target.value = "";
                          addFiles(files);
                        }}
                      />
                      <div className="relative" ref={plusMenuRef}>
                        <button
                          onClick={() => {
                            setPlusMenuOpen((o) => !o);
                            setToolsOpen(false);
                          }}
                          className="rounded-full bg-black/5 p-2 text-foreground/60 transition-colors hover:bg-black/10"
                          aria-label="Add content"
                        >
                          <Plus className="h-[18px] w-[18px]" />
                        </button>
                        {plusMenuOpen && (
                          <div 
                            className="absolute bottom-12 left-0 z-20"
                          >
                            {/* Main Plus Menu */}
                            <div className="w-56 rounded-xl border border-black/10 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-200 dark:bg-[var(--card)]">
                              {[
                                { name: "Attach File", icon: <Paperclip className="h-4 w-4" />, action: () => fileRef.current?.click() },
                                { name: "Image Generation", icon: <ImageIcon className="h-4 w-4" />, action: () => router.push("/image-generator") },
                                { name: "Recent Files", icon: <Library className="h-4 w-4" />, action: () => router.push("/recent-files") },
                                { name: "Web Search", icon: <Globe className="h-4 w-4" />, action: () => setActiveTool("Web Search") },
                                { name: "Deep Search", icon: <SearchCode className="h-4 w-4" />, action: () => {
                                  const plan = user?.user_metadata?.plan || "free";
                                  if (["ultra", "max"].includes(plan)) {
                                    setActiveTool("Deep Search");
                                  } else {
                                    router.push("/upgrade");
                                  }
                                }, locked: !["ultra", "max"].includes(user?.user_metadata?.plan || "") },
                                { name: "Connectors", icon: <Blocks className="h-4 w-4" />, action: () => setShowConnectorsHub(true) },
                              ].map((item) => (
                                <div key={item.name} className="relative group">
                                  <button
                                    onClick={() => {
                                      if (item.action) item.action();
                                      setPlusMenuOpen(false);
                                    }}
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-black/5 text-foreground/80 hover:text-foreground transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      {item.icon}
                                      {item.name}
                                    </div>
                                    {item.locked && <Lock className="h-3 w-3 text-foreground/40" />}
                                    {item.name === "Connectors" && (
                                      <ChevronRight className="h-3.5 w-3.5 text-foreground/30 group-hover:text-foreground/60 transition-colors" />
                                    )}
                                  </button>

                                  {item.name === "Connectors" && (
                                    <div className="absolute left-full bottom-0 z-30 w-80 rounded-xl border border-black/10 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150 hidden group-hover:block">
                                      <div className="pointer-events-none absolute -left-1 bottom-5 h-2 w-2 rotate-45 border-l border-t border-black/10 bg-white" />
                                      <p className="flex items-center gap-1.5 px-3 pt-1.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-foreground/45">
                                        <Sparkles className="h-3 w-3 text-violet-500" />
                                        VedaApex Connectors
                                      </p>

                                      <button
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          setPlusMenuOpen(false);
                                          setShowConnectorsHub(true);
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-black/5 text-foreground/85 hover:text-foreground transition-colors"
                                      >
                                        <Globe className="h-4 w-4 shrink-0 text-blue-500" />
                                        <span className="flex-1 text-left">Browser Connectors</span>
                                      </button>
                                      <button
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          setPlusMenuOpen(false);
                                          setCustomModalOpen(true);
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-black/5 text-foreground/85 hover:text-foreground transition-colors"
                                      >
                                        <Plug className="h-4 w-4 text-emerald-500" />
                                        <span className="flex-1 text-left">Add Custom Connector</span>
                                      </button>

                                      <div className="my-2 border-t border-black/5" />

                                      <p className="flex items-center justify-between px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/45">
                                        Connected ({Object.keys(connectorConnections).length})
                                      </p>
                                      {CONNECTORS.filter((c) => connectorConnections[c.id]).length === 0 && customConnectors.length === 0 ? (
                                        <p className="px-3 pb-2 text-xs text-foreground/40">
                                          No connectors connected yet.
                                        </p>
                                      ) : (
                                        <div className="max-h-60 space-y-0.5 overflow-y-auto pr-0.5">
                                          {CONNECTORS.filter((c) => connectorConnections[c.id]).map((c) => (
                                            <div
                                              key={c.id}
                                              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-black/5 transition-colors"
                                            >
                                              <Link
                                                href={`/connectors/${c.id}`}
                                                onClick={() => setPlusMenuOpen(false)}
                                                className="flex min-w-0 flex-1 items-center gap-2.5"
                                              >
                                                <ConnectorLogo connector={c} size="sm" />
                                                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground/85">
                                                  {c.name}
                                                </span>
                                              </Link>
                                              <button
                                                onClick={() => toggleConnectorEnabled(c.id)}
                                                aria-label={`Toggle ${c.name}`}
                                                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                                                  connectorEnabled[c.id] !== false
                                                    ? "bg-emerald-500"
                                                    : "bg-black/15"
                                                }`}
                                              >
                                                <span
                                                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                                                    connectorEnabled[c.id] !== false ? "left-[18px]" : "left-0.5"
                                                  }`}
                                                />
                                              </button>
                                            </div>
                                          ))}
                                          {customConnectors.map((cc) => (
                                            <div
                                              key={cc.id}
                                              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-black/5 transition-colors"
                                            >
                                              <a
                                                href={cc.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex min-w-0 flex-1 items-center gap-2.5"
                                              >
                                                {cc.logo ? (
                                                  <img
                                                    src={cc.logo}
                                                    alt=""
                                                    className="h-8 w-8 shrink-0 rounded-lg bg-black/5 object-contain"
                                                  />
                                                ) : (
                                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-400 to-slate-600">
                                                    <Puzzle className="h-4 w-4 text-white" />
                                                  </div>
                                                )}
                                                <span className="min-w-0 flex-1">
                                                  <span className="block truncate text-[13px] font-medium text-foreground/85">
                                                    {cc.name}
                                                  </span>
                                                  <span className="block text-[10px] font-medium uppercase tracking-wide text-foreground/40">
                                                    Custom
                                                    {cc.permissions && cc.permissions.length > 0 && (
                                                      <> · {cc.permissions.length} permission{cc.permissions.length > 1 ? "s" : ""}</>
                                                    )}
                                                  </span>
                                                </span>
                                              </a>
                                              <button
                                                onClick={() => toggleConnectorEnabled(cc.id)}
                                                aria-label={`Toggle ${cc.name}`}
                                                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                                                  connectorEnabled[cc.id] !== false
                                                    ? "bg-emerald-500"
                                                    : "bg-black/15"
                                                }`}
                                              >
                                                <span
                                                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                                                    connectorEnabled[cc.id] !== false ? "left-[18px]" : "left-0.5"
                                                  }`}
                                                />
                                              </button>
                                              <button
                                                onClick={() => removeCustomConnector(cc.id)}
                                                aria-label={`Remove ${cc.name}`}
                                                className="shrink-0 rounded p-0.5 text-foreground/30 hover:text-red-500 transition-colors"
                                              >
                                                <X className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        ref={toolsBtnRef}
                        onClick={() => setToolsOpen((o) => !o)}
                        className="flex items-center gap-1.5 rounded-full bg-black/5 px-2 sm:px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-black/10"
                      >
                        <SlidersHorizontal className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">Tools</span>
                      </button>
                      {toolsOpen && (
                        <div ref={toolsMenuRef} className="absolute bottom-12 left-10 z-20 w-44 rounded-lg border border-black/10 bg-white p-1 shadow-lg dark:bg-[var(--card)]">
                          {["Image", "Video", "PPT", "Website", "APEXCODE", "Explore Apex"].map((t) => (
                            <button
                              key={t}
                              onClick={() => {
                                if (t === "Explore Apex") {
                                  router.push("/explore-vedas");
                                } else if (t === "Image") {
                                  router.push("/image-generator");
                                } else if (t === "Video") {
                                  router.push("/video-generator");
                                } else if (t === "PPT") {
                                  router.push("/ppt-generator");
                                } else if (t === "Website") {
                                  setWizardOpen(true);
                                } else if (t === "APEXCODE") {
                                  router.push("/apexcode");
                                } else {
                                  setActiveTool(t);
                                }
                                setToolsOpen(false);
                              }}
                              className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-black/5"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Model Selector in Composer */}
                      <div className="relative" ref={composerModelRef}>
                          <button 
                              onClick={() => setModelOpen(!modelOpen)}
                              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm bg-black/5 rounded-full text-foreground/70 hover:bg-black/10"
                          >
                              <span className="truncate max-w-[80px] sm:max-w-[140px]">{model}</span>
                              <ChevronDown className="h-3 w-3 shrink-0" />
                          </button>
                          {modelOpen && (
                              <div className="absolute bottom-10 right-0 z-20 w-48 rounded-lg border border-black/10 bg-white p-1 shadow-lg">
                                  {COMPOSER_MODELS.map((m) => {
                                      const allowed = canAccess(user?.user_metadata?.plan, m.price);
                                      return (
                                          <button
                                              key={m.name}
                                              onClick={() => {
                                                  if (allowed) {
                                                      setModel(m.name);
                                                      setModelOpen(false);
                                                  } else {
                                                      router.push("/upgrade");
                                                  }
                                              }}
                                              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-black/5"
                                          >
                                              {m.name}
                                              {!allowed && <Lock className="h-3 w-3 text-foreground/40" />}
                                              {model === m.name && allowed && <Check className="h-4 w-4 text-foreground/70" />}
                                          </button>
                                      );
                                  })}
                              </div>
                          )}
                      </div>
                      
                      <button
                        onClick={() => setListening((l) => !l)}
                        className={`rounded-full p-2 hover:bg-black/5 ${listening ? "text-red-500" : "text-foreground/55"}`}
                        aria-label="Voice input"
                      >
                        <Mic className="h-[18px] w-[18px]" />
                      </button>
                      {input.trim() ? (
                        <button
                          onClick={send}
                          className="rounded-full bg-foreground p-2 text-white hover:opacity-90"
                          aria-label="Send"
                        >
                          <SendHorizontal className="h-[18px] w-[18px]" />
                        </button>
                      ) : (
                        <button
                          onClick={() => alert("Voice mode")}
                          className="rounded-full border border-black/10 p-2 text-foreground/70 hover:bg-black/5"
                          aria-label="Audio mode"
                        >
                          <AudioLines className="h-[18px] w-[18px]" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                </div>
              </div>
              {messages.length === 0 && !input.trim() && !barDocked && (
                <div className="mt-6 w-full max-w-[720px] z-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Link
                      href="/image-generator"
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-[13px] text-foreground/60 hover:bg-black/5 hover:text-foreground transition-colors"
                    >
                      Generate an image
                    </Link>
                    <Link
                      href="/video-generator"
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-[13px] text-foreground/60 hover:bg-black/5 hover:text-foreground transition-colors"
                    >
                      Generate a video
                    </Link>
                    <Link
                      href="/ppt-generator"
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-[13px] text-foreground/60 hover:bg-black/5 hover:text-foreground transition-colors"
                    >
                      Create a presentation
                    </Link>
                    <Link
                      href="/apexcode"
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-[13px] text-foreground/60 hover:bg-black/5 hover:text-foreground transition-colors"
                    >
                      Write code
                    </Link>
                    <button
                      onClick={() => setActiveTool("Web Search")}
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-[13px] text-foreground/60 hover:bg-black/5 hover:text-foreground transition-colors"
                    >
                      Search the web
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>
          )}
        </main>
        <RequirementWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onComplete={(brief, answers) => {
            setWizardOpen(false);
            if (brief) {
              setInput(brief);
              setTimeout(() => {
                scrollToBottom();
                const textarea = document.querySelector<HTMLTextAreaElement>(
                  'textarea[placeholder*="Ask"]',
                );
                textarea?.focus();
              }, 0);
            }
          }}
        />
        {promoModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="w-80 rounded-xl bg-white p-6 shadow-xl">
                    <h2 className="mb-4 text-lg font-semibold">Enter Promo Code</h2>
                    <input
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="mb-4 w-full rounded border p-2"
                        placeholder="Enter code"
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setPromoModalOpen(false)} className="px-3 py-1 text-sm">Cancel</button>
                        <button onClick={applyPromoCode} className="rounded bg-black px-3 py-1 text-sm text-white">Apply</button>
                    </div>
                </div>
            </div>
        )}

        {previewItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 cursor-pointer"
            onClick={closePreview}
          >
            <div
              className="relative w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden rounded-2xl bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-black/10 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-foreground/60 shrink-0" />
                  <span className="text-sm font-semibold text-foreground truncate">
                    {previewItem.file.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {previewItem.file.type.startsWith("image/") && (
                    <div className="flex items-center gap-2 rounded-xl bg-black/[0.04] px-3 py-1.5 border border-black/5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
                        Size
                      </span>
                      <label className="flex items-center gap-1 text-xs font-medium text-foreground/70">
                        Length
                        <input
                          type="number"
                          min={1}
                          value={imgW ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") {
                              setImgW(null);
                              if (keepRatio && naturalDimRef.current) setImgH(null);
                            } else {
                              handleImgWidthChange(Math.max(1, parseInt(v) || 1));
                            }
                          }}
                          className="w-16 rounded-md border border-black/10 px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:border-black/20"
                        />
                        px
                      </label>
                      <label className="flex items-center gap-1 text-xs font-medium text-foreground/70">
                        Breadth
                        <input
                          type="number"
                          min={1}
                          value={imgH ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") {
                              setImgH(null);
                              if (keepRatio && naturalDimRef.current) setImgW(null);
                            } else {
                              handleImgHeightChange(Math.max(1, parseInt(v) || 1));
                            }
                          }}
                          className="w-16 rounded-md border border-black/10 px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:border-black/20"
                        />
                        px
                      </label>
                      <button
                        type="button"
                        onClick={() => setKeepRatio((v) => !v)}
                        title={keepRatio ? "Locked: aspect ratio maintained" : "Unlocked: free resize"}
                        className={`rounded-md p-1 transition-colors ${
                          keepRatio ? "bg-black/10 text-foreground" : "text-foreground/40 hover:text-foreground"
                        }`}
                      >
                        {keepRatio ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={resetImgSize}
                        className="rounded-md px-1.5 py-0.5 text-xs font-medium text-foreground/50 hover:text-foreground hover:bg-black/5 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                  <button
                    onClick={closePreview}
                    className="rounded-full p-1.5 text-foreground/50 hover:text-red-500 hover:bg-black/5 transition-colors"
                    aria-label="Close preview"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center bg-black/[0.02] p-4">
                {previewItem.file.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewItem.url}
                    alt={previewItem.file.name}
                    onLoad={(e) => {
                      const { naturalWidth, naturalHeight } = e.currentTarget;
                      if (!naturalDimRef.current) {
                        naturalDimRef.current = {
                          w: naturalWidth,
                          h: naturalHeight,
                        };
                      }
                      if (imgW === null) setImgW(naturalWidth);
                      if (imgH === null) setImgH(naturalHeight);
                    }}
                    style={{
                      width: imgW ? `${imgW}px` : undefined,
                      height: imgH ? `${imgH}px` : undefined,
                    }}
                    className="max-w-full max-h-[calc(85vh-140px)] object-contain rounded-lg"
                  />
                ) : previewItem.file.type.startsWith("video/") ? (
                  <video
                    src={previewItem.url}
                    controls
                    className="max-w-full max-h-[70vh] rounded-lg"
                  />
                ) : previewItem.file.type.startsWith("audio/") ? (
                  <audio src={previewItem.url} controls className="w-full" />
                ) : previewItem.file.type === "application/pdf" ||
                  previewItem.file.type.startsWith("text/") ? (
                  <iframe
                    src={previewItem.url}
                    title={previewItem.file.name}
                    className="w-full h-[70vh] rounded-lg"
                  />
                ) : (
                  <div className="text-center py-8 w-full">
                    <FileText className="h-12 w-12 mx-auto text-foreground/30" />
                    <p className="mt-3 text-sm font-medium text-foreground break-all px-6">
                      {previewItem.file.name}
                    </p>
                    <p className="mt-1 text-xs text-foreground/50">
                      {previewItem.file.type || "Unknown type"} ·{" "}
                      {Math.max(1, Math.round(previewItem.file.size / 1024))} KB
                    </p>
                    <a
                      href={previewItem.url}
                      download={previewItem.file.name}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white hover:opacity-80 transition-opacity"
                    >
                      <Download className="h-4 w-4" /> Download
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <OAuthModal
          connector={oauthFor}
          onClose={() => setOauthFor(null)}
          onSuccess={handleConnectorOauthSuccess}
          onFailed={handleConnectorOauthFailed}
        />
        {customModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
            <div
              className="absolute inset-0"
              onClick={() => !customAdded && setCustomModalOpen(false)}
            />
            <div className="relative w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Add Custom Connector</h3>
                  <p className="mt-1 text-xs text-foreground/50">
                    Connect any service with a name, MCP URL and logo.
                  </p>
                </div>
                <button
                  onClick={() => !customAdded && setCustomModalOpen(false)}
                  className="rounded-lg p-1 text-foreground/40 hover:bg-black/5 hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {customAdded ? (
                <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  <p className="text-sm font-medium text-emerald-700">
                    Added to your connectors!
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-4 space-y-3">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => customLogoInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") customLogoInputRef.current?.click();
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setCustomLogoDragOver(true);
                      }}
                      onDragLeave={() => setCustomLogoDragOver(false)}
                      onDrop={handleCustomLogoDrop}
                      className={`flex h-14 items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                        customLogoDragOver
                          ? "border-violet-400 bg-violet-50"
                          : customLogo
                            ? "border-emerald-300 bg-emerald-50/40"
                            : "border-black/15 bg-[#FAFAFA] hover:border-violet-400 hover:bg-violet-50"
                      }`}
                    >
                      {customLogo ? (
                        <div className="group relative flex items-center gap-3 px-3">
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
                            <img src={customLogo} alt="" className="h-full w-full object-contain" />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <ImageIcon className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="text-left">
<p className="text-xs font-medium text-emerald-700">Logo added</p>
                            <p className="text-[11px] text-foreground/45">
                              Drop a new image or click to replace
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomLogo("");
                            }}
                            aria-label="Remove logo"
                            className="rounded p-1 text-foreground/30 hover:bg-black/5 hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 px-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white">
                            <ImageIcon className="h-3.5 w-3.5 text-foreground/40" />
                          </span>
                          <div className="text-left">
                            <p className="text-xs font-medium text-foreground/70">
                              {customLogoDragOver ? "Drop to add logo" : "Add logo"}
                            </p>
                            <p className="text-[11px] text-foreground/40">
                              Drag &amp; drop an image, or click to browse
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      ref={customLogoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCustomLogoUpload}
                      className="hidden"
                    />
                    <input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomConnector()}
                      placeholder="Connector name (e.g. My API)"
                      className="w-full rounded-lg border border-black/10 bg-[#FAFAFA] px-3 py-2 text-sm text-foreground outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                    <input
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomConnector()}
                      placeholder="MCP URL (e.g. http://127.0.0.1:3000)"
                      className="w-full rounded-lg border border-black/10 bg-[#FAFAFA] px-3 py-2 text-sm text-foreground outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                    <div className="rounded-xl border border-black/10 bg-[#FAFAFA] p-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/70">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        Permissions
                        {customPermissions.length > 0 && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            {customPermissions.length}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-foreground/45">
                        Grant the connector access to specific capabilities.
                      </p>
                      <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {CUSTOM_CONNECTOR_PERMISSIONS.map((p) => {
                          const checked = customPermissions.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => toggleCustomPermission(p.id)}
                              className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                                checked
                                  ? "border-emerald-300 bg-emerald-50"
                                  : "border-black/10 bg-white hover:border-black/20"
                              }`}
                            >
                              <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                  checked ? "border-emerald-500 bg-emerald-500" : "border-black/20 bg-white"
                                }`}
                              >
                                {checked && <Check className="h-3 w-3 text-white" />}
                              </span>
                              <span>
                                <span className="block text-xs font-medium text-foreground/80">{p.label}</span>
                                <span className="block text-[10px] text-foreground/45">{p.desc}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      onClick={() => setCustomModalOpen(false)}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/60 hover:bg-black/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addCustomConnector}
                      disabled={!customName.trim()}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 transition-colors disabled:opacity-40"
                    >
                      Add Connector
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
