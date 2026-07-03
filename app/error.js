"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

const C = {
  bg: "#0D1117",
  surface: "#161B22",
  border: "#30363D",
  accent: "#F97316",
  red: "#F85149",
  text: "#E6EDF3",
  textSub: "#8B949E",
};

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#2D0E0D", border: `1px solid ${C.red}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <AlertTriangle size={26} color={C.red} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>Something went wrong</div>
        <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6, marginBottom: 24 }}>
          Waymark hit an unexpected error. This does not affect your saved rig profile or trip data.
        </div>
        <button onClick={reset}
          style={{ width: "100%", padding: "12px", background: C.accent, border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, color: "#1A0800", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <RotateCcw size={15} />
          Try Again
        </button>
      </div>
    </div>
  );
}
