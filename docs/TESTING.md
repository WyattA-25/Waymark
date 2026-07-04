# Waymark QA: automated suite + manual checklist

## Automated e2e tests (Playwright)

Critical paths are covered by automated tests in `e2e/`: auth (real Supabase sign-in, wrong password, session persistence, sign out), cloud chat (real Gemini answer, unreachable fallback, history across tabs), API route integration (validation, auth gates, real upstream data), graceful degradation (each upstream killed one at a time), and the no-WebGPU offline fallback (Chromium with WebGPU removed, plus real Firefox).

- Run: `npm run test:e2e` (starts its own dev server on port 3011). Stop any running `npm run dev` first: Next.js allows only one dev server per project directory (.next/dev lock), so a second one fails to start.
- Credentials: put `TEST_EMAIL` / `TEST_PASSWORD` for a real test account in `.env.test.local` (gitignored); tests needing them are skipped when unset
- The full ~700MB offline model download-and-answer test is gated: set `RUN_WEBLLM_E2E=1` to include it. It also self-skips when the automated browser has no WebGPU (common: Playwright's headless shell has no WebGPU build, and automated Chromium often does not expose `navigator.gpu` on Windows). When it skips, verify offline mode by hand using the "Co-Pilot chat: offline mode" section below in a normal Chrome or Edge window.
- Real-Firefox fallback tests are gated: set `E2E_FIREFOX=1` (needs the Microsoft VC++ redistributable for Playwright's Firefox build); the same no-WebGPU path always runs in Chromium with `navigator.gpu` removed
- Weather and forecast integration tests skip automatically when api.open-meteo.com (a free provider with real outages) is unreachable

## PWA / offline app checks

The service worker only runs in production builds (`npm run build` then `npm run start`); `npm run dev` never registers it, so dev work is not affected by stale caches.

- [ ] Visit the production site in Chrome or Edge. Expected: an install prompt is available (address bar icon or browser menu, "Install Waymark").
- [ ] Sign in, then set devtools Network to Offline and reload. Expected: the dashboard still renders with your rig profile, an Offline pill in the top bar, and the weather strip showing the last saved conditions for your trip (or an unavailable notice on a first visit).
- [ ] Dashboard shows the "Take Waymark offline" card when setup is incomplete. Expected: in Chrome or Edge, Download for offline opens the browser install dialog AND starts the ~700MB model download in one click; on browsers without an install prompt (iPhone), the AI still downloads and the card explains Share, then Add to Home Screen. Later hides the card (the download stays available in Co-Pilot). The card never shows on browsers without WebGPU, and disappears once the app is installed and the model is ready.
- [ ] With the model downloaded but the app not installed, the card compacts to "Offline AI is ready" with an Install app button (or manual install instructions).
- [ ] Edit the rig profile while offline. Expected: a notice says changes are saved on this device and will sync; going back online pushes them to Supabase (verify in the Table Editor or by reloading online later).

## Pro tier checks

Grant an account Pro with the SQL comment at the bottom of `supabase/migrations/003_pro.sql` (there is no payment flow yet).

- [ ] Free account, Rig tab. Expected: a locked "Maintenance log" card with the PRO badge and a disabled "Payments coming soon" button; no maintenance list.
- [ ] Pro account, Rig tab. Expected: a Maintenance section with + Add; adding an item with a due date shows it with a due chip (Overdue red when past, Due soon orange within 14 days); Done on a repeating item reschedules it (due date advances by the repeat interval); Done on a one-off removes it.
- [ ] Pro account, dashboard. Expected: when items are overdue or due within 14 days, an orange reminder banner shows the count and tapping it opens the Rig tab.
- [ ] Pro account offline. Expected: the maintenance list still shows (local mirror); adds and edits are marked "syncs when online" and push to Supabase when the connection returns.
- [ ] Pro chat: cloud answers come from the smarter model (gemini-2.5-pro) and the per-user limit is 150 per 10 minutes instead of 30. NOTE: free-tier Gemini API keys have no 2.5-pro quota (429); the route then falls back to flash automatically, so Pro chat always answers. Check the Vercel function logs to see which model served ("Gemini gemini-2.5-pro failed: 429" means the key needs billing for the smarter model).

## Manual QA checklist

Run through this list before each release. Test in Chrome or Edge (full experience) plus one browser without WebGPU (Firefox or Safari) for the unsupported-browser checks. Test both layouts: mobile is any viewport under 768px wide (use devtools device emulation), desktop is 768px and up.

## Setup

- [ ] Confirm the TEMP DEV BYPASS block in `app/page.js` has been removed. Expected: the app shows the sign-in screen when no session exists, instead of auto-signing-in a fake user.
- [ ] `npm run dev` starts cleanly. Expected: no missing env var error at startup; the app loads at localhost:3000.

## Auth (signed out)

- [ ] Visit the app with no session. Expected: the waymark logo sign-in screen appears, no dashboard content is reachable.
- [ ] Submit with empty email or password. Expected: inline error "Please enter your email and password."
- [ ] Sign in with a wrong password. Expected: a red inline error from Supabase; the form stays usable.
- [ ] Toggle to "Sign up" and create an account. Expected: green message "Check your email to confirm your account, then sign in."
- [ ] Sign in with valid credentials (Enter key also submits). Expected: dashboard loads with your rig in the greeting line, and the session survives a page reload.

## Layout and navigation

- [ ] Mobile: bottom nav shows 5 tabs (Home, Co-Pilot, Sites, Explore, Rig). Expected: tapping each switches content; the active tab turns orange.
- [ ] Mobile: top bar shows the bell and user icons. Expected: bell opens Co-Pilot prefilled with a rig alerts question; user icon signs out.
- [ ] Desktop: left sidebar shows the same 5 items, the rig summary, and a Sign Out button. Expected: active item is highlighted orange; the top bar title matches the active tab.
- [ ] Resize the window across the 768px breakpoint. Expected: layout swaps between bottom nav and sidebar without losing the current tab.
- [ ] Open Full Forecast or Vibe Feed, then use the back arrow. Expected: returns to the dashboard; on desktop the top bar shows "Home · Full Forecast" or "Home · Vibe Feed" while open.

## Dashboard (Home)

- [ ] Load the Home tab. Expected: time-appropriate greeting, rig year and make, and the current trip (From and To) in the subtitle. No quick-action buttons: Co-Pilot lives in the nav bar.
- [ ] Route Weather strip renders. Expected: 5 waypoint columns, each with a city name, temperature, and wind speed (not stuck on "..." or "--").
- [ ] Click Edit Trip, change From and To to valid cities, Save. Expected: weather strip reloads with new waypoints; the trip survives a page reload (localStorage).
- [ ] Enter an invalid To city (e.g. "zzzzqqq") and Save. Expected: a friendly red error like: Could not find "zzzzqqq". Try a city name like "Denver" or "Moab, UT". The rest of the page still renders.
- [ ] If a wind alert exists on the route. Expected: red banner with "Tap to reroute"; tapping opens Co-Pilot prefilled with a reroute question.
- [ ] Vibe Feed preview shows up to 3 videos matched to your rig make and model. Expected: real thumbnails and channel names; clicking opens YouTube in a new tab; Browse All opens the full Vibe Feed subpage.

## Full Forecast subpage

- [ ] Open Full Forecast from the dashboard. Expected: header shows From and To, skeletons while loading, then daily cards with city, day label, high and low temps, wind, and rain chance.
- [ ] If a high-wind day exists. Expected: that card and a top banner turn red with HIGH WIND WARNING.
- [ ] Block `/api/forecast` in devtools and reload the subpage. Expected: friendly red error "Forecast is unavailable right now. Check your connection." and the page does not blank.

## Vibe Feed subpage

- [ ] Category pills (All, DIY, Adventure, Off-Grid, Tips, Routes, Gear). Expected: tapping a pill refetches videos for that category and highlights the pill.
- [ ] Search for a term (e.g. "solar") and press Enter or click Search. Expected: results update to rig-brand videos matching the term; clicking a video opens YouTube in a new tab.
- [ ] Block `/api/youtube` and switch categories. Expected: loading skeletons resolve, page does not blank or crash (list may stay empty or stale).

## Co-Pilot chat: shared UI (both modes)

- [ ] Open Co-Pilot. Expected: rig badge at top shows year, make, model, floor plan, length, and height; empty state shows quick reply chips, and tapping one sends it.
- [ ] Send any message. Expected: typing indicator (three bouncing dots) appears, then a reply; the view auto-scrolls to the newest message.
- [ ] Reply formatting. Expected: headings, bullets, and bold render; no raw ``` code fences or ** markers visible.
- [ ] Send a message, switch to Home, then back to Co-Pilot. Expected: the conversation is still there (chat history survives tab switches).

## Co-Pilot chat: cloud mode

- [ ] Signed in, toggle set to Cloud, send a question. Expected: answer arrives with the orange bot avatar and no OFFLINE AI tag.
- [ ] Ask a rig-specific question ("how long is my trailer"). Expected: the answer references your actual rig profile.
- [ ] Cloud mode with the network killed (devtools Network set to Offline). Expected: friendly message "Cloud AI is unreachable right now. Check your connection, or switch to Offline mode." No crash, no infinite spinner.
- [ ] Expired or missing session (sign out in another tab, or clear the Supabase token in localStorage), then send in Cloud mode. Expected: the same friendly unreachable message, never a raw 401 or JSON error on screen.

## Co-Pilot chat: offline mode

- [ ] Fresh browser profile, Chrome or Edge: click "Download offline AI for emergency use" (~700MB note shown). Expected: blue progress bar with a percentage and "First time only" label while downloading.
- [ ] Download completes. Expected: status row "Offline AI ready: answers even with no internet" and a green dot on the Offline toggle button; after a page reload the model reloads from browser cache far faster than the first download.
- [ ] Toggle set to Offline, send a question. Expected: a short plain-text answer (about 100 words max, no code blocks) with the blue bot avatar and the OFFLINE AI tag under the message.
- [ ] ACCEPTANCE GATE: with the model loaded, open devtools, set Network to Offline, then ask an emergency question (e.g. "propane smell in the camper"). Expected: the assistant still answers, and the reply carries the OFFLINE AI tag.
- [ ] Select Offline before the model is loaded and send a message. Expected: a system message explains the ~700MB first-time download, the model loads, then the answer arrives with the OFFLINE AI tag.

## Co-Pilot chat: Auto mode

- [ ] Auto with a working connection. Expected: replies come from cloud (orange avatar, no OFFLINE AI tag).
- [ ] Auto with the network killed and the model already loaded. Expected: cloud fails silently and the reply arrives from offline with the OFFLINE AI tag, no error shown to the user.
- [ ] Auto with the network killed and the model NOT loaded. Expected: a friendly message explains that cloud is unreachable and points to the Offline toggle for the one-time ~700MB download; Auto mode never starts the download on its own.

## Unsupported browser (Firefox or Safari)

- [ ] Open Co-Pilot. Expected: notice "Offline AI unavailable: this browser has no WebGPU. Use Chrome or Edge." and the Offline toggle is disabled (dimmed, not-allowed cursor) with a tooltip pointing to Chrome or Edge.
- [ ] Cloud chat in this browser. Expected: works normally, answers arrive as usual.
- [ ] Kill the network in this browser and send in Auto mode. Expected: friendly message that offline AI needs WebGPU and to use Chrome or Edge, or switch back to Cloud.

## Sites tab (campsite search)

- [ ] Search a term (e.g. "Yellowstone") with a state selected. Expected: campground cards with name, description, state, phone, and a Reservable badge where applicable; the notice above results shows your rig length and points to Ask Waymark AI for fit checks.
- [ ] Click Ask Waymark AI on a result. Expected: opens Co-Pilot prefilled with a question about that campground and your rig.
- [ ] Click Reserve. Expected: opens the Recreation.gov page in a new tab.
- [ ] Search a nonsense term. Expected: "No campgrounds found. Try a different search term or state." (not an error, not a blank page).
- [ ] Search with the network killed. Expected: friendly error "Search failed. Check your connection."

## Explore tab

- [ ] Open Explore with a trip set. Expected: header "Campgrounds near {destination}" and a grid of up to 8 campground cards.
- [ ] Tap a campground card. Expected: opens Co-Pilot prefilled with a fit-and-things-to-do question for that campground and your rig.
- [ ] Set a trip destination with no nearby campgrounds. Expected: empty state suggesting a different destination or the Sites tab, not an error.
- [ ] Open Explore with the network killed. Expected: friendly error "Could not load campgrounds. Check your connection." and no blank page.

## Rig profile tab

- [ ] Toggle First-Time Buyer Mode on. Expected: card highlights orange with a Consultant Mode note; the Co-Pilot header badge changes from Co-Pilot to Consultant.
- [ ] Change Year or Make. Expected: the Model dropdown clears and reloads real models from NHTSA (shows "loading..." while fetching).
- [ ] Pick a make and year with no NHTSA models. Expected: "No models found - try a different year" under the empty dropdown, no crash.
- [ ] Fill Floor Plan, Length, and Height. Expected: the orange rig summary card updates live with all values; the new length also shows in the Sites tab filter notice.
- [ ] Toggle several Subscriptions pills. Expected: selected pills turn orange and the green Active Memberships summary lists them.
- [ ] Reload the page (or sign in on another browser). Expected: all profile changes persisted via Supabase and load back exactly.

## Sign out

- [ ] Desktop: click Sign Out in the sidebar. Mobile: tap the user icon in the top bar. Expected: returns to the sign-in screen; reloading does not restore the session.
- [ ] Sign back in after signing out. Expected: rig profile, subscriptions, and first-time buyer setting are all restored; no leftover chat history from the prior session is required.
