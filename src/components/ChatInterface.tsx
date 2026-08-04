"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MessageContent from "@/components/MessageContent";
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
} from "@/lib/supabase/chat";
import { THINKING_MESSAGES } from "@/lib/thinking-messages";
import OAuthModal from "@/components/OAuthModal";
import ConnectorLogo from "@/components/ConnectorLogo";
import { ChromeIcon } from "@/components/brand-icons";
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

const COMPOSER_MODELS = [
  { name: "Apex_2.1", price: "free" },
  { name: "Apex_2.2(Low)", price: "200" },
  { name: "Apex_2.2(High)", price: "500" },
  { name: "Apex_2.2(beta)", price: "1000" }
];

const canAccess = (plan: string | undefined, price: string) => {
  if (price === "free") return true;
  if (!plan) return false;
  if (price === "200") return ["200", "500", "1000"].includes(plan);
  if (price === "500") return ["500", "1000"].includes(plan);
  if (price === "1000") return plan === "1000";
  return false;
};

export default function ChatInterface({ initialChatId }: { initialChatId?: string }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(COMPOSER_MODELS[0].name);
  const [headerModel, setHeaderModel] = useState(HEADER_MODELS[0].name);
  const [modelOpen, setModelOpen] = useState(false);
  const [headerModelOpen, setHeaderModelOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [barDocked, setBarDocked] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState("Thinking...");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [authResolved, setAuthResolved] = useState(false);
  const clickCountRef = useRef(0);
  const lastClickRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const [connectorSearch, setConnectorSearch] = useState("");
  const [showConnectorsHub, setShowConnectorsHub] = useState(false);
  const [connectorConnections, setConnectorConnections] = useState<Record<string, string>>({});
  const [connectorEnabled, setConnectorEnabled] = useState<Record<string, boolean>>({});
  const [customConnectors, setCustomConnectors] = useState<{ id: string; name: string; url: string }[]>([]);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customAdded, setCustomAdded] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customUrl, setCustomUrl] = useState("");
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

  const toggleConnectorEnabled = (id: string) => {
    setConnectorEnabled((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("vedaapex-connector-enabled", JSON.stringify(next));
      return next;
    });
  };

  const addCustomConnector = () => {
    const name = customName.trim();
    if (!name) return;
    const url = customUrl.trim() || "https://";
    const next = [...customConnectors, { id: `custom-${Date.now()}`, name, url }];
    setCustomConnectors(next);
    localStorage.setItem("vedaapex-custom-connectors", JSON.stringify(next));
    setCustomAdded(true);
    setTimeout(() => {
      setCustomModalOpen(false);
      setCustomAdded(false);
      setCustomName("");
      setCustomUrl("");
    }, 900);
  };

  const removeCustomConnector = (id: string) => {
    const next = customConnectors.filter((c) => c.id !== id);
    setCustomConnectors(next);
    localStorage.setItem("vedaapex-custom-connectors", JSON.stringify(next));
  };
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [txtPreviewContent, setTxtPreviewContent] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<{ url: string; name: string; type: string } | null>(null);
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

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  };

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
      const f = acceptedFiles[0];
      if (f) {
        setDroppedFile(f);
        if (f.type.startsWith("image/") || f.type.startsWith("video/")) {
          setPreviewUrl(URL.createObjectURL(f));
        } else {
          setPreviewUrl(null);
        }
      }
    },
    maxFiles: 1,
    noClick: true,
  });

  const removeAttachedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (filePreview) URL.revokeObjectURL(filePreview.url);
    setDroppedFile(null);
    setPreviewUrl(null);
    setTxtPreviewContent(null);
    setFilePreview(null);
    setTimeout(autoResize, 0);
  };

  const openFilePreview = () => {
    if (!droppedFile) return;
    if (previewUrl) {
      setShowPreview(true);
      return;
    }
    setFilePreview({
      url: URL.createObjectURL(droppedFile),
      name: droppedFile.name,
      type: droppedFile.type,
    });
  };

  const closeFilePreview = () => {
    if (filePreview) URL.revokeObjectURL(filePreview.url);
    setFilePreview(null);
  };

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
      setDroppedFile(txtFile);
      setPreviewUrl(null);
      setTxtPreviewContent(input.trim());
      setInput("");
      setTimeout(autoResize, 0);
    }
  }, [input]);

  const openTxtPreview = () => {
    if (!droppedFile) return;
    const reader = new FileReader();
    reader.onload = () => setTxtPreviewContent(reader.result as string);
    reader.readAsText(droppedFile);
  };

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
            
            alert("Plan upgraded successfully!");
            setPromoModalOpen(false);
            setPromoCode("");
        }
    } else {
        alert("Invalid promo code");
    }
  };

  const [user, setUser] = useState<User | null>(null);

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

  // Monitor auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthResolved(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setAuthResolved(true);
    });
    return () => subscription.unsubscribe();
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

  // Load state from localStorage or Supabase
  useEffect(() => {
    let active = true;

    async function loadData() {
      if (user) {
        try {
          const [dbChats, dbFolders] = await Promise.all([
            getChatsFromSupabase().catch(() => []),
            getFoldersFromSupabase().catch(() => [])
          ]);

          if (!active) return;

          // Migrate local storage chats to supabase if supabase is empty
          const savedChats = localStorage.getItem("apex_chats_v2");
          const savedFolders = localStorage.getItem("apex_folders");

          let finalChats = dbChats;
          let finalFolders = dbFolders;

          if (dbChats.length === 0 && savedChats) {
            try {
              const localChats = JSON.parse(savedChats) as Chat[];
              if (localChats.length > 0) {
                await Promise.all(localChats.map(c => saveChatToSupabase(c).catch(console.error)));
                finalChats = localChats;
              }
            } catch (e) {
              console.error("Failed to migrate local chats", e);
            }
          }

          if (dbFolders.length === 0 && savedFolders) {
            try {
              const localFolders = JSON.parse(savedFolders) as Folder[];
              if (localFolders.length > 1 || (localFolders.length === 1 && localFolders[0].name !== ":C")) {
                await Promise.all(localFolders.map(f => saveFolderToSupabase(f).catch(console.error)));
                finalFolders = localFolders;
              }
            } catch (e) {
              console.error("Failed to migrate local folders", e);
            }
          }

          // Ensure default folder :C exists
          if (finalFolders.length === 0) {
            const defaultFolder = { id: "folder-c", name: ":C" };
            finalFolders = [defaultFolder];
            await saveFolderToSupabase(defaultFolder).catch(console.error);
          }

          setChats(finalChats);
          setFolders(finalFolders);
        } catch (e) {
          console.error("Failed to fetch data from Supabase", e);
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }
    }

    function loadFromLocalStorage() {
      const savedChats = localStorage.getItem("apex_chats_v2");
      const savedFolders = localStorage.getItem("apex_folders");
      
      if (savedChats) {
        try {
          setChats(JSON.parse(savedChats));
        } catch (e) {
          console.error("Failed to load chats", e);
        }
      } else {
        setChats([]);
      }
      
      if (savedFolders) {
        try {
          setFolders(JSON.parse(savedFolders));
        } catch (e) {
          console.error("Failed to load folders", e);
        }
      } else {
        const defaultFolder = { id: "folder-c", name: ":C" };
        setFolders([defaultFolder]);
        localStorage.setItem("apex_folders", JSON.stringify([defaultFolder]));
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [user]);

  // Backup saves to localStorage on local state changes
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("apex_chats_v2", JSON.stringify(chats));
    }
  }, [chats]);

  useEffect(() => {
    if (folders.length > 0) {
      localStorage.setItem("apex_folders", JSON.stringify(folders));
    }
  }, [folders]);

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
    if (user) {
      await saveFolderToSupabase(newFolder).catch(console.error);
    }
  }

  async function deleteFolder(id: string) {
    setFolders(folders.filter(f => f.id !== id));
    const updatedChats = chats.map(c => c.folderId === id ? { ...c, folderId: undefined } : c);
    setChats(updatedChats);
    
    if (user) {
      await deleteFolderFromSupabase(id).catch(console.error);
      // Update orphaned chats in database to have no folder
      const orphanedChats = updatedChats.filter(c => c.folderId === undefined);
      await Promise.all(orphanedChats.map(c => saveChatToSupabase(c).catch(console.error)));
    }
  }

  async function deleteChat(id: string) {
    setChats(chats.filter(c => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
      setMessages([]);
      setBarDocked(false);
    }
    if (user) {
      await deleteChatFromSupabase(id).catch(console.error);
    }
  }

  async function renameChat(id: string, newName: string) {
    const updatedChats = chats.map(c => c.id === id ? { ...c, name: newName } : c);
    setChats(updatedChats);
    const targetChat = updatedChats.find(c => c.id === id);
    if (targetChat && user) {
      await saveChatToSupabase(targetChat).catch(console.error);
    }
  }

  async function renameFolder(id: string, newName: string) {
    const updatedFolders = folders.map(f => f.id === id ? { ...f, name: newName } : f);
    setFolders(updatedFolders);
    const targetFolder = updatedFolders.find(f => f.id === id);
    if (targetFolder && user) {
      await saveFolderToSupabase(targetFolder).catch(console.error);
    }
  }

  async function moveChatToFolder(chatId: string, folderId?: string) {
    const updatedChats = chats.map(c => c.id === chatId ? { ...c, folderId } : c);
    setChats(updatedChats);
    const targetChat = updatedChats.find(c => c.id === chatId);
    if (targetChat && user) {
      await saveChatToSupabase(targetChat).catch(console.error);
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
    const text = input.trim() || (droppedFile && txtPreviewContent ? txtPreviewContent : input.trim());
    if (!text && !droppedFile) return;

    let fileData: { name: string; type: string; dataUrl: string } | undefined;

    if (droppedFile) {
      fileData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            name: droppedFile!.name,
            type: droppedFile!.type,
            dataUrl: reader.result as string,
          });
        };
        reader.readAsDataURL(droppedFile);
      });
    }

    const userMsg: Message = { role: "user", text, file: fileData };
    
    // Immediate UI update
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTimeout(() => {
      autoResize();
      scrollToBottom();
    }, 0);
    removeAttachedFile();
    setIsThinking(true); // Start thinking animation
    setToolsOpen(false); // Close tools menu on send

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
        "Content-Type": "application/json" 
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          message: text, 
          chat_id: activeChatId, 
          model,
          intent: "general",
          responseMode: "structured",
          accuracy: getAccuracy(user?.user_metadata?.plan),
          system_prompt: getClientAiSettings().systemPrompt,
          file: fileData ? { name: fileData.name, type: fileData.type, dataUrl: fileData.dataUrl } : undefined,
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

    setIsThinking(false); // Stop thinking animation
    const assistantMsg: Message = { role: "assistant", text: assistantText };
    const nextMessages = [...messages, userMsg, assistantMsg];
    setMessages(nextMessages);
    setShowDisclaimer(true);

    if (!activeChatId) {
      const newId = Date.now().toString();
      const defaultFolder = folders.find(f => f.name === ":C")?.id;
      const newChatObj: Chat = {
        id: newId,
        name: "New Chat",
        messages: nextMessages,
        createdAt: Date.now(),
        folderId: defaultFolder
      };
      setChats([newChatObj, ...chats]);
      setActiveChatId(newId);
      window.history.pushState(null, "", `/c/${newId}`);
      if (user) {
        await saveChatToSupabase(newChatObj).catch(console.error);
      }

      // Generate title via AI after first message
      generateChatTitle(newId, text).catch(console.error);
    } else {
      const currentChat = chats.find(c => c.id === activeChatId);
      if (currentChat) {
        const updatedChat: Chat = {
          ...currentChat,
          messages: nextMessages,
        };
        setChats(chats.map(c => c.id === activeChatId ? updatedChat : c));
        if (user) {
          await saveChatToSupabase(updatedChat).catch(console.error);
        }
      }
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
        if (updatedChat && user) {
          saveChatToSupabase(updatedChat).catch(console.error);
        }
      }, 0);
    } catch {
      const fallback = generateName(message);
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, name: fallback } : c));
    }
  }

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
          deleteChat={deleteChat}
          renameChat={renameChat}
          onLogoClick={handleLogoClick}
        />

        {/* Main */}
        <main className="relative flex flex-1 flex-col min-h-0">
          {/* Chat header */}
          <div className="relative flex items-center justify-between px-6 pt-5">
            <div className="flex items-center gap-8">
                {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="rounded-md p-1.5 text-foreground/60 hover:bg-black/5"
                    aria-label="Show sidebar"
                >
                    <PanelLeft className="h-[18px] w-[18px]" />
                </button>
                )}
                <button
                    onClick={newChat}
                    className="flex items-center gap-1.5 rounded-md p-1.5 text-foreground/60 hover:bg-black/5"
                    aria-label="New chat"
                    title="New chat"
                >
                    <Plus className="h-[18px] w-[18px]" />
                </button>
                {/* Header Model Selector */}
                <div className="relative">
                    <button
                        onClick={() => setHeaderModelOpen(!headerModelOpen)}
                        className="flex items-center gap-2 text-[15px] font-medium text-foreground/80 hover:text-foreground"
                    >
                        {headerModel}
                        <ChevronDown className="h-4 w-4 text-foreground/55" />
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
            
            <Link href="/upgrade" className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-full shadow hover:opacity-90 transition-all">
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
              </div>
            </div>
          ) : (
            <div className="relative flex flex-1 min-w-0 overflow-hidden">
              <div
                className="flex flex-1 flex-col items-center px-6 overflow-hidden min-w-0"
              >
              {messages.length === 0 ? (
                <div className="flex w-full max-w-[720px] flex-col items-center pt-24 md:pt-28">
                  <h1 className="text-center text-[28px] font-medium tracking-tight text-foreground/85 md:text-[32px]">
                    {greeting}, {displayName}
                  </h1>
                </div>
              ) : (
                <div ref={messagesContainerRef} onScroll={handleScroll} className="scrollable-container flex-1 w-full overflow-y-auto py-6 pb-36 min-h-0">
                  <div className="max-w-[720px] mx-auto space-y-6">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                    >
                      {m.role === "user" && m.file && m.file.type.startsWith("image/") && (
                        <img src={m.file.dataUrl} alt={m.file.name} className="max-w-[200px] rounded-lg object-cover mb-1" />
                      )}
                      <div
                        className={`max-w-[80%] text-[15px] ${
                          m.role === "user"
                            ? "bg-black/[0.06] text-foreground rounded-2xl px-4 py-2.5"
                            : "text-foreground/85"
                        }`}
                      >
                        {m.role === "assistant" ? (
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
                    </div>
                  ))}
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
                </div>
                </div>
              )}

              {/* Composer - bottom on chat, inline near center on empty */}
              <div
                className={
                  messages.length === 0 && !input.trim() && !barDocked
                    ? "relative z-10 w-full max-w-[720px] mx-auto mt-6"
                    : "absolute bottom-0 left-0 right-0 w-full max-w-[720px] mx-auto pb-6 z-10"
                }
              >
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
                    droppedFile ? "px-5 py-5" : "px-5 py-4"
                  } ${
                    isDropActive
                      ? "border-blue-400 bg-blue-50/50"
                      : "border-black/[0.06] bg-white/60 backdrop-blur-xl"
                  }`}
                >
                  <input {...getDropInputProps()} />
                  {isDropActive && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-blue-50/80 z-10">
                      <span className="text-sm font-medium text-blue-600">Drop file here (images, videos, docs)</span>
                    </div>
                  )}
                  {droppedFile && (
                    <div className="mb-2 flex items-center gap-2">
                      <div className="relative group">
                        <button
                          onClick={() => {
                            if (droppedFile?.name.toLowerCase().endsWith(".txt")) {
                              openTxtPreview();
                            } else {
                              openFilePreview();
                            }
                          }}
                          className={`rounded-2xl overflow-hidden shrink-0 border border-black/5 cursor-pointer flex items-center justify-center ${previewUrl ? "h-14 w-24" : "h-8 w-8 bg-black/5"}`}
                        >
                          {previewUrl ? (
                            droppedFile?.type.startsWith("video/") ? (
                              <video
                                src={previewUrl}
                                muted
                                playsInline
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
                            )
                          ) : (
                            <FileText className={`h-4 w-4 ${droppedFile?.name.toLowerCase().endsWith(".txt") ? "text-violet-500" : "text-foreground/40"}`} />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAttachedFile();
                          }}
                          className="absolute -top-1.5 -right-1.5 rounded-full bg-white p-0.5 shadow-sm border border-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
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
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setDroppedFile(f);
                            if (f.type.startsWith("image/") || f.type.startsWith("video/")) {
                              setPreviewUrl(URL.createObjectURL(f));
                            } else {
                              setPreviewUrl(null);
                            }
                          }
                        }}
                      />
                      <div className="relative">
                        <button
                          onClick={() => {
                            setPlusMenuOpen((o) => !o);
                            setToolsOpen(false);
                          }}
                          className="rounded-full p-2 text-foreground/60 hover:bg-black/5"
                          aria-label="Add content"
                        >
                          <Plus className="h-[18px] w-[18px]" />
                        </button>
                        {plusMenuOpen && (
                          <div 
                            className="absolute bottom-12 left-0 z-20"
                          >
                            {/* Main Plus Menu */}
                            <div className="w-56 rounded-xl border border-black/10 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-200">
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
                                        <ChromeIcon className="h-4 w-4 shrink-0" />
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
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-400 to-slate-600">
                                                  <Puzzle className="h-4 w-4 text-white" />
                                                </div>
                                                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground/85">
                                                  {cc.name}
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
                        onClick={() => setToolsOpen((o) => !o)}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground/70 hover:bg-black/5"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Tools
                      </button>
                      {toolsOpen && (
                        <div className="absolute bottom-12 left-10 z-20 w-44 rounded-lg border border-black/10 bg-white p-1 shadow-lg">
                          {["Image", "Video", "PPT", "APEXCODE", "Explore Apex"].map((t) => (
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
                      <div className="relative">
                          <button 
                              onClick={() => setModelOpen(!modelOpen)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-black/5 rounded-full text-foreground/70 hover:bg-black/10"
                          >
                              {model}
                              <ChevronDown className="h-3 w-3" />
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

        {showPreview && previewUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 cursor-pointer"
            onClick={() => setShowPreview(false)}
          >
            <div
              className="relative flex flex-col items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg border border-black/10">
                <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
                  Size
                </span>
                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground/70">
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
                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground/70">
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
                  className={`rounded-md p-1.5 transition-colors ${
                    keepRatio ? "bg-black/10 text-foreground" : "text-foreground/40 hover:text-foreground"
                  }`}
                >
                  {keepRatio ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={resetImgSize}
                  className="rounded-md px-2 py-1 text-xs font-medium text-foreground/50 hover:text-foreground hover:bg-black/5 transition-colors"
                >
                  Reset
                </button>
              </div>
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="preview"
                  onLoad={(e) => {
                    if (!naturalDimRef.current) {
                      naturalDimRef.current = {
                        w: e.currentTarget.naturalWidth,
                        h: e.currentTarget.naturalHeight,
                      };
                    }
                  }}
                  style={{
                    width: imgW ? `${imgW}px` : undefined,
                    height: imgH ? `${imgH}px` : undefined,
                  }}
                  className="max-w-[85vw] max-h-[75vh] rounded-2xl"
                />
                <button
                  onClick={() => setShowPreview(false)}
                  className="absolute -top-3 -right-3 rounded-full bg-white p-1.5 shadow-lg border border-black/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {txtPreviewContent !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 cursor-pointer"
            onClick={() => setTxtPreviewContent(null)}
          >
            <div
              className="relative w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden rounded-2xl bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-black/10">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-violet-500 shrink-0" />
                  <span className="text-sm font-semibold text-foreground truncate">
                    {droppedFile?.name ?? "prompt.txt"}
                  </span>
                </div>
                <button
                  onClick={() => setTxtPreviewContent(null)}
                  className="rounded-full p-1.5 text-foreground/50 hover:text-red-500 hover:bg-black/5 transition-colors"
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <pre className="flex-1 min-h-0 overflow-auto px-4 py-3 text-[13px] leading-relaxed text-foreground/80 font-mono whitespace-pre-wrap break-words">
                {txtPreviewContent}
              </pre>
            </div>
          </div>
        )}

        {filePreview && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 cursor-pointer"
            onClick={closeFilePreview}
          >
            <div
              className="relative w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden rounded-2xl bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-black/10 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-foreground/60 shrink-0" />
                  <span className="text-sm font-semibold text-foreground truncate">
                    {filePreview.name}
                  </span>
                </div>
                <button
                  onClick={closeFilePreview}
                  className="rounded-full p-1.5 text-foreground/50 hover:text-red-500 hover:bg-black/5 transition-colors"
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-auto flex items-start justify-start bg-black/[0.02] p-4">
                {filePreview.type.startsWith("video/") ? (
                  <video
                    src={filePreview.url}
                    controls
                    className="max-w-full max-h-[70vh] rounded-lg"
                  />
                ) : filePreview.type.startsWith("audio/") ? (
                  <audio src={filePreview.url} controls className="w-full" />
                ) : filePreview.type === "application/pdf" ||
                  filePreview.type.startsWith("text/") ? (
                  <iframe
                    src={filePreview.url}
                    title={filePreview.name}
                    className="w-full h-[70vh] rounded-lg"
                  />
                ) : (
                  <div className="text-center py-8 w-full">
                    <FileText className="h-12 w-12 mx-auto text-foreground/30" />
                    <p className="mt-3 text-sm font-medium text-foreground break-all px-6">
                      {filePreview.name}
                    </p>
                    <p className="mt-1 text-xs text-foreground/50">
                      {filePreview.type || "Unknown type"} ·{" "}
                      {droppedFile ? Math.max(1, Math.round(droppedFile.size / 1024)) : 0} KB
                    </p>
                    <a
                      href={filePreview.url}
                      download={filePreview.name}
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
            <div className="relative w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Add Custom Connector</h3>
                  <p className="mt-1 text-xs text-foreground/50">
                    Connect any service with a name and URL.
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
                      placeholder="URL (e.g. https://example.com)"
                      className="w-full rounded-lg border border-black/10 bg-[#FAFAFA] px-3 py-2 text-sm text-foreground outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
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
