"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Plus,
  X,
  Check,
  Trash2,
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
  deleteChat,
  renameChat,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTool?: string | null;
  setActiveTool?: (tool: string | null) => void;
  newChat?: () => void;
  activeChatId?: string | null;
  setActiveChat?: (id: string | null) => void;
  chats?: Chat[];
  deleteChat?: (id: string) => void;
  renameChat?: (id: string, newName: string) => void;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

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

  async function handleLogout() {
    await supabase.auth.signOut();
  }

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
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-black/5 bg-[var(--sidebar-bg,white)] transition-all duration-300 md:relative md:translate-x-0 ${
        sidebarOpen ? "translate-x-0 w-[260px]" : "-translate-x-full md:w-[60px] md:translate-x-0"
      }`}
    >
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <Link href="/" className={`flex items-center gap-2 text-[17px] font-semibold tracking-tight ${!sidebarOpen ? "justify-center w-full" : ""}`}>
          <img src="/logo.svg" alt="VedaApex Logo" className="h-[60px] w-[60px] min-w-[60px]" />
          {sidebarOpen && "VedaApex"}
        </Link>
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
          <SidebarItem icon={Library} label="Library" onClick={() => alert("Library coming soon")} sidebarOpen={sidebarOpen} />
        </div>

        {sidebarOpen && (
          <div className="space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between px-3 py-1 text-[11px] font-semibold text-foreground/45 uppercase tracking-wider">
              <span>C/ Chats</span>
            </div>

            <div className="space-y-1.5 px-1 max-h-[300px] overflow-y-auto pr-1">
              {filteredChats.length === 0 ? (
                <div className="py-4 text-center text-xs text-foreground/40 italic">
                  No chats found
                </div>
              ) : (
                filteredChats.map((chat) => renderChatRow(chat))
              )}
            </div>
          </div>
        )}

        <div className="space-y-0.5">
          <div className="px-3 py-1 text-[11px] font-semibold text-foreground/45 uppercase tracking-wider">
            {sidebarOpen && "AI Services"}
          </div>
          <SidebarItem icon={ImageIcon} label="VedaS Vision" active={pathname === "/image-generator"} href="/image-generator" sidebarOpen={sidebarOpen} />
          <SidebarItem icon={Sparkles} label="KodiXapex" active={activeTool === "KodiXapex"} onClick={() => setActiveTool?.(activeTool === "KodiXapex" ? null : "KodiXapex")} sidebarOpen={sidebarOpen} />
          <SidebarItem icon={Compass} label="Explore Apex" active={pathname === "/explore-vedas"} href="/explore-vedas" sidebarOpen={sidebarOpen} />
        </div>
      </div>

      {/* User */}
      <div className="border-t border-black/5 px-3 py-3">
        {user ? (
          <div className="relative">
            <button
              onClick={() => { document.getElementById("user-menu")?.classList.toggle("hidden"); }}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-black/5 transition ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <div className="flex h-8 w-8 min-w-[32px] items-center justify-center rounded-full bg-foreground/15 text-xs font-medium text-foreground/80 overflow-hidden">
                {(user.email?.[0] ?? "U").toUpperCase()}
              </div>
              {sidebarOpen && (
                <>
                  <div className="flex min-w-0 flex-col items-start leading-tight flex-1">
                    <span className="truncate text-sm font-medium">{user.user_metadata?.username || "User"}</span>
                    <span className="text-xs text-foreground/55">Free</span>
                  </div>
                  <Link href="/settings" className="p-1.5 text-foreground/40 hover:text-foreground hover:bg-black/5 rounded-md">
                    <SettingsIcon className="h-4 w-4" />
                  </Link>
                </>
              )}
            </button>
            <div id="user-menu" className="hidden absolute bottom-14 left-3 right-3 rounded-lg border border-black/10 bg-white p-2 shadow-lg z-50">
              <div className="px-3 py-2 text-xs text-foreground/50 truncate border-b border-black/5 mb-1">{user.email}</div>
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
            <Link href="/login" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium hover:bg-black/5"><LogIn className="h-4 w-4" /> Log in</Link>
          </div>
        )}
      </div>
    </aside>
  );
}
