# Waymark

An AI co-pilot for RV travel, built with Next.js. Waymark gives RVers one assistant for repairs, routes, and campsites, with recommendations sized to their specific rig. It also includes an offline assistant that runs a language model directly in the browser for use without a connection.

## Features

- Waymark AI: one assistant for repairs, routes, and campsite questions, aware of your rig's dimensions and memberships
- Offline mode: an in-browser language model (WebLLM, Llama 3.2) for emergencies with no connectivity
- Route Weather: live wind and storm warnings along your trip (Open-Meteo)
- Explore: campsite recommendations filtered to your rig length (Recreation.gov)
- Rig Profile: stores your dimensions, tanks, and memberships
- How-to videos: relevant clips pulled in for repair and setup questions (YouTube)

## Tech Stack

- Next.js 15 (App Router), React, Zustand
- Gemini (cloud assistant) and WebLLM / Llama 3.2 (offline, in-browser)
- Supabase (authentication and database)
- External data: Open-Meteo, Recreation.gov, NHTSA vehicle lookup, YouTube
- Lucide React (icons)

## Getting Started

1. Install dependencies:
   npm install
2. Create a .env.local file with:
   GEMINI_API_KEY=your_key
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   RECREATION_GOV_API_KEY=your_key
   YOUTUBE_API_KEY=your_key
3. Run the development server:
   npm run dev
4. Open http://localhost:3000 in your browser.

## Status

🚧 In active development
