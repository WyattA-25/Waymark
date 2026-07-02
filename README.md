# Waymark

An AI-powered RV co-pilot built with Next.js. Chat runs two ways: Gemini in the cloud, and Llama 3.2 fully offline in the browser via WebLLM, so it still answers at a campsite with no signal.

## Features
- **Waymark AI**: one unified assistant for repairs, routes, and campsites, tuned to your specific rig
- **Offline mode**: Llama 3.2 runs in-browser (WebLLM + WebGPU) and answers with zero network
- **Route Weather**: live wind and storm warnings along your trip (Open-Meteo)
- **Campsite Search**: real campgrounds from Recreation.gov, filtered for your rig length
- **Vibe Feed**: curated RV videos via the YouTube Data API
- **Rig Profile**: stores your dimensions, tanks, and memberships (Supabase)

## Tech Stack
- Next.js 16 (App Router)
- React 19
- Gemini (cloud chat) + WebLLM / Llama 3.2 1B (offline chat)
- Supabase (auth + database)
- Lucide React (icons)

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the keys
3. `npm run dev`

## Status
🚧 In active development
