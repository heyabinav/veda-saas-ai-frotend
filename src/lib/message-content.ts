export type MessageBlock =
  | { type: "text"; content: string }
  | { type: "svg"; content: string }
  | { type: "html"; content: string }
  | { type: "code"; language: string; content: string };

const FENCE_RE = /```(\w*)\n([\s\S]*?)```/g;

/**
 * Remove the structured log footer that /api/chat appends to assistant
 * responses. Only strips when the ```json block is the VERY LAST thing in the
 * response AND looks like the log payload — a ```json block in the middle of
 * the answer (e.g. the user asked for JSON config) must never be cut off,
 * otherwise trailing code/HTML after it silently disappears.
 */
export function stripStructuredFooter(text: string): string {
  const lines = text.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith("```")) {
      if (!line.startsWith("```json")) return text;
      const footer = lines.slice(i).join("\n");
      if (/"(assistant_response|user_message|assistantResponse|userMessage)"\s*:/.test(footer)) {
        return lines.slice(0, i).join("\n").trimEnd();
      }
      return text;
    }
    if (line !== "") return text;
  }
  return text;
}

export function parseMessageBlocks(text: string): MessageBlock[] {
  const cleaned = stripStructuredFooter(text)
    .replace(/^\s*~~~(\w*)\s*$/gm, "```$1")
    .replace(/^\s*~~~\s*$/gm, "```")
    .trim();
  if (!cleaned) return [];

  // Truncated responses (backend max output reached) often end with an
  // opened code fence that never closes — which would otherwise swallow the
  // whole tail into prose. Close it synthetically so the code still renders.
  const fenceCount = (cleaned.match(/```/g) || []).length;
  const normalized = fenceCount % 2 === 1 ? `${cleaned}\n\`\`\`` : cleaned;

  const blocks: MessageBlock[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const pushText = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (looksLikeCode(t)) {
      blocks.push({ type: "code", language: guessCodeLanguage(t), content: t });
    } else {
      blocks.push({ type: "text", content: raw });
    }
  };

  FENCE_RE.lastIndex = 0;
  while ((match = FENCE_RE.exec(normalized)) !== null) {
    const before = normalized.slice(lastIndex, match.index).trim();
    pushText(before);

    const lang = match[1].toLowerCase();
    const content = match[2].trim();

    if (lang === "svg" || content.startsWith("<svg")) {
      blocks.push({ type: "svg", content });
    } else if (lang === "html") {
      blocks.push({ type: "html", content });
    } else if (lang === "json") {
      // skip structured log payloads
    } else {
      blocks.push({ type: "code", language: lang || guessCodeLanguage(content), content });
    }

    lastIndex = match.index + match[0].length;
  }

  const tail = normalized.slice(lastIndex).trim();
  if (tail) {
    if (tail.startsWith("<svg") && tail.includes("</svg>")) {
      blocks.push({ type: "svg", content: tail });
    } else {
      pushText(tail);
    }
  }

  return blocks.length > 0 ? blocks : [{ type: "text", content: normalized }];
}

export function splitTextParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// ── Raw (unfenced) code detection ──────────────────────────────────────────
// AI responses sometimes return code without ``` fences. If a text segment
// looks like code, render it in the syntax-highlighted code box instead of as
// plain prose.

const CODE_LINE_RE =
  /^(?:\s{2,}\S|<[a-zA-Z/!]|function\s|const\s|let\s|var\s|import\s|export\s|def\s|class\s|public\s|private\s|protected\s|static\s|async\s|await\s|return\s|if\s*\(|for\s*\(|while\s*\(|switch\s*\(|try\s*\{|catch\s*\(|console\.|document\.|window\.|require\(|from\s+["']|npm\s|npx\s|pip\s|git\s|curl\s|SELECT\b|INSERT\b|UPDATE\b|DELETE\b|CREATE\b|ALTER\b|DROP\b|SET\s+[\w.]+\s*=)/im;

export function looksLikeCode(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 6000) return false;
  const lines = trimmed.split("\n");
  if (lines.length === 1) {
    // Single line: only treat it as code when it has strong code markers
    const single = lines[0];
    return CODE_LINE_RE.test(single) && /[{}\[\]()=;]/.test(single) && /\s/.test(single);
  }
  const hints = lines.filter((l) => CODE_LINE_RE.test(l)).length;
  return hints >= Math.max(2, Math.ceil(lines.length * 0.35));
}

export function guessCodeLanguage(content: string): string {
  const head = content.slice(0, 1000);

  // HTML/XML: has opening AND closing tags
  if (/<[a-zA-Z][\w-]*[^>]*>/i.test(head) && /<\/[a-zA-Z][\w-]*>/i.test(content)) {
    return "html";
  }

  // CSS: selector blocks with property: value;
  if (/^\s*[.#@][\w-]+\s*\{/m.test(head) || (/^\s*[\w-]+\s*\{/m.test(head) && /[a-z-]+\s*:\s*[^;{}]+;/i.test(head))) {
    return "css";
  }

  // SQL
  if (/^\s*(select|insert into|update|delete from|create table|alter table|drop table)\b/im.test(head)) {
    return "sql";
  }

  // Python
  if (/^\s*(def|class)\s+\w+|^\s*import\s+\w+|^\s*from\s+\w+\s+import/im.test(head)) {
    return "python";
  }

  // TypeScript-only syntax markers
  const tsOnly =
    /:\s*(string|number|boolean|any|unknown|never|void|Record<\w|Promise<\w|Array<\w)\b|interface\s+\w+|type\s+\w+\s*=|enum\s+\w+|as\s+(const|string|number|any|unknown)\b/;
  const hasTs = tsOnly.test(head);

  // JSX/TSX: JS plus component-style tags
  const hasJsx = /return\s*\(?\s*<[A-Za-z][\s/>]|=>\s*\(?\s*<[A-Za-z]|const\s+\w+\s*=\s*\(?\s*<[A-Za-z]|function\s+\w+\s*\([^)]*\)\s*\{\s*return\s*\(?\s*</i.test(head);
  if (hasJsx) {
    return hasTs ? "tsx" : "jsx";
  }

  // Shell commands
  if (/^\s*(npm|npx|pip|git|curl|cd\s|ls\s|mkdir|rm\s|sudo|echo|docker)\b/im.test(head)) {
    return "bash";
  }

  // C / C++ includes
  if (/#include|using namespace std|std::|printf\s*\(/im.test(head)) {
    return "cpp";
  }

  // Java
  if (/\bpublic\s+(static\s+)?(void|int|String|boolean|double)\s+\w+\s*\(|System\.out\.print/im.test(head)) {
    return "java";
  }

  // JavaScript (default for common JS markers)
  if (/\b(function|const|let|var|=>|console\.|document\.|window\.|require\(|import\s)/im.test(head)) {
    return hasTs ? "typescript" : "javascript";
  }

  return "text";
}
