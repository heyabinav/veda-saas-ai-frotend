# VedaApex — AI-Native Creative Platform

> The most advanced AI-powered creative workspace. Generate, design, and build — all in one place.

---

## Vision

VedaApex is a premium AI SaaS platform that unifies conversational AI, image/video generation, code generation, and document creation into a single, elegant workspace. Our redesign transforms VedaApex from a functional prototype into a world-class product that rivals the polish of ChatGPT, Claude, Linear, and Vercel.

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js (App Router) | 15.1.7 | Server/client rendering, routing, API routes |
| **Language** | TypeScript | 5.8.3 | Type safety across the entire codebase |
| **UI Library** | React | 19.0.0 | Component-based UI with concurrent features |
| **Styling** | Tailwind CSS | 4.2.1 | Utility-first CSS with design tokens |
| **Components** | Shadcn UI | Latest | 46 pre-built accessible components (Radix primitives) |
| **Animation** | Framer Motion | 12.40.0 | Declarative animations and gestures |
| **Icons** | Lucide React | 0.575.0 | Consistent icon system |
| **State** | TanStack Query | 5.83.0 | Server state management and caching |
| **Forms** | React Hook Form + Zod | 7.71 / 3.24 | Form validation with schema-first approach |
| **Auth** | Supabase Auth | 2.106.1 | Authentication, session management |
| **Database** | Supabase (PostgreSQL) | — | Chat persistence, user data, folders |
| **Payments** | Razorpay | — | Subscription billing (INR) |
| **Charts** | Recharts | 2.15.4 | Analytics and data visualization |
| **Canvas** | Konva / React Konva | 10.3.0 | Canvas-based editor and generators |
| **3D** | Three.js | 0.184.0 | 3D model visualization |
| **Toasts** | Sonner | 2.0.7 | Notification system |
| **Theming** | next-themes | 0.4.6 | Dark/light mode toggle |
| **Panels** | react-resizable-panels | 4.6.5 | Resizable layout panels |
| **Command** | cmdk | 1.1.1 | Command palette (⌘K) |
| **Upload** | react-dropzone | 15.0.0 | File drag-and-drop |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Next.js App                    │
├────────┬────────┬────────┬────────┬──────────────┤
│ Landing│  Auth  │  Chat  │ Tools  │  Settings    │
│  Page  │ Pages  │  App   │ Pages  │    Page      │
├────────┴────────┴────────┴────────┴──────────────┤
│              Shared Component Library             │
│   (Design System + Shadcn UI + Custom Components) │
├──────────────────────────────────────────────────┤
│           State Management Layer                  │
│  (TanStack Query + React Context + localStorage)  │
├──────────────────────────────────────────────────┤
│              API & Integration Layer              │
│     (Next.js API Routes → FastAPI Backend)        │
├──────────┬───────────┬───────────────────────────┤
│ Supabase │  FastAPI  │     External APIs          │
│  Auth/DB │  Backend  │  (HF, Razorpay, OAuth)    │
└──────────┴───────────┴───────────────────────────┘
```

---

## Project Structure (Redesigned)

```
src/
├── app/                        # Next.js App Router pages
│   ├── (marketing)/            # Landing, pricing, contact (public)
│   │   ├── page.tsx            # Landing page
│   │   ├── pricing/
│   │   ├── contact/
│   │   ├── terms/
│   │   └── privacy/
│   ├── (auth)/                 # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (app)/                  # Authenticated app shell
│   │   ├── layout.tsx          # App shell with sidebar
│   │   ├── chat/               # AI Chat interface
│   │   │   ├── page.tsx        # New chat
│   │   │   └── [id]/page.tsx   # Chat by ID
│   │   ├── dashboard/
│   │   ├── library/
│   │   ├── tools/              # All AI tools
│   │   │   ├── image/
│   │   │   ├── video/
│   │   │   ├── ppt/
│   │   │   ├── code/
│   │   │   └── ...
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── profile/
│   │   │   ├── billing/
│   │   │   ├── api-keys/
│   │   │   └── ...
│   │   └── files/
│   ├── api/                    # API routes
│   ├── layout.tsx              # Root layout
│   └── not-found.tsx           # 404 page
├── components/
│   ├── ui/                     # Shadcn UI primitives
│   ├── chat/                   # Chat-specific components
│   │   ├── ChatContainer.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── Composer.tsx
│   │   ├── StreamingMessage.tsx
│   │   ├── CodeBlock.tsx
│   │   └── ToolSelector.tsx
│   ├── layout/                 # Layout components
│   │   ├── AppSidebar.tsx
│   │   ├── AppHeader.tsx
│   │   ├── CommandPalette.tsx
│   │   └── MobileNav.tsx
│   ├── marketing/              # Landing page components
│   ├── settings/               # Settings page components
│   └── shared/                 # Shared components
│       ├── EmptyState.tsx
│       ├── ErrorBoundary.tsx
│       ├── LoadingSkeleton.tsx
│       └── ModelSelector.tsx
├── hooks/                      # Custom React hooks
│   ├── use-chat.ts
│   ├── use-auth.ts
│   ├── use-keyboard-shortcuts.ts
│   ├── use-mobile.ts
│   └── use-theme.ts
├── lib/                        # Utility libraries
│   ├── api/
│   ├── supabase/
│   ├── utils.ts
│   └── constants.ts
├── config/                     # Configuration
├── types/                      # TypeScript types
└── styles/                     # Global styles
    ├── globals.css
    ├── tokens.css
    └── animations.css
```

---

## Key Architecture Decisions

### 1. Route Groups for Layout Separation
Marketing pages (`(marketing)/`), auth pages (`(auth)/`), and the app (`(app)/`) each get their own layout. The marketing site has a traditional navbar/footer; the app has a sidebar/header shell.

### 2. ChatInterface Decomposition
The current 1,077-line `ChatInterface.tsx` is decomposed into:
- `ChatContainer` — Layout and routing logic
- `MessageList` — Virtual scrolled message display
- `MessageBubble` — Individual message with markdown/code rendering
- `Composer` — Input area with tools, model selector, voice, file upload
- `StreamingMessage` — Real-time streaming text display
- `ToolSelector` — Plus menu and tool picker

### 3. Settings Decomposition
The 1,338-line `SettingsPage` is split into route-based sections:
- `/settings` — Overview with navigation
- `/settings/profile` — Profile and general
- `/settings/billing` — Plans and payments
- `/settings/api-keys` — Developer API keys
- Each section is its own component under `components/settings/`

### 4. State Architecture
- **Server state**: TanStack Query for all API data (chats, user, settings)
- **Client state**: React Context for sidebar state, theme, active chat
- **Persistent state**: localStorage with Supabase sync for logged-in users
- **URL state**: Chat IDs in URL via App Router dynamic segments

### 5. Design Token System
All visual values flow from CSS custom properties defined in `tokens.css`:
- Spacing: 4px grid system
- Typography: Inter font with modular scale
- Colors: HSL-based with semantic naming
- Radius, shadows, blur: Consistent token system

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev

# Build for production
npm run build
```

---

## Design Philosophy

1. **AI-Native**: Every interaction assumes AI as the primary interface
2. **Minimal Elegance**: Remove clutter, maximize content, breathe white space
3. **Progressive Disclosure**: Show complexity only when needed
4. **Instant Feedback**: Every action has immediate visual response
5. **Accessible First**: WCAG AA+ compliance, keyboard navigable, screen reader friendly
6. **Performance Obsessed**: < 100ms interactions, < 1s page loads, streaming by default

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |
| Mobile Safari | 15+ |
| Chrome Android | 90+ |

---

## License

Proprietary — VedaApex © 2024-2026. All rights reserved.
