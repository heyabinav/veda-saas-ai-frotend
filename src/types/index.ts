export type Message = {
  role: "user" | "assistant";
  text: string;
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
