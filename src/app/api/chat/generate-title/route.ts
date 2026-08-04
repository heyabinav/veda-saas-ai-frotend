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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ title: "New Chat" });
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
        prompt: `User's first message: "${message}"\n\nTitle:`,
        system_prompt: TITLE_SYSTEM_PROMPT,
        tier: 1,
        provider: "auto",
      }),
    });

    const data = await response.json();
    const rawTitle =
      data?.assistant_response ||
      data?.response ||
      data?.text ||
      "";

    const title = rawTitle
      .replace(/^["'\s]+|["'\s]+$/g, "")
      .replace(/[.!?:]+$/, "")
      .trim();

    return NextResponse.json({
      title: title || "New Chat",
    });
  } catch (error) {
    console.error("Title generation failed:", error);
    return NextResponse.json({ title: "New Chat" });
  }
}
