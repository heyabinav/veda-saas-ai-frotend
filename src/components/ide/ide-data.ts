import type { LucideIcon } from "lucide-react";
import {
  Search,
  FolderSearch,
  FileSearch,
  Wrench,
  Palette,
  Terminal,
} from "lucide-react";

export type FileNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
};

export type FileMarker = { line: number; type: "error" | "warning"; message: string };

export type ChatMessage = { id: string; role: "user" | "assistant"; text: string };

export type ToolStep = {
  id: string;
  label: string;
  icon: LucideIcon;
  state: "pending" | "running" | "done" | "error";
};

export type DiffSign = "+" | "-" | "~";
export type DiffLine = { sign: " " | DiffSign; text: string };
export type DiffFile = { path: string; lines: DiffLine[] };
export type DiffSummaryLine = { sign: DiffSign; text: string };

export type Toast = { id: string; kind: "info" | "success" | "error"; text: string };

export const MODELS = ["Apex 2.1", "Apex 2.2 (Low)", "Apex 2.2 (High)", "ApexCode 3.0"];

export const WORKSPACES = ["vedaapex", "apex-starter", "portfolio-2026"];

export const SUGGESTIONS = [
  "Explain what page.tsx does",
  "Fix the type error in Login.tsx",
  "Add dark mode toggle",
  "Write tests for utils.ts",
  "Refactor the login form",
];

export const SAMPLE_TREE: FileNode[] = [
  {
    name: "vedaapex",
    path: "vedaapex",
    type: "folder",
    children: [
      { name: ".gitignore", path: "vedaapex/.gitignore", type: "file" },
      { name: "package.json", path: "vedaapex/package.json", type: "file" },
      { name: "README.md", path: "vedaapex/README.md", type: "file" },
      { name: "tsconfig.json", path: "vedaapex/tsconfig.json", type: "file" },
      {
        name: "public",
        path: "vedaapex/public",
        type: "folder",
        children: [{ name: "favicon.svg", path: "vedaapex/public/favicon.svg", type: "file" }],
      },
      {
        name: "src",
        path: "vedaapex/src",
        type: "folder",
        children: [
          {
            name: "app",
            path: "vedaapex/src/app",
            type: "folder",
            children: [
              { name: "globals.css", path: "vedaapex/src/app/globals.css", type: "file" },
              { name: "layout.tsx", path: "vedaapex/src/app/layout.tsx", type: "file" },
              { name: "page.tsx", path: "vedaapex/src/app/page.tsx", type: "file" },
            ],
          },
          {
            name: "components",
            path: "vedaapex/src/components",
            type: "folder",
            children: [
              { name: "ChatPanel.tsx", path: "vedaapex/src/components/ChatPanel.tsx", type: "file" },
              { name: "Login.tsx", path: "vedaapex/src/components/Login.tsx", type: "file" },
              { name: "Sidebar.tsx", path: "vedaapex/src/components/Sidebar.tsx", type: "file" },
            ],
          },
          {
            name: "lib",
            path: "vedaapex/src/lib",
            type: "folder",
            children: [{ name: "utils.ts", path: "vedaapex/src/lib/utils.ts", type: "file" }],
          },
        ],
      },
    ],
  },
];

export const FILE_CONTENTS: Record<string, string> = {
  "vedaapex/.gitignore": `node_modules
.next
out
dist
.env*
*.log
.DS_Store`,
  "vedaapex/package.json": `{
  "name": "vedaapex",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "16.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.575.0"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "@types/react": "^19.2.0",
    "@types/node": "^22.16.5"
  }
}`,
  "vedaapex/README.md": `# vedaapex

AI-powered developer workspace with authentication, chat and a minimal file explorer.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Scripts

| Script      | Description                |
| ----------- | -------------------------- |
| npm run dev | Start the dev server       |
| npm run build | Production build         |
| npm run lint | Run ESLint                |`,
  "vedaapex/tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`,
  "vedaapex/public/favicon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="32" y2="32">
      <stop offset="0" stop-color="#818cf8" />
      <stop offset="1" stop-color="#22d3ee" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="#0b0f1a" />
  <path d="M9 25 L16 7 L23 25" fill="none" stroke="url(#g)" stroke-width="3"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M12.5 19 H19.5" stroke="url(#g)" stroke-width="3" stroke-linecap="round" />
</svg>`,
  "vedaapex/src/app/globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background: #0b0f1a;
  color: #e5e9f0;
  font-family: "Inter", system-ui, sans-serif;
}

body {
  min-height: 100vh;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background: #1e2638;
  border-radius: 8px;
}

.card {
  border: 1px solid #1e2638;
  border-radius: 12px;
}

@media (max-width: 640px) {
  .card {
    padding: 0.75rem;
  }
}`,
  "vedaapex/src/app/layout.tsx": `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "vedaapex",
  description: "AI-powered developer workspace",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}`,
  "vedaapex/src/app/page.tsx": `import { useState } from "react";
import Login from "@/components/Login";
import ChatPanel from "@/components/ChatPanel";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  const [user, setUser] = useState<{ name: string } | null>(null);

  if (!user) {
    return <Login onLogin={(name) => setUser({ name })} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar userName={user.name} />
      <ChatPanel />
    </div>
  );
}`,
  "vedaapex/src/components/ChatPanel.tsx": `import { useState } from "react";

type Message = { role: "user" | "assistant"; text: string };

const WELCOME: Message = {
  role: "assistant",
  text: "Hi! I'm Apex AI. Ask me to build, fix, explain, or refactor anything in this workspace.",
};

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [draft, setDraft] = useState("");

  function send() {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { role: "user", text },
      {
        role: "assistant",
        text: "I'll inspect the repository first, then implement that for you.",
      },
    ]);
    setDraft("");
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <span className="font-semibold text-white">Apex AI</span>
        <span className="text-xs text-slate-500">vedaapex</span>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={
                m.role === "user"
                  ? "inline-block rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2 text-left text-sm text-white"
                  : "inline-block max-w-full rounded-2xl rounded-bl-sm border border-slate-800 bg-slate-900 px-4 py-2 text-left text-sm text-slate-200"
              }
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t border-slate-800 p-4"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask Apex AI to build, fix, explain, or modify your code..."
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-indigo-500"
        />
      </form>
    </main>
  );
}`,
  "vedaapex/src/components/Login.tsx": `import { useState, type FormEvent } from "react";

export default function Login({ onLogin }: { onLogin: (name: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setLoading] = useState<boolean>("false");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    onLogin(email.split("@")[0]);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-400">
          Sign in to continue to vedaapex
        </p>
        <label className="mt-6 block text-sm text-slate-300">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
            required
          />
        </label>
        <label className="mt-4 block text-sm text-slate-300">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
            required
          />
        </label>
        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}`,
  "vedaapex/src/components/Sidebar.tsx": `import { useState } from "react";

const ITEMS = ["Chat", "Files", "Search", "Settings"];

export default function Sidebar({ userName }: { userName: string }) {
  const [active, setActive] = useState("Chat");

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-800 p-4 md:block">
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
          A
        </div>
        <div>
          <p className="text-sm font-semibold text-white">vedaapex</p>
          <p className="text-xs text-slate-500">{userName}</p>
        </div>
      </div>
      <nav className="mt-6 space-y-1">
        {ITEMS.map((item) => (
          <button
            key={item}
            onClick={() => setActive(item)}
            className={
              active === item
                ? "w-full rounded-lg bg-slate-800 px-3 py-2 text-left text-sm font-medium text-white"
                : "w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-900 hover:text-white"
            }
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}`,
  "vedaapex/src/lib/utils.ts": `export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}`,
};

export const FILE_MARKERS: Record<string, FileMarker[]> = {
  "vedaapex/src/components/Login.tsx": [
    {
      line: 6,
      type: "error",
      message: "Type 'string' is not assignable to type 'boolean'",
    },
  ],
  "vedaapex/src/app/globals.css": [
    {
      line: 11,
      type: "warning",
      message: "Duplicate selector 'body' (first defined at line 5)",
    },
    {
      line: 25,
      type: "warning",
      message: ".card is defined but never used",
    },
  ],
};

export const INTELLISENSE: Record<string, string[]> = {
  "vedaapex/src/app/page.tsx": [
    "useState",
    "useEffect",
    "Login",
    "ChatPanel",
    "Sidebar",
    "export default",
  ],
  "vedaapex/src/components/Login.tsx": [
    "useState",
    "FormEvent",
    "onLogin",
    "handleSubmit",
    "isLoading",
    "email",
  ],
  "vedaapex/src/components/ChatPanel.tsx": ["useState", "Message", "WELCOME", "send", "draft"],
  "vedaapex/src/components/Sidebar.tsx": ["useState", "ITEMS", "active", "setActive"],
  "vedaapex/src/lib/utils.ts": ["cn", "formatDate", "classes", "date"],
};

const toolTemplate = (id: string, label: string, icon: LucideIcon) => ({ id, label, icon });

export const AI_TOOL_STEPS = [
  toolTemplate("analyze", "Analyzed project", Search),
  toolTemplate("inspect", "Inspected src/app", FolderSearch),
  toolTemplate("found", "Found authentication components", FileSearch),
  toolTemplate("update", "Updated Login.tsx", Wrench),
  toolTemplate("styles", "Added responsive styles", Palette),
  toolTemplate("typecheck", "Ran type checking", Terminal),
];

export const READ_TOOL_STEPS = [
  toolTemplate("analyze", "Analyzed project", Search),
  toolTemplate("inspect", "Inspected src/app", FolderSearch),
];

export const DIFF_SUMMARY: DiffSummaryLine[] = [
  { sign: "+", text: "Added responsive authentication layout" },
  { sign: "-", text: "Removed duplicated component" },
  { sign: "~", text: "Updated API request handling" },
];

export const DIFF_FILES: DiffFile[] = [
  {
    path: "src/components/Login.tsx",
    lines: [
      { sign: " ", text: "import { useState, type FormEvent } from \"react\";" },
      { sign: "-", text: "import { AuthCard } from \"./AuthCard\";" },
      { sign: " ", text: "" },
      { sign: " ", text: "export default function Login({ onLogin }: { onLogin: (name: string) => void }) {" },
      { sign: " ", text: "  const [email, setEmail] = useState(\"\");" },
      { sign: " ", text: "  const [password, setPassword] = useState(\"\");" },
      { sign: "-", text: "  const [isLoading, setLoading] = useState<boolean>(\"false\");" },
      { sign: "+", text: "  const [isLoading, setLoading] = useState(false);" },
      { sign: " ", text: "" },
      { sign: " ", text: "  async function handleSubmit(e: FormEvent) {" },
      { sign: " ", text: "    e.preventDefault();" },
      { sign: "+", text: "    if (!email || !password) return;" },
      { sign: " ", text: "    setLoading(true);" },
      { sign: "-", text: "    await new Promise((r) => setTimeout(r, 900));" },
      { sign: "+", text: "    await new Promise((r) => setTimeout(r, 600));" },
      { sign: " ", text: "    onLogin(email.split(\"@\")[0]);" },
      { sign: " ", text: "  }" },
      { sign: " ", text: "" },
      { sign: "+", text: "  return <AuthCard onSubmit={handleSubmit} />;" },
      { sign: "-", text: "  return (" },
      { sign: "-", text: "    <main className=\"flex min-h-screen items-center justify-center px-4 py-8\">" },
      { sign: "-", text: "      <form className=\"w-full max-w-md ...\" >" },
      { sign: "+", text: "  // Responsive layout extracted into AuthCard" },
      { sign: "-", text: "  // Duplicated responsive handling removed" },
      { sign: " ", text: "}" },
    ],
  },
  {
    path: "src/app/globals.css",
    lines: [
      { sign: " ", text: "@tailwind base;" },
      { sign: " ", text: "@tailwind components;" },
      { sign: " ", text: "@tailwind utilities;" },
      { sign: " ", text: "" },
      { sign: "-", text: "body {" },
      { sign: "-", text: "  min-height: 100vh;" },
      { sign: "-", text: "}" },
      { sign: "+", text: "body {" },
      { sign: "+", text: "  min-height: 100dvh;" },
      { sign: "+", text: "}" },
      { sign: " ", text: "" },
      { sign: "+", text: "@media (max-width: 640px) {" },
      { sign: "+", text: "  .auth-card {" },
      { sign: "+", text: "    padding: 1rem;" },
      { sign: "+", text: "  }" },
      { sign: "+", text: "}" },
    ],
  },
];

export const DARK_TOKENS = {
  default: "#9aa4b5",
  keyword: "#c678dd",
  string: "#98c379",
  comment: "#5c6370",
  number: "#d19a66",
  tag: "#e06c75",
  functionName: "#61afef",
  attribute: "#e5c07b",
  symbol: "#7f8ea3",
};

type Token = { text: string; color: string };

const TOKEN_RE =
  /(<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/[^\n]*)|(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b0[xX][0-9a-fA-F]+\b|\b\d+(?:\.\d+)?\b|#[0-9a-fA-F]{3,8}\b)|(\b(?:const|let|var|function|return|if|else|for|while|do|import|export|from|default|class|new|this|async|await|try|catch|finally|throw|typeof|instanceof|true|false|null|undefined|switch|case|break|continue|in|of|extends|super|static|yield|void|delete|interface|type|enum|readonly|string|number|boolean|any|Array|Object|Promise|Date|Math|JSON|window|document|console)\b)|(<\/?[a-zA-Z][\w-]*)|([a-zA-Z_$][\w$]*(?=\s*\())|([\w-]+(?=\s*=)|[\w-]+(?=\s*:))|([{}()[\];,.:<>+\-*/=!&|?~%^])/g;

const TOKEN_GROUPS: { color: string }[] = [
  { color: DARK_TOKENS.comment },
  { color: DARK_TOKENS.string },
  { color: DARK_TOKENS.number },
  { color: DARK_TOKENS.keyword },
  { color: DARK_TOKENS.tag },
  { color: DARK_TOKENS.functionName },
  { color: DARK_TOKENS.attribute },
  { color: DARK_TOKENS.symbol },
];

export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  const re = new RegExp(TOKEN_RE.source, "g");
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, match.index), color: DARK_TOKENS.default });
    }
    let color = DARK_TOKENS.default;
    for (let g = 0; g < TOKEN_GROUPS.length; g++) {
      if (match[g + 1] !== undefined) {
        color = TOKEN_GROUPS[g].color;
        break;
      }
    }
    tokens.push({ text: match[0], color });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), color: DARK_TOKENS.default });
  }
  return tokens;
}

export function firstTokenColor(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return "#232c3e";
  if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*"))
    return DARK_TOKENS.comment;
  const tokens = tokenizeLine(line);
  for (const t of tokens) {
    if (t.text.trim()) return t.color;
  }
  return "#232c3e";
}

export function computeFoldRanges(lines: string[]): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let depth = 0;
  let start: number | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("//") && !line.includes("/*")) continue;
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    if (start === null && opens > 0 && !line.trim().startsWith("}")) {
      start = i;
    }
    depth += opens - closes;
    if (start !== null && depth <= 0) {
      if (i - start >= 2) ranges.push([start, i]);
      start = null;
      depth = 0;
    }
  }
  return ranges;
}