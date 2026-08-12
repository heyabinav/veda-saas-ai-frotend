import { ENDPOINTS } from "@/config/api";
import { apiRequest } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

export type ChatMessageItem = {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
};

export type ChatAnswerResponse = {
  success?: boolean;
  session_id: string;
  title: string;
  answer: string;
  history?: ChatMessageItem[];
  metadata?: Record<string, unknown>;
};

export type ChatSessionCreateResponse = {
  success?: boolean;
  session_id: string;
  title: string;
};

export type ChatSessionListItem = {
  id: string;
  title: string;
  last_message_at?: string | null;
  created_at: string;
};

export type ChatSessionListResponse = {
  success?: boolean;
  items: ChatSessionListItem[];
};

export type ChatAskRequest = {
  session_id?: string | null;
  message: string;
  model?: string | null;
  context_limit?: number;
};

export async function createChatSession(title = "New Chat"): Promise<ChatSessionCreateResponse | null> {
  try {
    const res = await apiRequest(
      `${ENDPOINTS.chatNewSession.replace(/^https?:\/\/[^/]+/i, "")}?title=${encodeURIComponent(title)}`,
      { method: "POST" },
    );
    const data = await res.json();
    return data?.data && typeof data.data === "object" ? data.data : data;
  } catch (error) {
    console.warn("Chat session creation failed:", error);
    return null;
  }
}

export async function listChatSessions(limit = 20): Promise<ChatSessionListItem[]> {
  try {
    const res = await apiRequest(
      `${ENDPOINTS.chatSessions.replace(/^https?:\/\/[^/]+/i, "")}?limit=${limit}`,
    );
    const data = await res.json();
    const nested = data?.data && typeof data.data === "object" ? data.data : data;
    return Array.isArray(nested?.items) ? nested.items : [];
  } catch (error) {
    console.warn("Chat session list failed:", error);
    return [];
  }
}

export async function getChatMessages(sessionId: string, limit = 50): Promise<ChatMessageItem[]> {
  try {
    const res = await apiRequest(
      `${ENDPOINTS.chatSessionMessages(sessionId).replace(/^https?:\/\/[^/]+/i, "")}?limit=${limit}`,
    );
    const data = await res.json();
    return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  } catch (error) {
    console.warn("Chat messages fetch failed:", error);
    return [];
  }
}

export async function askChat(payload: ChatAskRequest): Promise<ChatAnswerResponse | null> {
  try {
    const res = await apiRequest(ENDPOINTS.chatAsk.replace(/^https?:\/\/[^/]+/i, ""), {
      method: "POST",
      timeoutMs: 180000,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data?.data && typeof data.data === "object" ? data.data : data;
  } catch (error) {
    console.warn("Chat ask failed:", error);
    return null;
  }
}

const CLOUD_SESSION_KEY = "vedaapex_cloud_sessions";

export function getCloudSessionId(chatId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CLOUD_SESSION_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[chatId] ?? null;
  } catch {
    return null;
  }
}

export function setCloudSessionId(chatId: string, sessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(CLOUD_SESSION_KEY);
    const map = (raw ? JSON.parse(raw) : {}) as Record<string, string>;
    map[chatId] = sessionId;
    window.localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export async function ensureCloudSession(chatId: string): Promise<string | null> {
  const existing = getCloudSessionId(chatId);
  if (existing) return existing;
  const session = await createChatSession();
  if (session?.session_id) {
    setCloudSessionId(chatId, session.session_id);
    return session.session_id;
  }
  return null;
}

export async function hasBackendToken(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) return true;
  } catch {
    // ignore
  }
  if (typeof document === "undefined") return false;
  try {
    if (document.cookie.split("; ").some((c) => c.startsWith("auth_token="))) return true;
    if (window.localStorage.getItem("accessToken") || window.localStorage.getItem("token")) return true;
  } catch {
    // ignore
  }
  return false;
}