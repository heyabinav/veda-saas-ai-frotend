"use client";

import { useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  FilePlus2,
  ImagePlus,
  KeyRound,
  Play,
  Rocket,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./ui";
import { addCustomConnector } from "@/config/customConnectors";

const steps = [
  { id: 0, label: "Create", icon: FilePlus2 },
  { id: 1, label: "Configure", icon: Settings2 },
  { id: 2, label: "Authenticate", icon: KeyRound },
  { id: 3, label: "Test", icon: Play },
  { id: 4, label: "Publish", icon: Rocket },
] as const;

const METHODS = ["OAuth 2.0", "MCP"] as const;
type Method = (typeof METHODS)[number];

const scopes = [
  { id: "orders:read", label: "Read orders", checked: true },
  { id: "orders:write", label: "Create & edit orders", checked: true },
  { id: "customers:read", label: "Read customers", checked: false },
];

function LogoUploader({
  logo,
  onChange,
}: {
  logo: string | null;
  onChange: (logo: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Logo <span className="font-normal text-slate-400">(optional)</span>
      </label>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-white/15 dark:bg-black/30">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="Connector logo" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus className="h-5 w-5 text-slate-400" />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () =>
              onChange(typeof reader.result === "string" ? reader.result : null);
            reader.readAsDataURL(file);
            e.target.value = "";
          }}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-white/15 dark:text-slate-300 dark:hover:border-indigo-400/50 dark:hover:text-indigo-400"
          >
            Upload logo
          </button>
          {logo && (
            <button
              type="button"
              onClick={() => onChange(null)}
              title="Remove logo"
              className="rounded-lg border border-slate-300 p-2 text-slate-500 transition-colors hover:border-red-400 hover:text-red-500 dark:border-white/15 dark:text-slate-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">PNG or SVG, square works best.</p>
    </div>
  );
}

function StepBody({
  step,
  published,
  savedName,
  onPublish,
  name,
  setName,
  baseUrl,
  setBaseUrl,
  method,
  setMethod,
  logo,
  setLogo,
}: {
  step: number;
  published: boolean;
  savedName: string;
  onPublish: () => void;
  name: string;
  setName: (v: string) => void;
  baseUrl: string;
  setBaseUrl: (v: string) => void;
  method: Method;
  setMethod: (m: Method) => void;
  logo: string | null;
  setLogo: (v: string | null) => void;
}) {
  switch (step) {
    case 0:
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Connector name
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-connector"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-white/15 dark:bg-black/30 dark:text-slate-200"
              />
              {name.trim() && (
                <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ available
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Base URL
            </label>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-white/15 dark:bg-black/30 dark:text-slate-300"
            />
          </div>
          <LogoUploader logo={logo} onChange={setLogo} />
          <p className="rounded-xl bg-indigo-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">
            <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
            A starter config is generated automatically — publish and it stays saved for you.
          </p>
        </div>
      );
    case 1:
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Connection method
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-2.5">
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    "rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all",
                    method === m
                      ? "border-indigo-500 bg-indigo-50/70 text-indigo-700 dark:border-indigo-400/50 dark:bg-indigo-400/10 dark:text-indigo-300"
                      : "border-slate-300 text-slate-500 hover:border-slate-400 dark:border-white/15 dark:text-slate-400"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Scoped permissions
            </p>
            <div className="mt-1.5 space-y-2">
              {scopes.map((scope) => (
                <div
                  key={scope.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 dark:border-white/10"
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-md border",
                      scope.checked
                        ? "border-indigo-500 bg-indigo-600 text-white"
                        : "border-slate-300 dark:border-white/20"
                    )}
                  >
                    {scope.checked && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="font-mono text-[13px] text-slate-700 dark:text-slate-300">
                    {scope.id}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">{scope.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 2:
      return (
        <div className="space-y-3">
          {[
            { title: "OAuth handshake", desc: "Redirect to your app's consent screen", state: "done" as const },
            { title: "Consent approved", desc: "orders:read, orders:write granted", state: "done" as const },
            { title: "Token exchange", desc: "PKCE verified · refresh token stored", state: "active" as const },
          ].map((row) => (
            <div
              key={row.title}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3.5 py-3",
                row.state === "active"
                  ? "border-indigo-400/50 bg-indigo-50/70 dark:border-indigo-400/40 dark:bg-indigo-400/10"
                  : "border-slate-200 dark:border-white/10"
              )}
            >
              {row.state === "done" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              )}
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {row.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{row.desc}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case 3:
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Request · GET /orders?limit=5
            </p>
            <pre className="mt-2 overflow-x-auto font-mono text-[12.5px] leading-6 text-slate-600 dark:text-slate-300">
{`{
  "headers": { "Authorization": "Bearer ···" },
  "params":  { "limit": 5 }
}`}
            </pre>
          </div>
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/5 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Response · 200 OK · 184ms
            </p>
            <pre className="mt-2 overflow-x-auto font-mono text-[12.5px] leading-6 text-slate-600 dark:text-slate-300">
{`{ "orders": [{ "id": "ord_1024", "total": 129.9 }] }`}
            </pre>
          </div>
        </div>
      );
    default:
      return published ? (
        <div className="flex flex-col items-center rounded-2xl border border-emerald-400/40 bg-emerald-500/5 px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
            <Rocket className="h-7 w-7 text-emerald-500" />
          </span>
          <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            {savedName} is live!
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Saved to your workspace — you can reconnect it anytime without rebuilding.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {[
            { label: "Config valid", ok: true },
            { label: "Auth flow tested", ok: true },
            { label: "Sandbox: 4/4 calls passed", ok: true },
            { label: "Team access scoped to Engineering", ok: true },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 dark:border-white/10"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {item.label}
              </span>
            </div>
          ))}
          <button
            onClick={onPublish}
            disabled={!name.trim()}
            className="mt-1 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:shadow-indigo-600/50 disabled:opacity-50"
          >
            Publish connector
          </button>
        </div>
      );
  }
}

export function BuilderPreview() {
  const [activeStep, setActiveStep] = useState(0);
  const [published, setPublished] = useState(false);
  const [name, setName] = useState("my-app");
  const [baseUrl, setBaseUrl] = useState("https://api.example.com/v1");
  const [method, setMethod] = useState<Method>("OAuth 2.0");
  const [logo, setLogo] = useState<string | null>(null);
  const [savedName, setSavedName] = useState("my-app");

  const handlePublish = () => {
    const finalName = name.trim() || "my-app";
    addCustomConnector({
      name: finalName,
      baseUrl: baseUrl.trim() || "https://api.example.com/v1",
      method,
      logo,
    });
    setSavedName(finalName);
    setPublished(true);
    window.dispatchEvent(new Event("vedaapex-custom-connectors-updated"));
  };

  return (
    <section
      id="builder"
      className="relative overflow-hidden bg-white py-20 lg:py-24 dark:bg-[#0d1526]"
    >
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Live builder"
          title="Build your connector in minutes"
          description="Create, configure, authenticate, test and publish. Add your own logo — your connector stays saved so you can reconnect it anytime."
        />

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-1.5">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all",
                  activeStep === step.id
                    ? "border-indigo-500/60 bg-indigo-50/80 text-indigo-700 shadow-sm dark:border-indigo-400/40 dark:bg-indigo-400/10 dark:text-indigo-300"
                    : "border-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
                )}
              >
                <step.icon
                  className={cn(
                    "h-4.5 w-4.5",
                    activeStep === step.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                  )}
                />
                {step.label}
                <ChevronRight
                  className={cn(
                    "ml-auto h-4 w-4 transition-all",
                    activeStep === step.id && "translate-x-0.5 text-indigo-500"
                  )}
                />
              </button>
            ))}
            <p className="px-4 pt-3 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              Tip: published connectors stay saved in your workspace — disconnect and
              reconnect anytime without rebuilding.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-5 shadow-lg shadow-slate-900/5 sm:p-7 dark:border-white/10 dark:bg-black/30">
            <StepBody
              step={activeStep}
              published={published}
              savedName={savedName}
              onPublish={handlePublish}
              name={name}
              setName={setName}
              baseUrl={baseUrl}
              setBaseUrl={setBaseUrl}
              method={method}
              setMethod={setMethod}
              logo={logo}
              setLogo={setLogo}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
