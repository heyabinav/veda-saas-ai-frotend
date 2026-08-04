"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  parseMessageBlocks,
  splitTextParagraphs,
  type MessageBlock,
} from "@/lib/message-content";

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
          p: ({ children }) => <p className="whitespace-pre-wrap leading-relaxed">{children}</p>,
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

function CodeBlock({ language, content }: { language: string; content: string }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-3 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/[0.03] border-b border-[var(--border)]">
        <span className="text-[10px] font-medium text-foreground/40 uppercase tracking-wider">{language}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setEditing(!editing); if (editing) setCode(code); }}
            className="px-2 py-0.5 text-[10px] rounded text-foreground/40 hover:text-foreground/70 hover:bg-black/5 transition"
          >
            {editing ? "Done" : "Edit"}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded text-foreground/40 hover:text-foreground/70 hover:bg-black/5 transition"
          >
            {copied ? (
              <>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      {editing ? (
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-3 text-xs leading-relaxed font-mono text-foreground/80 bg-transparent resize-y focus:outline-none"
          rows={code.split("\n").length}
        />
      ) : (
        <pre className="overflow-x-auto p-3 text-xs leading-relaxed font-mono text-foreground/80">
          <code>{code}</code>
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
        if (block.type === "svg" || block.type === "html") {
          return (
            <DiagramBlock
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
