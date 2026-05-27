"use client";

import { useState } from "react";
import { User, Mail, CreditCard, Languages, Library, Sparkles, Sun, Moon, ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

const menuItems = [
  { id: "general", label: "General", icon: User },
  { id: "email", label: "Email", icon: Mail },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "language", label: "Language", icon: Languages },
  { id: "library", label: "Library", icon: Library },
  { id: "vedas", label: "VedaS", icon: Sparkles },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const { theme, setTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    desktopNotifications: false,
    publicProfile: true,
    dataSharing: false,
    autoSave: true,
    betaFeatures: false,
    analytics: true,
    shortcuts: true,
    tfa: false,
    offlineMode: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    // In a real app, you would send this to backend:
    // await fetch("/api/v1/user/settings", { method: "POST", body: JSON.stringify(settings) });
    alert("Settings saved successfully!");
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 border-r p-6 flex flex-col gap-6">
        <h2 className="text-xl font-bold">Settings</h2>
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium ${activeTab === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t">
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-muted"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>

      <div className="flex-1 p-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Go Back
        </Link>
        <h1 className="text-2xl font-bold mb-6 capitalize">{activeTab} Settings</h1>
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          {activeTab === "general" ? (
            <div className="space-y-8 max-w-lg">
              {/* Profile Section */}
              <section>
                <h3 className="text-sm font-bold uppercase text-primary mb-4">Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input type="text" className="w-full p-2 border rounded-lg bg-background" placeholder="Enter name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <input type="text" className="w-full p-2 border rounded-lg bg-background" placeholder="Enter username" />
                  </div>
                </div>
              </section>

              {/* Generation Settings Section */}
              <section>
                <h3 className="text-sm font-bold uppercase text-primary mb-4">Generation Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">AI Model</label>
                    <select className="w-full p-2 border rounded-lg bg-background">
                      <option>Apex 2.2 (Standard)</option>
                      <option>Apex 2.2 Turbo (Fast)</option>
                      <option>VedaS Thinking Model</option>
                    </select>
                  </div>
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Enable Creative Mode</span>
                    <input type="checkbox" className="toggle" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm">High-Res Generation</span>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </label>
                </div>
              </section>

              {/* Other Features */}
              <div className="space-y-3 pt-4 border-t">
                {Object.entries(settings).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <input 
                      type="checkbox" 
                      checked={value} 
                      onChange={() => toggleSetting(key as keyof typeof settings)} 
                      className="toggle" 
                    />
                  </label>
                ))}
              </div>
              <button onClick={handleSave} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90">Save All Changes</button>
            </div>
          ) : activeTab === "email" ? (
            <div className="space-y-6 max-w-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Primary Email Address</label>
                <input type="email" className="w-full p-2 border rounded-lg bg-background" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notification Frequency</label>
                <select className="w-full p-2 border rounded-lg bg-background">
                  <option>Immediately</option>
                  <option>Daily Digest</option>
                  <option>Weekly</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm">Receive Marketing Emails</span>
                  <input type="checkbox" className="toggle" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Security Alerts</span>
                  <input type="checkbox" defaultChecked className="toggle" />
                </label>
              </div>
              <button onClick={handleSave} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90">Save Email Settings</button>
            </div>
          ) : activeTab === "billing" ? (
            <div className="space-y-6 max-w-lg">
              <div className="p-4 border rounded-xl bg-muted/50">
                <p className="text-sm font-medium">Current Plan: <span className="text-primary font-bold">Pro</span></p>
                <p className="text-xs text-muted-foreground mt-1">Next billing date: 26 June 2026</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <input type="text" className="w-full p-2 border rounded-lg bg-background" placeholder="Visa **** 1234" disabled />
              </div>
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90">Manage Subscription</button>
            </div>
          ) : activeTab === "language" ? (
            <div className="space-y-6 max-w-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Language</label>
                <select className="w-full p-2 border rounded-lg bg-background">
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Spanish</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Timezone</label>
                <select className="w-full p-2 border rounded-lg bg-background">
                  <option>IST (GMT+05:30)</option>
                  <option>UTC</option>
                </select>
              </div>
              <button onClick={handleSave} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90">Save Language Settings</button>
            </div>
          ) : (
            <p className="text-muted-foreground">Manage your {activeTab} preferences here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
