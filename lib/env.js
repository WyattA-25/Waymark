// Startup check: fail fast with a clear message when a required env var is missing.
// Imported from app/layout.js so it runs on every server start.

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "GEMINI_API_KEY",
  "RECREATION_GOV_API_KEY",
];
// Optional: YOUTUBE_API_KEY (only used as a fallback when scraping fails)

const missing = REQUIRED.filter((name) => !process.env[name]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(", ")}. ` +
    "Copy .env.example to .env.local and fill in the values."
  );
}
