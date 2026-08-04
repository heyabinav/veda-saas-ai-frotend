# VedaApex — Product Requirements Document

---

## 1. Vision

**Make AI tools accessible, beautiful, and indispensable for every creator.**

VedaApex is a unified AI creative platform that combines conversational AI, image generation, video creation, code generation, document tools, and design utilities into a single, premium workspace. We aim to be the "everything app" for AI-powered creation — the tool that creators, developers, students, and professionals open first every morning.

---

## 2. Mission

Deliver the most polished, powerful, and accessible AI workspace by:
- Unifying 15+ AI capabilities under one roof
- Providing a UI/UX that matches Apple, Linear, and Claude in quality
- Making premium AI tools affordable for the Indian market and beyond
- Building trust through transparency, speed, and reliability

---

## 3. Goals

### Business Goals
| Goal | Metric | Target | Timeline |
|------|--------|--------|----------|
| User acquisition | Monthly Active Users (MAU) | 50,000 | 6 months |
| Conversion rate | Free → Paid | 8-12% | 6 months |
| Revenue growth | Monthly Recurring Revenue | ₹15L/month | 12 months |
| Retention | 30-day retention | > 40% | 6 months |
| Engagement | DAU/MAU ratio | > 35% | 6 months |

### Product Goals
| Goal | Metric | Target |
|------|--------|--------|
| Performance | First Contentful Paint | < 1.2s |
| Performance | Time to Interactive | < 2.5s |
| Reliability | Uptime | 99.5% |
| Quality | Lighthouse Score | > 90 (all categories) |
| Accessibility | WCAG Compliance | AA+ |
| Satisfaction | NPS Score | > 50 |

---

## 4. Target Users

### Primary Personas

#### Persona 1: "Aarav" — The Student Creator
- **Age**: 18-24
- **Location**: Tier 1-2 Indian cities
- **Device**: Android phone (primary), laptop (secondary)
- **Behavior**: Uses AI for assignments, project presentations, image generation for social media
- **Pain Points**: Can't afford multiple AI subscriptions; ChatGPT Plus is too expensive; needs tools in one place
- **Goals**: Get work done fast; create impressive presentations; generate images for Instagram
- **Tech Comfort**: Moderate — comfortable with apps, less so with terminal/code
- **Willingness to Pay**: ₹200/month max for Pro; wants free tier to be genuinely useful

#### Persona 2: "Priya" — The Freelance Designer
- **Age**: 25-34
- **Location**: Metro cities (Mumbai, Bangalore, Delhi)
- **Device**: MacBook (primary), iPhone (secondary)
- **Behavior**: Uses AI for ideation, mockup generation, logo creation, client presentations
- **Pain Points**: Switches between Canva, Midjourney, ChatGPT, and Figma; workflow fragmentation
- **Goals**: Unified creative workspace; quick iteration on designs; professional output quality
- **Tech Comfort**: High — power user, values keyboard shortcuts and efficiency
- **Willingness to Pay**: ₹500/month for Max; expects premium tool quality

#### Persona 3: "Rohan" — The Developer
- **Age**: 22-35
- **Location**: Remote / tech hubs
- **Device**: Desktop with multiple monitors
- **Behavior**: Uses AI for code generation, debugging, API documentation, technical writing
- **Pain Points**: Needs code-specific AI that understands context; wants API access for automation
- **Goals**: Fast code generation with copy-paste workflow; API access; multi-model comparison
- **Tech Comfort**: Expert — expects keyboard shortcuts, terminal integration, API docs
- **Willingness to Pay**: ₹500-1000/month for deep code features and API access

#### Persona 4: "Meera" — The Small Business Owner
- **Age**: 30-50
- **Location**: Tier 2-3 cities
- **Device**: Android phone (primary), basic laptop
- **Behavior**: Needs AI for marketing content, social media posts, business documents, wedding cards
- **Pain Points**: Not tech-savvy; overwhelmed by complex interfaces; needs guided experiences
- **Goals**: Simple, guided tools; templates; results she can use immediately
- **Tech Comfort**: Low — needs clear CTAs, no jargon, visual guidance
- **Willingness to Pay**: ₹200/month if clearly valuable; needs to see ROI immediately

---

## 5. Pain Points (Current State)

### Critical UX Pain Points
| # | Pain Point | Impact | Affected Persona |
|---|-----------|--------|-----------------|
| 1 | Monolithic chat interface overwhelms new users | High bounce rate | All |
| 2 | No onboarding — user lands on empty chat with no guidance | Users don't know capabilities | Aarav, Meera |
| 3 | `alert()` for errors/success — feels amateurish | Erodes trust | All |
| 4 | No streaming responses — users wait with "Thinking..." | Perceived slowness | All |
| 5 | Model names are cryptic ("Apex_2.2(Low)") | Confusion about what to choose | Aarav, Meera |
| 6 | Chat input is single-line `<input>` — can't write long prompts | Poor writing experience | Rohan, Priya |
| 7 | No command palette despite `cmdk` being installed | Power users can't work efficiently | Rohan, Priya |
| 8 | Settings page is a 1,338-line wall of options | Overwhelming, hard to find settings | All |
| 9 | Promo codes hardcoded in frontend source | Security vulnerability | — |
| 10 | No proper error pages (404, 500, offline) | Users hit dead ends | All |
| 11 | Dark mode partially broken — hardcoded `bg-white` | Unusable in dark mode | All |
| 12 | No loading skeletons — content pops in jarringly | Feels unpolished | All |
| 13 | Sidebar uses `document.getElementById` for menu toggle | React anti-pattern, fragile | — |
| 14 | `confirm()` for delete — no undo capability | Accidental data loss | All |
| 15 | No keyboard shortcuts for common actions | Slow for power users | Rohan, Priya |

---

## 6. User Journey

### New User Journey (Redesigned)

```
Landing Page → Sign Up → Onboarding (3 steps) → First Chat → Explore Tools → Upgrade
     │              │            │                    │              │            │
     ▼              ▼            ▼                    ▼              ▼            ▼
  See value    Quick OAuth   Choose use case    AI responds     Discover     See value
  immediately  (Google/     + set preferences   with streaming  sidebar      proposition
               GitHub)                          + suggestions   tools        of paid tier
```

### Returning User Journey

```
Open App → See recent chats → Continue conversation OR start new → Use tools → Settings
    │            │                       │                            │           │
    ▼            ▼                       ▼                            ▼           ▼
  < 1.5s     Sidebar with          ⌘K command palette           Quick access   Focused
  load time  search + folders      for instant navigation       from sidebar   sections
```

### Upgrade Journey

```
Hit free limit → See upgrade prompt (inline) → View pricing page → Choose plan → Pay → Immediate access
      │                    │                          │                  │          │          │
      ▼                    ▼                          ▼                  ▼          ▼          ▼
  Soft paywall      Shows what they're       Feature comparison    One-click   Razorpay    Toast
  with context      missing + preview        with current plan     selection   checkout    confirmation
```

---

## 7. Features

### Core Features (MVP Redesign)

#### F1: AI Chat Interface
- Multi-model selection (VedaApex, Pro, Ultra, Max)
- Real-time streaming responses with typing animation
- Markdown rendering (headings, lists, bold, italic, links)
- Code blocks with syntax highlighting and copy button
- SVG/HTML diagram rendering
- LaTeX math rendering
- Mermaid diagram support
- Table rendering
- Message actions: copy, regenerate, continue, retry
- Conversation history with search
- Chat folders and organization
- Pinned conversations
- Chat sharing (public link)

#### F2: AI Tools Suite
- Image generation (text-to-image)
- Video generation (text-to-video)
- Logo generation
- PPT/Slide generation
- Document generation (Word, Excel, PDF)
- Wedding card generator
- Image enhancement/upscaling
- Background removal
- Watermark removal
- File conversion
- 3D model generation
- Text-to-speech
- Music generation
- Prompt generator

#### F3: Workspace
- File library with uploads
- Recent files
- Canvas editor (Konva-based)
- Connectors hub (Canva, Figma, Slack)

#### F4: Settings & Account
- Profile management
- Workspace preferences
- AI engine configuration (creativity, tokens, model, system prompt)
- Privacy & data controls
- Security settings (sessions, 2FA)
- Billing & subscription management
- API key management
- Accessibility settings
- Language & regional preferences

#### F5: Authentication
- Email/password login with validation
- OAuth (Google, GitHub)
- Password reset flow
- Guest access (limited, no login required)
- Session management

#### F6: Billing & Monetization
- Three-tier pricing (Pro ₹200, Max ₹500, Ultra ₹1000)
- Razorpay payment integration
- Plan comparison
- Usage tracking and limits
- Promo code system (server-side validation)

### Future Features (Post-Launch)
- Real-time collaboration
- Plugin/extension marketplace
- Custom AI model fine-tuning
- Team workspaces
- Version history for chats
- Advanced analytics dashboard
- Mobile app (React Native)
- Browser extension
- CLI tool
- Webhook integrations

---

## 8. Functional Requirements

### FR-01: Authentication
| ID | Requirement | Priority |
|----|------------|----------|
| FR-01.1 | Users can sign up with email/password | P0 |
| FR-01.2 | Users can login via Google OAuth | P0 |
| FR-01.3 | Users can login via GitHub OAuth | P0 |
| FR-01.4 | Users can reset their password | P0 |
| FR-01.5 | Guest users can access basic chat without login | P0 |
| FR-01.6 | Session persists across browser tabs | P0 |
| FR-01.7 | Authenticated users are redirected from login page | P0 |

### FR-02: Chat System
| ID | Requirement | Priority |
|----|------------|----------|
| FR-02.1 | Users can send text messages and receive AI responses | P0 |
| FR-02.2 | Responses stream in real-time with visible typing | P0 |
| FR-02.3 | Users can select between available AI models | P0 |
| FR-02.4 | Locked models show upgrade prompt | P0 |
| FR-02.5 | Chat history persists (localStorage for guests, Supabase for users) | P0 |
| FR-02.6 | Users can search chat history | P1 |
| FR-02.7 | Users can create folders and organize chats | P1 |
| FR-02.8 | Users can rename and delete chats | P0 |
| FR-02.9 | Users can attach files to messages | P1 |
| FR-02.10 | Users can use voice input | P2 |
| FR-02.11 | Code blocks render with syntax highlighting | P0 |
| FR-02.12 | Users can copy code blocks with one click | P0 |
| FR-02.13 | Users can regenerate the last AI response | P1 |
| FR-02.14 | Users can stop a streaming response | P1 |

### FR-03: Navigation
| ID | Requirement | Priority |
|----|------------|----------|
| FR-03.1 | Collapsible sidebar with navigation | P0 |
| FR-03.2 | Command palette (⌘K / Ctrl+K) for quick navigation | P0 |
| FR-03.3 | Keyboard shortcuts for common actions | P1 |
| FR-03.4 | Mobile-responsive bottom navigation | P0 |
| FR-03.5 | Breadcrumb navigation in nested pages | P2 |

### FR-04: Settings
| ID | Requirement | Priority |
|----|------------|----------|
| FR-04.1 | Users can update profile information | P0 |
| FR-04.2 | Users can toggle dark/light mode | P0 |
| FR-04.3 | Users can configure AI behavior (creativity, tokens, model) | P1 |
| FR-04.4 | Users can manage privacy settings | P1 |
| FR-04.5 | Users can view and manage billing | P0 |
| FR-04.6 | Users can generate and revoke API keys | P1 |

### FR-05: Billing
| ID | Requirement | Priority |
|----|------------|----------|
| FR-05.1 | Users can view plan comparison | P0 |
| FR-05.2 | Users can upgrade via Razorpay | P0 |
| FR-05.3 | Plan changes take effect immediately | P0 |
| FR-05.4 | Promo codes validated server-side | P0 |
| FR-05.5 | Users see usage metrics and limits | P1 |

---

## 9. Non-Functional Requirements

| Category | Requirement | Target |
|----------|------------|--------|
| **Performance** | First Contentful Paint | < 1.2s |
| **Performance** | Largest Contentful Paint | < 2.5s |
| **Performance** | Cumulative Layout Shift | < 0.1 |
| **Performance** | First Input Delay | < 100ms |
| **Performance** | Time to Interactive | < 3.5s |
| **Performance** | Bundle size (initial JS) | < 200KB gzipped |
| **Reliability** | API uptime | 99.5% |
| **Reliability** | Error recovery | Graceful degradation with retry |
| **Security** | Authentication | Supabase Auth with JWT |
| **Security** | Data encryption | HTTPS everywhere, encrypted at rest |
| **Security** | Input sanitization | All user inputs sanitized |
| **Accessibility** | WCAG compliance | AA+ |
| **Accessibility** | Keyboard navigation | Full keyboard support |
| **Accessibility** | Screen reader | ARIA labels on all interactive elements |
| **Accessibility** | Color contrast | Minimum 4.5:1 ratio |
| **Scalability** | Concurrent users | 10,000+ |
| **Scalability** | Chat history | Unlimited for paid users |
| **Internationalization** | Languages | English (primary), Hindi (future) |
| **Browser support** | Desktop | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ |
| **Browser support** | Mobile | iOS Safari 15+, Chrome Android 90+ |

---

## 10. Success Metrics & KPIs

### Primary KPIs
| KPI | Definition | Current | Target | Measurement |
|-----|-----------|---------|--------|-------------|
| Activation Rate | % of signups who send first message within 24h | Unknown | > 70% | Analytics |
| Free-to-Paid Conversion | % of free users who upgrade | Unknown | 8-12% | Billing data |
| Daily Active Users | Unique users per day | Unknown | 5,000+ | Analytics |
| Messages per Session | Avg messages sent per visit | Unknown | > 5 | Analytics |
| Session Duration | Avg time spent per visit | Unknown | > 8 min | Analytics |
| Churn Rate | Monthly paid user churn | Unknown | < 5% | Billing data |
| NPS Score | Net Promoter Score | Unknown | > 50 | Survey |

### Secondary KPIs
| KPI | Definition | Target |
|-----|-----------|--------|
| Time to First Message | How fast new users send first message | < 30s |
| Tool Discovery Rate | % of users who try 2+ tools | > 40% |
| Feature Adoption | % of users using each tool | Varies |
| Support Tickets | Tickets per 1,000 users | < 5 |
| Page Load Performance | Core Web Vitals passing | 100% |
| Error Rate | Client-side errors per session | < 0.1% |

---

## 11. Roadmap

### Phase 1: Foundation (Weeks 1-3)
- [ ] Design system implementation (tokens, colors, typography)
- [ ] Component library rebuild (buttons, inputs, cards, modals)
- [ ] Layout system (sidebar, header, responsive shell)
- [ ] Authentication pages redesign (login, signup, forgot password)
- [ ] Error pages (404, 500, offline, maintenance)
- [ ] Loading states and skeleton screens

### Phase 2: Core Experience (Weeks 4-6)
- [ ] ChatInterface decomposition and rebuild
- [ ] Streaming response implementation
- [ ] Message rendering (markdown, code, diagrams, tables)
- [ ] Composer redesign (textarea, model selector, tools, voice)
- [ ] Command palette (⌘K)
- [ ] Keyboard shortcuts system
- [ ] Chat history with search and folders

### Phase 3: Pages & Tools (Weeks 7-9)
- [ ] Settings page decomposition and rebuild
- [ ] Upgrade/pricing page redesign
- [ ] Dashboard page
- [ ] Image generator redesign
- [ ] Video generator redesign
- [ ] Other tool pages (PPT, logo, code, etc.)
- [ ] File library

### Phase 4: Marketing & Polish (Weeks 10-11)
- [ ] Landing page creation
- [ ] Onboarding flow
- [ ] Empty states for all pages
- [ ] Error messages systemization
- [ ] Animation and micro-interaction pass
- [ ] Dark mode complete audit
- [ ] SEO optimization

### Phase 5: Launch (Week 12)
- [ ] Performance audit and optimization
- [ ] Accessibility audit
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Analytics integration
- [ ] Production deployment
- [ ] Monitoring setup

### Phase 6: Post-Launch (Weeks 13+)
- [ ] User feedback collection
- [ ] A/B testing on conversion flows
- [ ] Performance monitoring
- [ ] Feature iteration based on data
- [ ] Mobile app planning

---

## 12. Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Backend cold starts (HF Space) | High | High | Add retry logic, loading states, consider dedicated hosting |
| Razorpay payment failures | Medium | High | Implement webhook verification, retry queue, error recovery |
| Large bundle size from 46 Shadcn components | Medium | Medium | Tree-shaking, dynamic imports, component audit |
| Supabase rate limits | Low | High | Implement caching layer, batch operations |
| Dark mode regressions | High | Medium | Systematic CSS variable usage, visual regression tests |
| Mobile performance issues (Indian market) | High | High | Performance budgets, lazy loading, image optimization |
| API key exposure in frontend | High (current) | Critical | Move promo validation server-side, remove hardcoded keys |
| Cross-browser CSS issues (Tailwind v4) | Medium | Medium | Browser testing matrix, fallback styles |
| User data migration during redesign | Medium | High | Backward-compatible localStorage format, migration script |
| SEO regression during route restructure | Medium | Medium | 301 redirects, sitemap update, Search Console monitoring |

---

## 13. Future Scope

### Short Term (3-6 months)
- Real-time collaboration on chats
- Custom AI personas/characters
- Chat export (PDF, markdown)
- Image editing within chat
- Voice conversation mode
- Browser extension for "Ask VedaApex"

### Medium Term (6-12 months)
- Team workspaces with roles
- Plugin marketplace
- Custom model fine-tuning
- Advanced analytics for creators
- Mobile apps (iOS & Android)
- Webhook/Zapier integrations
- Multi-language support

### Long Term (12+ months)
- Enterprise tier with SSO/SAML
- On-premise deployment option
- AI agent workflows
- Video editing within platform
- Marketplace for AI-generated assets
- Community features (share prompts, templates)
