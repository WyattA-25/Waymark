// Server-side helpers: verify a Supabase access token from the Authorization
// header and return the user, or null when missing/invalid; look up the
// user's plan under their own RLS context.

import { createClient } from "@supabase/supabase-js";

function tokenFromRequest(req) {
  const authHeader = req.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

export async function getUserFromRequest(req) {
  const token = tokenFromRequest(req);
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// Returns "pro" or "free". Queries with the caller's own token so RLS
// applies; any failure quietly means free (never block chat on this).
export async function getPlanFromRequest(req) {
  try {
    const token = tokenFromRequest(req);
    if (!token) return "free";
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data } = await supabase
      .from("subscriptions")
      .select("plan,status,current_period_end")
      .maybeSingle();
    if (!data || data.plan !== "pro" || data.status === "canceled") return "free";
    if (data.current_period_end && new Date(data.current_period_end).getTime() < Date.now()) return "free";
    return "pro";
  } catch {
    return "free";
  }
}
