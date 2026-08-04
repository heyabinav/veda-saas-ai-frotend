"use client";

import { useMemo } from "react";

type Token = { text: string; color: string };

const COLORS = {
  default: "#cdd6f4",
  keyword: "#cba6f7",
  string: "#a6e3a1",
  comment: "#6c7086",
  number: "#fab387",
  tag: "#f38ba8",
  attribute: "#89b4fa",
  constant: "#f9e2af",
};

const TOKEN_RE =
  /(<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/[^\n]*)|(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b0[xX][0-9a-fA-F]+\b|\b\d+(?:\.\d+)?\b|#[0-9a-fA-F]{3,8}\b)|(\b(?:const|let|var|function|return|if|else|for|while|do|import|export|from|default|class|new|this|async|await|try|catch|finally|throw|typeof|instanceof|true|false|null|undefined|switch|case|break|continue|in|of|extends|super|static|yield|void|delete|interface|type|enum|readonly|string|number|boolean|any|void|Array|Object|Promise|Date|Math|JSON|window|document|console)\b)|(<\/?[a-zA-Z][\w-]*)|([\w-]+(?=\s*=)|[\w-]+(?=\s*:))|([{}()[\];,.:<>+\-*/=!&|?~%^])/g;

const GROUPS: { color: string }[] = [
  { color: COLORS.comment },
  { color: COLORS.string },
  { color: COLORS.number },
  { color: COLORS.keyword },
  { color: COLORS.tag },
  { color: COLORS.attribute },
  { color: COLORS.constant },
];

function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  const re = new RegExp(TOKEN_RE.source, "g");
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        text: line.slice(lastIndex, match.index),
        color: COLORS.default,
      });
    }
    let tokenColor = COLORS.default;
    for (let g = 0; g < GROUPS.length; g++) {
      if (match[g + 1] !== undefined) {
        tokenColor = GROUPS[g].color;
        break;
      }
    }
    tokens.push({ text: match[0], color: tokenColor });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), color: COLORS.default });
  }
  return tokens;
}

export default function CodeSyntaxLine({ line }: { line: string }) {
  const tokens = useMemo(() => tokenize(line), [line]);
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: t.color }}>
          {t.text}
        </span>
      ))}
    </>
  );
}