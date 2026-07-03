"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Auth from "./components/Auth";
import Waymark from "./components/Waymark";

const USER_CACHE_KEY = "waymark_user_cache";

function readCachedUser() {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    const cached = raw ? JSON.parse(raw) : null;
    return cached?.id ? cached : null;
  } catch {
    return null;
  }
}

export default function Page() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Keep the app shell available offline (production only, so dev never
    // fights a stale cache)
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Stash the browser install prompt (Chrome and Edge fire this once per
    // load, often before sign-in) so the dashboard offline card can trigger
    // the real install from its own Download button
    const onInstallPrompt = (e) => {
      e.preventDefault();
      window.__waymarkInstallPrompt = e;
      window.dispatchEvent(new Event("waymark-installable"));
    };
    window.addEventListener("beforeinstallprompt", onInstallPrompt);

    // Check if user is already logged in. Offline, an expired session cannot
    // refresh; fall back to the last signed-in user so the installed app
    // still opens (profile and chat work from local data).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        try {
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify({ id: session.user.id, email: session.user.email }));
        } catch {}
      } else if (!navigator.onLine) {
        setUser(readCachedUser());
      } else {
        setUser(null);
      }
      setLoading(false);
    }).catch(() => {
      setUser(navigator.onLine ? null : readCachedUser());
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          try { localStorage.removeItem(USER_CACHE_KEY); } catch {}
          setUser(null);
          return;
        }
        if (session?.user) setUser(session.user);
      }
    );

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ background: "#0D1117", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#F97316", fontSize: 14, fontFamily: "system-ui" }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return <Waymark user={user} />;
}
