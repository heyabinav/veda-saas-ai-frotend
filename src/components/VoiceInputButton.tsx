"use client";

import { Mic, Square } from "lucide-react";

interface VoiceInputButtonProps {
  isSupported: boolean;
  isListening: boolean;
  isStarting: boolean;
  onToggle: () => void;
  className?: string;
}

export function VoiceInputButton({
  isSupported,
  isListening,
  isStarting,
  onToggle,
  className = "",
}: VoiceInputButtonProps) {
  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title="Voice input is not supported in this browser."
        aria-label="Voice input is not supported in this browser"
        className={`rounded-full p-2 text-foreground/25 opacity-60 cursor-not-allowed ${className}`}
      >
        <Mic className="h-[18px] w-[18px]" />
      </button>
    );
  }

  const isActive = isListening || isStarting;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isListening ? "Stop voice input" : "Start voice input"}
      aria-pressed={isListening}
      title={
        isListening
          ? "Stop voice input"
          : "Voice input — recognition is handled by your browser. No audio is stored by this application."
      }
      className={`relative flex items-center justify-center rounded-full transition-colors ${
        isActive ? "text-red-500" : "text-foreground/55 hover:bg-black/5 hover:text-foreground"
      } ${className}`}
    >
      {isActive && (
        <span className="absolute inset-0 rounded-full bg-red-500/15 animate-ping pointer-events-none" />
      )}
      {isListening ? (
        <Square className="h-[14px] w-[14px] fill-current" />
      ) : (
        <Mic className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
