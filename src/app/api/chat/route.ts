import { NextRequest, NextResponse } from "next/server";

type ChatRequestBody = {
  message?: string;
  chat_id?: string | null;
  model?: string;
  context?: Record<string, unknown>;
};

const parseJsonResponse = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const callChatEndpoint = async (url: string, body: ChatRequestBody) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return {
    response,
    data: await parseJsonResponse(response),
  };
};

const buildFallbackReply = (body: ChatRequestBody) => {
  const prompt = typeof body.message === "string" && body.message.trim() ? body.message.trim() : "your message";
  const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : "Apex_2.1";

  return `AI Brain backend is offline, so this is a local fallback reply from ${model}. You said: "${prompt}". Start the backend on port 8080 to get live AI responses.`;
};

export async function POST(req: NextRequest) {
  let body: ChatRequestBody = {};

  try {
    body = (await req.json()) as ChatRequestBody;
    const aiBrainBaseUrl = (process.env.AI_BRAIN_API_URL ?? "https://vedaapex-m77e.onrender.com").replace(/\/$/, "");
    const primary = await callChatEndpoint(`${aiBrainBaseUrl}/api/v1/ai/chat`, body);

    if (primary.response.ok) {
      return NextResponse.json(primary.data);
    }

    if (primary.response.status < 500) {
      return NextResponse.json(
        {
          error: primary.data?.message ?? primary.data?.error ?? "AI Brain request failed",
          details: primary.data?.details,
        },
        { status: primary.response.status },
      );
    }

    const pythonFallback = await callChatEndpoint("https://vedaapex-m77e.onrender.com/api/chat", body);

    if (pythonFallback.response.ok) {
      return NextResponse.json(pythonFallback.data);
    }

    return NextResponse.json({
      response: buildFallbackReply(body),
      provider: "local",
      model: body.model ?? "Apex_2.1",
      fallback: true,
    });
  } catch {
    return NextResponse.json({
      response: buildFallbackReply(body),
      provider: "local",
      model: body.model ?? "Apex_2.1",
      fallback: true,
    });
  }
}
