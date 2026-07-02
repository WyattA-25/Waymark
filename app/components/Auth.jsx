"use client";

import { useState } from "react";
import { Navigation } from "lucide-react";
import { supabase } from "../../lib/supabase";

const C = {
  bg: "#0D1117",
  surface: "#161B22",
  surfaceAlt: "#1C2330",
  border: "#30363D",
  accent: "#F97316",
  text: "#E6EDF3",
  textSub: "#8B949E",
  muted: "#7D8590",
  green: "#3FB950",
  red: "#F85149",
};

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account, then sign in.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onLogin(data.user);
    }
    setLoading(false);
  }

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${C.accent}, #C04A00)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Navigation size={24} color="#fff" strokeWidth={2.5} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: "-0.03em" }}>waymark</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Your RV Co-Pilot</div>
        </div>

        {/* Form */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
            {isSignUp ? "Create your account" : "Welcome back"}
          </div>

          <div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6 }}>EMAIL</div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="you@example.com"
              style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6 }}>PASSWORD</div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="••••••••"
              style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: C.red, background: "#2D0E0D", border: `1px solid ${C.red}33`, borderRadius: 8, padding: "8px 12px" }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ fontSize: 12, color: C.green, background: "#0D2116", border: `1px solid ${C.green}33`, borderRadius: 8, padding: "8px 12px" }}>
              {message}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", padding: "12px", background: C.accent, border: "none", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, color: "#1A0800", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>

          <button onClick={() => { setIsSignUp(s => !s); setError(""); setMessage(""); }}
            style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}