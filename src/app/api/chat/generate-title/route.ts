import { NextRequest, NextResponse } from "next/server";
import { apiRequest } from "@/lib/api";

const TITLE_SYSTEM_PROMPT = `You are a title generator for a chat application. Generate a short, clear chat title based on the user's first message.

Rules:
- Maximum 4-5 words
- No quotation marks, no punctuation at the end
- Capture the main topic or intent of the message
- If the message is just a greeting (like "hi", "hello", "hey", "namaste"), return exactly "New Chat"
- Keep it in the same language as the user's message (Hindi, English, Hinglish, etc.)
- Return ONLY the title, no explanation, no prefix, no extra text`;

const MAX_TITLE_LENGTH = 60;

function cleanTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let title = raw.trim();
  title = title.replace(/^["'\s]+|["'\s]+$/g, "").trim();
  title = title.replace(/[.!?:;\-–—]+$/g, "").trim();
  if (!title) return null;
  if (title.length > MAX_TITLE_LENGTH) {
    title = `${title.slice(0, MAX_TITLE_LENGTH - 1).trim()}…`;
  }
  return title;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ title: "" });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const authToken =
      authHeader ||
      (req.cookies.get("auth_token")?.value
        ? `Bearer ${decodeURIComponent(req.cookies.get("auth_token")!.value)}`
        : "");

    const response = await apiRequest("/api/v1/ai/generate/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: authToken } : {}),
      },
      body: JSON.stringify({
        prompt: `User's first message: "${message.slice(0, 500)}"\n\nTitle:`,
        system_prompt: TITLE_SYSTEM_PROMPT,
        tier: 1,
        provider: "auto",
      }),
      timeoutMs: 60000,
    });

    const data = await response.json().catch(() => ({}));
    // Backend /api/v1/ai/generate/text returns the answer under "result".
    const raw =
      typeof data?.result === "string"
        ? data.result
        : typeof data?.response === "string"
          ? data.response
          : data?.choices?.[0]?.message?.content ??
            typeof data?.text === "string"
              ? data.text
              : "";

    // Return an empty title on failure so the client can fall back to its own
    // local name generator instead of every chat being named "New Chat".
    return NextResponse.json({ title: cleanTitle(raw) ?? "" });
  } catch (error) {
    console.error("Title generation failed:", error);
    return NextResponse.json({ title: "" });
  }
}
