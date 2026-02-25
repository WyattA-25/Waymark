"use client";

import { useState, useRef, useEffect } from "react";
import {
  Wind, Cloud, Droplets, AlertTriangle,
  Wrench, Navigation, User, Home,
  TrendingUp, TrendingDown,
  Map, Star, Bell, X, Send, MessageSquare,
  Tent, Car,
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
function FullForecastPage({ onBack }) {
  const days = [
    { day: "Today", city: "Pittsburgh, PA", temp: 62, low: 48, wind: 12, precip: "10%", status: "Clear", alert: false },
    { day: "Day 2", city: "Columbus, OH", temp: 58, low: 44, wind: 19, precip: "25%", status: "Partly Cloudy", alert: false },
    { day: "Day 3", city: "St. Louis, MO", temp: 71, low: 55, wind: 8, precip: "5%", status: "Clear & Warm", alert: false },
    { day: "Day 4", city: "Kansas City, MO", temp: 67, low: 51, wind: 22, precip: "35%", status: "Scattered Showers", alert: false },
    { day: "Day 5", city: "Casper, WY", temp: 44, low: 31, wind: 52, precip: "15%", status: "HIGH WIND WARNING", alert: true },
    { day: "Day 6", city: "Yellowstone, WY", temp: 38, low: 28, wind: 34, precip: "20%", status: "Gusts Possible", alert: false },
  ];
  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0 16px" }}>
        <button onClick={onBack} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center" }}><ArrowLeft size={16} /></button>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: "-0.02em" }}>Full Route Forecast</div>
          <div style={{ fontSize: 12, color: C.textSub }}>PA → Yellowstone · 6-Day Outlook</div>
        </div>
      </div>
      <div style={{ background: `linear-gradient(90deg, ${C.redSoft}, #3D1A19)`, border: `1px solid ${C.red}44`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <AlertTriangle size={18} color={C.red} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.red }}>HIGH WIND WARNING — Day 5</div>
          <div style={{ fontSize: 11, color: C.red, opacity: 0.8, marginTop: 2 }}>52mph gusts near Casper, WY. Consider delaying or rerouting.</div>
        </div>
      </div>
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
function FullVibePage({ onBack }) {
  const cats = ["All", "DIY", "Adventure", "Off-Grid", "Tips", "Routes", "Gear"];
  const [activeCat, setActiveCat] = useState("All");
  const items = [
    { title: "Kayaking the Tetons — Summer 2024 Highlights", channel: "PaddleNomad", views: "142K", dur: "18:32", thumb: "🏔️", tag: "Adventure", likes: "4.2K" },
    { title: "Grand Design 2600RB Full Solar Upgrade Build", channel: "VoltageVanlife", views: "89K", dur: "24:15", thumb: "⚡", tag: "DIY", likes: "2.1K" },
    { title: "Boondocking Joshua Tree: 7 Days Off-Grid", channel: "DustRoads", views: "203K", dur: "31:07", thumb: "🌵", tag: "Off-Grid", likes: "8.7K" },
    { title: "Top 5 Mistakes First-Time RVers Make", channel: "Campfire Counsel", views: "511K", dur: "12:49", thumb: "🔥", tag: "Tips", likes: "14.3K" },
    { title: "Water Filter Bypass Mod — Grand Design Imagine", channel: "DIY RV Life", views: "34K", dur: "9:22", thumb: "🔧", tag: "DIY", likes: "1.2K" },
    { title: "Best Full-Timer Routes in the Mountain West", channel: "RollingSagebrush", views: "77K", dur: "21:11", thumb: "🗺️", tag: "Routes", likes: "3.4K" },
    { title: "Budget Gear for Your First Season", channel: "Campfire Counsel", views: "198K", dur: "15:55", thumb: "🎒", tag: "Gear", likes: "6.8K" },
    { title: "Solo Camping the Adirondacks in a 30ft Trailer", channel: "PaddleNomad", views: "61K", dur: "28:44", thumb: "🌲", tag: "Adventure", likes: "2.9K" },
  ];
  const filtered = activeCat === "All" ? items : items.filter(i => i.tag === activeCat);
  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0 16px" }}>
        <button onClick={onBack} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center" }}><ArrowLeft size={16} /></button>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: "-0.02em" }}>Vibe Feed</div>
          <div style={{ fontSize: 12, color: C.textSub }}>Curated for your Grand Design setup</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setActiveCat(c)}
            style={{ whiteSpace: "nowrap", padding: "6px 14px", borderRadius: 20, border: `1px solid ${activeCat === c ? C.accent : C.border}`, background: activeCat === c ? C.accentSoft : "transparent", color: activeCat === c ? C.accent : C.textSub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
            {c}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((v, i) => (
          <Card key={i} style={{ display: "flex", gap: 12, padding: 12 }}>
            <div style={{ width: 88, height: 56, background: `linear-gradient(135deg, #1C2330, #2D3748)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, border: `1px solid ${C.border}` }}>
              {v.thumb}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.4, marginBottom: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{v.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <Badge color={C.blue} bg={C.blueSoft}>{v.tag}</Badge>
                <span style={{ fontSize: 10, color: C.muted }}>{v.channel}</span>
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>{v.views} views · 👍 {v.likes} · ⏱ {v.dur}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── AI RESPONSES ──────────────────────────────────────────────────────
const CHAT_OPENER = "Hey! I'm Waymark — your RV co-pilot. I know your 2024 Grand Design Imagine XLS 21BHE inside and out. Ask me anything: routes, campsites, repairs, or what to do when something breaks at mile 400.";

const QUICK_REPLIES = [
  "Flickering interior lights",
  "Kayaking in Adirondacks",
  "Find a site near Moab",
  "PA to Yellowstone route",
  "Water filter replacement",
  "Avoid low bridges",
];

const RESPONSES = {
  "flickering": "Based on your rig profile (2024 Grand Design, 29'11\"), intermittent interior light flickering is a classic symptom of a **failing 12V converter**—specifically the WFCO 8955PEC in your model.\n\n🔍 **Diagnosis:**\n• Converter output drops below 13.2V under load\n• Often triggers when running multiple 12V circuits simultaneously\n\n🔧 **Fix:**\n1. Test with a multimeter at the converter terminals (should read 13.5–14.5V)\n2. Check for loose wire at the distribution panel (Panel B, bay 2 on your layout)\n3. If voltage is low → converter replacement: **~$180 part + 2 hrs labor**\n\nWant me to find mobile RV techs within 30 miles of your current location?",
  "kayak": "Great choice! For a **30ft trailer** in the Adirondacks, tight mountain roads require careful planning.\n\n📍 **Basecamp Recommendation:**\n**Limekiln Lake Campground** (Inlet, NY)\n• 50-amp full hookups ✓\n• Max rig length: 35ft ✓\n• Water access: direct lake launch 🚣\n• Distance to best kayak waters: 0–8 miles\n\n🛶 **Top 3 Paddle Routes from Base:**\n1. **Limekiln Lake Loop** (easy, 4mi, your front yard)\n2. **Seventh Lake Chain** (moderate, 12mi)\n3. **Raquette Lake** (stunning, drive 18mi)\n\n⚠️ **Routing Alert:** Avoid NY-28N past Blue Mountain Lake—two bridges with 11'6\" clearance (your rig is 11'0\"—tight but passable, recommend daylight only).\n\nShall I build the full turn-by-turn route with height warnings?",
  "limekiln": "Limekiln Lake is a **perfect basecamp** for your 2024 Grand Design (29'11\")!\n\n📍 **Limekiln Lake Campground, Inlet NY**\n• Pull-through sites up to 40ft ✓\n• 30/50-amp electric + water hookups\n• Direct lake access — launch your kayak from camp\n• $35–45/night · Reservable on ReserveAmerica\n\n🚣 **From Your Doorstep:**\nThe lake is calm and shallow — ideal for all skill levels. The full loop is 4 miles with stunning Adirondack views. Sunrise paddles here are legendary.\n\n🗺 **Nearby Highlights:**\n• Seventh Lake (3mi) — deeper, more remote paddling\n• Old Forge Town (12mi) — resupply, restaurants, brew pub\n• Moose River Plains (8mi) — boondocking option for extra nights\n\n⛽ **Nearest Propane:** Old Forge Hardware, 11.2mi\n\nWant me to build a full driving route from State College, PA with rig-safe roads only?",
  "shenandoah": "**Shenandoah NP** is stunning but requires some planning for a 29'11\" rig!\n\n⚠️ **Rig Alert:** Skyline Drive has a **13' clearance** at several tunnel sections — you're fine at 11'0\" but watch mile markers 20.8 and 33.2.\n\n📍 **Best Campgrounds for Your Setup:**\n• **Mathews Arm** — Pull-throughs up to 35ft, electric hookups, $30/night\n• **Big Meadows** — Most popular, reservations fill fast, 30-amp available\n• **Lewis Mountain** — Smaller, quieter, accepts trailers\n\n🥾 **Top Trails from Base:**\n1. **Hawksbill Summit** (2.9mi RT) — highest peak in the park\n2. **Dark Hollow Falls** (1.4mi RT) — easiest waterfall hike\n3. **Stony Man** (1.6mi RT) — panoramic views\n\nShall I check availability for your dates?",
  "delaware": "**Delaware Water Gap** is one of the best quick escapes for RVers near PA!\n\n📍 **Top Site for Your Rig:**\n**Dingmans Campground** — Private, 50-amp, pull-throughs to 45ft. $55/night with full hookups.\n\n🌊 **Paddling & Hiking:**\n• **Delaware River** — Class I–II flatwater, great for a 6-mile float\n• **Dingmans Falls Trail** (1mi) — two waterfalls, easy, gorgeous\n• **Appalachian Trail** crosses nearby — day hike from camp\n\n📏 **Route Note:** I-80 into the gap is unrestricted for your height. Avoid Old Mine Road after mile 8 — narrow and unpaved.\n\nWant a full itinerary for a 3-day weekend?",
  "assateague": "**Assateague Island** — wild ponies, ocean beach, and serious boondocking vibes!\n\n⚠️ **Rig Note:** NPS hook-up sites max at **36ft** — you're good. The road is flat and sand-packed. Check tire pressure before you go.\n\n🐎 **What to Know:**\n• Wild ponies WILL approach your rig — secure all food\n• Ocean-side sites are exposed — bring your wind stakes!\n• Maryland side (Assateague SP) has electric hookups\n\n🏖 **Activities:**\n• Surf fishing right from your site\n• Kayaking the back-bay channels (calm, wildlife-rich)\n• Swimming — lifeguarded beach in summer\n\nWant me to check availability on Recreation.gov?",
  "allegany": "**Allegany State Park** is a classic Northeastern gem — huge park with great amenities!\n\n📍 **Recommended:** Red House District — larger sites, 30/50-amp hookups, pull-throughs available\n\nYour 29'11\" fits comfortably. Electric sites run $30–42/night.\n\n🌲 **What to Do:**\n• 85 miles of hiking trails\n• **ASP Lake** — kayak rentals, calm flatwater\n• Thunder Rocks — massive boulders, easy walk from camp\n\n🍺 **Local Extras:**\n• Southern Tier Brewing (Salamanca, 8mi)\n• Seneca Nation lands nearby — unique cultural sites\n\nShall I build a route from State College with fuel and dump station stops?",
  "promised": "**Promised Land State Park** is basically in your backyard — perfect for a quick weekend escape!\n\n📍 **Site Recommendation:**\nPine Lake Camp Area — largest sites, 30-amp hookups, wooded and private. $28/night.\n\n⚠️ **Rig Note:** Some loop roads are tight — request a pull-through when you reserve.\n\n🏊 **Activities:**\n• Swimming at two lakes (Promised Land + Lower Lake)\n• Kayak/canoe rentals on-site\n• 30+ miles of hiking trails — Bruce Lake Trail is a highlight\n• Only 85mi from State College — leave Friday after work!\n\nWant me to pre-fill a 3-night route with grocery stops on the way?",
  "tire": "Good call staying on top of tire pressure — the #1 overlooked RV safety item!\n\n🔧 **For your 2024 Grand Design Imagine XLS:**\n\n**Recommended PSI:**\n• Front axle: **80 PSI** (cold inflation)\n• Rear axle: **80 PSI** (may go to 90 if near max load)\n• Spare: **80 PSI** (always keep at max)\n\n**Check Frequency:**\n• Before every trip (cold, before driving)\n• After any overnight below 32°F (PSI drops ~1lb per 10°F)\n\n💡 **Pro Tip:** Your Grand Design likely uses **ST235/80R16** tires. Check the door jamb sticker for your specific load rating.\n\nWant me to add a tire check reminder before your PA → Yellowstone departure?",
  "water filter": "Water filter replacement is overdue — let's get that sorted before your big trip!\n\n🔧 **For your 2024 Grand Design:**\n\n**Replacement Filter:**\n• **Camco TastePURE** (inline, fits standard 3/4\" inlet) — ~$18 at Camping World\n• Replace every **3 months or 3,000 gallons**\n\n**Steps:**\n1. Turn off city water inlet\n2. Relieve pressure by opening a faucet\n3. Unscrew old filter (have a towel ready)\n4. Thread on new filter hand-tight + 1/4 turn\n5. Turn water back on, check for leaks\n\n⏱ **Time:** About 5 minutes total\n\nWith Yellowstone ahead, you'll want fresh filtering — campground water quality varies wildly. Add this to your pre-trip checklist?",
  "reroute": "On it! Let me re-route your PA → Yellowstone trip to avoid the Casper, WY high wind corridor.\n\n🗺 **Alternative Route — Southern Bypass:**\n\n**Original:** I-80W through Casper (52mph wind warning)\n**Alternative:** Drop to US-30W → I-76W → US-287N via Fort Collins\n\n📍 **Revised Stops:**\n1. **Pittsburgh, PA** → Depart Day 1\n2. **Indianapolis, IN** → Overnight (Blue Beacon, 50-amp KOA nearby)\n3. **Denver, CO** → Day 2 rest stop + resupply\n4. **Fort Collins, CO → US-287N** → scenic, rig-safe\n5. **Lander, WY** → Overnight (beautiful, no wind advisory)\n6. **Yellowstone South Entrance** → Day 5 arrival\n\n⏱ Adds ~90 minutes but avoids the warning window entirely.\n\n⚠️ **Height Check:** US-287 through Fort Collins is clear for your 11'0\". No restrictions flagged.\n\nShall I export this as a turn-by-turn route?",
  "alert": "Here are your current rig alerts:\n\n🔴 **Critical:**\n• Water Filter — **OVERDUE** for replacement\n\n🟡 **Upcoming:**\n• Tire Pressure Check — Due in 3 days\n• Black Tank Treatment — Due in 5 days\n\n🟢 **On Track:**\n• Slide Seal Lubrication — Due in 2 weeks\n• Annual Inspection — 2 months out\n\n📍 **Route Alert:**\nHigh Wind Warning active on your PA → Yellowstone route (Casper, WY — 52mph gusts). Recommend rerouting or delaying Day 5 transit.\n\nWant me to open any of these in detail?",
};

function getResponse(input) {
  const lower = input.toLowerCase();
  for (const [key, val] of Object.entries(RESPONSES)) {
    if (lower.includes(key)) return { role: "ai", text: val };
  }
  return {
    role: "ai",
    text: `I'm analyzing that with your rig profile in mind...\n\nThis would connect to live campground databases, weather APIs, and your specific Grand Design service history in the full version.\n\n💡 **Try asking about:**\n• "flickering interior lights"\n• "kayaking in Adirondacks" or a location from Explore\n• "tire pressure" or "water filter"\n\nOr tap any of the quick-reply chips below!`,
  };
}

// ─── CHAT PANEL ────────────────────────────────────────────────────────
function ChatPanel({ onClose, rigProfile, firstTimeBuyer, prefillMessage }) {
  const [messages, setMessages] = useState([{ role: "ai", text: CHAT_OPENER }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const prefillSent = useRef(false);

  useEffect(() => {
    if (prefillMessage && !prefillSent.current) {
      prefillSent.current = true;
      setTimeout(() => sendMsg(prefillMessage), 500);
    }
  }, [prefillMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function sendMsg(text) {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, getResponse(text)]);
    }, 1100 + Math.random() * 700);
  }

  return (
    <div style={{
      position: "fixed", right: 0, top: 0, bottom: 0, width: Math.min(390, window.innerWidth),
      background: C.bg, borderLeft: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", zIndex: 100,
      fontFamily: "'DM Sans', 'IBM Plex Sans', system-ui, sans-serif",
      animation: "slideIn 0.25s ease",
    }}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes bounce { 0%,80%,100%{transform:scale(1)} 40%{transform:scale(1.5)} }
      `}</style>

      {/* Header */}
      <div style={{ padding: "16px 16px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}, #C04A00)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bot size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Waymark AI</div>
          <div style={{ fontSize: 11, color: C.green, display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block" }} />
            {firstTimeBuyer ? "Consultant Mode · First-Time Buyer" : "Co-Pilot · Rig Profile Loaded"}
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4 }}><X size={18} /></button>
      </div>

      {/* Rig badge */}
      {!firstTimeBuyer && (
        <div style={{ margin: "10px 14px 0", background: C.accentSoft, border: `1px solid ${C.accent}33`, borderRadius: 8, padding: "7px 11px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Car size={13} color={C.accent} />
          <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>{rigProfile.year} {rigProfile.make} {rigProfile.model} · {rigProfile.length} · {rigProfile.height}</span>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
            {msg.role === "ai" && (
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, #C04A00)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 2 }}>
                <Bot size={13} color="#fff" />
              </div>
            )}
            <div style={{ maxWidth: "82%", padding: "10px 13px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "4px 14px 14px 14px", background: msg.role === "user" ? C.accent : C.surfaceAlt, color: msg.role === "user" ? "#1A0800" : C.text, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", fontWeight: msg.role === "user" ? 600 : 400 }}>
              {msg.text.split(/\*\*(.*?)\*\*/g).map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, #C04A00)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Bot size={13} color="#fff" />
            </div>
            <div style={{ display: "flex", gap: 4, padding: "12px 14px", background: C.surfaceAlt, borderRadius: "4px 14px 14px 14px", width: "fit-content" }}>
              {[0, 1, 2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.muted, display: "inline-block", animation: `bounce 1.2s ${i * 0.2}s ease infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Replies */}
      <div style={{ padding: "8px 14px 0", display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", flexShrink: 0 }}>
        {QUICK_REPLIES.map((q, i) => (
          <button key={i} onClick={() => sendMsg(q)} style={{ whiteSpace: "nowrap", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 20, padding: "5px 12px", color: C.textSub, fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.15s", }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "10px 14px 24px", display: "flex", gap: 8, flexShrink: 0, background: C.bg }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMsg(input)}
          placeholder="Ask Waymark anything about your rig..."
          style={{ flex: 1, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}
        />
        <button onClick={() => sendMsg(input)} style={{ width: 42, height: 42, borderRadius: 10, background: C.accent, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Send size={16} color="#1A0800" />
        </button>
      </div>
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
            🎓 Consultant Mode: AI explains terminology and gives beginner-friendly recommendations.
          </div>
        )}
      </Card>

      <div>
        <SectionLabel>Rig Profile</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[{ label: "Year", key: "year" }, { label: "Make", key: "make" }, { label: "Model", key: "model" }, { label: "Length", key: "length" }, { label: "Height", key: "height" }].map(({ label, key }) => (
            <div key={key}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600 }}>{label}</div>
              <input value={rigProfile[key]} onChange={e => setRigProfile(p => ({ ...p, [key]: e.target.value }))}
                style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Tank Capacities (gal)</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[{ label: "Fresh", key: "freshTank", color: C.blue }, { label: "Gray", key: "grayTank", color: C.accent }, { label: "Black", key: "blackTank", color: C.muted }].map(({ label, key, color }) => (
            <div key={key} style={{ background: C.surfaceAlt, borderRadius: 10, padding: 12, textAlign: "center", border: `1px solid ${C.border}` }}>
              <Droplets size={16} color={color} style={{ margin: "0 auto 4px" }} />
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
              <input value={rigProfile[key]} onChange={e => setRigProfile(p => ({ ...p, [key]: e.target.value }))}
                style={{ width: "100%", background: "transparent", border: "none", color, fontSize: 16, fontWeight: 700, textAlign: "center", fontFamily: "inherit", outline: "none" }} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Subscriptions</SectionLabel>
        {/* Use a standard block layout so it wraps and scrolls naturally */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {subs.map(s => {
            const active = rigProfile.subs.includes(s);
            return (
              <button key={s}
                onClick={() => setRigProfile(p => ({ ...p, subs: active ? p.subs.filter(x => x !== s) : [...p.subs, s] }))}
                style={{ padding: "9px 16px", borderRadius: 22, border: `1px solid ${active ? C.accent : C.border}`, background: active ? C.accentSoft : "transparent", color: active ? C.accent : C.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                {active ? "✓ " : ""}{s}
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
function Dashboard({ openChat, openForecast, openVibeFeed, rigProfile }) {
  const marketData = [29800, 29400, 30100, 31200, 30800, 31500, 30900, 32100, 31800, 32400, 33100, 32800];
  const cur = marketData[marketData.length - 1], prev = marketData[marketData.length - 2];
  const delta = ((cur - prev) / prev * 100).toFixed(1);
  const isUp = cur > prev;

  const [vibeItems, setVibeItems] = useState([
    { title: "Kayaking the Tetons — Summer 2024 Highlights", channel: "PaddleNomad", thumb: "🏔️", tag: "Adventure", url: null },
    { title: "Grand Design 2600RB Full Solar Upgrade", channel: "VoltageVanlife", thumb: "⚡", tag: "DIY", url: null },
  ]);
  const [vibeLoading, setVibeLoading] = useState(false);

  useEffect(() => {
    async function loadVideos() {
      setVibeLoading(true);
      try {
        const query = `${rigProfile.make} ${rigProfile.model} RV camping`;
        const res = await fetch(`/api/youtube?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.videos && data.videos.length > 0) {
          const tags = ["Tips", "DIY", "Adventure", "Off-Grid", "Routes", "Gear"];
          setVibeItems(data.videos.slice(0, 3).map((v, i) => ({
            title: v.title,
            channel: v.channel,
            thumb: v.thumbnail,
            tag: tags[i % tags.length],
            url: v.url,
            isReal: true,
          })));
        }
      } catch (err) {
        console.error("Failed to load videos:", err);
      } finally {
        setVibeLoading(false);
      }
    }
    loadVideos();
  }, [rigProfile.make, rigProfile.model]);
  const weatherPoints = [
    { city: "Pittsburgh", temp: 62, wind: 12, status: "Clear", alert: false },
    { city: "Columbus", temp: 58, wind: 19, status: "Breezy", alert: false },
    { city: "St. Louis", temp: 71, wind: 8, status: "Clear", alert: false },
    { city: "Casper", temp: 44, wind: 52, status: "HIGH WIND", alert: true },
    { city: "Yellowstone", temp: 38, wind: 34, status: "Gusts", alert: false },
  ];

  const actions = [
    { label: "Fix Issue", icon: <Wrench size={16} />, color: C.accent, mode: "mechanic", prompt: "I need help diagnosing an issue with my RV" },
    { label: "Plan Route", icon: <Navigation size={16} />, color: C.blue, mode: "route", prompt: "Help me plan a route for my upcoming trip to Yellowstone" },
    { label: "Find Site", icon: <Tent size={16} />, color: C.green, mode: "site", prompt: "Help me find a great campsite for my 2024 Grand Design" },
  ];

  return (
    <div style={{ padding: "0 20px 100px", display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Greeting */}
      <div style={{ paddingTop: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.03em" }}>Good morning, Alex</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{rigProfile.year} {rigProfile.make} · PA → Yellowstone</div>
      </div>

      {/* Quick Actions — prominent, at top */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {actions.map(a => (
          <button key={a.label} onClick={() => openChat(a.prompt)}
            style={{
              padding: "16px 6px 14px", background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 14, cursor: "pointer", fontFamily: "inherit",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 9,
              transition: "all 0.15s",
            }}
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

      {/* Weather — stripped back, alert-first */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Vibe Feed {vibeLoading && <span style={{ color: C.muted, fontWeight: 400, fontSize: 11 }}>· loading...</span>}
          </span>
          <button onClick={openVibeFeed} style={{ background: "none", border: "none", color: C.blue, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Browse All →</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {vibeItems.map((v, i) => (
            <a key={i}
              href={v.url || "#"}
              target={v.url ? "_blank" : "_self"}
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, textDecoration: "none", transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.blue}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              {v.isReal ? (
                <img src={v.thumb} alt={v.title} style={{ width: 80, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 10, background: C.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, border: `1px solid ${C.border}` }}>{v.thumb}</div>
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

      {/* Market Watch — minimal */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Market Watch</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {isUp ? <TrendingUp size={12} color={C.green} /> : <TrendingDown size={12} color={C.red} />}
            <span style={{ fontSize: 12, fontWeight: 700, color: isUp ? C.green : C.red }}>{isUp ? "+" : ""}{delta}%</span>
          </div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{rigProfile.year} {rigProfile.make} Imagine</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.03em" }}>${cur.toLocaleString()}</div>
            </div>
            <div style={{ fontSize: 11, color: C.muted, textAlign: "right" }}>
              <div>Est. trade-in</div>
              <div style={{ color: isUp ? C.green : C.red, fontWeight: 700, marginTop: 2 }}>{isUp ? "▲" : "▼"} trending</div>
            </div>
          </div>
          <Sparkline data={marketData} color={isUp ? C.green : C.red} height={36} />
        </div>
      </div>

      {/* Vibe Feed — just 2 cards, compact */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Vibe Feed</span>
          <button onClick={openVibeFeed} style={{ background: "none", border: "none", color: C.blue, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Browse All →</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {vibeItems.map((v, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${C.surfaceAlt}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, border: `1px solid ${C.border}` }}>{v.thumb}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 4 }}>{v.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Badge color={C.blue} bg={C.blueSoft}>{v.tag}</Badge>
                  <span style={{ fontSize: 10, color: C.muted }}>{v.dur}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── EXPLORE PAGE ──────────────────────────────────────────────────────
function ExplorePage({ openChat }) {
  const spots = [
    { name: "Limekiln Lake, NY", tag: "Kayak Base", rating: 4.8, dist: "210mi", emoji: "🚣", mode: "site", prompt: "Tell me about camping at Limekiln Lake NY for kayaking with my 30ft Grand Design trailer" },
    { name: "Shenandoah NP, VA", tag: "Scenic Drive", rating: 4.9, dist: "180mi", emoji: "🏔️", mode: "route", prompt: "Plan a trip to Shenandoah National Park for my 2024 Grand Design, including rig-safe roads and campsite recommendations" },
    { name: "Delaware Water Gap", tag: "Hiking", rating: 4.6, dist: "95mi", emoji: "🌊", mode: "site", prompt: "Find me a great campsite at Delaware Water Gap for my setup and tell me what to do there" },
    { name: "Allegany SP, NY", tag: "Full Hookup", rating: 4.5, dist: "150mi", emoji: "🌲", mode: "site", prompt: "Tell me about Allegany State Park camping for a 30ft trailer with activities" },
    { name: "Assateague Island", tag: "Beach/Ponies", rating: 4.9, dist: "230mi", emoji: "🏖️", mode: "site", prompt: "Tell me about camping at Assateague Island with my Grand Design trailer, wild ponies, and beach activities" },
    { name: "Promised Land SP", tag: "Poconos", rating: 4.7, dist: "85mi", emoji: "⛺", mode: "site", prompt: "Tell me about Promised Land State Park camping near the Poconos for a weekend trip" },
  ];
  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", marginBottom: 4 }}>Explore <span style={{ color: C.blue }}>↗</span></div>
      <div style={{ fontSize: 13, color: C.textSub, marginBottom: 16 }}>Top picks near State College, PA · <span style={{ color: C.blue }}>Tap any to get AI trip info</span></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {spots.map((s, i) => (
          <Card key={i} onClick={() => openChat(s.prompt)} style={{ padding: 14 }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{s.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 5 }}>{s.name}</div>
            <Badge color={C.blue} bg={C.blueSoft}>{s.tag}</Badge>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: C.muted }}><Star size={10} color={C.blue} fill={C.blue} />{s.rating}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{s.dist}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: C.blue, fontWeight: 600 }}>Tap for AI trip info →</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── CO-PILOT PAGE ─────────────────────────────────────────────────────
function CoPilotPage({ openChat }) {
  const suggestions = [
    { label: "Diagnose an issue", prompt: "I need help diagnosing an issue with my RV", icon: <Wrench size={15} />, color: C.accent },
    { label: "Plan a route", prompt: "Help me plan a route for my upcoming trip to Yellowstone", icon: <Navigation size={15} />, color: C.blue },
    { label: "Find a campsite", prompt: "Find me a great campsite for my 2024 Grand Design", icon: <Tent size={15} />, color: C.green },
    { label: "Maintenance checklist", prompt: "What maintenance should I do before a long trip?", icon: <Wrench size={15} />, color: C.accent },
    { label: "Boondocking spots", prompt: "Find me great boondocking spots within 300 miles", icon: <Tent size={15} />, color: C.green },
    { label: "Check bridge clearances", prompt: "Are there any low bridge warnings on my route?", icon: <Navigation size={15} />, color: C.blue },
  ];
  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <div style={{ textAlign: "center", padding: "24px 0 28px" }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg, ${C.accent}, #C04A00)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Bot size={30} color="#fff" />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.03em", marginBottom: 8 }}>Waymark AI</div>
        <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.55, maxWidth: 280, margin: "0 auto" }}>
          One assistant for everything — repairs, routes, campsites, and more. Knows your rig profile by heart.
        </div>
      </div>
      <button onClick={() => openChat(null)}
        style={{ width: "100%", padding: "15px", background: C.accent, border: "none", borderRadius: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 15, color: "#1A0800", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <MessageSquare size={17} color="#1A0800" />
        Start a Conversation
      </button>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>Try asking</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => openChat(s.prompt)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.background = `${s.color}0D`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{s.label}</span>
            <ChevronRight size={14} color={C.muted} style={{ marginLeft: "auto" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [subPage, setSubPage] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [chatPrefill, setChatPrefill] = useState(null);
  const [firstTimeBuyer, setFirstTimeBuyer] = useState(false);
  const [rigProfile, setRigProfile] = useState({
    year: "2024", make: "Grand Design", model: "Imagine XLS 21BHE",
    length: "29'11\"", height: "11'0\"",
    freshTank: "52", grayTank: "82", blackTank: "45",
    subs: ["Harvest Hosts", "KOA"],
  });

  function openChat(prefill = null) {
    setChatPrefill(prefill);
    setChatKey(k => k + 1);
    setChatOpen(true);
  }

  function closeChat() {
    setChatOpen(false);
    setChatPrefill(null);
  }

  const navItems = [
    { key: "home", icon: <Home size={20} />, label: "Home" },
    { key: "explore", icon: <Compass size={20} />, label: "Explore" },
    { key: "copilot", icon: <Bot size={20} />, label: "Co-Pilot" },
    { key: "profile", icon: <User size={20} />, label: "Rig" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', 'IBM Plex Sans', system-ui, sans-serif", background: C.bg, minHeight: "100vh", color: C.text, maxWidth: 430, margin: "0 auto", position: "relative", boxShadow: "0 0 80px #00000088" }}>

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
          <button onClick={() => openChat("alert")} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center" }}>
            <Bell size={15} />
          </button>
          <button onClick={() => { setTab("profile"); setSubPage(null); }} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center" }}>
            <User size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {tab === "home" && !subPage && <Dashboard openChat={openChat} openForecast={() => setSubPage("forecast")} openVibeFeed={() => setSubPage("vibefeed")} rigProfile={rigProfile} />}
        {tab === "home" && subPage === "forecast" && <FullForecastPage onBack={() => setSubPage(null)} />}
        {tab === "home" && subPage === "vibefeed" && <FullVibePage onBack={() => setSubPage(null)} />}
        {tab === "explore" && <ExplorePage openChat={openChat} />}
        {tab === "copilot" && <CoPilotPage openChat={openChat} />}
        {tab === "profile" && <ProfileTab rigProfile={rigProfile} setRigProfile={setRigProfile} firstTimeBuyer={firstTimeBuyer} setFirstTimeBuyer={setFirstTimeBuyer} />}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: `${C.bg}F8`, backdropFilter: "blur(16px)", borderTop: `1px solid ${C.border}`, display: "flex", padding: "8px 0 20px", zIndex: 49 }}>
        {navItems.map(n => {
          const active = tab === n.key;
          return (
            <button key={n.key}
              onClick={() => {
                setSubPage(null);
                if (n.key === "copilot") {
                  setTab("copilot");
                } else {
                  setTab(n.key);
                }
              }}
              style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0", fontFamily: "inherit" }}>
              <div style={{ color: active ? C.accent : C.muted, transition: "color 0.15s" }}>{n.icon}</div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? C.accent : C.muted, transition: "color 0.15s" }}>{n.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Overlay */}
      {chatOpen && (
        <>
          <div onClick={closeChat} style={{ position: "fixed", inset: 0, background: "#00000077", zIndex: 99, backdropFilter: "blur(2px)" }} />
          <ChatPanel
            key={chatKey}
            onClose={closeChat}
            rigProfile={rigProfile}
            firstTimeBuyer={firstTimeBuyer}
            prefillMessage={chatPrefill}
          />
        </>
      )}
    </div>
  );
}
