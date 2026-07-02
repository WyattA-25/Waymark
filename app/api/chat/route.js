import { getUserFromRequest } from "../../../lib/supabaseServer";
import { rateLimit } from "../../../lib/ratelimit";

export async function POST(req) {
  try {
    // Chat proxies a paid API key, so require a signed-in user and rate limit per user
    const user = await getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: "Sign in to use cloud chat." }, { status: 401 });
    }
    const limited = rateLimit(req, "chat", user.id);
    if (limited) return limited;

    const { messages, rigProfile, firstTimeBuyer } = await req.json();

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

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: history,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Gemini Error:", data.error?.message || data);
      return Response.json({ error: data.error?.message || "API Error" }, { status: res.status });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    return Response.json({ text });

  } catch (err) {
    return Response.json({ error: "Server Error", detail: err.message }, { status: 500 });
  }
}
