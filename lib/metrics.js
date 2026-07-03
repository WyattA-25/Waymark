import { supabase } from "./supabase";

// Fire-and-forget product metric. Callers do not await it.
// Never throws: a missing session is a silent no-op, and any insert
// failure (including a missing table) is swallowed with a debug log.
export async function logMetric(event, meta = {}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase
      .from("metrics")
      .insert({ user_id: session.user.id, event, meta });
    if (error) console.debug("logMetric skipped:", error.message);
  } catch (err) {
    console.debug("logMetric skipped:", err?.message);
  }
}
