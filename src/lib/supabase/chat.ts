import { supabase } from "@/integrations/supabase/client";
import { Chat, Folder } from "@/types";

export const saveChatToSupabase = async (chat: Chat) => {
  const { data, error } = await (supabase as any)
    .from("chats")
    .upsert([
      {
        id: chat.id,
        name: chat.name,
        messages: chat.messages,
        folder_id: chat.folderId,
        created_at: new Date(chat.createdAt || Date.now()).toISOString(),
      },
    ]);

  if (error) {
    console.error("Error saving chat:", error);
    throw error;
  }
  return data;
};

export const getChatsFromSupabase = async () => {
  const { data, error } = await (supabase as any)
    .from("chats")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching chats:", error);
    throw error;
  }
  
  // Map snake_case database fields back to camelCase properties
  return (data || []).map((dbChat: any) => ({
    id: dbChat.id,
    name: dbChat.name,
    messages: dbChat.messages,
    folderId: dbChat.folder_id,
    createdAt: dbChat.created_at ? new Date(dbChat.created_at).getTime() : Date.now(),
  }));
};

export const deleteChatFromSupabase = async (chatId: string) => {
  const { error } = await (supabase as any)
    .from("chats")
    .delete()
    .eq("id", chatId);

  if (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
};

export const saveFolderToSupabase = async (folder: Folder) => {
  const { data, error } = await (supabase as any)
    .from("folders")
    .upsert([
      {
        id: folder.id,
        name: folder.name,
      },
    ]);

  if (error) {
    console.error("Error saving folder:", error);
    throw error;
  }
  return data;
};

export const deleteFolderFromSupabase = async (folderId: string) => {
  const { error } = await (supabase as any)
    .from("folders")
    .delete()
    .eq("id", folderId);

  if (error) {
    console.error("Error deleting folder:", error);
    throw error;
  }
};

export const getFoldersFromSupabase = async () => {
  const { data, error } = await (supabase as any)
    .from("folders")
    .select("*");

  if (error) {
    console.error("Error fetching folders:", error);
    throw error;
  }
  
  return (data || []).map((dbFolder: any) => ({
    id: dbFolder.id,
    name: dbFolder.name,
  }));
};
