import { useState, useEffect, useRef } from "react";
import { logMetric } from "../../lib/metrics";

const MODEL_ID = "Llama-3.2-1B-Instruct-q4f32_1-MLC";

// WebLLM persists weights in Cache API caches named webllm/model,
// webllm/wasm, and webllm/config. Probing them directly (instead of
// importing the 6MB library) lets the UI know the model is already on
// this device without pulling the engine into the initial load.
async function modelIsCached() {
  try {
    if (!(await caches.has("webllm/model"))) return false;
    const cache = await caches.open("webllm/model");
    const keys = await cache.keys();
    return keys.some((req) => req.url.includes(MODEL_ID));
  } catch {
    return false;
  }
}

export function useWebLLM() {
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error | unsupported
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [cached, setCached] = useState(false); // model already on this device
  const [fromCache, setFromCache] = useState(false); // current load reads from device storage
  const engineRef = useRef(null);
  const loadPromiseRef = useRef(null);

  // WebLLM requires WebGPU (Chrome and Edge; Safari and Firefox are partial).
  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.gpu) {
      setStatus("unsupported");
      return;
    }
    let alive = true;
    modelIsCached().then((hit) => { if (alive && hit) setCached(true); });
    return () => { alive = false; };
  }, []);

  // Callers that send a message mid-download await the same in-flight
  // promise instead of hitting a "Model not loaded" error.
  function load() {
    if (engineRef.current) return Promise.resolve();
    if (status === "unsupported") return Promise.resolve();
    if (loadPromiseRef.current) return loadPromiseRef.current;

    setStatus("loading");
    setFromCache(cached);
    loadPromiseRef.current = (async () => {
      try {
        // Ask the browser not to evict the 700MB model under storage
        // pressure; granted silently for installed or engaged origins
        try { await navigator.storage?.persist?.(); } catch {}
        const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
        const engine = await CreateMLCEngine(MODEL_ID, {
          initProgressCallback: (p) => {
            setProgress(Math.round(p.progress * 100));
            setProgressText(p.text || "Loading model...");
            if (/cache/i.test(p.text || "")) setFromCache(true);
          },
        });
        engineRef.current = engine;
        setStatus("ready");
        setCached(true);
        logMetric("offline_model_loaded");
      } catch (err) {
        // Swallow rather than rethrow: buttons call load() directly, and the
        // send flow already fails safely via generate() when no engine exists.
        console.error("WebLLM load error:", err);
        setStatus("error");
        logMetric("offline_model_load_failed", { message: err.message });
      } finally {
        loadPromiseRef.current = null;
      }
    })();
    return loadPromiseRef.current;
  }

  async function generate(messages, rigProfile, firstTimeBuyer) {
    if (!engineRef.current) throw new Error("Model not loaded");

    const systemPrompt = `You are Waymark, an offline RV emergency assistant. Be extremely brief and direct.

RIG: ${rigProfile.year} ${rigProfile.make} ${rigProfile.model} ${rigProfile.floorPlan || ""} (${rigProfile.length} long, ${rigProfile.height} tall)
MODE: ${firstTimeBuyer ? "First-time buyer" : "Experienced RVer"}

RULES:
- You are running OFFLINE on the user's device
- Max 100 words per response
- Never use code blocks, backticks, or markdown formatting
- Plain text and bullet points only
- Prioritize safety and practical fixes
- No fluff, get straight to the answer
- Perfect for emergencies: fires, leaks, mechanical issues, first aid basics, campsite safety`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
      })),
    ];

    const reply = await engineRef.current.chat.completions.create({
      messages: formattedMessages,
      temperature: 0.3,
      max_tokens: 300,
    });

    return reply.choices[0].message.content;
  }

  return { status, progress, progressText, cached, fromCache, load, generate };
}
