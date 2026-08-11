import { NextRequest, NextResponse } from "next/server";
import { apiRequest } from "@/lib/api";

type WebsiteRequirementsBody = {
  websiteType?: string;
  goal?: string;
  features?: string[];
  customRequirements?: string;
  followUpAnswers?: Record<string, string[] | string>;
};

const WEBSITE_PLANNER_SYSTEM_PROMPT = `You are VedaApex's website planning assistant. The user has answered a short requirement questionnaire. Create a clear, structured website generation brief they can paste into a builder.

Return plain text with these sections:
1. "Project Overview" — one or two sentences about the site.
2. "Pages" — a bullet list of pages/screens.
3. "Features" — bullet list of every requested feature.
4. "Tech & Design Notes" — short notes on feel, layout, and any requested AI functionality.

Keep it under 350 words. Do not use markdown headers, just plain bold labels (e.g. "Project Overview:").`;

function cleanRequirements(body: WebsiteRequirementsBody) {
  return {
    websiteType: typeof body.websiteType === "string" ? body.websiteType : "",
    goal: typeof body.goal === "string" ? body.goal : "",
    features: Array.isArray(body.features)
      ? body.features.filter((f): f is string => typeof f === "string")
      : [],
    customRequirements: typeof body.customRequirements === "string" ? body.customRequirements : "",
    followUpAnswers:
      body.followUpAnswers && typeof body.followUpAnswers === "object" ? body.followUpAnswers : {},
  };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = (await req.json()) as WebsiteRequirementsBody;
    const requirements = cleanRequirements(rawBody);

    if (!requirements.websiteType.trim()) {
      return NextResponse.json(
        { success: false, error: "Please select the type of website you want to build." },
        { status: 400 },
      );
    }
    if (!requirements.goal.trim()) {
      return NextResponse.json(
        { success: false, error: "Please select the main goal of the website." },
        { status: 400 },
      );
    }

    const followUpLines = Object.entries(requirements.followUpAnswers)
      .map(([q, a]) => `- ${q}: ${Array.isArray(a) ? a.join(", ") : a}`)
      .join("\n");

    const prompt = `Website requirements:
- Type: ${requirements.websiteType}
- Goal: ${requirements.goal}
- Features: ${requirements.features.length ? requirements.features.join(", ") : "none specified"}
${followUpLines ? `- Follow-up details:\n${followUpLines}` : ""}
${requirements.customRequirements.trim() ? `- Extra requirements: ${requirements.customRequirements.trim()}` : ""}`;

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
        prompt,
        system_prompt: WEBSITE_PLANNER_SYSTEM_PROMPT,
        tier: 1,
        provider: "auto",
      }),
      timeoutMs: 120000,
    });

    const data = await response.json();

    if (!response.ok) {
      const quotaExceeded =
        response.status === 402 ||
        data?.code === "insufficient_funds" ||
        data?.error === "No usage left for request." ||
        data?.message === "No usage left for request.";

      return NextResponse.json(
        {
          success: false,
          error: quotaExceeded
            ? "AI usage is exhausted right now. Please try again later."
            : data?.message ?? data?.error ?? "AI Brain request failed",
        },
        { status: response.status },
      );
    }

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

    return NextResponse.json({
      success: true,
      response: aiResponse.trim(),
      requirements,
    });
  } catch (error: any) {
    console.error("Website requirements route error:", error);
    return NextResponse.json(
      { success: false, error: error?.message ?? "Internal Server Error" },
      { status: 500 },
    );
  }
}
