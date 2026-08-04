import { DIAGRAM_SYSTEM_PROMPT } from "./diagram-system-prompt";

export const BASE_SYSTEM_PROMPT =
  "You are VedaApex, a professional AI assistant. Be clear, accurate, and helpful.";

export const DEFAULT_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}\n\n${DIAGRAM_SYSTEM_PROMPT}`;

export const defaultAiSettings = {
  creativity: 0.7,
  maxTokens: 4096,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  streamResponses: true,
  responseStyle: "Balanced",
  defaultModel: "Apex 2.2 (High)",
  codeOnlyMode: true,
};
