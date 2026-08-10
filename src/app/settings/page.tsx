"use client";

import { useEffect, useRef, useState } from "react";
import { defaultAiSettings } from "@/config/default-ai-settings";
import {
  User,
  Mail,
  CreditCard,
  Languages,
  Library,
  Sparkles,
  Sun,
  Moon,
  ArrowLeft,
  Shield,
  Accessibility as AccessibilityIcon,
  Info,
  CheckCircle,
  AlertTriangle,
  Upload,
  Globe,
  Database,
  History,
  Key,
  Smartphone,
  Eye,
  Sliders,
  Terminal,
  Cpu
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { getPlanBasedAiSettings } from "@/lib/ai-settings";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const SETTINGS_MODELS = [
  { name: "Apex 2.1", price: "free" },
  { name: "Apex 2.2 (Low)", price: "200" },
  { name: "Apex 2.2 (High)", price: "500" },
  { name: "Apex 3.0 Ultra (Deep Coding Reasoning)", price: "1000" },
];

function canAccessModel(plan: string | null, price: string) {
  if (price === "free") return true;
  if (!plan) return false;
  if (price === "200") return ["200", "500", "1000"].includes(plan);
  if (price === "500") return ["500", "1000"].includes(plan);
  if (price === "1000") return plan === "1000";
  return false;
}

const menuItems = [
  { id: "general", label: "General & Profile", icon: User, color: "text-blue-500 bg-blue-500/10" },
  { id: "workspace", label: "Workspace & Editor", icon: Sliders, color: "text-slate-600 bg-slate-500/10" },
  { id: "privacy", label: "Privacy & Data", icon: Shield, color: "text-emerald-600 bg-emerald-500/10" },
  { id: "email", label: "Email Notifications", icon: Mail, color: "text-purple-500 bg-purple-500/10" },
  { id: "billing", label: "Billing & Subscriptions", icon: CreditCard, color: "text-green-500 bg-green-500/10" },
  { id: "language", label: "Language & Regional", icon: Languages, color: "text-amber-500 bg-amber-500/10" },
  { id: "library", label: "Library & Assets", icon: Library, color: "text-rose-500 bg-rose-500/10" },
  { id: "vedas", label: "VedaS AI Engine", icon: Sparkles, color: "text-indigo-500 bg-indigo-500/10" },
  { id: "security", label: "Security & Sessions", icon: Shield, color: "text-emerald-500 bg-emerald-500/10" },
  { id: "accessibility", label: "Accessibility Settings", icon: AccessibilityIcon, color: "text-sky-500 bg-sky-500/10" },
  { id: "about", label: "About System", icon: Info, color: "text-gray-500 bg-gray-500/10" },
];

const defaultProfileSettings = {
  fullName: "",
  username: "",
  profession: "",
  location: "",
  email: "",
  avatar: "",
};

const defaultWorkspaceSettings = {
  startupScreen: "Dashboard",
  autosaveInterval: "30 seconds",
  editorDensity: "Comfortable",
  tabSize: "2 spaces",
  defaultShell: "PowerShell",
  backupFrequency: "Daily",
  formatOnSave: true,
  autoBackup: true,
};

const defaultPrivacySettings = {
  telemetry: true,
  crashReports: true,
  chatHistory: true,
  privateMode: false,
  dataRetention: "90 days",
};

const defaultSecuritySettings = {
  sessionTimeout: "24 hours",
  rememberDevices: true,
  requireReauth: true,
  apiKeyVisibility: false,
};

const defaultSystemSettings = {
  emailNotifications: true,
  desktopNotifications: false,
  publicProfile: true,
  dataSharing: false,
  autoSave: true,
  betaFeatures: false,
  analytics: true,
  shortcuts: true,
  tfa: true,
  offlineMode: false,
  reduceMotion: false,
  highContrast: false,
  releaseNotes: true,
};

type AccountIdentity = {
  fullName: string;
  username: string;
  profession: string;
  location: string;
  email: string;
  avatar: string;
};

type StoredSettingsSnapshot = {
  profileSettings?: Partial<AccountIdentity>;
  settings?: Partial<typeof defaultSystemSettings>;
  workspaceSettings?: Partial<typeof defaultWorkspaceSettings>;
  privacySettings?: Partial<typeof defaultPrivacySettings>;
  securitySettings?: Partial<typeof defaultSecuritySettings>;
  aiSettings?: Partial<typeof defaultAiSettings>;
  theme?: string;
  lastSavedAt?: string;
};

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${key}=`));
  if (!match) return "";
  try {
    return decodeURIComponent(match.slice(key.length + 1));
  } catch {
    return match.slice(key.length + 1);
  }
}

function getIdentityKey(email: string, username: string) {
  const raw = (email || username || "guest").trim().toLowerCase();
  return raw || "guest";
}

function getSettingsStorageKey(identity: AccountIdentity) {
  return `vedaapex-settings:${getIdentityKey(identity.email, identity.username)}`;
}

function buildIdentityFromUser(
  currentUser: SupabaseUser | null,
  fallbackName = "",
  fallbackEmail = ""
): AccountIdentity {
  const meta = currentUser?.user_metadata || {};
  const email = currentUser?.email || fallbackEmail || "";
  const baseName = fallbackName || meta.full_name || meta.name || meta.username || email.split("@")[0] || "";
  const username = meta.username || baseName || email.split("@")[0] || "";

  return {
    fullName: baseName,
    username,
    profession: meta.profession || "",
    location: meta.location || "",
    email,
    avatar: meta.avatar || "",
  };
}

function loadSnapshot(key: string): StoredSettingsSnapshot | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSettingsSnapshot;
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("general");
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [settingsKey, setSettingsKey] = useState<string>("vedaapex-settings:guest");

  const [profileSettings, setProfileSettings] = useState(defaultProfileSettings);
  const [settings, setSettings] = useState(defaultSystemSettings);
  const [workspaceSettings, setWorkspaceSettings] = useState(defaultWorkspaceSettings);
  const [privacySettings, setPrivacySettings] = useState(defaultPrivacySettings);
  const [securitySettings, setSecuritySettings] = useState(defaultSecuritySettings);
  const [aiSettings, setAiSettings] = useState(defaultAiSettings);
  const [saveStatus, setSaveStatus] = useState("Unsaved changes");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const userPlan = user?.user_metadata?.plan || readCookie("user_plan") || null;

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const cookieIdentity = buildIdentityFromUser(
      null,
      readCookie("user_name"),
      readCookie("user_email")
    );

    function applyUser(currentUser: SupabaseUser | null) {
      setUser(currentUser);
      const identity = buildIdentityFromUser(
        currentUser,
        cookieIdentity.fullName,
        cookieIdentity.email
      );
      if (!identity.avatar) {
        try {
          identity.avatar = window.localStorage.getItem("vedaapex-avatar") || "";
        } catch {
          identity.avatar = "";
        }
      }
      setProfileSettings(identity);
      setSettingsKey(getSettingsStorageKey(identity));
    }

    supabase.auth.getSession().then(({ data }) => {
      applyUser(data.session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      applyUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const snapshot = loadSnapshot(settingsKey);
    if (!snapshot) {
      setAiSettings(getPlanBasedAiSettings(user?.user_metadata?.plan || readCookie("user_plan")));
      setSaveStatus(user || readCookie("user_email") ? "Synced to account profile" : "Unsaved changes");
      return;
    }

    try {
      if (snapshot.profileSettings) {
        setProfileSettings((prev) => {
          const merged = { ...prev, ...snapshot.profileSettings };
          if (!merged.avatar) {
            try {
              merged.avatar = window.localStorage.getItem("vedaapex-avatar") || "";
            } catch {
              merged.avatar = "";
            }
          }
          return merged;
        });
      }
      if (snapshot.settings) setSettings((prev) => ({ ...prev, ...snapshot.settings }));
      if (snapshot.workspaceSettings) setWorkspaceSettings((prev) => ({ ...prev, ...snapshot.workspaceSettings }));
      if (snapshot.privacySettings) setPrivacySettings((prev) => ({ ...prev, ...snapshot.privacySettings }));
      if (snapshot.securitySettings) setSecuritySettings((prev) => ({ ...prev, ...snapshot.securitySettings }));
      if (snapshot.aiSettings) setAiSettings((prev) => ({ ...prev, ...snapshot.aiSettings }));
      if (snapshot.theme) setTheme(snapshot.theme);
      if (snapshot.lastSavedAt) setLastSavedAt(snapshot.lastSavedAt);
      setSaveStatus("Synced from saved preferences");
    } catch (error) {
      console.error("Failed to load settings snapshot", error);
    }
  }, [settingsKey, setTheme, user]);

  const syncAvatarGlobally = () => {
    try {
      if (profileSettings.avatar) {
        window.localStorage.setItem("vedaapex-avatar", profileSettings.avatar);
      } else {
        window.localStorage.removeItem("vedaapex-avatar");
      }
      window.dispatchEvent(new Event("vedaapex-avatar-updated"));
    } catch {
      // localStorage full or unavailable — ignore
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Image too large — max size is 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfileSettings((prev) => ({ ...prev, avatar: String(reader.result) }));
      setSaveStatus("Unsaved changes — click Save Changes to keep your avatar");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (user) {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileSettings.fullName,
          username: profileSettings.username,
          profession: profileSettings.profession,
          location: profileSettings.location,
          avatar: profileSettings.avatar || null,
        },
      });
      if (error) {
        console.error("Failed to update profile:", error);
      }
    }

    const payload: StoredSettingsSnapshot = {
      profileSettings,
      settings,
      workspaceSettings,
      privacySettings,
      securitySettings,
      aiSettings,
      theme,
      lastSavedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(
      settingsKey,
      JSON.stringify({
        ...payload,
      })
    );
    const savedAt = new Date().toLocaleString();
    setLastSavedAt(savedAt);
    setSaveStatus("Saved successfully");
    syncAvatarGlobally();
  };

  const handleReset = () => {
    setSettings(defaultSystemSettings);
    setWorkspaceSettings(defaultWorkspaceSettings);
    setPrivacySettings(defaultPrivacySettings);
    setSecuritySettings(defaultSecuritySettings);
    setAiSettings(getPlanBasedAiSettings(user?.user_metadata?.plan || readCookie("user_plan")));
    setTheme("light");
    setLastSavedAt(null);
    const identity = buildIdentityFromUser(user, readCookie("user_name"), readCookie("user_email"));
    setProfileSettings(identity);
    setSaveStatus("Reset to defaults");
    syncAvatarGlobally();
  };

  const formatSavedAt = (value: string | null) => {
    if (!value) return null;
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;

    return parsedDate.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getInitials = () => {
    const name = profileSettings.fullName || user?.email || "U";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const summaryCards = [
    {
      label: "Workspace",
      value: workspaceSettings.editorDensity,
      note: `Autosave every ${workspaceSettings.autosaveInterval}`,
      icon: Sliders,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "AI",
      value: aiSettings.defaultModel,
      note: aiSettings.responseStyle + " replies",
      icon: Cpu,
      tone: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Security",
      value: settings.tfa ? "2FA enabled" : "2FA off",
      note: `Session timeout ${securitySettings.sessionTimeout}`,
      icon: Shield,
      tone: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div className="h-screen w-full">
      <div className="flex h-full w-full overflow-hidden">
        <main className="relative flex flex-1 flex-col min-h-0 overflow-y-auto bg-[#F4F1EA]">
          <div className="flex flex-col md:flex-row min-h-screen text-foreground overflow-hidden font-sans">
      <div className="w-full md:w-[320px] md:shrink-0 border-b md:border-b-0 md:border-r border-black/5 bg-white/90 backdrop-blur-xl p-4 md:p-6 flex flex-col justify-between">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2.5 hover:bg-black/5 rounded-xl text-muted-foreground hover:text-foreground transition border border-transparent hover:border-black/5"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Settings
              </h2>
              <p className="text-xs text-foreground/50">Manage your account and preferences</p>
            </div>
          </div>
            <div className="rounded-[22px] border border-black/5 bg-[#FCFBF7] p-4 shadow-sm">
              <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-white font-semibold text-sm overflow-hidden">
                {profileSettings.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileSettings.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {profileSettings.fullName || "Set your name"}
                </p>
                <p className="truncate text-xs text-foreground/50">
                  {profileSettings.email || user?.email || "No email"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-black/5 bg-white px-2.5 py-1 text-[10px] font-semibold text-foreground/60">
                <History className="h-3 w-3" />
                {saveStatus}
              </span>
            </div>
          </div>

          <nav className="flex gap-1.5 overflow-x-auto md:flex-col md:max-h-[62vh] md:overflow-y-auto md:overflow-x-visible pr-1 pb-2 md:pb-0">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between w-full shrink-0 px-4 py-3 rounded-2xl text-left text-sm font-medium transition-all border ${
                    isActive
                      ? "bg-foreground text-white border-foreground shadow-sm"
                      : "hover:bg-black/5 text-foreground/70 hover:text-foreground border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${item.color}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-black/5 space-y-3">
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#F4F1EA] p-4 sm:p-8 xl:p-10 flex justify-center">
        <div className="max-w-6xl w-full space-y-8 pb-16">
          <div className="rounded-[28px] border border-black/5 bg-white p-7 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-foreground/40">
                  System Preferences
                </p>
                <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground capitalize">
                  {activeTab === "vedas" ? "VedaS AI Settings" : `${activeTab} Settings`}
                </h1>
                <p className="mt-3 text-sm leading-6 text-foreground/55">
                  Tune workspace defaults, privacy, AI behavior, and account controls.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-black/5 bg-[#FAFAFA] px-3 py-1 text-[11px] font-semibold text-foreground/60">
                    {saveStatus}
                  </span>
                  {lastSavedAt && (
                    <span className="rounded-full border border-black/5 bg-[#FAFAFA] px-3 py-1 text-[11px] font-semibold text-foreground/60">
                      Last saved {formatSavedAt(lastSavedAt)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleReset}
                  className="rounded-xl border border-black/5 bg-[#FAFAFA] px-4 py-2.5 text-sm font-medium text-foreground/70 transition hover:bg-black/5"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={handleSave}
                  className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-95 hover:bg-foreground/90"
                >
                  Save Changes
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-black/5 bg-[#FCFBF8] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/40">{card.label}</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{card.value}</p>
                      <p className="mt-1 text-xs text-foreground/50">{card.note}</p>
                    </div>
                    <div className={`rounded-2xl p-2.5 ${card.tone}`}>
                      <card.icon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {activeTab === "general" && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
                    <User className="h-5 w-5 text-violet-500" /> Profile Settings
                  </h3>
                  <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="relative group cursor-pointer"
                        onClick={() => avatarInputRef.current?.click()}
                        title="Click to upload profile picture"
                      >
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-1">
                          <div className="w-full h-full rounded-2xl bg-white dark:bg-zinc-950 flex items-center justify-center overflow-hidden">
                            {profileSettings.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={profileSettings.avatar}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-slate-600 dark:text-slate-200 font-semibold text-2xl">
                                {getInitials()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <div className="flex items-center gap-2">
                        <span
                          onClick={() => avatarInputRef.current?.click()}
                          className="text-xs font-semibold text-violet-500 hover:text-violet-600 cursor-pointer transition"
                        >
                          {profileSettings.avatar ? "Change photo" : "Attach photo"}
                        </span>
                        {profileSettings.avatar && (
                          <span
                            onClick={() => {
                              setProfileSettings((prev) => ({ ...prev, avatar: "" }));
                              setSaveStatus("Unsaved changes — click Save Changes to keep your avatar");
                              try {
                                window.localStorage.removeItem("vedaapex-avatar");
                                window.dispatchEvent(new Event("vedaapex-avatar-updated"));
                              } catch {
                                // ignore
                              }
                            }}
                            className="text-xs font-semibold text-red-500 hover:text-red-600 cursor-pointer transition"
                          >
                            Remove
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-1 text-center md:text-left">
                      <h4 className="text-lg font-semibold">{profileSettings.fullName || "Your Name"}</h4>
                      <p className="text-sm text-muted-foreground">{profileSettings.email || user?.email || "your@email.com"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileSettings.fullName}
                        onChange={(e) => setProfileSettings((prev) => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={profileSettings.username}
                        onChange={(e) => setProfileSettings((prev) => ({ ...prev, username: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Profession
                      </label>
                      <input
                        type="text"
                        value={profileSettings.profession}
                        onChange={(e) => setProfileSettings((prev) => ({ ...prev, profession: e.target.value }))}
                        placeholder="e.g. Full Stack Developer"
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profileSettings.location}
                        onChange={(e) => setProfileSettings((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g. New Delhi, India"
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileSettings.email}
                        disabled
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-100 dark:bg-zinc-900 text-foreground/60 cursor-not-allowed outline-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Email is managed through your account settings.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
                      <Sliders className="h-5 w-5 text-indigo-500" /> Workspace Defaults
                    </h3>
                    <p className="text-xs text-muted-foreground">Configure the core editor and model defaults used throughout the app.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Primary Code Model
                      </label>
                      <select
                        value={
                          SETTINGS_MODELS.some(
                            (m) => m.name === aiSettings.defaultModel && canAccessModel(userPlan, m.price)
                          )
                            ? aiSettings.defaultModel
                            : "Apex 2.1"
                        }
                        onChange={(e) => {
                          const chosen = e.target.value;
                          const opt = SETTINGS_MODELS.find((m) => m.name === chosen);
                          if (opt && !canAccessModel(userPlan, opt.price)) {
                            router.push("/upgrade");
                            return;
                          }
                          setAiSettings((prev) => ({ ...prev, defaultModel: chosen }));
                        }}
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none"
                      >
                        {SETTINGS_MODELS.map((m) => {
                          const allowed = canAccessModel(userPlan, m.price);
                          return (
                            <option key={m.name} value={m.name}>
                              {m.name}
                              {allowed ? "" : "  — Upgrade Required"}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-medium">Automatic Cloud Code Save</span>
                          <p className="text-xs text-muted-foreground">Saves state to secure Supabase storage as you code.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.autoSave}
                          onChange={() => toggleSetting("autoSave")}
                          className="h-5 w-10 accent-violet-600 rounded cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-medium">Public Portfolio Profile</span>
                          <p className="text-xs text-muted-foreground">Allow others to browse your generated pages/apps.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.publicProfile}
                          onChange={() => toggleSetting("publicProfile")}
                          className="h-5 w-10 accent-violet-600 rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "workspace" && (
              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 animate-fade-in">
                <div className="space-y-6">
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">Workspace & Editor Defaults</h3>
                        <p className="text-xs text-muted-foreground">These settings shape how the IDE behaves when you open the app.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Startup Screen
                        </label>
                        <select
                          value={workspaceSettings.startupScreen}
                          onChange={(e) => setWorkspaceSettings((prev) => ({ ...prev, startupScreen: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none"
                        >
                          <option>Dashboard</option>
                          <option>Last Project</option>
                          <option>Explore</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Auto-save Interval
                        </label>
                        <select
                          value={workspaceSettings.autosaveInterval}
                          onChange={(e) => setWorkspaceSettings((prev) => ({ ...prev, autosaveInterval: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none"
                        >
                          <option>15 seconds</option>
                          <option>30 seconds</option>
                          <option>60 seconds</option>
                          <option>120 seconds</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Editor Density
                        </label>
                        <select
                          value={workspaceSettings.editorDensity}
                          onChange={(e) => setWorkspaceSettings((prev) => ({ ...prev, editorDensity: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none"
                        >
                          <option>Compact</option>
                          <option>Comfortable</option>
                          <option>Spacious</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Tab Size
                        </label>
                        <select
                          value={workspaceSettings.tabSize}
                          onChange={(e) => setWorkspaceSettings((prev) => ({ ...prev, tabSize: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none"
                        >
                          <option>2 spaces</option>
                          <option>4 spaces</option>
                          <option>Tabs</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Default Shell
                        </label>
                        <select
                          value={workspaceSettings.defaultShell}
                          onChange={(e) => setWorkspaceSettings((prev) => ({ ...prev, defaultShell: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none"
                        >
                          <option>PowerShell</option>
                          <option>Bash</option>
                          <option>Node REPL</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Backup Frequency
                        </label>
                        <select
                          value={workspaceSettings.backupFrequency}
                          onChange={(e) => setWorkspaceSettings((prev) => ({ ...prev, backupFrequency: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none"
                        >
                          <option>Manual</option>
                          <option>Daily</option>
                          <option>Weekly</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Editor Behavior</h4>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-sm font-medium">Format on Save</span>
                        <p className="text-xs text-muted-foreground">Normalize spacing and indentation whenever you save.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={workspaceSettings.formatOnSave}
                        onChange={() => setWorkspaceSettings((prev) => ({ ...prev, formatOnSave: !prev.formatOnSave }))}
                        className="h-5 w-10 accent-violet-600 rounded cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                      <div>
                        <span className="text-sm font-medium">Automatic Backup</span>
                        <p className="text-xs text-muted-foreground">Store a local snapshot before destructive changes.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={workspaceSettings.autoBackup}
                        onChange={() => setWorkspaceSettings((prev) => ({ ...prev, autoBackup: !prev.autoBackup }))}
                        className="h-5 w-10 accent-violet-600 rounded cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                      <div>
                        <span className="text-sm font-medium">Keyboard Shortcuts</span>
                        <p className="text-xs text-muted-foreground">Enable fast actions like save, run, and quick navigation.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.shortcuts}
                        onChange={() => toggleSetting("shortcuts")}
                        className="h-5 w-10 accent-violet-600 rounded cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                      <div>
                        <span className="text-sm font-medium">Release Notes</span>
                        <p className="text-xs text-muted-foreground">Show product updates and new feature notes on startup.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.releaseNotes}
                        onChange={() => toggleSetting("releaseNotes")}
                        className="h-5 w-10 accent-violet-600 rounded cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#FCFBF8] border border-black/5 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Workspace Snapshot</h4>
                        <p className="text-xs text-foreground/50">A quick summary of the current editor profile.</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-3 border-b border-black/5 pb-3">
                        <span className="text-foreground/50">Startup</span>
                        <span className="font-medium">{workspaceSettings.startupScreen}</span>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-black/5 pb-3">
                        <span className="text-foreground/50">Density</span>
                        <span className="font-medium">{workspaceSettings.editorDensity}</span>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-black/5 pb-3">
                        <span className="text-foreground/50">Tab Size</span>
                        <span className="font-medium">{workspaceSettings.tabSize}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-foreground/50">Backup</span>
                        <span className="font-medium">{workspaceSettings.backupFrequency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#FCFBF8] border border-black/5 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                        <Key className="h-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Saved Preferences</h4>
                        <p className="text-xs text-foreground/50">These settings are stored in your browser until you sync them elsewhere.</p>
                      </div>
                    </div>
                    <button
                      onClick={handleSave}
                      className="w-full rounded-xl border border-black/5 bg-white px-4 py-3 text-sm font-semibold text-foreground/80 transition hover:bg-black/5"
                    >
                      Sync workspace preferences now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 animate-fade-in">
                <div className="space-y-6">
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">Privacy & Data Controls</h3>
                        <p className="text-xs text-muted-foreground">Control what the product remembers, logs, and shares.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-medium">Usage Telemetry</span>
                          <p className="text-xs text-muted-foreground">Share anonymous product metrics to improve features.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={privacySettings.telemetry}
                          onChange={() => setPrivacySettings((prev) => ({ ...prev, telemetry: !prev.telemetry }))}
                          className="h-5 w-10 accent-emerald-600 rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                        <div>
                          <span className="text-sm font-medium">Crash Reports</span>
                          <p className="text-xs text-muted-foreground">Send error traces when the app encounters a failure.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={privacySettings.crashReports}
                          onChange={() => setPrivacySettings((prev) => ({ ...prev, crashReports: !prev.crashReports }))}
                          className="h-5 w-10 accent-emerald-600 rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                        <div>
                          <span className="text-sm font-medium">Chat History</span>
                          <p className="text-xs text-muted-foreground">Keep recent conversations visible in the sidebar and library.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={privacySettings.chatHistory}
                          onChange={() => setPrivacySettings((prev) => ({ ...prev, chatHistory: !prev.chatHistory }))}
                          className="h-5 w-10 accent-emerald-600 rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                        <div>
                          <span className="text-sm font-medium">Private Mode</span>
                          <p className="text-xs text-muted-foreground">Limit visible metadata and reduce trace collection while editing.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={privacySettings.privateMode}
                          onChange={() => setPrivacySettings((prev) => ({ ...prev, privateMode: !prev.privateMode }))}
                          className="h-5 w-10 accent-emerald-600 rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                        <div>
                          <span className="text-sm font-medium">Workspace Usage Sharing</span>
                          <p className="text-xs text-muted-foreground">Allow aggregated workspace insights for product improvement.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.dataSharing}
                          onChange={() => toggleSetting("dataSharing")}
                          className="h-5 w-10 accent-emerald-600 rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Data Retention</h4>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Retain local activity
                    </label>
                    <select
                      value={privacySettings.dataRetention}
                      onChange={(e) => setPrivacySettings((prev) => ({ ...prev, dataRetention: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none"
                    >
                      <option>30 days</option>
                      <option>90 days</option>
                      <option>1 year</option>
                      <option>Forever</option>
                    </select>
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>Choosing shorter retention reduces your local trace footprint and keeps the settings panel lighter.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#FCFBF8] border border-black/5 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                        <Eye className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Privacy Snapshot</h4>
                        <p className="text-xs text-foreground/50">What the app can remember right now.</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-3 border-b border-black/5 pb-3">
                        <span className="text-foreground/50">Telemetry</span>
                        <span className="font-medium">{privacySettings.telemetry ? "Enabled" : "Disabled"}</span>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-black/5 pb-3">
                        <span className="text-foreground/50">Crash Reports</span>
                        <span className="font-medium">{privacySettings.crashReports ? "Enabled" : "Disabled"}</span>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-black/5 pb-3">
                        <span className="text-foreground/50">Chat History</span>
                        <span className="font-medium">{privacySettings.chatHistory ? "Retained" : "Off"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-foreground/50">Retention</span>
                        <span className="font-medium">{privacySettings.dataRetention}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm space-y-6 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Email Notifications</h3>
                    <p className="text-xs text-muted-foreground">Manage your notification channels and address credentials.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Primary Verification Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profileSettings.email}
                        disabled
                        className="w-full pl-4 pr-24 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-100 dark:bg-zinc-900 text-foreground/60 cursor-not-allowed outline-none"
                      />
                      <span className="absolute right-3 top-2 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold rounded-lg text-xs border border-emerald-200 dark:border-emerald-500/20">
                        Verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Digest Schedule Frequency
                    </label>
                    <select className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none">
                      <option>Send notifications immediately</option>
                      <option>Daily condensed review summary</option>
                      <option>Weekly system compilation</option>
                      <option>Never email (Strictly In-App Dashboard)</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-sm font-medium">Critical Security & Deployment Alerts</span>
                        <p className="text-xs text-muted-foreground">Receive instant notifications when code releases fail or passwords reset.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={() => toggleSetting("emailNotifications")}
                        className="h-5 w-10 accent-violet-600 rounded cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-sm font-medium">Marketing and Feature Spotlights</span>
                        <p className="text-xs text-muted-foreground">Get tips, code templates, and info about Apex model upgrades.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.desktopNotifications}
                        onChange={() => toggleSetting("desktopNotifications")}
                        className="h-5 w-10 accent-violet-600 rounded cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8 shadow-sm text-center animate-fade-in">
                <CreditCard className="h-12 w-12 mx-auto text-foreground/30 mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">Billing & Subscriptions</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Billing features will be available soon. You can manage your subscription and payment methods here once this section is active.
                </p>
              </div>
            )}

            {activeTab === "language" && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm space-y-6 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Language & Regionalization</h3>
                    <p className="text-xs text-muted-foreground">Align your editor UI languages, times and numeral formatting.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      System Language
                    </label>
                    <select className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none">
                      <option>English (United States)</option>
                      <option>Hindi (India)</option>
                      <option>Spanish (Spain)</option>
                      <option>French (France)</option>
                      <option>Japanese (Japan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Preferred Timezone
                    </label>
                    <select className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none">
                      <option>IST (GMT+05:30) India Standard Time</option>
                      <option>UTC (GMT+00:00) Universal Coordinated</option>
                      <option>PST (GMT-08:00) Pacific Standard Time</option>
                      <option>EST (GMT-05:00) Eastern Standard Time</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-sm font-medium">Automatic RTL (Right-to-Left) Rendering</span>
                      <p className="text-xs text-muted-foreground">Adjust text directions dynamically for Hebrew, Arabic or Persian locales.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.dataSharing}
                      onChange={() => toggleSetting("dataSharing")}
                      className="h-5 w-10 accent-violet-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {activeTab === "library" && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8 shadow-sm text-center animate-fade-in">
                <Library className="h-12 w-12 mx-auto text-foreground/30 mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">Library & Assets</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Your generated assets and workspace bundles will appear here as you create them.
                </p>
              </div>
            )}

            {activeTab === "vedas" && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm space-y-6 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">VedaS Cognitive Engine Settings</h3>
                    <p className="text-xs text-muted-foreground">Configure coding parameters, system rules, and agent reasoning weights.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Creativity & Temperature
                      </label>
                      <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{aiSettings.creativity}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={aiSettings.creativity}
                      onChange={(e) => setAiSettings({ ...aiSettings, creativity: parseFloat(e.target.value) })}
                      className="range-slider w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>Strict & Deterministic (0.1)</span>
                      <span>Creative & Experimental (1.0)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Max Completion Length (Tokens)
                    </label>
                    <select
                      value={aiSettings.maxTokens}
                      onChange={(e) => setAiSettings({ ...aiSettings, maxTokens: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none"
                    >
                      <option value="1024">1,024 Tokens (Basic responses)</option>
                      <option value="2048">2,048 Tokens (Standard Coding Files)</option>
                      <option value="4096">4,096 Tokens (Full-stack pages)</option>
                      <option value="8192">8,192 Tokens (Max comprehensive output)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      System Developer Instruction Prompt
                    </label>
                    <textarea
                      rows={8}
                      value={aiSettings.systemPrompt}
                      onChange={(e) => setAiSettings({ ...aiSettings, systemPrompt: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none font-mono text-xs"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-sm font-medium">Activate Beta Experimental Features</span>
                        <p className="text-xs text-muted-foreground">Enables next-generation self-improving code agents inside the IDE.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.betaFeatures}
                        onChange={() => toggleSetting("betaFeatures")}
                        className="h-5 w-10 accent-indigo-600 rounded cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm space-y-6 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Security & Access</h3>
                    <p className="text-xs text-muted-foreground">Protect sign-ins, session lifetime, and sensitive workspace actions.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-bold">Two-Factor Authentication (2FA)</p>
                        <p className="text-xs text-muted-foreground">Require an authenticator or passkey during sign-in.</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.tfa}
                      onChange={() => toggleSetting("tfa")}
                      className="h-5 w-10 accent-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 space-y-2">
                      <p className="text-sm font-bold text-foreground">Session Timeout</p>
                      <p className="text-xs text-muted-foreground">Automatically log out after inactivity.</p>
                      <select
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings((prev) => ({ ...prev, sessionTimeout: e.target.value }))}
                        className="w-full mt-2 px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none"
                      >
                        <option>15 minutes</option>
                        <option>1 hour</option>
                        <option>8 hours</option>
                        <option>24 hours</option>
                        <option>Never</option>
                      </select>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="pr-3">
                          <span className="text-sm font-medium">Require Re-authentication</span>
                          <p className="text-xs text-muted-foreground">Confirm identity before billing or key changes.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={securitySettings.requireReauth}
                          onChange={() => setSecuritySettings((prev) => ({ ...prev, requireReauth: !prev.requireReauth }))}
                          className="h-5 w-10 accent-emerald-600 rounded cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-200 dark:border-zinc-800/80">
                        <div className="pr-3">
                          <span className="text-sm font-medium">Remember Trusted Devices</span>
                          <p className="text-xs text-muted-foreground">Reduce repeated prompts on known devices.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={securitySettings.rememberDevices}
                          onChange={() => setSecuritySettings((prev) => ({ ...prev, rememberDevices: !prev.rememberDevices }))}
                          className="h-5 w-10 accent-emerald-600 rounded cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-200 dark:border-zinc-800/80">
                        <div className="pr-3">
                          <span className="text-sm font-medium">Mask API Keys in UI</span>
                          <p className="text-xs text-muted-foreground">Hide sensitive keys until you explicitly reveal them.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={!securitySettings.apiKeyVisibility}
                          onChange={() => setSecuritySettings((prev) => ({ ...prev, apiKeyVisibility: !prev.apiKeyVisibility }))}
                          className="h-5 w-10 accent-emerald-600 rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "accessibility" && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm space-y-6 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                    <AccessibilityIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Accessibility & Readability Settings</h3>
                    <p className="text-xs text-muted-foreground">Fine-tune motion dynamics, colors and layouts for comfortable operations.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-sm font-medium">Reduce Editor Animation Motions</span>
                      <p className="text-xs text-muted-foreground">Deactivates high-frequency transitions to improve terminal performance.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.reduceMotion}
                      onChange={() => toggleSetting("reduceMotion")}
                      className="h-5 w-10 accent-sky-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-100 dark:border-zinc-800/85">
                    <div>
                      <span className="text-sm font-medium">Activate High-Contrast Workspace CSS</span>
                      <p className="text-xs text-muted-foreground">Improves border visual visibility for all dialog panels.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.highContrast}
                      onChange={() => toggleSetting("highContrast")}
                      className="h-5 w-10 accent-sky-600 rounded cursor-pointer"
                    />
                  </label>

                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/85">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Code Editor Font Size Scaling
                    </label>
                    <select className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none">
                      <option>12px (Compact Coding)</option>
                      <option>14px (Standard Editor Default)</option>
                      <option>16px (Comfortable Reading)</option>
                      <option>18px (Large Display)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm space-y-6 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gray-500/10 text-gray-500">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">About VedaApex</h3>
                    <p className="text-xs text-muted-foreground">A local-first settings surface for the workspace.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold">VedaApex Production Release 2.2.0</p>
                      <p className="text-xs text-muted-foreground">Designed for local-first control, clean hierarchy, and fast edits.</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">Environment: Stable Production</p>
                      <p className="text-[10px] text-muted-foreground">Node v20.11.0 - React v19.0.0</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Changelog Notes</h4>
                    <div className="text-xs space-y-2 text-muted-foreground">
                      <p className="flex items-start gap-2">
                        <span className="font-semibold text-violet-600 dark:text-violet-400 shrink-0">v2.2.0</span>
                        <span>Added workspace, privacy, and security controls with persistent local settings.</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="font-semibold text-violet-600 dark:text-violet-400 shrink-0">v2.1.0</span>
                        <span>Expanded the settings shell with clearer hierarchy, spacing, and calmer interaction states.</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  </div>
  );
}
