import { NextRequest, NextResponse } from "next/server";
import { apiRequest, isMissingApiKeyError, MISSING_API_KEY_MESSAGE } from "@/lib/api";
import { DEFAULT_SYSTEM_PROMPT } from "@/config/default-ai-settings";

type ChatRequestBody = {
  message?: string;
  chat_id?: string | null;
  session_id?: string | null;
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

    const authHeader = req.headers.get("Authorization") ?? "";
    const authToken =
      authHeader ||
      (req.cookies.get("auth_token")?.value
        ? `Bearer ${decodeURIComponent(req.cookies.get("auth_token")!.value)}`
        : "");

    // Attached files: the deployed backend's OpenAPI spec declares
    // /api/v1/ai/generate/text as application/json only (prompt, system_prompt,
    // tier, provider), but some backend builds accept a multipart "file" field.
    // Strategy: try multipart first; if the backend rejects it with 422
    // (validation error), fall back to JSON with the attachments embedded as
    // data URLs inside the prompt so multimodal models can still analyze them.
    const filesArray = files && files.length > 0 ? files : [];

    function buildPromptWithFiles(message: string, items: NonNullable<ChatRequestBody["files"]>) {
      const parts: string[] = [];
      for (const f of items) {
        const dataUrl = typeof f?.dataUrl === "string" ? f.dataUrl : "";
        const isImage = typeof f?.type === "string" && f.type.startsWith("image/");
        if (isImage && dataUrl.startsWith("data:") && dataUrl.length < 4_000_000) {
          parts.push(`[Image Attachment: ${f?.name ?? "image"}]\n![${f?.name ?? "image"}](${dataUrl})`);
        } else if (typeof f?.type === "string" && f.type === "text/plain" && dataUrl.startsWith("data:")) {
          try {
            const match = /^data:[^;]+;base64,(.*)$/s.exec(dataUrl);
            const text = match ? Buffer.from(match[1], "base64").toString("utf-8").slice(0, 6000) : "";
            if (text.trim()) parts.push(`[Text Attachment: ${f?.name ?? "file"}]\n${text}`);
          } catch {
            // ignore unreadable text attachments
          }
        } else {
          parts.push(`[Attachment: ${f?.name ?? "file"} (${f?.type ?? "unknown type"})]`);
        }
      }
      const attachments = parts.length > 0 ? `\n\n---\nAttached files from the user (analyze them if relevant):\n${parts.join("\n\n")}\n---` : "";
      return `${message ?? ""}${attachments}`;
    }

    function buildMultipartPayload() {
      const formData = new FormData();
      formData.append("prompt", body.message ?? "");
      formData.append("system_prompt", systemPrompt);
      formData.append("tier", String(tier));
      formData.append("provider", "auto");
      let appended = 0;
      filesArray.forEach((f) => {
        const match = /^data:([^;]+);base64,(.*)$/s.exec(f?.dataUrl ?? "");
        if (match) {
          const blob = new Blob([Buffer.from(match[2], "base64")], {
            type: f?.type || match[1],
          });
          formData.append(
            appended === 0 ? "file" : `file_${appended + 1}`,
            blob,
            f?.name || `attachment-${appended + 1}`,
          );
          appended += 1;
        }
      });
      return formData;
    }

    function buildJsonPayload(withFiles: boolean) {
      const payload = {
        prompt: withFiles ? buildPromptWithFiles(body.message ?? "", filesArray) : body.message,
        system_prompt: systemPrompt,
        tier,
        provider: "auto",
      };
      return JSON.stringify(payload);
    }

    const payloadBody: BodyInit =
      filesArray.length > 0 ? buildMultipartPayload() : buildJsonPayload(false);

    if (filesArray.length > 0) {
      console.log(
        "DEBUG: Sending request to /api/v1/ai/generate/text (multipart) with",
        filesArray.length,
        "file(s):",
        filesArray.map((f) => f?.name),
      );
    } else {
      console.log("DEBUG: Sending request to /api/v1/ai/generate/text with payload:", payloadBody);
    }

    // NOTE: apiRequest() THROWS on non-OK responses (it never returns them), so
    // every attempt below must be wrapped in try/catch — an unchecked call would
    // skip the multipart->JSON fallback and surface the backend's raw 422
    // message ("Invalid request data.") to the user.
    async function callBackend(body: BodyInit): Promise<Response> {
      return apiRequest("/api/v1/ai/generate/text", {
        method: "POST",
        headers: {
          ...(authToken ? { Authorization: authToken } : {}),
        },
        body,
        timeoutMs: 180000,
      });
    }

    const isValidationError = (err: any) =>
      err?.status === 422 || err?.status === 400 || err?.status === 415;

    let response: Response;
    try {
      response = await callBackend(payloadBody);
    } catch (error: any) {
      // Fallback 1: the deployed backend declares /api/v1/ai/generate/text as
      // application/json only, so multipart bodies are always rejected with 422
      // (VALIDATION_ERROR). Retry as JSON with the image(s) embedded as data
      // URLs inside the prompt.
      if (filesArray.length > 0 && isValidationError(error)) {
        console.warn("Multipart rejected, retrying as JSON with embedded data URLs");
        try {
          response = await callBackend(buildJsonPayload(true));
        } catch (error2: any) {
          // Fallback 2: the model/backend can't ingest embedded data URLs.
          // Send the message text alone so the chat still gets a reply instead
          // of a hard error.
          if (isValidationError(error2)) {
            console.warn("JSON with attachments rejected, retrying with text only");
            response = await callBackend(buildJsonPayload(false));
          } else {
            throw error2;
          }
        }
      } else {
        throw error;
      }
    }

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
      getStringValue(body.session_id) ??
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
        : isMissingApiKeyError(data?.message ?? data?.error)
          ? MISSING_API_KEY_MESSAGE
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
      const assistantResponse = isMissingApiKeyError(error?.message)
        ? MISSING_API_KEY_MESSAGE
        : (error.message ?? "Internal Server Error");
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
      { error: isMissingApiKeyError(error?.message) ? MISSING_API_KEY_MESSAGE : (error.message ?? "Internal Server Error") },
      { status: 500 }
    );
  }
}
