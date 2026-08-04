# VedaApex — UX Documentation

---

## 1. Information Architecture

### Site Map

```
VedaApex
├── Marketing (Public)
│   ├── Landing Page (/)
│   ├── Pricing (/pricing)
│   ├── Contact (/contact)
│   ├── Terms (/terms)
│   ├── Privacy (/privacy)
│   └── Blog (/blog) [Future]
│
├── Authentication
│   ├── Login (/login)
│   ├── Sign Up (/signup)
│   ├── Forgot Password (/forgot-password)
│   └── Reset Password (/reset-password)
│
├── App (Authenticated)
│   ├── Chat (/chat)
│   │   ├── New Chat (/chat)
│   │   └── Chat by ID (/chat/[id])
│   │
│   ├── Dashboard (/dashboard)
│   │   ├── Overview
│   │   ├── Usage Stats
│   │   └── Quick Actions
│   │
│   ├── Library (/library)
│   │   ├── All Files
│   │   ├── Images
│   │   ├── Videos
│   │   ├── Documents
│   │   └── Recent
│   │
│   ├── Tools (/tools)
│   │   ├── Image Generator (/tools/image)
│   │   ├── Video Generator (/tools/video)
│   │   ├── Logo Generator (/tools/logo)
│   │   ├── PPT Generator (/tools/ppt)
│   │   ├── Document Generator (/tools/docs)
│   │   ├── Code Generator (/tools/code)
│   │   ├── Wedding Card (/tools/wedding-card)
│   │   ├── Background Remover (/tools/bg-remover)
│   │   ├── Image Enhancer (/tools/enhancer)
│   │   ├── Watermark Remover (/tools/watermark)
│   │   ├── File Converter (/tools/converter)
│   │   ├── 3D Model (/tools/3d)
│   │   ├── Music Generator (/tools/music)
│   │   ├── Text to Speech (/tools/tts)
│   │   └── Prompt Generator (/tools/prompts)
│   │
│   ├── Explore (/explore)
│   │   ├── Featured
│   │   ├── Templates
│   │   └── Community [Future]
│   │
│   ├── Connectors (/connectors)
│   │   ├── Canva
│   │   ├── Figma
│   │   └── Slack
│   │
│   └── Settings (/settings)
│       ├── Profile (/settings/profile)
│       ├── Workspace (/settings/workspace)
│       ├── AI Engine (/settings/ai)
│       ├── Privacy (/settings/privacy)
│       ├── Security (/settings/security)
│       ├── Billing (/settings/billing)
│       ├── API Keys (/settings/api-keys)
│       ├── Notifications (/settings/notifications)
│       ├── Accessibility (/settings/accessibility)
│       └── About (/settings/about)
│
└── Error Pages
    ├── 404 Not Found
    ├── 500 Server Error
    ├── Offline
    └── Maintenance
```

---

## 2. User Flows

### Flow 1: First-Time User (New Chat)

```
1. User lands on Landing Page
   └── Sees hero with AI demo, features, and CTA
2. Clicks "Get Started Free"
   └── Redirected to /signup
3. Signs up via Google OAuth (1-click) or email
   └── Account created in Supabase
4. Onboarding overlay (3 steps, skippable)
   ├── Step 1: "What will you create?" (select interests)
   ├── Step 2: "Choose your theme" (dark/light)
   └── Step 3: "Try your first prompt" (suggested prompts)
5. Lands on /chat with empty state
   ├── Greeting: "Good morning, [Name]"
   ├── Suggested prompts grid (4 cards)
   └── Composer ready with placeholder
6. Types first message → AI responds with streaming
7. Chat saved automatically
8. Sidebar shows chat in history
```

### Flow 2: Returning User (Continue Chat)

```
1. User opens vedaapex.com
   └── Auth detected → redirected to /chat
2. Sidebar shows recent chats
   ├── Search bar for finding chats
   └── Folders for organization
3. Clicks existing chat
   └── Messages load from Supabase
4. Continues conversation
   └── New messages append with streaming
5. OR starts new chat (⌘N or "New chat" button)
```

### Flow 3: Tool Discovery

```
1. User is in chat
2. Clicks "+" button in composer
   └── Flyout menu appears with options:
       ├── Attach File
       ├── Image Generation → /tools/image
       ├── Web Search (inline tool)
       ├── Deep Search (premium)
       └── Connectors → submenu
3. OR browses sidebar "AI Services" section
   └── VedaS Vision, KodiXapex, Explore Apex
4. OR uses ⌘K command palette
   └── Type "image" → sees Image Generator
5. Navigates to tool page
   └── Tool-specific interface loads
6. Uses tool → output saved to Library
```

### Flow 4: Upgrade Flow

```
1. User hits a limit or sees locked feature
   └── Inline upgrade prompt appears (not blocking)
2. Shows what they're missing
   ├── "Upgrade to Pro to access Apex 2.2"
   └── "See all plans →" link
3. Clicks → navigates to /pricing
4. Pricing page with 3 plans
   ├── Feature comparison table
   ├── Current plan highlighted
   └── FAQ section
5. Clicks "Get Started" on desired plan
6. Razorpay checkout opens (overlay)
7. Completes payment
8. Success toast: "Welcome to Pro! 🎉"
9. Plan updated immediately
10. Redirected back to where they were
```

### Flow 5: Settings Management

```
1. User clicks Settings icon (sidebar) or ⌘,
2. Settings page with left navigation
   ├── Profile → name, avatar, email
   ├── Workspace → editor prefs, autosave
   ├── AI Engine → creativity, model, tokens
   ├── Privacy → telemetry, history, private mode
   ├── Security → sessions, 2FA, API key visibility
   ├── Billing → current plan, usage, invoices
   ├── API Keys → generate, view, revoke
   ├── Notifications → email, desktop, in-app
   ├── Accessibility → reduce motion, contrast, font size
   └── About → version, changelog, support
3. Changes save automatically (debounced)
4. Success toast on save
```

---

## 3. Wireframe Descriptions

### 3.1 Landing Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│ NAVBAR                                                        │
│ [Logo VedaApex]     Features  Pricing  Docs    [Login] [CTA] │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│                         HERO SECTION                          │
│              "The AI platform for creators"                   │
│         [Animated AI demo / chat preview]                     │
│              [Get Started Free]  [Watch Demo]                 │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│ TRUSTED BY                                                    │
│ [Logo] [Logo] [Logo] [Logo] [Logo]                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│                    FEATURES (Bento Grid)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐             │
│  │ AI Chat  │ │  Image   │ │    Video Gen     │             │
│  │          │ │   Gen    │ │                  │             │
│  └──────────┘ └──────────┘ └──────────────────┘             │
│  ┌──────────────────┐ ┌──────────┐ ┌──────────┐             │
│  │     Code Gen     │ │  PPT Gen │ │ More...  │             │
│  └──────────────────┘ └──────────┘ └──────────┘             │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                     PRICING SECTION                           │
│  ┌─────────┐  ┌─────────────┐  ┌─────────┐                  │
│  │  Pro     │  │  Max ★      │  │  Ultra   │                  │
│  │  ₹200    │  │  ₹500       │  │  ₹1000   │                  │
│  │ [Start]  │  │  [Start]    │  │  [Start] │                  │
│  └─────────┘  └─────────────┘  └─────────┘                  │
├──────────────────────────────────────────────────────────────┤
│ FOOTER                                                        │
│ [Logo]  Product  Company  Legal  Social                       │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 App Shell Layout (Desktop)

```
┌──────────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────────────────────────────────────────┐│
│ │          │ │ HEADER                                       ││
│ │          │ │ [≡] [Model ▾]                    [Upgrade]   ││
│ │          │ ├──────────────────────────────────────────────┤│
│ │ SIDEBAR  │ │                                              ││
│ │          │ │                                              ││
│ │ [Logo]   │ │              MAIN CONTENT                    ││
│ │ [New]    │ │                                              ││
│ │ [Search] │ │         (Chat / Tool / Settings)             ││
│ │ [Library]│ │                                              ││
│ │          │ │                                              ││
│ │ AI Tools │ │                                              ││
│ │ ─ Vision │ │                                              ││
│ │ ─ Kodix  │ │                                              ││
│ │ ─ Explore│ │ ┌──────────────────────────────────────┐     ││
│ │          │ │ │         COMPOSER                     │     ││
│ │ Recent   │ │ │ [+] [Tools] Ask anything...  [⏺][➤] │     ││
│ │ ─ Chat 1 │ │ │          [Model ▾]                   │     ││
│ │ ─ Chat 2 │ │ └──────────────────────────────────────┘     ││
│ │ ─ Chat 3 │ │                                              ││
│ │          │ │                                              ││
│ │ [User]   │ │                                              ││
│ └──────────┘ └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### 3.3 App Shell Layout (Mobile)

```
┌─────────────────────┐
│ HEADER              │
│ [≡] [Model ▾] [⚙]  │
├─────────────────────┤
│                     │
│                     │
│   MAIN CONTENT      │
│                     │
│   (Chat / Tool)     │
│                     │
│                     │
│                     │
│                     │
├─────────────────────┤
│ COMPOSER            │
│ [+] Ask...   [⏺][➤]│
├─────────────────────┤
│ BOTTOM NAV          │
│ [Chat][Tools][Lib]  │
│ [Explore][Settings] │
└─────────────────────┘
```

### 3.4 Chat Interface Layout

```
┌──────────────────────────────────────────┐
│              MESSAGES AREA                │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ 👤 User message right-aligned    │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ 🤖 AI response                    │    │
│  │    with markdown, code blocks,   │    │
│  │    diagrams, etc.                │    │
│  │                                  │    │
│  │ [Copy] [Regenerate] [Continue]   │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ 👤 User follow-up                │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ 🤖 Streaming response...         │    │
│  │ ▌ (cursor blink)                 │    │
│  └──────────────────────────────────┘    │
│                                          │
├──────────────────────────────────────────┤
│ COMPOSER                                  │
│ ┌────────────────────────────────────┐   │
│ │ [File badge: report.pdf ✕]         │   │
│ │                                    │   │
│ │ Ask anything...                    │   │
│ │                                    │   │
│ │ [+] [Tools]  [Model▾] [🎤] [➤]   │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

---

## 4. Navigation

### 4.1 Sidebar Navigation (Desktop)

#### Expanded State (260px)
```
Logo + Brand Name           [Collapse ◀]
─────────────────────────────────────────
[+] New Chat                     ⌘N
[🔍] Search chats...
[📚] Library
─────────────────────────────────────────
AI SERVICES
  [🖼] VedaS Vision
  [✨] KodiXapex
  [🧭] Explore Apex
─────────────────────────────────────────
RECENT
  Chat: "React component help..."    [⋯]
  Chat: "Logo ideas for startup"     [⋯]
  Chat: "Wedding card template"      [⋯]
  Chat: "Python data analysis"       [⋯]
  → View all chats
─────────────────────────────────────────
[👤 User Avatar]
  Username
  Free Plan                    [⚙]
```

#### Collapsed State (60px)
```
[Logo Icon]
───────────
[+]
[🔍]
[📚]
───────────
[🖼]
[✨]
[🧭]
───────────
[👤]
```

### 4.2 Mobile Bottom Navigation

```
┌─────┬─────┬─────┬─────┬─────┐
│ 💬  │ 🛠️  │ 📚  │ 🧭  │ ⚙️  │
│Chat │Tools│Lib  │Disc │More │
└─────┴─────┴─────┴─────┴─────┘
```

### 4.3 Header Navigation

```
[≡ Sidebar Toggle]  [Model: VedaApex ▾]              [Upgrade ✨]
```

---

## 5. Command Palette (⌘K)

### Purpose
Quick access to any action, page, or feature without leaving the keyboard.

### Behavior
- Opens on `⌘K` (Mac) or `Ctrl+K` (Windows/Linux)
- Fuzzy search across all items
- Grouped results: Pages, Actions, Chats, Settings
- Recent items shown by default
- Enter to select, Escape to close, Arrow keys to navigate

### Command Groups

```
┌──────────────────────────────────────┐
│ 🔍 Type a command or search...       │
├──────────────────────────────────────┤
│ RECENT                                │
│   💬 Continue: "React component..."  │
│   💬 Continue: "Logo ideas..."       │
├──────────────────────────────────────┤
│ PAGES                                 │
│   📊 Dashboard                       │
│   💬 New Chat                    ⌘N  │
│   🖼 Image Generator                 │
│   📹 Video Generator                │
│   ⚙ Settings                    ⌘,  │
│   💰 Billing                         │
├──────────────────────────────────────┤
│ ACTIONS                               │
│   🌙 Toggle Dark Mode            ⌘D  │
│   📋 Copy Last Response          ⌘C  │
│   🔄 Regenerate Response         ⌘R  │
│   🗑 Delete Current Chat              │
│   📤 Export Chat                      │
├──────────────────────────────────────┤
│ SETTINGS                              │
│   👤 Profile Settings                 │
│   🤖 AI Engine Settings              │
│   🔑 API Keys                        │
└──────────────────────────────────────┘
```

---

## 6. Keyboard Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Command Palette | `⌘K` | `Ctrl+K` |
| New Chat | `⌘N` | `Ctrl+N` |
| Settings | `⌘,` | `Ctrl+,` |
| Toggle Sidebar | `⌘B` | `Ctrl+B` |
| Toggle Dark Mode | `⌘D` | `Ctrl+D` |
| Focus Composer | `⌘/` | `Ctrl+/` |
| Send Message | `Enter` | `Enter` |
| New Line in Composer | `Shift+Enter` | `Shift+Enter` |
| Copy Last Response | `⌘Shift+C` | `Ctrl+Shift+C` |
| Regenerate Response | `⌘Shift+R` | `Ctrl+Shift+R` |
| Stop Generation | `Escape` | `Escape` |
| Search Chats | `⌘Shift+F` | `Ctrl+Shift+F` |
| Close Modal/Panel | `Escape` | `Escape` |
| Navigate History | `↑` / `↓` | `↑` / `↓` |

---

## 7. Accessibility

### 7.1 WCAG AA+ Compliance

| Criterion | Requirement | Implementation |
|-----------|------------|----------------|
| 1.1.1 Non-text Content | All images have alt text | `alt` attributes on all `<img>` tags |
| 1.3.1 Info and Relationships | Semantic HTML structure | Use `<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>` |
| 1.4.1 Use of Color | Color not sole indicator | Icons + text for status, not just color |
| 1.4.3 Contrast | 4.5:1 for normal text | All text colors verified against backgrounds |
| 1.4.4 Resize Text | Text scales to 200% | `rem` units, no fixed pixel heights for text containers |
| 2.1.1 Keyboard | All functions keyboard accessible | Tab order, focus management, shortcut system |
| 2.4.1 Bypass Blocks | Skip navigation link | "Skip to main content" link on every page |
| 2.4.3 Focus Order | Logical focus sequence | DOM order matches visual order |
| 2.4.7 Focus Visible | Visible focus indicators | Custom focus ring on all interactive elements |
| 3.1.1 Language | Page language declared | `<html lang="en">` |
| 3.3.1 Error Identification | Errors identified in text | Form validation with field-level messages |
| 4.1.2 Name, Role, Value | ARIA labels on components | All interactive elements have accessible names |

### 7.2 Focus Ring System

```css
/* Default focus ring */
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Destructive focus ring */
.destructive:focus-visible {
  outline-color: var(--destructive);
}
```

### 7.3 Screen Reader Considerations

| Element | ARIA Pattern | Notes |
|---------|-------------|-------|
| Sidebar | `role="navigation"`, `aria-label="Main navigation"` | Collapsible with `aria-expanded` |
| Chat messages | `role="log"`, `aria-live="polite"` | New messages announced |
| Streaming | `aria-live="polite"`, `aria-busy="true"` | Announces when complete |
| Model selector | `role="listbox"`, `aria-activedescendant` | Keyboard navigable |
| Command palette | `role="dialog"`, `aria-modal="true"` | Trap focus when open |
| Toast | `role="status"`, `aria-live="polite"` | Auto-announced |
| Sidebar toggle | `aria-label="Toggle sidebar"`, `aria-expanded` | State communicated |
| Delete button | `aria-label="Delete chat: [name]"` | Context in label |

### 7.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 7.5 Responsive Typography

| Viewport | Base Size | Scale |
|----------|-----------|-------|
| Mobile (< 640px) | 15px | 1.2 (Minor Third) |
| Tablet (640-1024px) | 16px | 1.25 (Major Third) |
| Desktop (> 1024px) | 16px | 1.25 (Major Third) |

---

## 8. Dark Mode / Light Mode

### Design Philosophy
- **Dark mode is default** — follows AI product conventions (ChatGPT, Claude, VS Code)
- **Light mode is a first-class alternative** — not an afterthought
- All colors defined as CSS custom properties with separate light/dark values
- User preference stored in localStorage and respected via `next-themes`
- System preference detected on first visit via `prefers-color-scheme`

### Color Token Strategy

```css
:root {
  /* Light mode values */
  --background: 0 0% 98%;        /* #fafafa */
  --foreground: 0 0% 9%;         /* #171717 */
  --card: 0 0% 100%;             /* #ffffff */
  --muted: 0 0% 96%;             /* #f5f5f5 */
  --border: 0 0% 90%;            /* #e5e5e5 */
  --primary: 258 58% 68%;        /* #7b5cff */
}

.dark {
  /* Dark mode values */
  --background: 240 6% 10%;      /* #18181b */
  --foreground: 0 0% 95%;        /* #f2f2f2 */
  --card: 240 4% 14%;            /* #222226 */
  --muted: 240 4% 18%;           /* #2c2c30 */
  --border: 240 4% 20%;          /* #333337 */
  --primary: 258 58% 68%;        /* #7b5cff */
}
```

---

## 9. Touch Experience (Mobile)

### Gestures

| Gesture | Action | Context |
|---------|--------|---------|
| Swipe right from left edge | Open sidebar | Chat page |
| Swipe left on sidebar | Close sidebar | Sidebar open |
| Swipe left on chat item | Reveal delete/rename | Chat list |
| Pull down | Refresh chat list | Chat page |
| Long press on message | Copy/share menu | Chat messages |
| Tap outside dropdown | Close dropdown | Any dropdown |

### Touch Targets
- Minimum touch target: 44×44px (WCAG 2.5.5)
- Interactive elements have 8px minimum spacing
- Bottom navigation icons: 48×48px
- Composer buttons: 44×44px

### Mobile-Specific Behavior
- Sidebar is overlay (not push) on mobile
- Bottom navigation replaces sidebar for primary nav
- Composer sticks to bottom with keyboard push
- Messages use full width on mobile
- Model selector uses bottom sheet instead of dropdown
- File picker uses native picker

---

## 10. Responsive Behavior

### Breakpoints

| Name | Width | Layout Changes |
|------|-------|---------------|
| `sm` | 640px | Single column, bottom nav visible |
| `md` | 768px | Sidebar overlay, wider content area |
| `lg` | 1024px | Sidebar persistent, two-column layout |
| `xl` | 1280px | Maximum content width (720px for chat) |
| `2xl` | 1536px | Extra padding, wider sidebar |

### Layout Rules

| Component | Mobile (< 768px) | Tablet (768-1024px) | Desktop (> 1024px) |
|-----------|-------------------|---------------------|---------------------|
| Sidebar | Hidden, overlay on menu tap | Collapsed (60px), expand on tap | Expanded (260px), collapsible |
| Header | Sticky, compact | Sticky, full | Sticky, full |
| Chat messages | Full width, 16px padding | Max 640px centered | Max 720px centered |
| Composer | Full width, bottom-fixed | Max 640px centered | Max 720px centered |
| Bottom nav | Visible | Hidden | Hidden |
| Model selector | Bottom sheet | Dropdown | Dropdown |
| Settings | Full page, stacked sections | Side nav + content | Side nav + content |
| Pricing cards | Stacked vertically | 2-column grid | 3-column grid |
| Landing hero | Single column | Two column | Two column |
| Tool pages | Full width | Centered, max 800px | Centered, max 800px |

### Content Width Constraints
```
Landing page max-width: 1280px (centered)
App content max-width: 720px (chat), 1024px (tools), 1280px (dashboard)
Settings content max-width: 640px
```
