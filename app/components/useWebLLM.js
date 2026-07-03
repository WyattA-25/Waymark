import { useState, useEffect, useRef } from "react";
import { logMetric } from "../../lib/metrics";

const MODEL_ID = "Llama-3.2-1B-Instruct-q4f32_1-MLC";

export function useWebLLM() {
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error | unsupported
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const engineRef = useRef(null);
  const loadPromiseRef = useRef(null);

  // WebLLM requires WebGPU (Chrome and Edge; Safari and Firefox are partial).
  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.gpu) {
      setStatus("unsupported");
    }
  }, []);

  // Callers that send a message mid-download await the same in-flight
  // promise instead of hitting a "Model not loaded" error.
  function load() {
    if (engineRef.current) return Promise.resolve();
    if (status === "unsupported") return Promise.resolve();
    if (loadPromiseRef.current) return loadPromiseRef.current;

    setStatus("loading");
    loadPromiseRef.current = (async () => {
      try {
        const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
        const engine = await CreateMLCEngine(MODEL_ID, {
          initProgressCallback: (p) => {
            setProgress(Math.round(p.progress * 100));
            setProgressText(p.text || "Loading model...");
          },
        });
        engineRef.current = engine;
        setStatus("ready");
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

  return { status, progress, progressText, load, generate };
}
