import { Chat, Folder } from "@/types";

const LEGACY_CHATS_KEY = "apex_chats_v2";
const LEGACY_FOLDERS_KEY = "apex_folders";
const GUEST_CHATS_KEY = "apex_chats_v2:guest";
const GUEST_FOLDERS_KEY = "apex_folders:guest";

// ── Storage keys ────────────────────────────────────────────────────────────
// Each logged-in user gets their own history bucket; guests share one bucket.
// Old (pre-user-scoped) keys are only used to migrate data once.

export function chatsKey(userId?: string | null): string {
  return userId ? `apex_chats_v2:${userId}` : GUEST_CHATS_KEY;
}

export function foldersKey(userId?: string | null): string {
  return userId ? `apex_folders:${userId}` : GUEST_FOLDERS_KEY;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — never crash the app
  }
}

// ── Chats ─────────────────────────────────────────────────────────────────

export function getStoredChatsSync(userId?: string | null): Chat[] {
  const key = chatsKey(userId);
  const direct = readJson<Chat[] | null>(key, null);
  if (direct) return direct;
  // Migrate legacy shared key (pre user-scoped saves) into this bucket once
  const legacy = readJson<Chat[] | null>(LEGACY_CHATS_KEY, null);
  if (legacy) {
    writeJson(key, legacy);
    return legacy;
  }
  return [];
}

export function getStoredFoldersSync(userId?: string | null): Folder[] {
  const key = foldersKey(userId);
  const direct = readJson<Folder[] | null>(key, null);
  if (direct) return direct;
  const legacy = readJson<Folder[] | null>(LEGACY_FOLDERS_KEY, null);
  if (legacy) {
    writeJson(key, legacy);
    return legacy;
  }
  return [];
}

export const saveChatToSupabase = async (chat: Chat, userId?: string | null) => {
  const key = chatsKey(userId);
  const chats = readJson<Chat[]>(key, []);
  const idx = chats.findIndex((c) => c.id === chat.id);
  if (idx >= 0) {
    chats[idx] = chat;
  } else {
    chats.unshift(chat);
  }
  writeJson(key, chats);
  return chat;
};

export const getChatsFromSupabase = async (userId?: string | null): Promise<Chat[]> => {
  return getStoredChatsSync(userId);
};

export const deleteChatFromSupabase = async (chatId: string, userId?: string | null) => {
  const key = chatsKey(userId);
  const chats = readJson<Chat[]>(key, []);
  writeJson(
    key,
    chats.filter((c) => c.id !== chatId),
  );
};

// Move guest chats into a user's bucket (called when a guest logs in) so the
// logged-in user never loses history they created before signing in.
export async function migrateGuestChatsToUser(userId: string): Promise<void> {
  const guestChats =
    readJson<Chat[] | null>(GUEST_CHATS_KEY, null) ??
    readJson<Chat[] | null>(LEGACY_CHATS_KEY, null);
  if (guestChats && guestChats.length > 0) {
    const key = chatsKey(userId);
    const userChats = readJson<Chat[]>(key, []);
    const existing = new Set(userChats.map((c) => c.id));
    const added = guestChats.filter((c) => !existing.has(c.id));
    if (added.length > 0) {
      writeJson(key, [...added, ...userChats]);
    }
  }

  const guestFolders =
    readJson<Folder[] | null>(GUEST_FOLDERS_KEY, null) ??
    readJson<Folder[] | null>(LEGACY_FOLDERS_KEY, null);
  if (guestFolders && guestFolders.length > 0) {
    const key = foldersKey(userId);
    const userFolders = readJson<Folder[]>(key, []);
    const existing = new Set(userFolders.map((f) => f.id));
    const added = guestFolders.filter((f) => !existing.has(f.id));
    if (added.length > 0) {
      writeJson(key, [...userFolders, ...added]);
    }
  }
}

// ── Folders ───────────────────────────────────────────────────────────────

export const saveFolderToSupabase = async (folder: Folder, userId?: string | null) => {
  const key = foldersKey(userId);
  const folders = readJson<Folder[]>(key, []);
  const idx = folders.findIndex((f) => f.id === folder.id);
  if (idx >= 0) {
    folders[idx] = folder;
  } else {
    folders.push(folder);
  }
  writeJson(key, folders);
  return folder;
};

export const deleteFolderFromSupabase = async (folderId: string, userId?: string | null) => {
  const key = foldersKey(userId);
  const folders = readJson<Folder[]>(key, []);
  writeJson(
    key,
    folders.filter((f) => f.id !== folderId),
  );
};

export const getFoldersFromSupabase = async (userId?: string | null): Promise<Folder[]> => {
  return getStoredFoldersSync(userId);
};