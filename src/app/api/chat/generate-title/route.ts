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

const GREETINGS = [
  "hi", "hello", "hey", "hii", "heyy", "hlo", "helo", "hai", "namaste",
  "namaskar", "hola", "good morning", "good afternoon", "good evening",
  "good night", "hy", "hye", "hey there", "hello there", "hi there",
  "kaise ho", "kya haal", "namastey",
];

function cleanTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let title = raw.trim();
  title = title.replace(/^["'\s]+|["'\s]+$/g, "").trim();
  title = title.replace(/[.!?:;\-–—]+$/g, "").trim();
  // Remove markdown formatting
  title = title.replace(/[*_#`~]/g, "").trim();
  if (!title) return null;
  if (title.length > MAX_TITLE_LENGTH) {
    title = `${title.slice(0, MAX_TITLE_LENGTH - 1).trim()}…`;
  }
  return title;
}

function generateLocalTitle(message: string): string {
  if (!message) return "New Chat";
  const cleaned = message
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "New Chat";

  const lower = cleaned.toLowerCase();
  let words = cleaned.split(" ").slice(0, 5);
  for (const greeting of GREETINGS) {
    if (lower === greeting || lower.startsWith(`${greeting} `)) {
      const after = cleaned.split(" ").slice(1).join(" ");
      if (!after || after.length < 3) return "New Chat";
      words = after.split(" ").slice(0, 5);
      break;
    }
  }

  const title = words.join(" ").charAt(0).toUpperCase() + words.join(" ").slice(1);
  return title.length > 40 ? `${title.slice(0, 37)}...` : title;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
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

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: authToken } : {}),
    };

    // 1. Dedicated Search Title Generator endpoint (fast, cheap)
    try {
      const titleRes = await apiRequest("/api/v1/search/title/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: message.slice(0, 500),
          text: message.slice(0, 500),
          prompt: message.slice(0, 500),
        }),
        timeoutMs: 10000,
      });

      if (titleRes.ok) {
        const titleData = await titleRes.json().catch(() => ({}));
        const rawTitle =
          titleData?.title ||
          titleData?.result ||
          titleData?.search_title ||
          titleData?.data?.title ||
          "";
        const cleaned = cleanTitle(rawTitle);
        if (cleaned) {
          return NextResponse.json({ title: cleaned });
        }
      }
    } catch {
      // Endpoint unavailable — fall through to the AI text generator
    }

    // 2. AI Text Generation endpoint
    try {
      const response = await apiRequest("/api/v1/ai/generate/text", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: `User's first message: "${message.slice(0, 500)}"\n\nTitle:`,
          system_prompt: TITLE_SYSTEM_PROMPT,
          tier: 1,
          provider: "auto",
        }),
        timeoutMs: 15000,
      });

      if (response.ok) {
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

        const cleaned = cleanTitle(raw);
        if (cleaned) {
          return NextResponse.json({ title: cleaned });
        }
      }
    } catch {
      // Generation failed — fall through to the local fallback
    }

    // 3. Smart local title generation fallback
    return NextResponse.json({ title: generateLocalTitle(message) });
  } catch (error) {
    console.error("Title generation failed:", error);
    return NextResponse.json({ title: "New Chat" });
  }
}