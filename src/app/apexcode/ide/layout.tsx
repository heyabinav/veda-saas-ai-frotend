import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ApexCode — AI Workspace",
  description: "ApexCode — the AI-powered development workspace",
};

export default function IdeLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-dvh">{children}</div>;
}