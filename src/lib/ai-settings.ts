import { defaultAiSettings } from "@/config/default-ai-settings";

type StoredSettings = {
  aiSettings?: Partial<typeof defaultAiSettings>;
};

export function getClientAiSettings() {
  if (typeof window === "undefined") {
    return defaultAiSettings;
  }

  try {
    const raw = window.localStorage.getItem("vedaapex-settings");
    if (!raw) return defaultAiSettings;

    const parsed = JSON.parse(raw) as StoredSettings;
    return {
      ...defaultAiSettings,
      ...parsed.aiSettings,
    };
  } catch {
    return defaultAiSettings;
  }
}
