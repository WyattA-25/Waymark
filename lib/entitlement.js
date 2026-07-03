// Client-side entitlement: fetch the plan when online, cache it locally,
// and honor the cached plan offline with a grace window so a renewal date
// passing mid-trip does not strand a paying user at a campsite.

import { supabase } from "./supabase";

const CACHE_KEY = "waymark_plan_cache";
const OFFLINE_GRACE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days past period end

export function readCachedPlan() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    return cached?.plan ? cached : null;
  } catch {
    return null;
  }
}

// Resolves { plan, status, periodEnd } from the server, falling back to the
// local cache (offline) and finally to free.
export async function fetchPlan() {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("plan,status,current_period_end")
      .maybeSingle();
    if (error) throw error;
    const entitlement = {
      plan: data?.plan || "free",
      status: data?.status || "active",
      periodEnd: data?.current_period_end || null,
      checkedAt: Date.now(),
    };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(entitlement)); } catch {}
    return entitlement;
  } catch {
    return readCachedPlan() || { plan: "free", status: "active", periodEnd: null, checkedAt: null };
  }
}

export function isPro(entitlement) {
  if (!entitlement || entitlement.plan !== "pro") return false;
  if (entitlement.status === "canceled") return false;
  if (!entitlement.periodEnd) return true;
  return Date.now() < new Date(entitlement.periodEnd).getTime() + OFFLINE_GRACE_MS;
}
