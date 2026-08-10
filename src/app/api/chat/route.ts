import { NextRequest, NextResponse } from "next/server";
import { apiRequest } from "@/lib/api";
import { DEFAULT_SYSTEM_PROMPT } from "@/config/default-ai-settings";

type ChatRequestBody = {
  message?: string;
  chat_id?: string | null;
  model?: string;
  intent?: string;
  responseMode?: "structured" | "raw";
  system_prompt?: string;
  context?: Record<string, unknown>;
  file?: { name: string; type: string; dataUrl: string } | null;
  files?: { name: string; type: string; dataUrl: string }[] | null;
};

function getStringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function buildStructuredResponse(params: {
  userMessage?: string;
  assistantResponse: string;
  userName?: string | null;
  timestamp?: string;
  intent?: string | null;
  sessionId?: string | null;
}) {
  const cleanAssistantResponse = params.assistantResponse.trim();
  const logPayload = {
    user_message: params.userMessage ?? null,
    assistant_response: cleanAssistantResponse,
    user_name: params.userName ?? null,
    timestamp: params.timestamp ?? new Date().toISOString(),
    intent: params.intent ?? null,
    session_id: params.sessionId ?? null,
  };

  return `${cleanAssistantResponse}\n\n\`\`\`json\n${JSON.stringify(logPayload, null, 2)}\n\`\`\``;
}

export async function POST(req: NextRequest) {
  console.log("DEBUG: POST /api/chat received");
  let responseMode: "structured" | "raw" = "structured";
  let sessionId: string | null = null;
  let userName: string | null = null;
  let intent: string = "general";
  let timestamp = new Date().toISOString();
  try {
    const body = (await req.json()) as ChatRequestBody;
    responseMode = body.responseMode ?? "structured";
    
    const systemPrompt = body.system_prompt?.trim() || DEFAULT_SYSTEM_PROMPT;

    // Map UI model to backend tier:
    // Apex 2.1 (Free) -> 1
    // Apex 2.2 (Low) -> 2
    // Apex 2.2 (High) -> 3
    // Apex 3.0 Ultra / ApexCode 3 (Deep Coding Reasoning) -> 4
    let tier = 1;
    if (body.model?.includes("Low")) {
      tier = 2;
    } else if (body.model?.includes("High")) {
      tier = 3;
    } else if (
      body.model?.includes("Ultra") ||
      body.model?.includes("beta") ||
      body.model?.includes("ApexCode 3")
    ) {
      tier = 4;
    }

    const files =
      body.files && body.files.length > 0
        ? body.files
        : body.file
          ? [body.file]
          : undefined;

    const payload = {
      prompt: body.message,
      system_prompt: systemPrompt,
      tier,
      provider: "auto",
      files,
    };

    console.log("DEBUG: Sending request to /api/v1/ai/generate/text with payload:", payload);

    const authHeader = req.headers.get("Authorization") ?? "";
    const authToken =
      authHeader ||
      (req.cookies.get("auth_token")?.value
        ? `Bearer ${decodeURIComponent(req.cookies.get("auth_token")!.value)}`
        : "");

    const response = await apiRequest("/api/v1/ai/generate/text", {
      method: "POST",
      headers: {
        "Authorization": authToken,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("DEBUG: Backend response status:", response.status);
    console.log("DEBUG: Backend response data:", data);

    const quotaExceeded =
      response.status === 402 ||
      data?.code === "insufficient_funds" ||
      data?.error === "No usage left for request." ||
      data?.message === "No usage left for request.";

    sessionId =
      getStringValue(body.chat_id) ??
      getStringValue(body.context?.session_id) ??
      null;
    userName =
      getStringValue(body.context?.user_name) ??
      getStringValue(body.context?.userName) ??
      null;
    intent = getStringValue(body.intent) ?? "general";
    timestamp = new Date().toISOString();

    if (response.ok) {
      let aiResponse = "";
      if (data?.result) {
        aiResponse = typeof data.result === "string" ? data.result : JSON.stringify(data.result);
      } else if (typeof data === "string") {
        aiResponse = data;
      } else if (data?.choices?.[0]?.message?.content) {
        aiResponse = data.choices[0].message.content;
      } else if (data?.response) {
        aiResponse = data.response;
      } else {
        aiResponse = JSON.stringify(data);
      }


      if (responseMode === "structured") {
        return NextResponse.json({
          response: buildStructuredResponse({
            userMessage: body.message,
            assistantResponse: aiResponse,
            userName,
            intent,
            sessionId,
            timestamp,
          }),
          assistant_response: aiResponse.trim(),
          user_message: body.message ?? null,
          user_name: userName,
          timestamp,
          intent,
          session_id: sessionId,
          quotaExceeded: false,
        });
      }

      return NextResponse.json({ response: aiResponse });
    }

    if (responseMode === "structured") {
      const assistantResponse = quotaExceeded
        ? "AI usage is exhausted right now. Please try again later."
        : data?.message ?? data?.error ?? "AI Brain request failed";

      return NextResponse.json({
        response: buildStructuredResponse({
          userMessage: body.message,
          assistantResponse,
          userName,
          intent,
          sessionId,
          timestamp,
        }),
        assistant_response: assistantResponse,
        user_message: body.message ?? null,
        user_name: userName,
        timestamp,
        intent,
        session_id: sessionId,
        quotaExceeded,
        error: quotaExceeded ? "AI usage is exhausted right now. Please try again later." : assistantResponse,
        details: data,
      });
    }

    if (quotaExceeded) {
      return NextResponse.json({
        error: "AI usage is exhausted right now. Please try again later.",
        quotaExceeded: true,
        details: data,
      });
    }

    return NextResponse.json(
      { error: data?.message ?? data?.error ?? "AI Brain request failed", details: data },
      { status: response.status }
    );
  } catch (error: any) {
    console.error("API Route Error:", error);
    if (responseMode === "structured") {
      const assistantResponse = error.message ?? "Internal Server Error";
      const errorTimestamp = new Date().toISOString();
      return NextResponse.json({
        response: buildStructuredResponse({
          userMessage: undefined,
          assistantResponse,
          userName: null,
          intent: "general",
          sessionId: null,
          timestamp: errorTimestamp,
        }),
        assistant_response: assistantResponse,
        user_message: null,
        user_name: null,
        timestamp: errorTimestamp,
        intent: "general",
        session_id: null,
        quotaExceeded: false,
        error: assistantResponse,
      });
    }
    return NextResponse.json(
      { error: error.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
