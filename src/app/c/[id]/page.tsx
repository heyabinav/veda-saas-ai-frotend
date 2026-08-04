"use client";

import ChatInterface from "@/components/ChatInterface";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;
  return <ChatInterface initialChatId={id} />;
}
