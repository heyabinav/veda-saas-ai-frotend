"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Brain, Plus, Trash2, RefreshCw, Search, Zap, Star, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

type Skill = {
  id?: string;
  name?: string;
  level?: string;
  confidence?: number | null;
  source?: string;
  description?: string;
  trigger_keywords?: string[];
  instructions?: string;
  tools_config?: Record<string, unknown> | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function SkillsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pName, setPName] = useState("");
  const [pLevel, setPLevel] = useState("beginner");
  const [pConfidence, setPConfidence] = useState("");
  const [pSource, setPSource] = useState("");

  const [cName, setCName] = useState("");
  const [cDescription, setCDescription] = useState("");
  const [cKeywords, setCKeywords] = useState("");
  const [cInstructions, setCInstructions] = useState("");

  const [creatingP, setCreatingP] = useState(false);
  const [creatingC, setCreatingC] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [matchMsg, setMatchMsg] = useState("");
  const [matchResult, setMatchResult] = useState<string[] | null>(null);
  const [matching, setMatching] = useState(false);

  const [execMsg, setExecMsg] = useState("");
  const [execResult, setExecResult] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const res = await apiRequest("/api/v1/skills");
      const data = await res.json();
      const nested = data?.data && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : data?.skills ?? data?.items;
      setSkills(Array.isArray(nested) ? nested : []);
    } catch (err: any) {
      console.error("Skills load failed:", err);
      setError(err?.message || "Failed to load skills.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const idOf = (s: Skill) => s.id ?? "";

  const addPersistentSkill = async () => {
    if (!pName.trim()) return;
    setCreatingP(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { name: pName.trim(), level: pLevel };
      if (pConfidence.trim()) body.confidence = Number(pConfidence);
      if (pSource.trim()) body.source = pSource.trim();
      await apiRequest("/api/v1/skills", { method: "POST", body: JSON.stringify(body) });
      setPName("");
      setPConfidence("");
      setPSource("");
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to add skill.");
    } finally {
      setCreatingP(false);
    }
  };

  const addCustomSkill = async () => {
    if (!cName.trim() || !cInstructions.trim()) return;
    setCreatingC(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: cName.trim(),
        instructions: cInstructions.trim(),
      };
      if (cDescription.trim()) body.description = cDescription.trim();
      if (cKeywords.trim()) {
        body.trigger_keywords = cKeywords.split(",").map((k) => k.trim()).filter(Boolean);
      }
      await apiRequest("/api/v1/skills", { method: "POST", body: JSON.stringify(body) });
      setCName("");
      setCDescription("");
      setCKeywords("");
      setCInstructions("");
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to create custom skill.");
    } finally {
      setCreatingC(false);
    }
  };

  const saveEdit = async (skill: Skill) => {
    if (!editingId || !editValue.trim()) return;
    setError(null);
    try {
      const body: Record<string, unknown> = { name: editValue.trim() };
      if (skill.level) body.level = skill.level;
      if (skill.instructions) body.instructions = skill.instructions;
      await apiRequest(`/api/v1/skills/${editingId}`, { method: "PATCH", body: JSON.stringify(body) });
      setEditingId(null);
      setEditValue("");
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to update skill.");
    }
  };

  const deleteSkill = async (skill: Skill) => {
    const id = idOf(skill);
    if (!id) return;
    if (!confirm(`Delete skill "${skill.name ?? id}"?`)) return;
    setError(null);
    try {
      await apiRequest(`/api/v1/skills/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to delete skill.");
    }
  };

  const runMatch = async () => {
    if (!matchMsg.trim()) return;
    setMatching(true);
    setMatchResult(null);
    setError(null);
    try {
      const res = await apiRequest("/api/v1/skills/match", { method: "POST", body: JSON.stringify({ message: matchMsg.trim() }) });
      const data = await res.json();
      const nested = data?.data && typeof data.data === "object" ? data.data : data;
      const arr = nested?.matched_skills ?? nested?.skills ?? [];
      setMatchResult(Array.isArray(arr) ? arr.map((s: any) => (typeof s === "string" ? s : s?.name ?? s?.slug ?? JSON.stringify(s))) : []);
    } catch (err: any) {
      setError(err?.message || "Skill match failed.");
    } finally {
      setMatching(false);
    }
  };

  const runExecute = async () => {
    if (!execMsg.trim()) return;
    setExecuting(true);
    setExecResult(null);
    setError(null);
    try {
      const res = await apiRequest("/api/v1/skills/execute", { method: "POST", body: JSON.stringify({ message: execMsg.trim() }) });
      const data = await res.json();
      const nested = data?.data && typeof data.data === "object" ? data.data : data;
      setExecResult(nested?.reply ?? nested?.response ?? (typeof nested === "string" ? nested : JSON.stringify(nested)));
    } catch (err: any) {
      setError(err?.message || "Skill execution failed.");
    } finally {
      setExecuting(false);
    }
  };

  const customCount = skills.filter((s) => s.instructions).length;
  const persistentCount = skills.length - customCount;

  return (
    <div className="h-screen w-full">
      <div className="flex h-full w-full overflow-hidden bg-white">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-[#F9F9F9] p-4 sm:p-8">
          <div className="mx-auto w-full max-w-5xl space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground/90">Skills</h1>
              <p className="text-sm text-foreground/50">Persistent user skills, custom skills, matching and execution</p>
            </div>

            {error && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                <span>{error}</span>
                <button onClick={() => void loadAll()} className="flex shrink-0 items-center gap-1.5 font-medium text-amber-700 hover:underline">
                  <RefreshCw className="h-4 w-4" /> Retry
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-busy={loading}>
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-foreground/50 mb-2">
                  <Brain className="h-4 w-4" /> Total Skills
                </div>
                {loading ? <Skeleton rounded="sm" className="h-9 w-24" /> : <p className="text-3xl font-bold text-foreground">{skills.length}</p>}
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-foreground/50 mb-2">
                  <Star className="h-4 w-4" /> Persistent Skills
                </div>
                {loading ? <Skeleton rounded="sm" className="h-9 w-24" /> : <p className="text-3xl font-bold text-foreground">{persistentCount}</p>}
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-foreground/50 mb-2">
                  <Sparkles className="h-4 w-4" /> Custom Skills
                </div>
                {loading ? <Skeleton rounded="sm" className="h-9 w-24" /> : <p className="text-3xl font-bold text-foreground">{customCount}</p>}
              </div>
            </div>

            {/* Create forms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <h2 className="mb-1 font-semibold text-foreground">Add a skill</h2>
                <p className="mb-4 text-xs text-foreground/45">Persistent capability (name + level + confidence)</p>
                <div className="space-y-3">
                  <input
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    placeholder="Skill name (e.g. Python data analysis)"
                    className="w-full rounded-xl border border-black/10 bg-[#FAFAFA] px-4 py-2.5 text-sm focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={pLevel}
                      onChange={(e) => setPLevel(e.target.value)}
                      className="rounded-xl border border-black/10 bg-[#FAFAFA] px-3 py-2.5 text-sm focus:outline-none"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                    <input
                      value={pConfidence}
                      onChange={(e) => setPConfidence(e.target.value)}
                      placeholder="Confidence (0-1)"
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      className="rounded-xl border border-black/10 bg-[#FAFAFA] px-3 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                  <input
                    value={pSource}
                    onChange={(e) => setPSource(e.target.value)}
                    placeholder="Source (optional, e.g. profile)"
                    className="w-full rounded-xl border border-black/10 bg-[#FAFAFA] px-4 py-2.5 text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => void addPersistentSkill()}
                    disabled={creatingP || !pName.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" /> {creatingP ? "Adding..." : "Add Skill"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <h2 className="mb-1 font-semibold text-foreground">Create custom skill</h2>
                <p className="mb-4 text-xs text-foreground/45">Instructions + trigger keywords — usable with match &amp; execute</p>
                <div className="space-y-3">
                  <input
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="Skill name (e.g. Blog writer)"
                    className="w-full rounded-xl border border-black/10 bg-[#FAFAFA] px-4 py-2.5 text-sm focus:outline-none"
                  />
                  <input
                    value={cDescription}
                    onChange={(e) => setCDescription(e.target.value)}
                    placeholder="Short description"
                    className="w-full rounded-xl border border-black/10 bg-[#FAFAFA] px-4 py-2.5 text-sm focus:outline-none"
                  />
                  <input
                    value={cKeywords}
                    onChange={(e) => setCKeywords(e.target.value)}
                    placeholder="Trigger keywords (comma separated)"
                    className="w-full rounded-xl border border-black/10 bg-[#FAFAFA] px-4 py-2.5 text-sm focus:outline-none"
                  />
                  <textarea
                    value={cInstructions}
                    onChange={(e) => setCInstructions(e.target.value)}
                    placeholder="Instructions for the AI (how to fulfill this skill)"
                    rows={4}
                    className="w-full resize-none rounded-xl border border-black/10 bg-[#FAFAFA] px-4 py-2.5 text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => void addCustomSkill()}
                    disabled={creatingC || !cName.trim() || !cInstructions.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" /> {creatingC ? "Creating..." : "Create Custom Skill"}
                  </button>
                </div>
              </div>
            </div>

            {/* Skills list */}
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm" aria-busy={loading}>
              <h2 className="mb-4 font-semibold text-foreground">Your skills</h2>
              {loading ? (
                <SkeletonList count={3} className="py-2" trailing={false} />
              ) : skills.length === 0 ? (
                <p className="py-8 text-center text-sm text-foreground/40">No skills yet. Add one above.</p>
              ) : (
                <div className="divide-y divide-black/5">
                  {skills.map((s) => (
                    <div key={idOf(s)} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50">
                          <Brain className="h-4 w-4 text-violet-500" />
                        </div>
                        <div className="min-w-0 max-w-[400px]">
                          {editingId === idOf(s) ? (
                            <input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") void saveEdit(s);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              autoFocus
                              className="w-full rounded-lg border border-black/10 bg-[#FAFAFA] px-3 py-1.5 text-sm focus:outline-none"
                            />
                          ) : (
                            <p className="truncate text-sm font-medium text-foreground">{s.name ?? "Unnamed"}</p>
                          )}
                          <p className="truncate text-xs text-foreground/45">
                            {s.instructions ? "Custom" : "Persistent"} {s.level ? `· ${s.level}` : ""}
                            {s.confidence != null ? ` · ${Number(s.confidence).toFixed(2)}` : ""}
                            {s.trigger_keywords?.length ? ` · triggers: ${s.trigger_keywords.slice(0, 3).join(", ")}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {editingId === idOf(s) ? (
                          <>
                            <button
                              onClick={() => void saveEdit(s)}
                              className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                            >
                              Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-foreground/60 hover:bg-black/5">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingId(idOf(s)); setEditValue(s.name ?? ""); }}
                              className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-foreground/60 hover:bg-black/5"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => void deleteSkill(s)}
                              className="flex items-center gap-1 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Match tester */}
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <h2 className="mb-1 font-semibold text-foreground">Match skills to a message</h2>
              <p className="mb-4 text-xs text-foreground/45">Finds the most relevant skills for any user input</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={matchMsg}
                  onChange={(e) => setMatchMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void runMatch(); }}
                  placeholder="e.g. Write a blog post about AI"
                  className="flex-1 rounded-xl border border-black/10 bg-[#FAFAFA] px-4 py-2.5 text-sm focus:outline-none"
                />
                <button
                  onClick={() => void runMatch()}
                  disabled={matching || !matchMsg.trim()}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Search className="h-4 w-4" /> {matching ? "Matching..." : "Match"}
                </button>
              </div>
              {matchResult && (
                <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-4">
                  <p className="text-xs font-medium text-violet-700 mb-1">Matched skills:</p>
                  {matchResult.length === 0 ? (
                    <p className="text-sm text-violet-600">No skills matched.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {matchResult.map((m, i) => (
                        <span key={i} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-violet-700 shadow-sm">{m}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Execute wizard */}
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <h2 className="mb-1 font-semibold text-foreground">Execute with skills</h2>
              <p className="mb-4 text-xs text-foreground/45">Runs a message through matched skills and returns the AI reply</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={execMsg}
                  onChange={(e) => setExecMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void runExecute(); }}
                  placeholder="e.g. Draft an intro for my startup"
                  className="flex-1 rounded-xl border border-black/10 bg-[#FAFAFA] px-4 py-2.5 text-sm focus:outline-none"
                />
                <button
                  onClick={() => void runExecute()}
                  disabled={executing || !execMsg.trim()}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" /> {executing ? "Executing..." : "Execute"}
                </button>
              </div>
              {execResult && (
                <div className="mt-4 max-h-64 overflow-y-auto rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="whitespace-pre-wrap text-sm text-emerald-800">{execResult}</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}