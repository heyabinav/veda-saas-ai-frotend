"use client";

import ChatInterface from "@/components/ChatInterface";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const params = useParams();
  const id = params.id as string;
  return <ChatInterface initialChatId={id} />;
}
