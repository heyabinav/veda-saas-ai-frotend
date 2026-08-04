export type MessageBlock =
  | { type: "text"; content: string }
  | { type: "svg"; content: string }
  | { type: "html"; content: string }
  | { type: "code"; language: string; content: string };

const FENCE_RE = /```(\w*)\n([\s\S]*?)```/g;

export function stripStructuredFooter(text: string): string {
  const idx = text.lastIndexOf("```json");
  if (idx === -1) return text;
  return text.slice(0, idx).trimEnd();
}

export function parseMessageBlocks(text: string): MessageBlock[] {
  const cleaned = stripStructuredFooter(text).trim();
  if (!cleaned) return [];

  const blocks: MessageBlock[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  FENCE_RE.lastIndex = 0;
  while ((match = FENCE_RE.exec(cleaned)) !== null) {
    const before = cleaned.slice(lastIndex, match.index).trim();
    if (before) blocks.push({ type: "text", content: before });

    const lang = match[1].toLowerCase();
    const content = match[2].trim();

    if (lang === "svg" || content.startsWith("<svg")) {
      blocks.push({ type: "svg", content });
    } else if (lang === "html") {
      blocks.push({ type: "html", content });
    } else if (lang === "json") {
      // skip structured log payloads
    } else {
      blocks.push({ type: "code", language: lang || "text", content });
    }

    lastIndex = match.index + match[0].length;
  }

  const tail = cleaned.slice(lastIndex).trim();
  if (tail) {
    if (tail.startsWith("<svg") && tail.includes("</svg>")) {
      blocks.push({ type: "svg", content: tail });
    } else {
      blocks.push({ type: "text", content: tail });
    }
  }

  return blocks.length > 0 ? blocks : [{ type: "text", content: cleaned }];
}

export function splitTextParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
