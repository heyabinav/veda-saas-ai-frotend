import { defaultAiSettings } from "@/config/default-ai-settings";

type StoredSettings = {
  aiSettings?: Partial<typeof defaultAiSettings>;
};

type PlanTier = "free" | "200" | "500" | "1000";

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${key}=`));
  if (!match) return "";
  try {
    return decodeURIComponent(match.slice(key.length + 1));
  } catch {
    return match.slice(key.length + 1);
  }
}

function normalizePlan(plan?: string | null): PlanTier {
  const raw = (plan || readCookie("user_plan") || "free").toLowerCase();
  if (raw.includes("1000") || raw.includes("ultra")) return "1000";
  if (raw.includes("500") || raw.includes("max")) return "500";
  if (raw.includes("200") || raw.includes("pro")) return "200";
  return "free";
}

function getPlanAiDefaults(plan?: string | null) {
  const tier = normalizePlan(plan);

  if (tier === "1000") {
    return {
      creativity: 0.85,
      maxTokens: 8192,
      responseStyle: "Balanced",
      defaultModel: "Apex 3.0 Ultra (Deep Coding Reasoning)",
    };
  }

  if (tier === "500") {
    return {
      creativity: 0.75,
      maxTokens: 4096,
      responseStyle: "Balanced",
      defaultModel: "Apex 2.2 (High)",
    };
  }

  if (tier === "200") {
    return {
      creativity: 0.65,
      maxTokens: 2048,
      responseStyle: "Balanced",
      defaultModel: "Apex 2.2 (Low)",
    };
  }

  return {
    creativity: 0.55,
    maxTokens: 1024,
    responseStyle: "Balanced",
    defaultModel: "Apex 2.1",
  };
}

function getStorageKey() {
  const email = readCookie("user_email");
  const name = readCookie("user_name");
  const identity = (email || name || "guest").trim().toLowerCase() || "guest";
  return `vedaapex-settings:${identity}`;
}

export function getPlanBasedAiSettings(plan?: string | null) {
  return {
    ...defaultAiSettings,
    ...getPlanAiDefaults(plan),
  };
}

export function getClientAiSettings(plan?: string | null) {
  if (typeof window === "undefined") {
    return getPlanBasedAiSettings(plan);
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey()) || window.localStorage.getItem("vedaapex-settings");
    if (!raw) return getPlanBasedAiSettings(plan);

    const parsed = JSON.parse(raw) as StoredSettings;
    return {
      ...getPlanBasedAiSettings(plan),
      ...parsed.aiSettings,
    };
  } catch {
    return getPlanBasedAiSettings(plan);
  }
}
