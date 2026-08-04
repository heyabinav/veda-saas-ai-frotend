"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Lock, CheckCircle, ShieldCheck, ArrowLeft, Sparkles } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [strength, setStrength] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Password strength calculator
  useEffect(() => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    setStrength(score);
  }, [password]);

  const strengthLabel = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"][strength];

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (error) return setError(error.message);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setLoading(false);
      setError("An error occurred. Please try again.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#ffffff", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); opacity: 0.5; }
          50%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes checkIn {
          0%   { transform: scale(0) rotate(-45deg); opacity: 0; }
          60%  { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(40px, -60px) scale(1.1); }
          66%      { transform: translate(-30px, 30px) scale(0.9); }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(-40px, 60px) scale(0.9); }
          66%      { transform: translate(30px, -30px) scale(1.1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }

        .fade-up { animation: fadeUp 0.7s ease both; }
        .fade-up-1 { animation: fadeUp 0.7s 0.1s ease both; }
        .fade-up-2 { animation: fadeUp 0.7s 0.2s ease both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.7s 0.4s ease both; }
        .fade-up-5 { animation: fadeUp 0.7s 0.5s ease both; }

        .float-anim { animation: floatY 4s ease-in-out infinite; }
        .orb-1 { animation: orb1 9s infinite ease-in-out; }
        .orb-2 { animation: orb2 11s infinite ease-in-out; }
        .check-anim { animation: checkIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

        .input-field {
          width: 100%;
          padding: 13px 44px 13px 44px;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          background: #f9fafb;
          color: #111827;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: all 0.2s ease;
        }
        .input-field::placeholder { color: #9ca3af; }
        .input-field:focus {
          border-color: #8b5cf6;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.08);
        }

        .reset-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.35);
          position: relative;
          overflow: hidden;
        }
        .reset-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(124, 58, 237, 0.45);
        }
        .reset-btn:active:not(:disabled) { transform: translateY(0); }
        .reset-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #6b7280;
          font-size: 14px;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .back-link:hover { color: #7c3aed; }

        .strength-bar-segment {
          height: 4px;
          border-radius: 2px;
          flex: 1;
          transition: background 0.3s ease;
        }
      `}</style>

      {/* ── LEFT PANEL (decorative) ── */}
      <div style={{
        flex: "0 0 45%",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4c1d95 75%, #5b21b6 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 48px",
      }}
        className="reset-left-panel"
      >
        {/* Animated orbs */}
        <div className="orb-1" style={{
          position: "absolute", top: "10%", left: "15%",
          width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        <div className="orb-2" style={{
          position: "absolute", bottom: "15%", right: "10%",
          width: 220, height: 220, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)",
          filter: "blur(35px)",
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)",
        }} />

        {/* Grid overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 380 }}>
          {/* Logo */}
          <div className="float-anim" style={{ marginBottom: 40 }}>
            <img
              src="/logo.svg"
              alt="VedaApex Logo"
              style={{ width: 90, height: 90, filter: "drop-shadow(0 8px 24px rgba(139,92,246,0.5))" }}
            />
          </div>

          {/* Lock icon badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 72, height: 72, borderRadius: "20px",
            background: "rgba(139,92,246,0.2)",
            border: "1px solid rgba(167,139,250,0.3)",
            marginBottom: 28,
            backdropFilter: "blur(12px)",
          }}>
            <ShieldCheck size={36} color="#c4b5fd" />
          </div>

          <h2 style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 16 }}>
            Secure Your<br />
            <span style={{ backgroundImage: "linear-gradient(90deg, #c4b5fd, #818cf8)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Account
            </span>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(196,181,253,0.75)", lineHeight: 1.7, marginBottom: 40 }}>
            Choose a strong password to keep your VedaApex account safe and protected.
          </p>

          {/* Tips */}
          {[
            { icon: "🔐", text: "Use 10+ characters for best security" },
            { icon: "🔠", text: "Mix uppercase, numbers & symbols" },
            { icon: "🔄", text: "Never reuse passwords across sites" },
          ].map((tip, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 12,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              marginBottom: 10, textAlign: "left",
            }}>
              <span style={{ fontSize: 18 }}>{tip.icon}</span>
              <span style={{ fontSize: 13, color: "rgba(196,181,253,0.8)", fontWeight: 500 }}>{tip.text}</span>
            </div>
          ))}
        </div>

        {/* Bottom badge */}
        <div style={{
          position: "absolute", bottom: 28,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
          <span style={{ fontSize: 12, color: "rgba(196,181,253,0.6)", fontWeight: 500 }}>
            256-bit SSL Encryption
          </span>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 40px",
        backgroundColor: "#ffffff",
        overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Back link */}
          <div className="fade-up" style={{ marginBottom: 32 }}>
            <Link href="/login" className="back-link">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>

          {!success ? (
            <>
              {/* Header */}
              <div className="fade-up-1" style={{ marginBottom: 32 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 20,
                  background: "linear-gradient(135deg, #ede9fe, #eef2ff)",
                  marginBottom: 16,
                }}>
                  <Sparkles size={14} color="#7c3aed" />
                  <span style={{ fontSize: 12, color: "#7c3aed", fontWeight: 600, letterSpacing: "0.04em" }}>
                    PASSWORD RESET
                  </span>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", lineHeight: 1.2, marginBottom: 8 }}>
                  Create New Password
                </h1>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
                  Your new password must be different from your previous passwords.
                </p>
              </div>

              <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* New Password */}
                <div className="fade-up-2">
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock size={18} color="#9ca3af" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex" }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="strength-bar-segment"
                            style={{ background: i <= strength ? strengthColor : "#e5e7eb" }}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: strengthColor }}>
                        {strengthLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="fade-up-3">
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                    Confirm Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock size={18} color="#9ca3af" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field"
                      style={{
                        borderColor: confirmPassword && confirmPassword !== password ? "#ef4444"
                          : confirmPassword && confirmPassword === password ? "#22c55e"
                          : "#e5e7eb"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex" }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p style={{ marginTop: 6, fontSize: 12, color: "#ef4444", fontWeight: 500 }}>
                      Passwords do not match
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p style={{ marginTop: 6, fontSize: 12, color: "#22c55e", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle size={13} /> Passwords match
                    </p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="fade-up" style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                  }}>
                    <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>{error}</p>
                  </div>
                )}

                {/* Submit */}
                <div className="fade-up-4">
                  <button type="submit" disabled={loading} className="reset-btn">
                    {loading ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <span style={{
                          width: 16, height: 16,
                          border: "2px solid rgba(255,255,255,0.4)",
                          borderTopColor: "#fff",
                          borderRadius: "50%",
                          display: "inline-block",
                          animation: "spin 0.7s linear infinite",
                        }} />
                        Updating password...
                      </span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <ShieldCheck size={17} />
                        Reset Password
                      </span>
                    )}
                  </button>
                </div>

                {/* Footer */}
                <p className="fade-up-5" style={{ textAlign: "center", fontSize: 13, color: "#9ca3af" }}>
                  Remember your password?{" "}
                  <Link href="/login" style={{ color: "#7c3aed", fontWeight: 600, textDecoration: "none" }}>
                    Sign in
                  </Link>
                </p>
              </form>
            </>
          ) : (
            /* ── Success State ── */
            <div style={{ textAlign: "center" }} className="fade-up">
              {/* Animated success icon */}
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 88, height: 88, borderRadius: "50%",
                background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                marginBottom: 24,
                boxShadow: "0 0 0 16px rgba(52,211,153,0.1)",
              }}>
                <CheckCircle size={44} color="#059669" className="check-anim" />
              </div>

              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 14px", borderRadius: 20,
                background: "#d1fae5",
                marginBottom: 20,
              }}>
                <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>SUCCESS</span>
              </div>

              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 12 }}>
                Password Updated!
              </h1>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 32 }}>
                Your password has been reset successfully. You&apos;ll be redirected to the login page in a few seconds.
              </p>

              <div style={{
                padding: "14px 20px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                border: "1px solid #bbf7d0",
                display: "flex", alignItems: "center", gap: 10,
                marginBottom: 24,
              }}>
                <ShieldCheck size={18} color="#16a34a" />
                <span style={{ fontSize: 13, color: "#15803d", fontWeight: 500 }}>
                  Your account is now secured with your new password
                </span>
              </div>

              <Link
                href="/login"
                style={{
                  display: "inline-block",
                  padding: "13px 32px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
                  transition: "all 0.2s ease",
                }}
              >
                Go to Login →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .reset-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
