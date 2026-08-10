export type Message = {
  role: "user" | "assistant";
  text: string;
  timestamp?: number;
  durationMs?: number;
  file?: {
    name: string;
    type: string;
    dataUrl: string;
  };
  files?: {
    name: string;
    type: string;
    dataUrl: string;
  }[];
};

export type Chat = {
  id: string;
  name: string;
  messages: Message[];
  folderId?: string;
  createdAt: number;
};

export type Folder = {
  id: string;
  name: string;
};
