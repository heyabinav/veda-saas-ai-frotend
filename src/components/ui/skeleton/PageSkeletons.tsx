"use client";

import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonList, SkeletonCard } from "@/components/ui/skeleton";

/* ─────────────────────────────────────────────
   Reusable page-level skeleton loading layouts
   ───────────────────────────────────────────── */

/** Sidebar skeleton — consistent across all sidebar-enabled pages */
export function SidebarSkeleton() {
  return (
    <aside className="hidden md:flex flex-col w-[260px] min-h-screen border-r border-border bg-card/60 px-3 py-4 gap-4 shrink-0">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2.5 px-2 mb-2">
        <Skeleton rounded="lg" className="h-8 w-8" />
        <Skeleton rounded="sm" className="h-4 w-24" />
      </div>

      {/* New Chat Button */}
      <Skeleton rounded="lg" className="h-10 w-full" />

      {/* Section label */}
      <Skeleton rounded="sm" className="h-3 w-16 mt-4" />

      {/* Chat history items */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
          <Skeleton rounded="sm" className="h-4 w-4 shrink-0" />
          <Skeleton rounded="sm" className="h-3.5 flex-1" style={{ width: `${55 + Math.random() * 35}%` }} />
        </div>
      ))}

      {/* Bottom profile */}
      <div className="mt-auto flex items-center gap-2.5 px-2 pt-4 border-t border-border">
        <SkeletonAvatar size={32} />
        <div className="flex-1 space-y-1.5">
          <Skeleton rounded="sm" className="h-3 w-20" />
          <Skeleton rounded="sm" className="h-2.5 w-14" />
        </div>
      </div>
    </aside>
  );
}

/** Top navbar skeleton for tool/generator pages */
export function NavbarSkeleton() {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card/60">
      <div className="flex items-center gap-3">
        <Skeleton rounded="sm" className="h-8 w-8 md:hidden" />
        <Skeleton rounded="sm" className="h-5 w-28" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton rounded="full" className="h-8 w-8" />
        <Skeleton rounded="full" className="h-8 w-8" />
      </div>
    </header>
  );
}

/** Chat page skeleton — main workspace with sidebar + chat area */
export function ChatPageSkeleton() {
  return (
    <div className="flex h-screen w-full bg-background">
      <SidebarSkeleton />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Skeleton rounded="sm" className="h-8 w-8 md:hidden" />
            <Skeleton rounded="sm" className="h-5 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton rounded="lg" className="h-8 w-24" />
            <Skeleton rounded="full" className="h-8 w-8" />
          </div>
        </div>

        {/* Message area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-8">
          <Skeleton rounded="full" className="h-12 w-12 mb-2" />
          <Skeleton rounded="sm" className="h-6 w-48" />
          <Skeleton rounded="sm" className="h-4 w-64" />

          {/* Suggestion cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 w-full max-w-lg">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} rounded="lg" className="h-16 w-full" />
            ))}
          </div>
        </div>

        {/* Composer skeleton */}
        <div className="px-4 pb-4 pt-2">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-3">
            <Skeleton rounded="lg" className="h-12 w-full mb-2" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton rounded="full" className="h-8 w-8" />
                <Skeleton rounded="full" className="h-8 w-8" />
                <Skeleton rounded="full" className="h-8 w-8" />
              </div>
              <Skeleton rounded="full" className="h-9 w-9" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Generator page skeleton — for image/video/ppt/logo/music/etc. */
export function GeneratorPageSkeleton() {
  return (
    <div className="flex h-screen w-full bg-background">
      <SidebarSkeleton />

      <main className="flex-1 flex flex-col min-w-0">
        <NavbarSkeleton />

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Generator title + controls */}
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-2">
              <Skeleton rounded="sm" className="h-7 w-48" />
              <Skeleton rounded="sm" className="h-4 w-72" />
            </div>

            {/* Prompt input area */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
              <Skeleton rounded="lg" className="h-28 w-full" />
              <div className="flex items-center gap-3">
                <Skeleton rounded="lg" className="h-10 w-28" />
                <Skeleton rounded="lg" className="h-10 w-28" />
                <div className="flex-1" />
                <Skeleton rounded="lg" className="h-10 w-32" />
              </div>
            </div>

            {/* Gallery / results grid */}
            <div className="space-y-3">
              <Skeleton rounded="sm" className="h-5 w-32" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} rounded="lg" className="aspect-square w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Settings page skeleton */
export function SettingsPageSkeleton() {
  return (
    <div className="flex h-screen w-full bg-background">
      <SidebarSkeleton />

      <main className="flex-1 flex flex-col min-w-0">
        <NavbarSkeleton />

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <Skeleton rounded="sm" className="h-7 w-32" />
              <Skeleton rounded="sm" className="h-4 w-56" />
            </div>

            {/* Profile card */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-4">
                <SkeletonAvatar size={64} />
                <div className="space-y-2 flex-1">
                  <Skeleton rounded="sm" className="h-5 w-40" />
                  <Skeleton rounded="sm" className="h-3.5 w-52" />
                </div>
                <Skeleton rounded="lg" className="h-9 w-20" />
              </div>
            </div>

            {/* Settings sections */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <Skeleton rounded="sm" className="h-5 w-36" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center justify-between py-2">
                      <div className="space-y-1.5">
                        <Skeleton rounded="sm" className="h-4 w-28" />
                        <Skeleton rounded="sm" className="h-3 w-44" />
                      </div>
                      <Skeleton rounded="lg" className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/** Wallet page skeleton */
export function WalletPageSkeleton() {
  return (
    <div className="flex h-screen w-full bg-background">
      <SidebarSkeleton />

      <main className="flex-1 flex flex-col min-w-0">
        <NavbarSkeleton />

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Balance cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton rounded="lg" className="h-9 w-9" />
                    <Skeleton rounded="sm" className="h-4 w-20" />
                  </div>
                  <Skeleton rounded="sm" className="h-7 w-24" />
                  <Skeleton rounded="sm" className="h-3 w-16" />
                </div>
              ))}
            </div>

            {/* Transaction list */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <Skeleton rounded="sm" className="h-5 w-32" />
              <SkeletonList count={6} avatar trailing />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Skills page skeleton */
export function SkillsPageSkeleton() {
  return (
    <div className="flex h-screen w-full bg-background">
      <SidebarSkeleton />

      <main className="flex-1 flex flex-col min-w-0">
        <NavbarSkeleton />

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton rounded="sm" className="h-7 w-28" />
                <Skeleton rounded="sm" className="h-4 w-56" />
              </div>
              <Skeleton rounded="lg" className="h-10 w-28" />
            </div>

            {/* Skill cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton rounded="lg" className="h-10 w-10" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton rounded="sm" className="h-4 w-28" />
                      <Skeleton rounded="sm" className="h-3 w-16" />
                    </div>
                    <Skeleton rounded="full" className="h-6 w-12" />
                  </div>
                  <Skeleton rounded="sm" className="h-3 w-full" />
                  <Skeleton rounded="sm" className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Connectors page skeleton */
export function ConnectorsPageSkeleton() {
  return (
    <div className="flex h-screen w-full bg-background">
      <SidebarSkeleton />

      <main className="flex-1 flex flex-col min-w-0">
        <NavbarSkeleton />

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="space-y-2">
              <Skeleton rounded="sm" className="h-7 w-36" />
              <Skeleton rounded="sm" className="h-4 w-64" />
            </div>

            {/* Connector cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton rounded="lg" className="h-10 w-10" />
                    <Skeleton rounded="sm" className="h-4 w-24" />
                  </div>
                  <Skeleton rounded="sm" className="h-3 w-full" />
                  <Skeleton rounded="sm" className="h-3 w-2/3" />
                  <Skeleton rounded="lg" className="h-9 w-full mt-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Blog page skeleton */
export function BlogPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <NavbarSkeleton />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <Skeleton rounded="sm" className="h-8 w-32" />
          <Skeleton rounded="sm" className="h-4 w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} lines={3} avatar />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Auth page skeleton — login/signup/forgot-password */
export function AuthPageSkeleton() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-12 border-r border-border">
        <Skeleton rounded="sm" className="h-6 w-28" />
        <div className="space-y-4">
          <Skeleton rounded="sm" className="h-8 w-3/4" />
          <Skeleton rounded="sm" className="h-4 w-2/3" />
          <Skeleton rounded="sm" className="h-4 w-1/2" />
        </div>
        <Skeleton rounded="sm" className="h-3 w-40" />
      </div>

      {/* Right form panel */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <Skeleton rounded="sm" className="h-7 w-40" />
            <Skeleton rounded="sm" className="h-4 w-56" />
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3">
            <Skeleton rounded="lg" className="h-11 w-full" />
            <Skeleton rounded="lg" className="h-11 w-full" />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <Skeleton rounded="none" className="h-px flex-1" />
            <Skeleton rounded="sm" className="h-3 w-8" />
            <Skeleton rounded="none" className="h-px flex-1" />
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton rounded="sm" className="h-3.5 w-16" />
              <Skeleton rounded="lg" className="h-11 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton rounded="sm" className="h-3.5 w-20" />
              <Skeleton rounded="lg" className="h-11 w-full" />
            </div>
          </div>

          <Skeleton rounded="lg" className="h-11 w-full" />
        </div>
      </div>
    </div>
  );
}

/** Files / Library / Recent Files page skeleton */
export function FilesPageSkeleton() {
  return (
    <div className="flex h-screen w-full bg-background">
      <SidebarSkeleton />

      <main className="flex-1 flex flex-col min-w-0">
        <NavbarSkeleton />

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton rounded="sm" className="h-7 w-28" />
              <div className="flex items-center gap-2">
                <Skeleton rounded="lg" className="h-9 w-9" />
                <Skeleton rounded="lg" className="h-9 w-9" />
                <Skeleton rounded="lg" className="h-9 w-28" />
              </div>
            </div>

            <SkeletonList count={8} avatar trailing />
          </div>
        </div>
      </main>
    </div>
  );
}

/** Upgrade / pricing page skeleton */
export function UpgradePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <NavbarSkeleton />

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        <div className="text-center space-y-3">
          <Skeleton rounded="sm" className="h-8 w-48 mx-auto" />
          <Skeleton rounded="sm" className="h-4 w-72 mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <Skeleton rounded="sm" className="h-5 w-20" />
              <Skeleton rounded="sm" className="h-9 w-28" />
              <div className="space-y-2.5">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton rounded="full" className="h-4 w-4" />
                    <Skeleton rounded="sm" className="h-3 flex-1" />
                  </div>
                ))}
              </div>
              <Skeleton rounded="lg" className="h-11 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Developer page skeleton */
export function DeveloperPageSkeleton() {
  return (
    <div className="flex h-screen w-full bg-background">
      <SidebarSkeleton />

      <main className="flex-1 flex flex-col min-w-0">
        <NavbarSkeleton />

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="space-y-2">
              <Skeleton rounded="sm" className="h-7 w-36" />
              <Skeleton rounded="sm" className="h-4 w-64" />
            </div>

            {/* API Key section */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <Skeleton rounded="sm" className="h-5 w-24" />
              <div className="flex items-center gap-3">
                <Skeleton rounded="lg" className="h-10 flex-1" />
                <Skeleton rounded="lg" className="h-10 w-24" />
              </div>
            </div>

            {/* Code examples */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <Skeleton rounded="sm" className="h-5 w-28" />
              <Skeleton rounded="lg" className="h-44 w-full" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
