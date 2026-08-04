export const SPEECH_ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone permission was denied. Enable microphone access and try again.",
  "service-not-allowed": "Voice recognition is not available in this browser.",
  "no-speech": "No speech was detected. Please try again.",
  "audio-capture": "No microphone was found or the microphone is unavailable.",
  network: "A network issue interrupted voice recognition.",
  aborted: "Voice recognition was stopped.",
  "language-not-supported": "The selected language is not supported by this browser.",
  "bad-grammar": "Speech recognition failed to start.",
};

const IGNORED_ERRORS = new Set(["no-speech", "aborted"]);

export function getSpeechErrorMessage(error: string): string {
  return SPEECH_ERROR_MESSAGES[error] ?? "Voice recognition failed. Please try again.";
}

export function shouldIgnoreSpeechError(error: string): boolean {
  return IGNORED_ERRORS.has(error);
}
