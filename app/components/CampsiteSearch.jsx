"use client";

import { useState } from "react";
import { Search, ExternalLink, MapPin, Phone } from "lucide-react";

const C = {
  bg: "#0D1117",
  surface: "#161B22",
  surfaceAlt: "#1C2330",
  border: "#30363D",
  accent: "#F97316",
  accentSoft: "#2D1508",
  green: "#3FB950",
  greenSoft: "#0D2116",
  blue: "#58A6FF",
  blueSoft: "#0C1C2D",
  muted: "#7D8590",
  text: "#E6EDF3",
  textSub: "#8B949E",
  red: "#F85149",
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

export default function CampsiteSearch({ rigProfile, openChat }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("PA");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const rigLength = parseInt(rigProfile?.length) || 30;
      const res = await fetch(
        `/api/campsites?query=${encodeURIComponent(query)}&state=${state}&rigLength=${rigLength}`
      );
      const data = await res.json();

      if (data.error) {
        setError("Search failed. Please try again.");
        setResults([]);
      } else {
        setResults(data.campgrounds || []);
      }
    } catch (err) {
      setError("Search failed. Check your connection.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "20px 16px 100px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", marginBottom: 4 }}>
          Find a Campsite
        </div>
        <div style={{ fontSize: 13, color: C.textSub }}>
          Searching federal campgrounds via Recreation.gov
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder='e.g. "Yellowstone", "Adirondack", "beach"'
          aria-label="Search campgrounds"
          style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: C.text, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={state}
            onChange={e => setState(e.target.value)}
            aria-label="State"
            style={{ flex: 1, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: "inherit" }}
          >
            {US_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{ padding: "10px 20px", background: C.accent, border: "none", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, color: "#1A0800", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Search size={15} color="#1A0800" />
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Rig fit notice */}
      {rigProfile && (
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 16, padding: "8px 12px", background: C.surfaceAlt, borderRadius: 8, border: `1px solid ${C.border}` }}>
          Your rig: <strong style={{ color: C.accent }}>{rigProfile.length}</strong>. Use Ask Waymark AI on any result to check whether it fits.
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ fontSize: 13, color: C.red, background: "#2D0E0D", border: `1px solid ${C.red}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Results */}
      {searched && !loading && results.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted, fontSize: 13 }}>
          No campgrounds found. Try a different search term or state.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {results.map((c, i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>

            {/* Name + reservable badge */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{c.name}</div>
              {c.reservable && (
                <span style={{ background: C.greenSoft, color: C.green, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>
                  Reservable
                </span>
              )}
            </div>

            {/* Description */}
            <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5, marginBottom: 12 }}>
              {c.description}
            </div>

            {/* Meta row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              {c.state && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.muted }}>
                  <MapPin size={11} />
                  {c.state}
                </div>
              )}
              {c.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.muted }}>
                  <Phone size={11} />
                  {c.phone}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => openChat(`Tell me about ${c.name} campground for my ${rigProfile?.year} ${rigProfile?.make} ${rigProfile?.model}. Is it a good fit for my rig?`)}
                style={{ flex: 1, padding: "8px", background: C.accentSoft, border: `1px solid ${C.accent}33`, borderRadius: 8, color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                Ask Waymark AI
              </button>
              
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, padding: "8px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textSub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
              >
                <ExternalLink size={12} />
                Reserve
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}