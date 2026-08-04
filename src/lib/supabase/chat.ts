import { Chat, Folder } from "@/types";

const CHATS_KEY = "apex_chats_v2";
const FOLDERS_KEY = "apex_folders";

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
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Chats ─────────────────────────────────────────────────────────────────

export const saveChatToSupabase = async (chat: Chat) => {
  const chats = readJson<Chat[]>(CHATS_KEY, []);
  const idx = chats.findIndex((c) => c.id === chat.id);
  if (idx >= 0) {
    chats[idx] = chat;
  } else {
    chats.unshift(chat);
  }
  writeJson(CHATS_KEY, chats);
  return chat;
};

export const getChatsFromSupabase = async (): Promise<Chat[]> => {
  return readJson<Chat[]>(CHATS_KEY, []);
};

export const deleteChatFromSupabase = async (chatId: string) => {
  const chats = readJson<Chat[]>(CHATS_KEY, []);
  writeJson(
    CHATS_KEY,
    chats.filter((c) => c.id !== chatId),
  );
};

// ── Folders ───────────────────────────────────────────────────────────────

export const saveFolderToSupabase = async (folder: Folder) => {
  const folders = readJson<Folder[]>(FOLDERS_KEY, []);
  const idx = folders.findIndex((f) => f.id === folder.id);
  if (idx >= 0) {
    folders[idx] = folder;
  } else {
    folders.push(folder);
  }
  writeJson(FOLDERS_KEY, folders);
  return folder;
};

export const deleteFolderFromSupabase = async (folderId: string) => {
  const folders = readJson<Folder[]>(FOLDERS_KEY, []);
  writeJson(
    FOLDERS_KEY,
    folders.filter((f) => f.id !== folderId),
  );
};

export const getFoldersFromSupabase = async (): Promise<Folder[]> => {
  return readJson<Folder[]>(FOLDERS_KEY, []);
};
