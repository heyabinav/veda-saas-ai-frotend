import { apiRequest } from "@/lib/api";

const SESSION_MAP_KEY = "apex_cloud_session_map_v1";

export type CloudSession = {
  id: string;
  title: string;
  last_message_at?: string;
  created_at: string;
};

export type CloudMessage = {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
};

function unwrap<T>(data: any, key: string): T | null {
  if (!data || typeof data !== "object") return null;
  const nested = data.data && typeof data.data === "object" ? data.data : data;
  const val = nested?.[key] ?? data?.[key];
  return (val as T) ?? null;
}

export async function ensureCloudSession(chatId: string): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(SESSION_MAP_KEY);
    let map: Record<string, string> = {};
    try {
      map = raw ? JSON.parse(raw) : {};
    } catch {
      map = {};
    }
    if (map[chatId]) return map[chatId];

    const res = await apiRequest("/api/v1/chat/session/new", { method: "POST" });
    if (!res.ok) return null;
    const data = await res.json();
    const sessionId = unwrap<string>(data, "session_id");
    if (!sessionId) return null;

    map[chatId] = sessionId;
    try {
      window.localStorage.setItem(SESSION_MAP_KEY, JSON.stringify(map));
    } catch {
      // ignore storage quota errors
    }
    return sessionId;
  } catch {
    return null;
  }
}

export async function seedChatMemory(chatId: string | null, message: string, reply: string): Promise<void> {
  if (!chatId || !message?.trim() || !reply?.trim()) return;
  try {
    const sessionId = await ensureCloudSession(chatId);
    if (!sessionId) return;
    await apiRequest("/api/v1/chat/ask", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, message: message.trim() }),
    });
  } catch {
    // Cloud memory is best-effort; never block the chat.
  }
}

export async function listCloudSessions(): Promise<CloudSession[]> {
  try {
    const res = await apiRequest("/api/v1/chat/sessions");
    if (!res.ok) return [];
    const data = await res.json();
    const items = unwrap<CloudSession[]>(data, "items") ?? (Array.isArray(data) ? data : null);
    return Array.isArray(items)
      ? items.map((s) => ({
          id: s?.id ?? "",
          title: s?.title ?? "Untitled",
          last_message_at: s?.last_message_at,
          created_at: s?.created_at ?? "",
        }))
      : [];
  } catch {
    return [];
  }
}

export async function getCloudSessionMessages(sessionId: string): Promise<CloudMessage[]> {
  try {
    const res = await apiRequest(`/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/messages`);
    if (!res.ok) return [];
    const data = await res.json();
    const nested = data?.data && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : data?.messages ?? data?.items;
    return Array.isArray(nested) ? nested : [];
  } catch {
    return [];
  }
}