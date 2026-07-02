"use client";

import { supabase } from "../../lib/supabase";
import CampsiteSearch from "./CampsiteSearch";
import { useState, useRef, useEffect } from "react";
import { useWebLLM } from "./useWebLLM";
import {
  Wind, Droplets, AlertTriangle,
  Wrench, Navigation, User, Home,
  Star, Bell, X, Send, MessageSquare,
  Tent, Car, Zap, Cloud, Download,
  ToggleLeft, ToggleRight, Bot, Compass, Sun,
  ArrowLeft, ChevronRight
} from "lucide-react";

const C = {
  bg: "#0D1117",
  surface: "#161B22",
  surfaceAlt: "#1C2330",
  border: "#30363D",
  accent: "#F97316",
  accentSoft: "#2D1508",
  green: "#3FB950",
  greenSoft: "#0D2116",
  red: "#F85149",
  redSoft: "#2D0E0D",
  blue: "#58A6FF",
  blueSoft: "#0C1C2D",
  muted: "#7D8590",
  text: "#E6EDF3",
  textSub: "#8B949E",
};

// ─── MOBILE HOOK ───────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ─── SPARKLINE ─────────────────────────────────────────────────────────
function Sparkline({ data, color = C.accent, height = 40 }) {
  const w = 200, h = height;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * (h - 6) - 3;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="sg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pts} ${w},${h} 0,${h}`} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── BADGE ─────────────────────────────────────────────────────────────
function Badge({ children, color = C.accent, bg = C.accentSoft }) {
  return (
    <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

// ─── CARD ──────────────────────────────────────────────────────────────
function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick}
      style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, cursor: onClick ? "pointer" : "default", transition: "border-color 0.15s, box-shadow 0.15s", ...style }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 1px ${C.accent}22`; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
    >
      {children}
    </div>
  );
}

// ─── SECTION LABEL ─────────────────────────────────────────────────────
function SectionLabel({ children, action, onAction }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted }}>{children}</span>
      {action && <button onClick={onAction} style={{ background: "none", border: "none", color: C.blue, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{action}</button>}
    </div>
  );
}

// ─── FULL FORECAST PAGE ────────────────────────────────────────────────
function getSavedTrip() {
  try {
    const saved = JSON.parse(localStorage.getItem("waymark_trip"));
    if (saved?.from && saved?.to) return saved;
  } catch {}
  return { from: "Pittsburgh", to: "Yellowstone National Park" };
}

function FullForecastPage({ onBack }) {
  const [trip] = useState(getSavedTrip);
  const [days, setDays] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadForecast() {
      try {
        const res = await fetch(`/api/forecast?from=${encodeURIComponent(trip.from)}&to=${encodeURIComponent(trip.to)}`);
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setDays(data.days || []);
          setAlert(data.hasAlert ? { message: data.alertMessage, day: data.alertDay } : null);
        }
      } catch {
        setError("Forecast is unavailable right now. Check your connection.");
      } finally {
        setLoading(false);
      }
    }
    loadForecast();
  }, [trip]);

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0 16px" }}>
        <button onClick={onBack} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center" }}><ArrowLeft size={16} /></button>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: "-0.02em" }}>Full Route Forecast</div>
          <div style={{ fontSize: 12, color: C.textSub }}>{trip.from} → {trip.to} · {days.length || 6}-Day Outlook</div>
        </div>
      </div>
      {alert && (
        <div style={{ background: `linear-gradient(90deg, ${C.redSoft}, #3D1A19)`, border: `1px solid ${C.red}44`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <AlertTriangle size={18} color={C.red} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.red }}>HIGH WIND WARNING: {alert.day}</div>
            <div style={{ fontSize: 11, color: C.red, opacity: 0.8, marginTop: 2 }}>{alert.message}</div>
          </div>
        </div>
      )}
      {error && (
        <div style={{ background: C.redSoft, border: `1px solid ${C.red}33`, borderRadius: 12, padding: "12px 14px", marginBottom: 16, fontSize: 12, color: C.red }}>
          {error}
        </div>
      )}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ height: 92, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, opacity: 0.5 }} />)}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {days.map((d, i) => (
          <Card key={i} style={{ borderColor: d.alert ? `${C.red}55` : C.border, background: d.alert ? `${C.redSoft}66` : C.surface }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ color: d.alert ? C.red : C.accent, flexShrink: 0 }}>
                {d.alert ? <AlertTriangle size={18} /> : <Sun size={18} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: d.alert ? C.red : C.text }}>{d.city}</span>
                  <Badge color={d.alert ? C.red : C.muted} bg={d.alert ? C.redSoft : C.surfaceAlt}>{d.day}</Badge>
                </div>
                <div style={{ fontSize: 12, color: d.alert ? C.red : C.textSub, marginTop: 2 }}>{d.status}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: d.alert ? C.red : C.text }}>{d.temp}°</div>
                <div style={{ fontSize: 11, color: C.muted }}>Lo {d.low}°</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: d.alert ? C.red : C.textSub }}>
                <Wind size={12} /><span style={{ fontWeight: d.alert ? 700 : 400 }}>{d.wind} mph</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.textSub }}>
                <Droplets size={12} color={C.blue} /><span>{d.precip} rain</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── FULL VIBE FEED PAGE ───────────────────────────────────────────────
function FullVibePage({ onBack, rigProfile }) {
  const cats = ["All", "DIY", "Adventure", "Off-Grid", "Tips", "Routes", "Gear"];
  const [activeCat, setActiveCat] = useState("All");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const catQueries = {
    "All": "RV camping tips",
    "DIY": "RV DIY modifications",
    "Adventure": "RV adventure camping",
    "Off-Grid": "RV boondocking off grid",
    "Tips": "RV tips tricks beginners",
    "Routes": "RV road trip route",
    "Gear": "RV gear equipment",
  };

  async function fetchVideos(customSearch = "") {
    setLoading(true);
    try {
      const base = rigProfile?.make ? `${rigProfile.make} RV` : "RV";
      const query = customSearch.trim()
        ? `${base} ${customSearch}`
        : `${base} ${catQueries[activeCat]}`;
      const res = await fetch(`/api/youtube?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.videos) setVideos(data.videos);
    } catch (err) {
      console.error("Failed to load vibe feed:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVideos();
  }, [activeCat]);

  return (
    <div style={{ padding: "0 16px 100px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0 16px" }}>
        <button onClick={onBack} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center" }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: "-0.02em" }}>Vibe Feed</div>
          <div style={{ fontSize: 12, color: C.textSub }}>{loading ? "Loading..." : `${videos.length} videos`}</div>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && fetchVideos(search)}
          placeholder={`Search ${rigProfile?.make || "RV"} videos...`}
          style={{ flex: 1, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}
        />
        <button onClick={() => fetchVideos(search)}
          style={{ padding: "9px 16px", background: C.accent, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#1A0800", fontFamily: "inherit" }}>
          Search
        </button>
      </div>

      {/* Category pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
        {cats.map(c => (
          <button key={c} onClick={() => { setSearch(""); setActiveCat(c); }}
            style={{ whiteSpace: "nowrap", padding: "6px 14px", borderRadius: 20, border: `1px solid ${activeCat === c && !search ? C.accent : C.border}`, background: activeCat === c && !search ? C.accentSoft : "transparent", color: activeCat === c && !search ? C.accent : C.textSub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {c}
          </button>
        ))}
      </div>

      {/* Videos */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 76, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, opacity: 0.5 }} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {videos.map((v, i) => (
            <a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", gap: 12, padding: 12, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, textDecoration: "none", transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.blue}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              <img src={v.thumbnail} alt={v.title} style={{ width: 88, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.4, marginBottom: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{v.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Badge color={C.blue} bg={C.blueSoft}>{activeCat === "All" ? "RV" : activeCat}</Badge>
                  <span style={{ fontSize: 10, color: C.muted }}>{v.channel}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── QUICK REPLIES ─────────────────────────────────────────────────────
const QUICK_REPLIES = [
  "Flickering interior lights",
  "Find a site near Moab",
  "PA to Yellowstone route",
  "Water filter replacement",
  "Avoid low bridges",
  "Pre-trip checklist",
];

// ─── INLINE CHAT (Co-Pilot Page) ───────────────────────────────────────
function InlineChat({ rigProfile, firstTimeBuyer, prefillMessage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const prefillSent = useRef(false);
  const [mode, setMode] = useState("auto"); // auto | cloud | offline
  const { status: llmStatus, progress, progressText, load: loadLLM, generate: generateLLM } = useWebLLM();

  useEffect(() => {
    if (prefillMessage && !prefillSent.current) {
      prefillSent.current = true;
      setTimeout(() => sendMsg(prefillMessage), 300);
    }
  }, [prefillMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function sendMsg(text) {
    if (!text.trim()) return;
    const newMessages = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setInput("");
    setTyping(true);

    // Cloud (Gemini) first, unless the user forced offline mode
    if (mode !== "offline") {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ messages: newMessages, rigProfile, firstTimeBuyer }),
          signal: AbortSignal.timeout(8000), // 8 second timeout
        });
        if (!res.ok) throw new Error("Gemini failed");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setMessages(m => [...m, { role: "ai", text: data.text, source: "gemini" }]);
        setTyping(false);
        return;
      } catch (err) {
        console.warn("Gemini unavailable:", err.message);
        if (mode === "cloud") {
          setMessages(m => [...m, { role: "ai", text: "Cloud AI is unreachable right now. Check your connection, or switch to Offline mode.", source: "system" }]);
          setTyping(false);
          return;
        }
      }
    }

    // Offline (WebLLM): forced by the toggle, or automatic fallback when cloud fails
    if (llmStatus === "unsupported") {
      setMessages(m => [...m, { role: "ai", text: "Offline AI needs WebGPU, which this browser does not support. Use Chrome or Edge for offline mode, or switch back to Cloud.", source: "system" }]);
      setTyping(false);
      return;
    }
    try {
      if (llmStatus !== "ready") {
        setMessages(m => [...m, { role: "ai", text: "Loading the offline AI model. The first load downloads about 700MB and can take a few minutes. After that it is cached and starts instantly.", source: "system" }]);
        await loadLLM();
      }
      const text = await generateLLM(newMessages, rigProfile, firstTimeBuyer);
      setMessages(m => [...m, { role: "ai", text, source: "offline" }]);
    } catch (err) {
      setMessages(m => [...m, { role: "ai", text: "Unable to reach the AI. Check your internet connection or try again.", source: "system" }]);
    } finally {
      setTyping(false);
    }
  }

  function renderMessage(text) {
    text = text.replace(/```[\w]*\n?/g, "").replace(/```/g, "");
    return text.split("\n").map((line, j) => {
      if (line.startsWith("### ")) return <div key={j} style={{ fontWeight: 800, fontSize: 13, color: C.accent, marginTop: 8, marginBottom: 2 }}>{line.replace("### ", "")}</div>;
      if (line.startsWith("## ")) return <div key={j} style={{ fontWeight: 800, fontSize: 14, color: C.text, marginTop: 8, marginBottom: 2 }}>{line.replace("## ", "")}</div>;
      if (line.startsWith("# ")) return <div key={j} style={{ fontWeight: 800, fontSize: 15, color: C.text, marginTop: 8, marginBottom: 2 }}>{line.replace("# ", "")}</div>;
      if (line.startsWith("* ") || line.startsWith("- ")) return <div key={j} style={{ paddingLeft: 12, marginTop: 2 }}>{"• "}{line.replace(/^\*\s|^-\s/, "").split(/\*\*(.*?)\*\*/g).map((p, k) => k % 2 === 1 ? <strong key={k}>{p}</strong> : p)}</div>;
      if (/^\d+\.\s/.test(line)) return <div key={j} style={{ paddingLeft: 12, marginTop: 2 }}>{line.split(/\*\*(.*?)\*\*/g).map((p, k) => k % 2 === 1 ? <strong key={k}>{p}</strong> : p)}</div>;
      if (line.trim() === "") return <div key={j} style={{ height: 6 }} />;
      return <div key={j}>{line.split(/\*\*(.*?)\*\*/g).map((p, k) => k % 2 === 1 ? <strong key={k}>{p}</strong> : p)}</div>;
    });
  }

  const isEmpty = messages.length === 0 && !typing;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(1)} 40%{transform:scale(1.5)} }`}</style>

      {/* Rig badge + offline status */}
      <div style={{ padding: "12px 16px 0", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ background: C.accentSoft, border: `1px solid ${C.accent}33`, borderRadius: 8, padding: "7px 11px", display: "flex", alignItems: "center", gap: 8 }}>
          <Car size={13} color={C.accent} />
          <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>
            {rigProfile.year} {rigProfile.make} {rigProfile.model} {rigProfile.floorPlan ? `· ${rigProfile.floorPlan}` : ""} · {rigProfile.length} · {rigProfile.height}
          </span>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.green }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, display: "inline-block" }} />
            {firstTimeBuyer ? "Consultant" : "Co-Pilot"}
          </span>
        </div>

        {/* Engine mode toggle */}
        <div style={{ display: "flex", gap: 4, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3 }}>
          {[
            { key: "auto", label: "Auto" },
            { key: "cloud", label: "Cloud", icon: <Cloud size={11} /> },
            { key: "offline", label: "Offline", icon: <Zap size={11} /> },
          ].map(opt => {
            const active = mode === opt.key;
            const disabled = opt.key === "offline" && llmStatus === "unsupported";
            return (
              <button key={opt.key} onClick={() => !disabled && setMode(opt.key)} disabled={disabled}
                title={disabled ? "Offline AI needs WebGPU (Chrome or Edge)" : undefined}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "5px 0", borderRadius: 6, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, background: active ? C.accent : "transparent", color: active ? "#1A0800" : disabled ? C.border : C.textSub, opacity: disabled ? 0.6 : 1 }}>
                {opt.icon}{opt.label}
                {opt.key === "offline" && llmStatus === "ready" && (
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: active ? "#1A0800" : C.green, display: "inline-block" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Offline AI loader */}
        {llmStatus === "loading" && (
          <div style={{ background: C.blueSoft, border: `1px solid ${C.blue}33`, borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: C.blue }}><Zap size={11} /> Loading Offline AI: {progress}%</span>
              <span style={{ fontSize: 10, color: C.muted }}>First time only</span>
            </div>
            <div style={{ background: C.surface, borderRadius: 4, height: 4, overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: C.blue, borderRadius: 4, transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{progressText}</div>
          </div>
        )}

        {llmStatus === "ready" && (
          <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block" }} />
            <span style={{ fontSize: 11, color: C.muted }}>Offline AI ready: answers even with no internet</span>
          </div>
        )}

        {llmStatus === "unsupported" && (
          <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={11} color={C.muted} />
            <span style={{ fontSize: 11, color: C.muted }}>Offline AI unavailable: this browser has no WebGPU. Use Chrome or Edge.</span>
          </div>
        )}

        {/* Preload button, shown when idle */}
        {llmStatus === "idle" && (
          <button onClick={loadLLM}
            style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
            <Download size={12} color={C.muted} />
            <span style={{ fontSize: 11, color: C.muted }}>Download offline AI for emergency use</span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: C.blue, fontWeight: 600 }}>~700MB · wifi recommended</span>
          </button>
        )}
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: `linear-gradient(135deg, ${C.accent}, #C04A00)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot size={26} color="#fff" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", marginBottom: 6 }}>Waymark AI</div>
            <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.5, maxWidth: 260, margin: "0 auto" }}>
              Ask me anything about your rig — repairs, routes, campsites, maintenance.
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 340 }}>
            {QUICK_REPLIES.map((q, i) => (
              <button key={i} onClick={() => sendMsg(q)}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 20, padding: "6px 14px", color: C.textSub, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {!isEmpty && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
              {msg.role === "ai" && (
                <div style={{ width: 26, height: 26, borderRadius: 8, background: msg.source === "offline" ? `linear-gradient(135deg, ${C.blue}, #0050CC)` : `linear-gradient(135deg, ${C.accent}, #C04A00)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 2 }}>
                  <Bot size={13} color="#fff" />
                </div>
              )}
              <div style={{ maxWidth: "82%", padding: "10px 13px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "4px 14px 14px 14px", background: msg.role === "user" ? C.accent : C.surfaceAlt, color: msg.role === "user" ? "#1A0800" : C.text, fontSize: 13, lineHeight: 1.6, fontWeight: msg.role === "user" ? 600 : 400 }}>
                {renderMessage(msg.text)}
                {msg.source === "offline" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: C.blue, marginTop: 6, fontWeight: 600 }}><Zap size={9} /> OFFLINE AI</div>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, #C04A00)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bot size={13} color="#fff" />
              </div>
              <div style={{ display: "flex", gap: 4, padding: "12px 14px", background: C.surfaceAlt, borderRadius: "4px 14px 14px 14px" }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.muted, display: "inline-block", animation: `bounce 1.2s ${i*0.2}s ease infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Quick replies */}
      {!isEmpty && (
        <div style={{ padding: "8px 16px 0", display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", flexShrink: 0 }}>
          {QUICK_REPLIES.map((q, i) => (
            <button key={i} onClick={() => sendMsg(q)}
              style={{ whiteSpace: "nowrap", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 20, padding: "5px 12px", color: C.textSub, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "10px 16px 16px", display: "flex", gap: 8, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMsg(input)}
          placeholder={llmStatus === "ready" ? "Ask anything, even offline..." : "Ask Waymark anything about your rig..."}
          style={{ flex: 1, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}
        />
        <button onClick={() => sendMsg(input)}
          style={{ width: 42, height: 42, borderRadius: 10, background: C.accent, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Send size={16} color="#1A0800" />
        </button>
      </div>
    </div>
  );
}

// ─── NHTSA MODEL PICKER ────────────────────────────────────────────────
function NHTSAModelPicker({ rigProfile, setRigProfile }) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!rigProfile.make || !rigProfile.year) return;
    setLoading(true);
    fetch(`/api/rig-models?make=${encodeURIComponent(rigProfile.make)}&year=${rigProfile.year}`)
      .then(r => r.json())
      .then(data => { setModels(data.models || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [rigProfile.make, rigProfile.year]);

  return (
    <div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontWeight: 700, textTransform: "uppercase" }}>
        Model {loading && <span style={{ fontWeight: 400 }}>· loading...</span>}
      </div>
      <select value={rigProfile.model} onChange={e => setRigProfile(p => ({ ...p, model: e.target.value }))}
        disabled={!rigProfile.make || loading}
        style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", appearance: "none", opacity: (!rigProfile.make || loading) ? 0.5 : 1 }}>
        <option value="">Select a model...</option>
        {models.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      {rigProfile.make && !loading && models.length === 0 && (
        <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>No models found — try a different year</div>
      )}
    </div>
  );
}

// ─── PROFILE TAB ───────────────────────────────────────────────────────
function ProfileTab({ rigProfile, setRigProfile, firstTimeBuyer, setFirstTimeBuyer }) {
  const subs = ["Harvest Hosts", "KOA", "Thousand Trails", "Good Sam", "Boondockers Welcome", "Passport America", "RV Trip Wizard", "Campendium Pro"];
  return (
    <div style={{ padding: "0 16px 140px", display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ background: firstTimeBuyer ? C.accentSoft : C.surface, borderColor: firstTimeBuyer ? C.accent : C.border, marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>First-Time Buyer Mode</div>
            <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>Switches AI to Consultant Mode</div>
          </div>
          <button onClick={() => setFirstTimeBuyer(f => !f)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            {firstTimeBuyer ? <ToggleRight size={32} color={C.accent} /> : <ToggleLeft size={32} color={C.muted} />}
          </button>
        </div>
        {firstTimeBuyer && (
          <div style={{ marginTop: 10, padding: "8px 10px", background: "#00000033", borderRadius: 8, fontSize: 12, color: C.accent }}>
            Consultant Mode: AI explains terminology and gives beginner-friendly recommendations.
          </div>
        )}
      </Card>

      <div>
        <SectionLabel>Rig Profile</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontWeight: 700, textTransform: "uppercase" }}>Year</div>
            <select value={rigProfile.year} onChange={e => setRigProfile(p => ({ ...p, year: e.target.value, model: "" }))}
              style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", appearance: "none" }}>
              {Array.from({ length: 17 }, (_, i) => String(2026 - i)).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontWeight: 700, textTransform: "uppercase" }}>Make</div>
            <select value={rigProfile.make} onChange={e => setRigProfile(p => ({ ...p, make: e.target.value, model: "" }))}
              style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", appearance: "none" }}>
              <option value="">Select a brand...</option>
              {["Airstream","Coachmen","CrossRoads","DRV","Entegra","Fleetwood","Forest River","Grand Design","Gulf Stream","Heartland","Jayco","Keystone","Lance","Newmar","Northwood","NuWa","Palomino","Prime Time","Shasta","Starcraft","Thor Motor Coach","Tiffin","Venture","Winnebago"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <NHTSAModelPicker rigProfile={rigProfile} setRigProfile={setRigProfile} />
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontWeight: 700, textTransform: "uppercase" }}>Floor Plan</div>
            <input value={rigProfile.floorPlan || ""} onChange={e => setRigProfile(p => ({ ...p, floorPlan: e.target.value }))}
              placeholder="e.g. 295RL, 21BHE, 310RLS"
              style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Found on your window sticker or manufacturer's website</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontWeight: 700, textTransform: "uppercase" }}>Length</div>
              <input value={rigProfile.length} onChange={e => setRigProfile(p => ({ ...p, length: e.target.value }))}
                placeholder="e.g. 29'11&quot;"
                style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontWeight: 700, textTransform: "uppercase" }}>Height</div>
              <input value={rigProfile.height} onChange={e => setRigProfile(p => ({ ...p, height: e.target.value }))}
                placeholder="e.g. 11'0&quot;"
                style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          {rigProfile.make && rigProfile.model && (
            <div style={{ background: C.accentSoft, border: `1px solid ${C.accent}33`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <Car size={20} color={C.accent} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>
                  {rigProfile.year} {rigProfile.make} {rigProfile.model} {rigProfile.floorPlan}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                  {rigProfile.length && rigProfile.height ? `${rigProfile.length} · ${rigProfile.height} tall` : "Add length and height"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <SectionLabel>Subscriptions</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {subs.map(s => {
            const active = rigProfile.subs.includes(s);
            return (
              <button key={s}
                onClick={() => setRigProfile(p => ({ ...p, subs: active ? p.subs.filter(x => x !== s) : [...p.subs, s] }))}
                style={{ padding: "9px 16px", borderRadius: 22, border: `1px solid ${active ? C.accent : C.border}`, background: active ? C.accentSoft : "transparent", color: active ? C.accent : C.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {rigProfile.subs.length > 0 && (
        <div style={{ background: C.greenSoft, border: `1px solid ${C.green}33`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 4 }}>Active Memberships ({rigProfile.subs.length})</div>
          <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.6 }}>{rigProfile.subs.join(" · ")}</div>
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────
function Dashboard({ goToCopilot, openForecast, openVibeFeed, rigProfile }) {
  const [vibeItems, setVibeItems] = useState([
    { title: "Loading your feed...", channel: "", tag: "Tips", url: null },
    { title: "Loading your feed...", channel: "", tag: "DIY", url: null },
  ]);
  const [vibeLoading, setVibeLoading] = useState(false);

  async function loadVideos() {
    setVibeLoading(true);
    try {
      const query = `${rigProfile.make} ${rigProfile.model} RV camping`;
      const res = await fetch(`/api/youtube?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.videos && data.videos.length > 0) {
        const tags = ["Tips", "DIY", "Adventure", "Off-Grid", "Routes", "Gear"];
        setVibeItems(data.videos.slice(0, 3).map((v, i) => ({
          title: v.title, channel: v.channel, thumb: v.thumbnail,
          tag: tags[i % tags.length], url: v.url, isReal: true,
        })));
      }
    } catch (err) {
      console.error("Failed to load videos:", err);
    } finally {
      setVibeLoading(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, [rigProfile.make, rigProfile.model]);

  // Trip route for weather, persisted per device
  const [trip, setTrip] = useState(getSavedTrip);
  const [tripDraft, setTripDraft] = useState(null); // null = not editing
  const [weatherPoints, setWeatherPoints] = useState(
    Array.from({ length: 5 }, () => ({ city: "...", temp: "--", wind: "--", status: "Loading", alert: false }))
  );
  const [weatherAlert, setWeatherAlert] = useState({ hasAlert: false, message: "" });
  const [weatherError, setWeatherError] = useState("");

  useEffect(() => {
    async function loadWeather() {
      setWeatherError("");
      try {
        const res = await fetch(`/api/weather?from=${encodeURIComponent(trip.from)}&to=${encodeURIComponent(trip.to)}`);
        const data = await res.json();
        if (data.error) {
          setWeatherError(data.error);
        } else if (data.weatherPoints) {
          setWeatherPoints(data.weatherPoints);
          setWeatherAlert({ hasAlert: data.hasAlert, message: data.alertMessage || "" });
        }
      } catch (err) {
        console.error("Failed to load weather:", err);
        setWeatherError("Weather is unavailable right now.");
      }
    }
    loadWeather();
  }, [trip]);

  function saveTrip() {
    if (!tripDraft?.from?.trim() || !tripDraft?.to?.trim()) return;
    const next = { from: tripDraft.from.trim(), to: tripDraft.to.trim() };
    setTrip(next);
    setTripDraft(null);
    try { localStorage.setItem("waymark_trip", JSON.stringify(next)); } catch {}
  }

  const actions = [
    { label: "Fix Issue", icon: <Wrench size={16} />, color: C.accent, prompt: "I need help diagnosing an issue with my RV" },
    { label: "Plan Route", icon: <Navigation size={16} />, color: C.blue, prompt: "Help me plan a route for my upcoming trip" },
    { label: "Find Site", icon: <Tent size={16} />, color: C.green, prompt: "Help me find a great campsite for my rig" },
  ];

  return (
    <div style={{ padding: "0 20px 100px", display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ paddingTop: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.03em" }}>
          {(() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; })()}
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{rigProfile.year} {rigProfile.make} · {trip.from} → {trip.to}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {actions.map(a => (
          <button key={a.label} onClick={() => goToCopilot(a.prompt)}
            style={{ padding: "16px 6px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 9, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = `${a.color}11`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${a.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: a.color }}>
              {a.icon}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.textSub, letterSpacing: "0.01em" }}>{a.label}</span>
          </button>
        ))}
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Route Weather</span>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setTripDraft(tripDraft ? null : { ...trip })} style={{ background: "none", border: "none", color: C.blue, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              {tripDraft ? "Cancel" : "Edit Trip"}
            </button>
            <button onClick={openForecast} style={{ background: "none", border: "none", color: C.blue, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Full Forecast →</button>
          </div>
        </div>
        {tripDraft && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input value={tripDraft.from} onChange={e => setTripDraft(d => ({ ...d, from: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && saveTrip()} placeholder="From (city)"
              style={{ flex: 1, minWidth: 0, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
            <input value={tripDraft.to} onChange={e => setTripDraft(d => ({ ...d, to: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && saveTrip()} placeholder="To (city or park name)"
              style={{ flex: 1, minWidth: 0, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
            <button onClick={saveTrip}
              style={{ background: C.accent, border: "none", borderRadius: 8, padding: "8px 14px", color: "#1A0800", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
          </div>
        )}
        {weatherError && (
          <div style={{ background: C.redSoft, border: `1px solid ${C.red}33`, borderRadius: 10, padding: "9px 12px", marginBottom: 10, fontSize: 12, color: C.red }}>
            {weatherError}
          </div>
        )}
        {weatherAlert.hasAlert && (
          <div onClick={() => goToCopilot(`reroute around weather warning: ${weatherAlert.message}`)}
            style={{ display: "flex", alignItems: "center", gap: 10, background: C.redSoft, border: `1px solid ${C.red}33`, borderRadius: 12, padding: "11px 14px", marginBottom: 10, cursor: "pointer" }}>
            <AlertTriangle size={15} color={C.red} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.red }}>{weatherAlert.message}</div>
              <div style={{ fontSize: 11, color: `${C.red}BB`, marginTop: 1 }}>Tap to reroute</div>
            </div>
            <ChevronRight size={14} color={C.red} />
          </div>
        )}
        <div style={{ display: "flex", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          {weatherPoints.map((pt, i) => (
            <div key={i} style={{ flex: 1, padding: "12px 4px", textAlign: "center", borderRight: i < weatherPoints.length - 1 ? `1px solid ${C.border}` : "none", background: pt.alert ? `${C.red}0D` : "transparent" }}>
              <div style={{ fontSize: 9, color: pt.alert ? C.red : C.muted, fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>{pt.city}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: pt.alert ? C.red : C.text }}>{pt.temp}°</div>
              <div style={{ fontSize: 9, color: pt.alert ? `${C.red}99` : C.muted, marginTop: 2 }}>{pt.wind}mph</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Vibe Feed {vibeLoading && <span style={{ fontWeight: 400, fontSize: 11 }}>· loading...</span>}
          </span>
          <button onClick={openVibeFeed} style={{ background: "none", border: "none", color: C.blue, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Browse All →</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {vibeItems.map((v, i) => (
            <a key={i} href={v.url || "#"} target={v.url ? "_blank" : "_self"} rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, textDecoration: "none", transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.blue}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              {v.isReal ? (
                <img src={v.thumb} alt={v.title} style={{ width: 80, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 10, background: C.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${C.border}` }}><Compass size={18} color={C.muted} /></div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 4 }}>{v.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Badge color={C.blue} bg={C.blueSoft}>{v.tag}</Badge>
                  <span style={{ fontSize: 10, color: C.muted }}>{v.channel}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EXPLORE PAGE ──────────────────────────────────────────────────────
function ExplorePage({ goToCopilot, rigProfile }) {
  const [trip] = useState(getSavedTrip);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSpots() {
      try {
        const res = await fetch(`/api/campsites?near=${encodeURIComponent(trip.to)}&limit=8`);
        const data = await res.json();
        if (data.error) setError("Could not load campgrounds right now.");
        else setSpots(data.campgrounds || []);
      } catch {
        setError("Could not load campgrounds. Check your connection.");
      } finally {
        setLoading(false);
      }
    }
    loadSpots();
  }, [trip]);

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", marginBottom: 4 }}>Explore <span style={{ color: C.blue }}>↗</span></div>
      <div style={{ fontSize: 13, color: C.textSub, marginBottom: 16 }}>Campgrounds near {trip.to} · <span style={{ color: C.blue }}>Tap any to get AI trip info</span></div>
      {error && (
        <div style={{ background: C.redSoft, border: `1px solid ${C.red}33`, borderRadius: 12, padding: "12px 14px", marginBottom: 16, fontSize: 12, color: C.red }}>{error}</div>
      )}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ height: 140, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, opacity: 0.5 }} />)}
        </div>
      )}
      {!loading && !error && spots.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted, fontSize: 13 }}>
          No campgrounds found near {trip.to}. Set a different trip destination on the Home tab, or search the Sites tab directly.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {spots.map((s, i) => (
          <Card key={s.id || i} onClick={() => goToCopilot(`Tell me about ${s.name} campground for my ${rigProfile?.year} ${rigProfile?.make} ${rigProfile?.model}. Is it a good fit for my rig, and what is there to do nearby?`)} style={{ padding: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: C.blueSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <Tent size={16} color={C.blue} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 5, lineHeight: 1.3 }}>{s.name}</div>
            <Badge color={C.blue} bg={C.blueSoft}>{s.state || "US"}</Badge>
            {s.reservable && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11, color: C.green }}>
                <Star size={10} color={C.green} fill={C.green} />Reservable
              </div>
            )}
            <div style={{ marginTop: 8, fontSize: 10, color: C.blue, fontWeight: 600 }}>Tap for AI trip info →</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────
export default function App({ user }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("home");
  const [subPage, setSubPage] = useState(null);
  const [copilotPrefill, setCopilotPrefill] = useState(null);
  const [copilotKey, setCopilotKey] = useState(0);
  const [firstTimeBuyer, setFirstTimeBuyer] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [rigProfile, setRigProfile] = useState({
    year: "2024", make: "Grand Design", model: "Imagine XLS 21BHE",
    floorPlan: "21BHE", length: "29'11\"", height: "11'0\"",
    subs: ["Harvest Hosts", "KOA"],
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data && !error) {
        setRigProfile({
          year: data.year || "2024",
          make: data.make || "Grand Design",
          model: data.model || "Imagine XLS 21BHE",
          floorPlan: data.floor_plan || "",
          length: data.length || "29'11\"",
          height: data.height || "11'0\"",
          subs: data.subs || ["Harvest Hosts", "KOA"],
        });
        setFirstTimeBuyer(data.first_time_buyer || false);
      }
      setProfileLoading(false);
    }
    loadProfile();
  }, [user]);

  useEffect(() => {
    async function saveProfile() {
      if (!user || profileLoading) return;
      await supabase.from("profiles").upsert({
        id: user.id,
        year: rigProfile.year, make: rigProfile.make, model: rigProfile.model,
        floor_plan: rigProfile.floorPlan, length: rigProfile.length, height: rigProfile.height,
        subs: rigProfile.subs, first_time_buyer: firstTimeBuyer,
        updated_at: new Date().toISOString(),
      });
    }
    saveProfile();
  }, [rigProfile, firstTimeBuyer]);

  function goToCopilot(prefill = null) {
    setCopilotPrefill(prefill);
    setCopilotKey(k => k + 1);
    setTab("copilot");
    setSubPage(null);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const navItems = [
    { key: "home", icon: <Home size={20} />, label: "Home" },
    { key: "copilot", icon: <Bot size={20} />, label: "Co-Pilot" },
    { key: "sites", icon: <Tent size={20} />, label: "Sites" },
    { key: "explore", icon: <Compass size={20} />, label: "Explore" },
    { key: "profile", icon: <User size={20} />, label: "Rig" },
  ];

  if (profileLoading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.accent, fontSize: 14, fontFamily: "system-ui" }}>Loading your rig...</div>
      </div>
    );
  }

  // ── CONTENT ────────────────────────────────────────────────────────
  const content = (
    <>
      {tab === "home" && !subPage && <Dashboard goToCopilot={goToCopilot} openForecast={() => setSubPage("forecast")} openVibeFeed={() => setSubPage("vibefeed")} rigProfile={rigProfile} />}
      {tab === "home" && subPage === "forecast" && <FullForecastPage onBack={() => setSubPage(null)} />}
      {tab === "home" && subPage === "vibefeed" && <FullVibePage onBack={() => setSubPage(null)} rigProfile={rigProfile} />}
      {tab === "explore" && <ExplorePage goToCopilot={goToCopilot} rigProfile={rigProfile} />}
      {tab === "sites" && <CampsiteSearch rigProfile={rigProfile} openChat={goToCopilot} />}
      {tab === "copilot" && (
        <div style={{ height: isMobile ? "calc(100vh - 130px)" : "calc(100vh - 60px)", display: "flex", flexDirection: "column" }}>
          <InlineChat key={copilotKey} rigProfile={rigProfile} firstTimeBuyer={firstTimeBuyer} prefillMessage={copilotPrefill} />
        </div>
      )}
      {tab === "profile" && <ProfileTab rigProfile={rigProfile} setRigProfile={setRigProfile} firstTimeBuyer={firstTimeBuyer} setFirstTimeBuyer={setFirstTimeBuyer} />}
    </>
  );

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>
        {/* Top bar */}
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: `${C.bg}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {subPage && (
              <button onClick={() => setSubPage(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 4 }}>
                <ArrowLeft size={18} />
              </button>
            )}
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, #C04A00)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Navigation size={14} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em", color: C.text }}>waymark</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => goToCopilot("Show me my current rig alerts")} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center" }}>
              <Bell size={15} />
            </button>
            <button onClick={handleSignOut} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center" }}>
              <User size={15} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div>{content}</div>

        {/* Bottom Nav */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: `${C.bg}F8`, backdropFilter: "blur(16px)", borderTop: `1px solid ${C.border}`, display: "flex", padding: "8px 0 20px", zIndex: 49 }}>
          {navItems.map(n => {
            const active = tab === n.key;
            return (
              <button key={n.key} onClick={() => { setSubPage(null); setTab(n.key); }}
                style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0", fontFamily: "inherit" }}>
                <div style={{ color: active ? C.accent : C.muted, transition: "color 0.15s" }}>{n.icon}</div>
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? C.accent : C.muted }}>{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── DESKTOP LAYOUT ────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: C.bg, minHeight: "100vh", color: C.text, display: "flex" }}>

      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50 }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, #C04A00)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Navigation size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", color: C.text }}>waymark</span>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map(n => {
            const active = tab === n.key;
            return (
              <button key={n.key} onClick={() => { setSubPage(null); setTab(n.key); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: "none", background: active ? C.accentSoft : "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "background 0.15s", width: "100%" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.surfaceAlt; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ color: active ? C.accent : C.muted }}>{n.icon}</div>
                <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? C.accent : C.textSub }}>{n.label}</span>
              </button>
            );
          })}
        </div>

        {/* Rig summary + sign out */}
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}` }}>
          {rigProfile.make && (
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600, color: C.textSub }}>{rigProfile.year} {rigProfile.make}</div>
              <div>{rigProfile.model} {rigProfile.floorPlan}</div>
              <div>{rigProfile.length} · {rigProfile.height}</div>
            </div>
          )}
          <button onClick={handleSignOut}
            style={{ width: "100%", padding: "8px 12px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
            <User size={14} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Top bar */}
        <div style={{ position: "sticky", top: 0, zIndex: 40, background: `${C.bg}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {subPage && (
              <button onClick={() => setSubPage(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 4 }}>
                <ArrowLeft size={18} />
              </button>
            )}
            <span style={{ fontWeight: 700, fontSize: 16, color: C.textSub }}>
              {navItems.find(n => n.key === tab)?.label}
              {subPage === "forecast" && " · Full Forecast"}
              {subPage === "vibefeed" && " · Vibe Feed"}
            </span>
          </div>
          <button onClick={() => goToCopilot("Show me my current rig alerts")}
            style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "inherit" }}>
            <Bell size={15} />
            Alerts
          </button>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, maxWidth: 900, width: "100%", margin: "0 auto", padding: "0 24px" }}>
          {content}
        </div>
      </div>
    </div>
  );
}