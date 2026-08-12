"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Pencil } from "lucide-react";
import { Prism } from "@/lib/prism";
import "@/lib/prism-languages";
import {
  parseMessageBlocks,
  splitTextParagraphs,
  guessCodeLanguage,
  type MessageBlock,
} from "@/lib/message-content";

const LANG_NORMALIZE: Record<string, string> = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  py: "python",
  py3: "python",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  html: "markup",
  xml: "markup",
  svg: "markup",
  yml: "yaml",
  md: "markdown",
  mdx: "markdown",
  cs: "csharp",
  "c#": "csharp",
  cpp: "cpp",
  "c++": "cpp",
  golang: "go",
  rb: "ruby",
  txt: "plain",
  text: "plain",
  plaintext: "plain",
};

const LANG_NAMES: Record<string, string> = {
  markup: "HTML",
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  typescript: "TypeScript",
  jsx: "JSX",
  tsx: "TSX",
  python: "Python",
  bash: "Bash",
  json: "JSON",
  markdown: "Markdown",
  sql: "SQL",
  java: "Java",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  ruby: "Ruby",
  php: "PHP",
  go: "Go",
  rust: "Rust",
  kotlin: "Kotlin",
  swift: "Swift",
  scala: "Scala",
  yaml: "YAML",
  docker: "Dockerfile",
  plain: "Text",
};

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type MessageContentProps = {
  text: string;
  onSendPrompt?: (prompt: string) => void;
};

function TextBlock({ content }: { content: string }) {
  return (
    <div className="md-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="whitespace-pre-wrap leading-relaxed">
              {typeof children === "string" ? children.replace(/[ \t]+\n+$/g, "") : children}
            </p>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          code: ({ children }) => <code className="bg-black/[0.06] rounded px-1.5 py-0.5 text-sm font-mono">{children}</code>,
          pre: ({ children }) => <pre className="overflow-x-auto my-2">{children}</pre>,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-primary/30 hover:decoration-primary">{children}</a>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-foreground/20 pl-4 my-2 italic text-foreground/70">{children}</blockquote>,
          hr: () => <hr className="my-4 border-foreground/10" />,
          h1: ({ children }) => <h1 className="text-xl font-sans font-semibold mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-sans font-semibold mt-4 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-sans font-semibold mt-3 mb-1">{children}</h3>,
          table: ({ children }) => <div className="overflow-x-auto my-3"><table className="min-w-full border-collapse border border-foreground/10 text-sm">{children}</table></div>,
          th: ({ children }) => <th className="border border-foreground/10 bg-black/[0.03] px-3 py-2 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border border-foreground/10 px-3 py-2">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function DiagramBlock({
  block,
  onSendPrompt,
}: {
  block: Extract<MessageBlock, { type: "svg" | "html" }>;
  onSendPrompt?: (prompt: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onSendPrompt) return;

    const handler = (prompt: string) => {
      if (typeof prompt === "string" && prompt.trim()) {
        onSendPrompt(prompt.trim());
      }
    };

    (window as Window & { sendPrompt?: (prompt: string) => void }).sendPrompt = handler;

    const node = containerRef.current;
    if (!node) {
      return () => {
        delete (window as Window & { sendPrompt?: (prompt: string) => void }).sendPrompt;
      };
    }

    const clickableNodes = node.querySelectorAll<SVGElement | HTMLElement>(".node, [data-prompt]");
    clickableNodes.forEach((el) => {
      el.style.cursor = "pointer";
      const prompt = el.getAttribute("data-prompt");
      if (prompt) {
        el.addEventListener("click", () => handler(prompt));
      }
    });

    return () => {
      delete (window as Window & { sendPrompt?: (prompt: string) => void }).sendPrompt;
    };
  }, [block.content, onSendPrompt]);

  if (block.type === "svg") {
    return (
      <div
        ref={containerRef}
        className="diagram-host my-3 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
        dangerouslySetInnerHTML={{ __html: block.content }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="diagram-host diagram-html my-3 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
      dangerouslySetInnerHTML={{ __html: block.content }}
    />
  );
}

function HtmlCodeBlock({
  block,
  onSendPrompt,
}: {
  block: Extract<MessageBlock, { type: "html" }>;
  onSendPrompt?: (prompt: string) => void;
}) {
  const [mode, setMode] = useState<"code" | "preview">("code");

  return (
    <div className="my-2">
      <div className="mb-1.5 flex items-center gap-1">
        <button
          onClick={() => setMode("code")}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            mode === "code"
              ? "bg-black/[0.07] text-foreground dark:bg-white/10"
              : "text-foreground/40 hover:text-foreground/70"
          }`}
        >
          Code
        </button>
        <button
          onClick={() => setMode("preview")}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            mode === "preview"
              ? "bg-black/[0.07] text-foreground dark:bg-white/10"
              : "text-foreground/40 hover:text-foreground/70"
          }`}
        >
          Preview
        </button>
      </div>
      {mode === "code" ? (
        <CodeBlock language="html" content={block.content} />
      ) : (
        <DiagramBlock block={block} onSendPrompt={onSendPrompt} />
      )}
    </div>
  );
}

function CodeBlock({ language, content }: { language: string; content: string }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const rawLang = language.trim().toLowerCase();
  const normalized = LANG_NORMALIZE[rawLang] ?? rawLang;
  const displayName = LANG_NAMES[normalized] ?? LANG_NAMES[rawLang] ?? normalized;

  // If the AI used an empty/unknown language tag, try to guess one so the code
  // still gets colorful highlighting. Fall back to clike/javascript as a last
  // resort so the box is never flat single-color.
  let grammar = Prism.languages[normalized];
  if (!grammar) {
    const guessed = guessCodeLanguage(code);
    grammar =
      Prism.languages[guessed] ??
      Prism.languages.clike ??
      Prism.languages.javascript ??
      undefined;
  }
  const highlighted = grammar
    ? Prism.highlight(code, grammar, normalized)
    : escapeHtml(code);

  return (
    <div className="code-block-theme my-3 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#0d1117]">
      <div className="relative flex items-center justify-center border-b border-black/[0.08] bg-[#f6f8fa] px-12 py-2.5 dark:border-white/10 dark:bg-black/20">
        <span className="truncate text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-white/80">
          {displayName}
        </span>
        <div className="absolute right-2.5 flex items-center gap-1.5">
          <button
            onClick={() => {
              setEditing(!editing);
              if (editing) setCode(code);
            }}
            aria-label="Edit code"
            title="Edit code"
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-700 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/80"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleCopy}
            aria-label="Copy code"
            title="Copy code"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-black/15 text-gray-500 transition-colors hover:border-black/30 hover:text-gray-800 dark:border-white/15 dark:text-white/60 dark:hover:border-white/30 dark:hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      {editing ? (
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full resize-y bg-transparent p-3.5 text-xs font-mono leading-relaxed text-gray-800 focus:outline-none dark:text-white/85"
          rows={code.split("\n").length}
        />
      ) : (
        <pre className="overflow-x-auto p-3.5 text-[12.5px] leading-relaxed">
          <code
            className={`language-${normalized} font-mono`}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      )}
    </div>
  );
}

export default function MessageContent({ text, onSendPrompt }: MessageContentProps) {
  const blocks = parseMessageBlocks(text);

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        if (block.type === "text") {
          return <TextBlock key={index} content={block.content} />;
        }
        if (block.type === "svg") {
          return (
            <DiagramBlock
              key={index}
              block={block}
              onSendPrompt={onSendPrompt}
            />
          );
        }
        if (block.type === "html") {
          return (
            <HtmlCodeBlock
              key={index}
              block={block}
              onSendPrompt={onSendPrompt}
            />
          );
        }
        return <CodeBlock key={`code-${index}`} language={block.language} content={block.content} />;
      })}
    </div>
  );
}
