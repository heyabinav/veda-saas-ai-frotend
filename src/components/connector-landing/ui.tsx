import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-indigo-200/70 bg-indigo-50/80 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300",
        className
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "mb-12 max-w-2xl",
        align === "center" && "mx-auto text-center"
      )}
    >
      <Badge>{eyebrow}</Badge>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-900/10 dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:hover:bg-white/[0.07]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function GradientText({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-indigo-600 via-blue-500 to-teal-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-sky-400 dark:to-teal-300">
      {children}
    </span>
  );
}
