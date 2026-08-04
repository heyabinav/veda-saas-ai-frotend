"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeechErrorMessage, shouldIgnoreSpeechError } from "@/utils/speechRecognitionErrors";

interface UseSpeechRecognitionOptions {
  language: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: { interim: string; final: string }) => void;
}

interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  isStarting: boolean;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
}

function getSpeechRecognitionConstructor(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return (
    window.SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition })
      .webkitSpeechRecognition ||
    null
  );
}

const RESTART_DELAY_MS = 500;
const START_DELAY_AFTER_PERMISSION_MS = 250;

export function useSpeechRecognition({
  language,
  continuous = true,
  interimResults = true,
  onResult,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const [isSupported] = useState<boolean>(() => getSpeechRecognitionConstructor() !== null);
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const loopIdRef = useRef(0);
  const restartTimerRef = useRef<number | null>(null);
  const onResultRef = useRef(onResult);
  const languageRef = useRef(language);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    loopIdRef.current += 1;
    clearRestartTimer();

    const recognition = recognitionRef.current;
    recognitionRef.current = null;

    if (recognition) {
      try {
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onresult = null;
        recognition.onstart = null;
        recognition.stop();
      } catch {
        try {
          recognition.abort();
        } catch {
          // already stopped
        }
      }
    }

    setIsListening(false);
    setIsStarting(false);
    setInterimTranscript("");
  }, [clearRestartTimer]);

  const resetTranscript = useCallback(() => {
    setFinalTranscript("");
    setInterimTranscript("");
  }, []);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      loopIdRef.current += 1;
      clearRestartTimer();

      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        try {
          recognition.onend = null;
          recognition.abort();
        } catch {
          // already stopped
        }
      }
    };
  }, [clearRestartTimer]);

  const startListening = useCallback(async (): Promise<void> => {
    if (!isSupported) return;
    if (isListeningRef.current || recognitionRef.current) return;

    setError(null);
    setIsStarting(true);

    let stream: MediaStream | null = null;
    try {
      // Request microphone permission explicitly so Chrome reliably shows
      // the permission prompt before speech recognition starts.
      if (navigator.mediaDevices?.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
    } catch (permissionError: unknown) {
      setIsStarting(false);
      const err = permissionError as { name?: string };
      setError(
        err?.name === "NotAllowedError"
          ? getSpeechErrorMessage("not-allowed")
          : err?.name === "NotFoundError"
            ? getSpeechErrorMessage("audio-capture")
            : getSpeechErrorMessage("not-allowed")
      );
      return;
    }

    // Give the mic hardware a moment to release before recognition captures it.
    window.setTimeout(() => {
      if (!isListeningRef.current) {
        void startRecognitionLoop();
      }
    }, START_DELAY_AFTER_PERMISSION_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  const startRecognitionLoop = useCallback(() => {
    const Constructor = getSpeechRecognitionConstructor();
    if (!Constructor) {
      setIsStarting(false);
      setError(getSpeechErrorMessage("service-not-allowed"));
      return;
    }

    const myId = ++loopIdRef.current;
    let recognition: SpeechRecognition;
    try {
      recognition = new Constructor();
    } catch {
      setIsStarting(false);
      setError(getSpeechErrorMessage("bad-grammar"));
      return;
    }

    recognition.lang = languageRef.current;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    isListeningRef.current = true;

    recognition.onstart = () => {
      setIsStarting(false);
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let newFinal = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) {
          newFinal += transcript;
        } else {
          interim += transcript;
        }
      }

      if (newFinal) {
        setFinalTranscript((prev) => {
          const next = prev ? `${prev.trim()} ${newFinal.trim()}` : newFinal.trim();
          return next;
        });
      }
      setInterimTranscript(interim);
      onResultRef.current?.({ interim, final: newFinal });
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (shouldIgnoreSpeechError(event.error)) return;

      if (event.error === "language-not-supported") {
        // Language fallback handled at the hook level below.
      }

      setError(getSpeechErrorMessage(event.error));

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed" ||
        event.error === "language-not-supported" ||
        event.error === "network" ||
        event.error === "audio-capture"
      ) {
        // Fatal errors: do not auto-restart.
        isListeningRef.current = false;
        loopIdRef.current += 1;
        setIsListening(false);
        setIsStarting(false);
        recognitionRef.current = null;
      }
    };

    recognition.onend = () => {
      // Stale loop superseded by a newer instance — do not restart.
      if (myId !== loopIdRef.current) return;

      if (isListeningRef.current) {
        // Safe auto-restart with a small delay to let Chrome release the mic.
        clearRestartTimer();
        restartTimerRef.current = window.setTimeout(() => {
          if (isListeningRef.current && myId === loopIdRef.current) {
            startRecognitionLoop();
          }
        }, RESTART_DELAY_MS);
      } else {
        setIsListening(false);
        setIsStarting(false);
        setInterimTranscript("");
        recognitionRef.current = null;
      }
    };

    try {
      recognition.start();
    } catch {
      isListeningRef.current = false;
      setIsListening(false);
      setIsStarting(false);
      recognitionRef.current = null;
      setError(getSpeechErrorMessage("bad-grammar"));
    }
  }, [clearRestartTimer, continuous, interimResults]);

  return {
    isSupported,
    isListening,
    isStarting,
    interimTranscript,
    finalTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
