"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  PenSquare,
  Search,
  Library,
  Image as ImageIcon,
  Video,
  Compass,
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
  Trash2,
  LogOut,
  LogIn,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import type { Chat, Folder, Message } from "@/types";
import {
  saveChatToSupabase,
  getChatsFromSupabase,
  deleteChatFromSupabase,
  saveFolderToSupabase,
  deleteFolderFromSupabase,
  getFoldersFromSupabase,
} from "@/lib/supabase/chat";

const MODELS = ["Apex_2.1", "Apex_2.2(Thinking)", "Apex_2.2(High)", "Apex_2.2(Beta)"];

export default function ChatInterface({ initialChatId }: { initialChatId?: string }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("ollama");
  const [modelOpen, setModelOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);

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
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

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
    // Basic automatic name generation
    const clean = text.trim().split("\n")[0];
    return clean.length > 30 ? clean.slice(0, 27) + "..." : clean;
  }

  async function send() {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { role: "user", text };
    
    // Immediate UI update
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsThinking(true); // Start thinking animation

    let assistantText = "AI Brain is unavailable right now.";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, chat_id: activeChatId, model }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "AI Brain request failed");
      }

      assistantText =
        typeof data?.response === "string" && data.response.trim().length > 0
          ? data.response
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

    if (!activeChatId) {
      const newId = Date.now().toString();
      const defaultFolder = folders.find(f => f.name === ":C")?.id;
      const newChatObj: Chat = {
        id: newId,
        name: generateName(text),
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
        />

        {/* Main */}
        <main className="relative flex flex-1 flex-col">
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
                onClick={() => setModelOpen((o) => !o)}
                className="flex items-center gap-3 text-[15px] font-medium text-foreground/80 hover:text-foreground"
                >
                <span className="tracking-wide font-semibold">{model}</span>
                <ChevronDown className="h-4 w-4 text-foreground/55" />
                </button>
                {modelOpen && (
                <div className="absolute left-6 top-12 z-20 w-48 rounded-lg border border-black/10 bg-white p-1 shadow-lg">
                    {MODELS.map((m) => (
                    <button
                        key={m}
                        onClick={() => {
                        setModel(m);
                        setModelOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-black/5"
                    >
                        {m}
                        {model === m && <Check className="h-4 w-4 text-foreground/70" />}
                    </button>
                    ))}
                </div>
                )}
            </div>
            
            <Link href="/upgrade" className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-full shadow hover:opacity-90 transition-all">
                Upgrade
            </Link>
          </div>

          {/* Center area */}
          <div className="flex flex-1 flex-col items-center px-6">
            {messages.length === 0 ? (
              <div className="flex flex-1 items-center">
                <h1 className="text-center text-[28px] font-medium tracking-tight text-foreground/85 md:text-[32px]">
                  What&apos;s on your mind today?
                </h1>
              </div>
            ) : (
              <div className="flex-1 w-full max-w-[720px] space-y-4 overflow-y-auto py-6">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] ${
                        m.role === "user" ? "bg-black/[0.06] text-foreground" : "text-foreground/85"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {isThinking && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl px-4 py-2.5 text-[15px] bg-black/[0.03] text-foreground/50 animate-pulse">
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Composer */}
            <div className="w-full max-w-[720px] pb-6">
              {activeTool && (
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-black/[0.05] px-3 py-1 text-xs text-foreground/70">
                  {activeTool}
                  <button onClick={() => setActiveTool(null)} aria-label="Clear tool">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="rounded-3xl border border-black/[0.06] bg-white px-5 py-4 shadow-[0_10px_30px_-12px_rgba(60,60,120,0.18)]">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  className="w-full bg-transparent text-[15px] text-foreground placeholder:text-foreground/45 focus:outline-none"
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
                        if (f) setInput((v) => `${v} [${f.name}]`.trim());
                      }}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="rounded-full p-2 text-foreground/60 hover:bg-black/5"
                      aria-label="Attach file"
                    >
                      <Plus className="h-[18px] w-[18px]" />
                    </button>
                    <button
                      onClick={() => setToolsOpen((o) => !o)}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground/70 hover:bg-black/5"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Tools
                    </button>
                    {toolsOpen && (
                      <div className="absolute bottom-12 left-10 z-20 w-44 rounded-lg border border-black/10 bg-white p-1 shadow-lg">
                        {["Image", "Video", "PPT", "KodiXapex", "Explore Apex"].map((t) => (
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
                  <div className="flex items-center gap-1">
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
        </main>
      </div>
    </div>
  );
}
