"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { VOICE_LANGUAGES, type VoiceLanguage } from "@/config/voiceLanguages";

interface VoiceLanguageSelectorProps {
  value: VoiceLanguage;
  onChange: (language: VoiceLanguage) => void;
  className?: string;
}

export function VoiceLanguageSelector({ value, onChange, className = "" }: VoiceLanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Voice input language: ${value.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-foreground/60 hover:bg-black/5 hover:text-foreground transition-colors"
      >
        <Globe className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline max-w-[130px] truncate text-xs">{value.label}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Voice input languages"
          className="absolute bottom-10 right-0 z-50 w-56 max-h-72 overflow-y-auto rounded-xl border border-black/10 bg-white p-1 shadow-xl"
        >
          {VOICE_LANGUAGES.map((language) => {
            const selected = language.id === value.id;
            return (
              <button
                key={language.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(language);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5 transition-colors"
              >
                <span className="flex min-w-0 flex-col">
                  <span className={`truncate ${selected ? "font-medium text-foreground" : "text-foreground/80"}`}>
                    {language.label}
                  </span>
                  <span className="text-[10px] text-foreground/40">{language.nativeLabel}</span>
                </span>
                {selected && <Check className="h-4 w-4 shrink-0 text-foreground/70" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
