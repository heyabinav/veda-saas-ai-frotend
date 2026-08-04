export interface VoiceLanguage {
  id: string;
  label: string;
  locale: string;
  nativeLabel: string;
}

export const VOICE_LANGUAGES: VoiceLanguage[] = [
  { id: "english-us", label: "English (US)", locale: "en-US", nativeLabel: "English" },
  { id: "english-india", label: "English (India)", locale: "en-IN", nativeLabel: "English" },
  { id: "hindi", label: "Hindi", locale: "hi-IN", nativeLabel: "हिन्दी" },
  { id: "hinglish", label: "Hinglish", locale: "hi-IN", nativeLabel: "Hinglish" },
  { id: "spanish", label: "Spanish (Spain)", locale: "es-ES", nativeLabel: "Español" },
  { id: "french", label: "French (France)", locale: "fr-FR", nativeLabel: "Français" },
  { id: "german", label: "German (Germany)", locale: "de-DE", nativeLabel: "Deutsch" },
  { id: "italian", label: "Italian (Italy)", locale: "it-IT", nativeLabel: "Italiano" },
  { id: "portuguese", label: "Portuguese (Brazil)", locale: "pt-BR", nativeLabel: "Português" },
  { id: "dutch", label: "Dutch (Netherlands)", locale: "nl-NL", nativeLabel: "Nederlands" },
  { id: "russian", label: "Russian (Russia)", locale: "ru-RU", nativeLabel: "Русский" },
  { id: "japanese", label: "Japanese (Japan)", locale: "ja-JP", nativeLabel: "日本語" },
  { id: "korean", label: "Korean (South Korea)", locale: "ko-KR", nativeLabel: "한국어" },
  { id: "chinese", label: "Chinese (Simplified)", locale: "zh-CN", nativeLabel: "中文" },
  { id: "arabic", label: "Arabic (Saudi Arabia)", locale: "ar-SA", nativeLabel: "العربية" },
  { id: "turkish", label: "Turkish (Türkiye)", locale: "tr-TR", nativeLabel: "Türkçe" },
  { id: "indonesian", label: "Indonesian (Indonesia)", locale: "id-ID", nativeLabel: "Bahasa Indonesia" },
  { id: "bengali", label: "Bengali (India)", locale: "bn-IN", nativeLabel: "বাংলা" },
  { id: "punjabi", label: "Punjabi (India)", locale: "pa-IN", nativeLabel: "ਪੰਜਾਬੀ" },
  { id: "marathi", label: "Marathi (India)", locale: "mr-IN", nativeLabel: "मराठी" },
];

export const DEFAULT_VOICE_LANGUAGE_ID = "english-india";

const STORAGE_KEY = "vedaapex-voice-language";

export function getSavedVoiceLanguage(): VoiceLanguage {
  if (typeof window === "undefined") {
    return VOICE_LANGUAGES.find((l) => l.id === DEFAULT_VOICE_LANGUAGE_ID) ?? VOICE_LANGUAGES[0];
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = VOICE_LANGUAGES.find((l) => l.id === saved);
      if (found) return found;
    }
  } catch {
    // ignore storage errors
  }

  const fallback =
    VOICE_LANGUAGES.find((l) => l.id === DEFAULT_VOICE_LANGUAGE_ID) ?? VOICE_LANGUAGES[0];
  return fallback;
}

export function saveVoiceLanguage(languageId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, languageId);
  } catch {
    // ignore storage errors
  }
}
