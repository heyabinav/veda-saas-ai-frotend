"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Github, Plug, X, Zap } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1220]/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/custom-connector" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 shadow-lg shadow-indigo-600/30">
            <Plug className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
          </span>
          <span className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              VedaApex
            </span>
            <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:inline dark:bg-white/10 dark:text-slate-400">
              Custom Connectors
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex dark:text-slate-400">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-slate-900 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#builder"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            <BookOpen className="h-4 w-4" />
            Docs
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#"
            aria-label="GitHub"
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:flex dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Github className="h-4.5 w-4.5" />
          </a>
          <a
            href="#"
            className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
          >
            Sign in
          </a>
          <a
            href="#builder"
            className="group inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:shadow-indigo-600/40"
          >
            Create connector
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200/60 bg-white dark:border-white/10 dark:bg-[#0b1220]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Link href="/custom-connector" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500">
              <Zap className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              VedaApex
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            The fastest way to connect your website or app to AI agents —
            securely, with MCP or OAuth.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Product
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
            <li><a href="#features" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">MCP Connector</a></li>
            <li><a href="#features" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">OAuth Connector</a></li>
            <li><a href="#builder" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">Live sandbox</a></li>
            <li><a href="#security" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">Security</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Developers
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
            <li><a href="#" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">Documentation</a></li>
            <li><a href="#" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">API reference</a></li>
            <li><a href="#" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">MCP spec</a></li>
            <li><a href="#" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">Changelog</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Company
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
            <li><a href="#" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">Status</a></li>
            <li><a href="#" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">Privacy</a></li>
            <li><a href="#" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">Terms</a></li>
            <li><a href="#" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">Contact</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200/60 py-6 dark:border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © 2026 VedaApex Labs. Built for builders.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="X" className="text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white">
              <X className="h-4 w-4" />
            </a>
            <a href="#" aria-label="GitHub" className="text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white">
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
