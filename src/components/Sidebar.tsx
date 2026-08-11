"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  PenSquare,
  Search,
  Library,
  Compass,
  Sparkles,
  PanelLeft,
  LogOut,
  LogIn,
  Settings as SettingsIcon,
  Image as ImageIcon,
  Video,
  Plus,
  X,
  Check,
  Trash2,
  Terminal,
  Wallet,
  KeyRound,
  Brain,
} from "lucide-react";

import type { Chat, Folder, Message } from "@/types";

export function SidebarItem({
  icon: Icon,
  label,
  active = false,
  onClick,
  muted = false,
  trailing,
  href,
  sidebarOpen,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
  muted?: boolean;
  trailing?: React.ReactNode;
  href?: string;
  sidebarOpen: boolean;
}) {
  const content = (
    <div
      onClick={onClick}
      className={`group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[15px] text-foreground/80 transition hover:bg-black/5 ${active ? "bg-black/[0.06]" : ""} ${!sidebarOpen ? "justify-center" : ""}`}
    >
      {Icon ? (
        <Icon
          className={`h-[18px] w-[18px] ${muted ? "text-foreground/60" : "text-foreground/70"}`}
        />
      ) : null}
      {sidebarOpen && <span className="truncate flex-1 text-left">{label}</span>}
      {sidebarOpen && trailing}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full">
        {content}
      </Link>
    );
  }

  return content;
}

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activeTool,
  setActiveTool,
  newChat,
  activeChatId,
  setActiveChat,
  chats = [],
  chatsLoading = false,
  deleteChat,
  renameChat,
  onLogoClick,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTool?: string | null;
  setActiveTool?: (tool: string | null) => void;
  newChat?: () => void;
  activeChatId?: string | null;
  setActiveChat?: (id: string | null) => void;
  chats?: Chat[];
  chatsLoading?: boolean;
  deleteChat?: (id: string) => void;
  renameChat?: (id: string, newName: string) => void;
  onLogoClick?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [cookieUser, setCookieUser] = useState<{ name: string; email: string } | null>(null);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  // Search and chat states
  const [searchQuery, setSearchQuery] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatValue, setEditingChatValue] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Read saved login details (backend/cookie login) — shows in sidebar at the login-option spot
  useEffect(() => {
    const read = (key: string) => {
      const match = document.cookie.split("; ").find((c) => c.startsWith(`${key}=`));
      if (!match) return "";
      try {
        return decodeURIComponent(match.slice(key.length + 1));
      } catch {
        return match.slice(key.length + 1);
      }
    };
    const name = read("user_name");
    const email = read("user_email");
    if (name || email) {
      setCookieUser({ name: name || email.split("@")[0] || "User", email });
    }
  }, []);

  // Read shared avatar from localStorage (set from Settings page) — works for cookie/backend login too
  useEffect(() => {
    const readAvatar = () => {
      try {
        setLocalAvatar(window.localStorage.getItem("vedaapex-avatar"));
      } catch {
        setLocalAvatar(null);
      }
    };
    readAvatar();
    window.addEventListener("vedaapex-avatar-updated", readAvatar);
    window.addEventListener("storage", readAvatar);
    return () => {
      window.removeEventListener("vedaapex-avatar-updated", readAvatar);
      window.removeEventListener("storage", readAvatar);
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    document.cookie = "post_login_grace=; path=/; max-age=0";
    document.cookie = "auth_token=; path=/; max-age=0";
    document.cookie = "user_name=; path=/; max-age=0";
    document.cookie = "user_email=; path=/; max-age=0";
    document.cookie = "guest_session=; path=/; max-age=0";
    setCookieUser(null);
    router.replace("/login");
  }

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const menu = document.getElementById("user-menu");
      const btn = document.getElementById("user-menu-btn");
      if (!menu || !btn) return;
      if (!menu.contains(e.target as Node) && !btn.contains(e.target as Node)) {
        menu.classList.add("hidden");
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function renderChatRow(chat: Chat) {
    const isActive = chat.id === activeChatId;

    return (
      <div
        key={chat.id}
        className={`group/chat flex items-center justify-between rounded-lg px-2.5 py-1 text-[13.5px] hover:bg-black/5 transition-all ${
          isActive ? "bg-black/[0.06] font-medium text-foreground animate-fade-in" : "text-foreground/75"
        }`}
      >
        {editingChatId === chat.id ? (
          <div className="flex items-center gap-1.5 w-full py-0.5">
            <input
              type="text"
              value={editingChatValue}
              onChange={(e) => setEditingChatValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (editingChatValue.trim() && renameChat) {
                    renameChat(chat.id, editingChatValue.trim());
                    setEditingChatId(null);
                  }
                } else if (e.key === "Escape") {
                  setEditingChatId(null);
                }
              }}
              autoFocus
              className="flex-1 rounded border border-black/15 bg-transparent px-1.5 py-0.5 text-xs focus:outline-none text-foreground"
            />
            <button
              onClick={() => {
                if (editingChatValue.trim() && renameChat) {
                  renameChat(chat.id, editingChatValue.trim());
                  setEditingChatId(null);
                }
              }}
              className="rounded p-0.5 text-foreground/60 hover:text-foreground shrink-0"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={() => setEditingChatId(null)}
              className="rounded p-0.5 text-foreground/60 hover:text-red-500 shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setActiveChat?.(chat.id)}
              className="truncate flex-1 text-left block py-1"
            >
              {chat.name}
            </button>

            <div className="opacity-0 group-hover/chat:opacity-100 flex items-center gap-0.5 transition-all shrink-0 ml-2">
              <button
                onClick={() => {
                  setEditingChatId(chat.id);
                  setEditingChatValue(chat.name);
                }}
                className="rounded p-0.5 hover:bg-black/5 text-foreground/50 hover:text-foreground"
                title="Rename chat"
              >
                <PenSquare className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => {
                  if (confirm(`Delete chat "${chat.name}"?`)) {
                    deleteChat?.(chat.id);
                  }
                }}
                className="rounded p-0.5 hover:bg-red-50 text-foreground/50 hover:text-red-600"
                title="Delete chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-black/5 bg-[var(--sidebar-bg,white)] transition-all duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0 w-[260px]" : "-translate-x-full md:w-[60px] md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <div onClick={onLogoClick} className={`cursor-pointer flex items-center gap-2 text-[17px] font-bold tracking-tight ${!sidebarOpen ? "justify-center w-full" : ""}`}>
            <Image src="/logo.svg" alt="VedaApex Logo" width={60} height={60} className="h-[60px] w-[60px] min-w-[60px]" />
            {sidebarOpen && "VedaApex"}
          </div>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="rounded-md p-1 text-foreground/60 hover:bg-black/5">
              <PanelLeft className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
          <div className="space-y-0.5">
            <SidebarItem icon={PenSquare} label="New chat" onClick={newChat} href="/" sidebarOpen={sidebarOpen} />
            {sidebarOpen ? (
              <div className="px-3 py-1.5 flex items-center gap-2 rounded-lg bg-black/[0.03] border border-black/5 mx-1 mt-1 mb-1">
                <Search className="h-[15px] w-[15px] text-foreground/45 shrink-0" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none placeholder:text-foreground/45 text-foreground"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-foreground/40 hover:text-foreground/70">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <SidebarItem icon={Search} label="Search chats" onClick={() => setSidebarOpen(true)} sidebarOpen={sidebarOpen} />
            )}
            <SidebarItem icon={Library} label="Library" href="/library" sidebarOpen={sidebarOpen} />
          </div>

          <div className="space-y-0.5">
            <div className="px-3 py-1 text-[11px] font-semibold text-foreground/45 uppercase tracking-wider">
              {sidebarOpen && "AI Services"}
            </div>
            <SidebarItem icon={ImageIcon} label="ApexVision" active={pathname === "/image-generator"} href="/image-generator" sidebarOpen={sidebarOpen} />
            <SidebarItem icon={Video} label="ApexMotion" active={pathname === "/video-generator"} href="/video-generator" sidebarOpen={sidebarOpen} />
            <SidebarItem icon={Sparkles} label="APEXCODE" active={pathname === "/apexcode"} href="/apexcode" sidebarOpen={sidebarOpen} />
            <SidebarItem icon={Compass} label="Explore Apex" active={pathname === "/explore-vedas"} href="/explore-vedas" sidebarOpen={sidebarOpen} />
          </div>

          <div className="space-y-0.5">
            <div className="px-3 py-1 text-[11px] font-semibold text-foreground/45 uppercase tracking-wider">
              {sidebarOpen && "Account"}
            </div>
            <SidebarItem icon={Wallet} label="Wallet & Credits" active={pathname === "/wallet"} href="/wallet" sidebarOpen={sidebarOpen} />
            <SidebarItem icon={KeyRound} label="API Keys" active={pathname === "/developer"} href="/developer" sidebarOpen={sidebarOpen} />
            <SidebarItem icon={Brain} label="Skills" active={pathname === "/skills"} href="/skills" sidebarOpen={sidebarOpen} />
          </div>

          {sidebarOpen && (
            <div className="space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-between px-3 py-1 text-[11px] font-semibold text-foreground/45 uppercase tracking-wider">
                <span>Recent</span>
              </div>

              <div className="space-y-1.5 px-1 max-h-[300px] overflow-y-auto pr-1" aria-busy={chatsLoading}>
                {chatsLoading ? (
                  <div className="space-y-1.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
                        <div className="skeleton h-5 w-5 shrink-0 rounded-md" />
                        <div
                          className="skeleton h-3 rounded-md"
                          style={{ width: `${90 - i * 12}%` }}
                        />
                      </div>
                    ))}
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="py-4 text-center text-xs text-foreground/40 italic">
                    No chats found
                  </div>
                ) : (
                  filteredChats.map((chat) => renderChatRow(chat))
                )}
              </div>
            </div>
          )}

        </div>

        {/* User */}
        <div className="border-t border-black/5 px-3 py-3">
          {user || cookieUser ? (
            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => { document.getElementById("user-menu")?.classList.toggle("hidden"); }}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-black/5 transition ${!sidebarOpen ? "justify-center" : ""}`}
              >
                <div className="flex h-8 w-8 min-w-[32px] items-center justify-center rounded-lg bg-foreground/15 text-xs font-medium text-foreground/80 overflow-hidden">
                  {user?.user_metadata?.avatar || localAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user?.user_metadata?.avatar || localAvatar!} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    (user?.email?.[0] ?? cookieUser?.email?.[0] ?? cookieUser?.name?.[0] ?? "U").toUpperCase()
                  )}
                </div>
                {sidebarOpen && (
                  <>
                    <div className="flex min-w-0 flex-col items-start leading-tight flex-1">
                      <span className="truncate text-sm font-medium">{user?.user_metadata?.username || user?.user_metadata?.full_name || cookieUser?.name || "User"}</span>
                      <span className="text-xs text-foreground/55 capitalize truncate max-w-full">
                        {cookieUser?.email || (user?.user_metadata?.plan === "200" ? "Pro Plan" : 
                         user?.user_metadata?.plan === "500" ? "Max Plan" : 
                         user?.user_metadata?.plan === "1000" ? "Ultra Plan" : "Free Plan")}
                      </span>
                    </div>
                    <Link href="/settings" className="p-1.5 text-foreground/40 hover:text-foreground hover:bg-black/5 rounded-md">
                      <SettingsIcon className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </button>
              <div id="user-menu" className="hidden absolute bottom-14 left-3 right-3 rounded-lg border border-black/10 bg-white p-2 shadow-lg z-50">
                <div className="px-3 py-2 text-xs text-foreground/50 truncate border-b border-black/5 mb-1">{user?.email || cookieUser?.email}</div>
                <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
                <Link href="/settings" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:bg-black/5 rounded-md">
                  <SettingsIcon className="h-4 w-4" /> Settings
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium hover:bg-black/5 ${
                  !sidebarOpen ? "px-2" : ""
                }`}
              >
                <LogIn className="h-4 w-4" />
                {sidebarOpen && "Log in"}
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
