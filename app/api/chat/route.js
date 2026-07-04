import { getUserFromRequest, getPlanFromRequest } from "../../../lib/supabaseServer";
import { rateLimit } from "../../../lib/ratelimit";

const PRO_CHAT_LIMIT = 150; // per 10 min window, vs the free bucket default of 30
const MODELS = { free: "gemini-2.5-flash", pro: "gemini-2.5-pro" };

export async function POST(req) {
  try {
    // Chat proxies a paid API key, so require a signed-in user and rate limit per user
    const user = await getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: "Sign in to use cloud chat." }, { status: 401 });
    }
    const plan = await getPlanFromRequest(req);
    const limited = rateLimit(req, "chat", user.id, plan === "pro" ? PRO_CHAT_LIMIT : null);
    if (limited) return limited;

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!Array.isArray(body?.messages)) {
      return Response.json({ error: "messages must be an array." }, { status: 400 });
    }

    // Cap history length, coerce each entry's text to a bounded string,
    // and drop entries without usable text
    const messages = body.messages
      .slice(-30)
      .map(m => ({
        role: m?.role,
        text: String(m?.text ?? "").slice(0, 4000),
      }))
      .filter(m => m.text.trim().length > 0);

    // Coerce rig fields to strings so the prompt template never throws
    const rawRig = (body.rigProfile && typeof body.rigProfile === "object" && !Array.isArray(body.rigProfile))
      ? body.rigProfile
      : {};
    const str = (v, fallback = "") => (v == null ? fallback : String(v).slice(0, 200));
    const rigProfile = {
      year: str(rawRig.year),
      make: str(rawRig.make, "Unknown make"),
      model: str(rawRig.model, "Unknown model"),
      floorPlan: str(rawRig.floorPlan),
      length: str(rawRig.length, "unknown length"),
      height: str(rawRig.height, "unknown height"),
      subs: Array.isArray(rawRig.subs)
        ? rawRig.subs.filter(s => typeof s === "string").slice(0, 20).map(s => s.slice(0, 100))
        : [],
    };
    const firstTimeBuyer = Boolean(body.firstTimeBuyer);

    const systemPrompt = `You are Waymark, an RV co-pilot assistant. Be brief and direct.

RIG: ${rigProfile.year} ${rigProfile.make} ${rigProfile.model} ${rigProfile.floorPlan || ""} (${rigProfile.length} long, ${rigProfile.height} tall)
MEMBERSHIPS: ${rigProfile.subs?.join(", ") || "none"}
MODE: ${firstTimeBuyer ? "First-time buyer: explain terms simply" : "Experienced RVer: be technical and direct"}

RULES:
- Max 150 words per response unless user asks for more
- No filler phrases ("Great question!", "Happy to help", "Let me know if...")
- First sentence = the answer, not an introduction
- Bullets for steps/lists, sentences for everything else
- Always reference the specific rig make/model/floor plan
- Flag height restrictions under ${rigProfile.height} for routes
- Flag sites that can't fit ${rigProfile.length} for campsites
- If you need clarification, ask ONE specific question only`;

    const history = messages.map(m => ({
      role: (m.role === "ai" || m.role === "model") ? "model" : "user",
      parts: [{ text: m.text || " " }]
    }));

    if (history.length > 0 && history[0].role === "user") {
      history[0].parts[0].text = `${systemPrompt}\n\nUser Question: ${history[0].parts[0].text}`;
    } else {
      history.unshift({
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nHello!` }]
      });
    }

    const geminiBody = JSON.stringify({
      contents: history,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      }
    });

    // Retry once on network failure, timeout, or 5xx; never retry 4xx
    const isRetryableError = e =>
      e instanceof TypeError || e?.name === "AbortError" || e?.name === "TimeoutError";

    // Pro tries the smarter model first, then falls back to flash, so chat
    // keeps working when the key has no 2.5-pro quota (free Gemini keys
    // return 429 for it until billing is enabled).
    const candidates = plan === "pro" ? [MODELS.pro, MODELS.free] : [MODELS.free];

    let res = null;
    for (const model of candidates) {
      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: geminiBody,
            signal: AbortSignal.timeout(20000),
          });
        } catch (fetchErr) {
          if (attempt === 0 && isRetryableError(fetchErr)) continue;
          throw fetchErr;
        }
        if (res.status < 500) break;
      }
      if (res?.ok) break;
      const detail = await res?.text().catch(() => "") || "";
      console.error(`Gemini ${model} failed:`, res?.status, detail.slice(0, 300));
    }

    if (!res?.ok) {
      return Response.json({ error: "Cloud AI is unavailable right now." }, { status: 502 });
    }

    const data = await res.json();

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    return Response.json({ text });

  } catch (err) {
    console.error("Chat route error:", err);
    return Response.json({ error: "Server Error" }, { status: 500 });
  }
}
