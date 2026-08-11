"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Loader2, Sparkles, X } from "lucide-react";

export type WebsiteAnswers = {
  websiteType: string;
  goal: string;
  features: string[];
  customRequirements: string;
  followUpAnswers: Record<string, string[] | string>;
};

type Option = { label: string; value: string };
type Question =
  | { id: string; type: "single"; prompt: string; options: Option[]; skip?: boolean }
  | { id: string; type: "multi"; prompt: string; options: Option[]; skip?: boolean };

const WEBSITE_TYPES: Option[] = [
  { label: "AI SaaS platform", value: "AI SaaS platform" },
  { label: "E-commerce website", value: "E-commerce website" },
  { label: "Portfolio", value: "Portfolio" },
  { label: "Admin dashboard", value: "Admin dashboard" },
];

const GOALS: Option[] = [
  { label: "Generate leads", value: "Generate leads" },
  { label: "Sell products", value: "Sell products" },
  { label: "Get users", value: "Get users" },
  { label: "Showcase work", value: "Showcase work" },
  { label: "Automate a business", value: "Automate a business" },
];

const FEATURES: Option[] = [
  { label: "Authentication", value: "Authentication" },
  { label: "Dashboard", value: "Dashboard" },
  { label: "Payments", value: "Payments" },
  { label: "AI chat", value: "AI chat" },
  { label: "Analytics", value: "Analytics" },
  { label: "Admin panel", value: "Admin panel" },
  { label: "File uploads", value: "File uploads" },
  { label: "Notifications", value: "Notifications" },
];

const FOLLOW_UPS: Record<string, Question[]> = {
  "AI SaaS platform": [
    {
      id: "aiFeatures",
      type: "multi",
      prompt: "What AI functionality should it include?",
      options: [
        { label: "Chat assistant", value: "Chat assistant" },
        { label: "Code generation", value: "Code generation" },
        { label: "Image generation", value: "Image generation" },
        { label: "Voice & transcription", value: "Voice & transcription" },
        { label: "Document processing", value: "Document processing" },
      ],
      skip: true,
    },
  ],
  "E-commerce website": [
    {
      id: "buying",
      type: "single",
      prompt: "How should customers buy?",
      options: [
        { label: "One-time purchases", value: "One-time purchases" },
        { label: "Subscriptions", value: "Subscriptions" },
        { label: "Digital downloads", value: "Digital downloads" },
        { label: "Bookings", value: "Bookings" },
      ],
    },
  ],
  Portfolio: [
    {
      id: "portfolioContent",
      type: "multi",
      prompt: "What should visitors see?",
      options: [
        { label: "Project gallery", value: "Project gallery" },
        { label: "About & bio", value: "About & bio" },
        { label: "Contact form", value: "Contact form" },
        { label: "Social links", value: "Social links" },
        { label: "Resume download", value: "Resume download" },
      ],
      skip: true,
    },
  ],
  "Admin dashboard": [
    {
      id: "dashboardData",
      type: "multi",
      prompt: "What data matters most?",
      options: [
        { label: "User analytics", value: "User analytics" },
        { label: "Sales & revenue", value: "Sales & revenue" },
        { label: "Charts & reports", value: "Charts & reports" },
        { label: "Live activity", value: "Live activity" },
      ],
      skip: true,
    },
  ],
};

const OTHER_TYPE = "Other";

const INITIAL_ANSWERS: WebsiteAnswers = {
  websiteType: "",
  goal: "",
  features: [],
  customRequirements: "",
  followUpAnswers: {},
};

function OptionPill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      layout
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
        selected
          ? "border-blue-500 bg-blue-500/10 text-foreground"
          : "border-[var(--border)] bg-[var(--surface-2)] text-foreground/80 hover:border-foreground/25"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          selected ? "border-blue-500 bg-blue-500 text-white" : "border-foreground/25"
        }`}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
      <span className="flex-1">{children}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-foreground/30" />
    </motion.button>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  onComplete: (brief: string, answers: WebsiteAnswers) => void;
};

export default function RequirementWizard({ open, onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<WebsiteAnswers>(INITIAL_ANSWERS);
  const [customType, setCustomType] = useState("");
  const [customFeatures, setCustomFeatures] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const questionSteps = useMemo<Question[]>(() => {
    const steps: Question[] = [
      { id: "websiteType", type: "single", prompt: "What website should I build?", options: WEBSITE_TYPES },
      { id: "goal", type: "single", prompt: "What is the main goal?", options: GOALS },
      { id: "features", type: "multi", prompt: "What features should it include?", options: FEATURES },
      ...(FOLLOW_UPS[answers.websiteType] ?? []),
      { id: "customRequirements", type: "multi", prompt: "Anything else to keep in mind?", options: [], skip: true },
    ];
    return steps;
  }, [answers.websiteType]);

  const progress = ((step + 1) / questionSteps.length) * 100;

  useEffect(() => {
    if (open) {
      setSubmitting(false);
      setSubmitError("");
      document.body.style.overflow = "hidden";
      const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>("button, input, textarea")?.focus(), 80);
      return () => {
        clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (submitting) return;
        onClose();
      }
      if (e.key === "Enter" && step !== questionSteps.length - 1) {
        const target = e.target as HTMLElement;
        if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const goToStep = useCallback(
    (next: number) => {
      setDirection(next > step ? 1 : -1);
      setStep(next);
    },
    [step],
  );

  const goNext = useCallback(() => {
    if (step < questionSteps.length - 1) goToStep(step + 1);
  }, [step, goToStep, questionSteps.length]);

  const goBack = useCallback(() => {
    if (step > 0) goToStep(step - 1);
  }, [step, goToStep]);

  const isLastStep = step === questionSteps.length - 1;
  const current = questionSteps[step];

  const canContinue = useMemo(() => {
    if (!current) return true;
    if (current.id === "websiteType") {
      return answers.websiteType !== "" && (answers.websiteType !== OTHER_TYPE || customType.trim() !== "");
    }
    if (current.id === "goal") return answers.goal !== "";
    if (current.id === "features") return true;
    return true;
  }, [current, answers, customType]);

  function selectSingle(questionId: string, value: string) {
    setAnswers((a) => {
      if (questionId === "websiteType") {
        return { ...a, websiteType: value, followUpAnswers: {} };
      }
      if (questionId === "goal") return { ...a, goal: value };
      return { ...a, followUpAnswers: { ...a.followUpAnswers, [questionId]: value } };
    });
  }

  function toggleFeature(feature: string) {
    setAnswers((a) => ({
      ...a,
      features: a.features.includes(feature)
        ? a.features.filter((f) => f !== feature)
        : [...a.features, feature],
    }));
  }

  function toggleFollowUp(questionId: string, value: string) {
    setAnswers((a) => {
      const existing = a.followUpAnswers[questionId];
      const list = Array.isArray(existing) ? existing : [];
      return {
        ...a,
        followUpAnswers: {
          ...a.followUpAnswers,
          [questionId]: list.includes(value)
            ? list.filter((v) => v !== value)
            : [...list, value],
        },
      };
    });
  }

  function reset() {
    setAnswers(INITIAL_ANSWERS);
    setCustomType("");
    setCustomFeatures("");
    setStep(0);
    setDirection(1);
    setSubmitError("");
    setSubmitting(false);
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError("");

    const finalAnswers: WebsiteAnswers = {
      ...answers,
      websiteType: answers.websiteType === OTHER_TYPE ? customType.trim() : answers.websiteType,
      features: [...answers.features],
      customRequirements: [customFeatures.trim(), answers.customRequirements.trim()]
        .filter(Boolean)
        .join("\n"),
    };
    if (finalAnswers.websiteType === "") {
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/website/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalAnswers),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }
      const brief = typeof data.response === "string" && data.response.trim() ? data.response : "";
      onComplete(brief, finalAnswers);
      reset();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <motion.div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          if (!submitting) onClose();
        }}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Website requirement wizard"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="relative w-full max-h-[92dvh] overflow-hidden rounded-t-2xl sm:max-w-md sm:rounded-2xl bg-[var(--card)] text-foreground shadow-2xl border border-[var(--border)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">Build my website</p>
              <p className="text-[11px] text-foreground/45">A few quick questions</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!submitting) onClose();
            }}
            aria-label="Close wizard"
            className="rounded-full p-2 text-foreground/50 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-black/5 dark:bg-white/10">
          <motion.div
            className="h-full bg-blue-500"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 28 }}
          />
        </div>

        {/* Body */}
        <div className="scrollable-container max-h-[calc(92dvh-160px)] overflow-y-auto px-5 py-5">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -24 }}
              transition={{ duration: 0.18 }}
            >
              {submitting ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-foreground/70">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    Preparing your website brief…
                  </div>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-3 w-1/2 rounded-full bg-black/10 dark:bg-white/10" />
                      <div className="h-3 w-full rounded-full bg-black/10 dark:bg-white/10" />
                      <div className="h-3 w-4/5 rounded-full bg-black/10 dark:bg-white/10" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <h2 className="mb-4 text-lg font-semibold tracking-tight">{current.prompt}</h2>

                  {current.id === "websiteType" && (
                    <div className="space-y-2">
                      {current.options.map((o) => (
                        <OptionPill
                          key={o.value}
                          selected={answers.websiteType === o.value}
                          onClick={() => selectSingle(current.id, o.value)}
                        >
                          {o.label}
                        </OptionPill>
                      ))}
                      <OptionPill
                        selected={answers.websiteType === OTHER_TYPE}
                        onClick={() => selectSingle(current.id, OTHER_TYPE)}
                      >
                        Other
                      </OptionPill>
                      {answers.websiteType === OTHER_TYPE && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="overflow-hidden"
                        >
                          <input
                            autoFocus
                            type="text"
                            value={customType}
                            onChange={(e) => setCustomType(e.target.value)}
                            placeholder="Describe your website, e.g. Restaurant website"
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-foreground/35 focus:border-blue-500"
                          />
                        </motion.div>
                      )}
                    </div>
                  )}

                  {current.id === "goal" && (
                    <div className="space-y-2">
                      {current.options.map((o) => (
                        <OptionPill
                          key={o.value}
                          selected={answers.goal === o.value}
                          onClick={() => selectSingle(current.id, o.value)}
                        >
                          {o.label}
                        </OptionPill>
                      ))}
                    </div>
                  )}

                  {current.id === "features" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        {current.options.map((o) => (
                          <button
                            key={o.value}
                            onClick={() => toggleFeature(o.value)}
                            className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
                              answers.features.includes(o.value)
                                ? "border-blue-500 bg-blue-500/10 text-foreground"
                                : "border-[var(--border)] bg-[var(--surface-2)] text-foreground/80 hover:border-foreground/25"
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                answers.features.includes(o.value)
                                  ? "border-blue-500 bg-blue-500 text-white"
                                  : "border-foreground/25"
                              }`}
                            >
                              {answers.features.includes(o.value) && <Check className="h-3 w-3" />}
                            </span>
                            {o.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={customFeatures}
                        onChange={(e) => setCustomFeatures(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && customFeatures.trim()) {
                            e.preventDefault();
                            toggleFeature(customFeatures.trim());
                            setCustomFeatures("");
                          }
                        }}
                        placeholder="Add custom feature + press Enter"
                        className="mt-1 w-full rounded-xl border border-dashed border-[var(--border)] bg-transparent px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-foreground/35 focus:border-blue-500"
                      />
                      {answers.features.length > 0 && (
                        <p className="text-[11px] text-foreground/45">
                          {answers.features.length} selected
                        </p>
                      )}
                    </div>
                  )}

                  {current.id === "customRequirements" && (
                    <div className="space-y-3">
                      <textarea
                        rows={4}
                        value={answers.customRequirements}
                        onChange={(e) =>
                          setAnswers((a) => ({ ...a, customRequirements: e.target.value }))
                        }
                        placeholder="Brand colors, design style, examples you like…"
                        className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm outline-none transition-colors placeholder:text-foreground/35 focus:border-blue-500"
                      />
                      {answers.websiteType !== "" && (
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5 text-xs text-foreground/70">
                          <p className="mb-2 font-semibold text-foreground/85">Summary</p>
                          <p>Type: {answers.websiteType === OTHER_TYPE ? (customType.trim() || "Other") : answers.websiteType}</p>
                          <p>Goal: {answers.goal || "—"}</p>
                          {answers.features.length > 0 && <p>Features: {answers.features.join(", ")}</p>}
                          {Object.entries(answers.followUpAnswers).map(([q, a]) => (
                            <p key={q}>
                              {q}: {Array.isArray(a) ? a.join(", ") : a}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {current.id !== "websiteType" &&
                    current.id !== "goal" &&
                    current.id !== "features" &&
                    current.id !== "customRequirements" && (
                      <div className="space-y-2">
                        {current.options.map((o) => (
                          <button
                            key={o.value}
                            onClick={() =>
                              current.type === "single"
                                ? selectSingle(current.id, o.value)
                                : toggleFollowUp(current.id, o.value)
                            }
                            className={`flex w-full items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
                              current.type === "single"
                                ? answers.followUpAnswers[current.id] === o.value
                                  ? "border-blue-500 bg-blue-500/10 text-foreground"
                                  : "border-[var(--border)] bg-[var(--surface-2)] text-foreground/80 hover:border-foreground/25"
                                : Array.isArray(answers.followUpAnswers[current.id]) &&
                                    (answers.followUpAnswers[current.id] as string[]).includes(o.value)
                                  ? "border-blue-500 bg-blue-500/10 text-foreground"
                                  : "border-[var(--border)] bg-[var(--surface-2)] text-foreground/80 hover:border-foreground/25"
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                current.type === "single"
                                  ? answers.followUpAnswers[current.id] === o.value
                                    ? "border-blue-500 bg-blue-500 text-white"
                                    : "border-foreground/25"
                                  : Array.isArray(answers.followUpAnswers[current.id]) &&
                                      (answers.followUpAnswers[current.id] as string[]).includes(o.value)
                                    ? "border-blue-500 bg-blue-500 text-white"
                                    : "border-foreground/25"
                              }`}
                            >
                              {(current.type === "single"
                                ? answers.followUpAnswers[current.id] === o.value
                                : Array.isArray(answers.followUpAnswers[current.id]) &&
                                    (answers.followUpAnswers[current.id] as string[]).includes(o.value)) && (
                                <Check className="h-3 w-3" />
                              )}
                            </span>
                            {o.label}
                          </button>
                        ))}
                      </div>
                    )}

                  {submitError && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-3 text-sm text-red-500">
                      <X className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">Couldn&apos;t save your answers</p>
                        <p className="mt-0.5 text-red-500/80">{submitError}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-4">
          <button
            onClick={goBack}
            disabled={step === 0 || submitting}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm text-foreground/60 transition-colors hover:bg-black/5 hover:text-foreground disabled:opacity-30 dark:hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            {current.skip && (
              <button
                onClick={() => (isLastStep ? handleSubmit() : goNext())}
                disabled={submitting}
                className="rounded-full px-3.5 py-2 text-sm text-foreground/50 transition-colors hover:text-foreground disabled:opacity-30"
              >
                Skip
              </button>
            )}
            <button
              ref={triggerRef}
              onClick={() => (isLastStep ? handleSubmit() : goNext())}
              disabled={!canContinue || submitting}
              className="flex items-center gap-1.5 rounded-full bg-blue-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : isLastStep ? (
                "Generate brief"
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
