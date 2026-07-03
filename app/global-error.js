"use client";

// Catches errors thrown in the root layout itself, which app/error.js cannot.
// Must render its own <html>/<body> since the layout may have failed.

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Unhandled layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#0D1117", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif", color: "#E6EDF3" }}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Waymark failed to load</div>
          <div style={{ fontSize: 13, color: "#8B949E", marginBottom: 24 }}>Something went wrong before the app could start.</div>
          <button onClick={reset}
            style={{ padding: "12px 20px", background: "#F97316", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, color: "#1A0800" }}>
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
