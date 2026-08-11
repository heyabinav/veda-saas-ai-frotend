# AGENTS.md

## Project Instructions for AI Assistants

### Formatting Preferences

Use the following text-based formatting in all responses:

- **Bold** for important terms or key points.
- **Bullet points** or **numbered lists** when there are multiple items.
- **Headers** (`##`, `###`) to break long responses into sections.
- **Code blocks** (```) when writing code or commands.
- **Tables** when comparing items.

### Development Commands

- Run TypeScript check: `npx tsc --noEmit --skipLibCheck`
- Run lint: `npx eslint src/app/apexcode/page.tsx src/components/ApexCodeSearchBar.tsx`

## Code Generation Prompt Template

### Basic Syntax

```
Generate [LANGUAGE/FRAMEWORK] code for: [TASK DESCRIPTION]

Requirements:
- Feature 1: [details]
- Feature 2: [details]
- Feature 3: [details]

Constraints:
- [e.g., no external libraries / use only vanilla JS]
- [e.g., mobile responsive]

Output: Provide complete, runnable code with a live preview.
```

### Example (with Preview Option)

```
Generate an HTML/CSS/JS code for: a to-do list app

Requirements:
- Add task with input box
- Mark task as complete (strikethrough)
- Delete task with a button
- Store tasks in memory (no localStorage)

Constraints:
- Single file (HTML + CSS + JS combined)
- Clean, modern UI

Output: Show me the code AND render a live preview so I can see how it looks/works.
```

### Slider/Interactive Component Prompt (special case)

```
Create an interactive [COMPONENT TYPE, e.g., image slider / carousel / range slider] in [LANGUAGE].

Features:
- [e.g., auto-play every 3 seconds]
- [e.g., left/right navigation arrows]
- [e.g., dots for slide indicators]
- [e.g., touch/swipe support for mobile]

Style: [e.g., minimal, dark theme, rounded corners]

Output:
1. Full working code
2. Live interactive preview
3. Brief explanation of how it works
```

### Quick Reference — Useful Keywords to Include in Prompts

| Keyword | Purpose |
|---|---|
| "complete, runnable code" | Ensures no placeholders/incomplete snippets |
| "live preview" | Triggers visual/interactive rendering (in tools that support it) |
| "single file" | Keeps HTML/CSS/JS combined, easy to copy-paste |
| "responsive" | Ensures mobile-friendly output |
| "no external libraries" | Keeps code dependency-free |
| "explain how it works" | Adds a short breakdown after the code |
| "step-by-step" | Breaks complex code into stages |

### Tips

- Hamesha **specific features** list karo (bullet points mein) — vague prompt = vague code.
- **Constraints** batana zaroori hai (language, libraries allowed/not allowed).
- Agar preview chahiye to explicitly likho: *"render a live preview"* ya *"show interactive demo"*.
- Bade projects ke liye task ko **chhote parts mein todo** (e.g., pehle UI, phir logic, phir styling).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
