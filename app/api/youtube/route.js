// Video search without API quota: parse ytInitialData from the public YouTube
// results page (no key, no daily limit). Falls back to the official Data API
// when scraping fails and a key is configured, then to stale cache.
import { rateLimit } from "../../../lib/ratelimit";

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Retry once on network-level failure with a fresh timeout signal
async function fetchOnceRetry(url, opts) {
  try {
    return await fetch(url, opts);
  } catch {
    return await fetch(url, { ...opts, signal: AbortSignal.timeout(8000) });
  }
}

async function scrapeSearch(query) {
  // sp=EgIQAQ%3D%3D filters results to videos only
  const res = await fetchOnceRetry(
    `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D&hl=en`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) throw new Error(`YouTube page returned ${res.status}`);
  const html = await res.text();

  const marker = "var ytInitialData = ";
  const start = html.indexOf(marker);
  if (start === -1) throw new Error("ytInitialData not found");
  const end = html.indexOf(";</script>", start);
  if (end === -1) throw new Error("ytInitialData terminator not found");
  const data = JSON.parse(html.slice(start + marker.length, end));

  // Walk the renderer tree and collect videoRenderer entries wherever they sit
  const videos = [];
  (function walk(node) {
    if (!node || typeof node !== "object" || videos.length >= 8) return;
    if (node.videoRenderer?.videoId) {
      const v = node.videoRenderer;
      videos.push({
        title: v.title?.runs?.[0]?.text || "Untitled",
        channel: v.ownerText?.runs?.[0]?.text || "",
        thumbnail: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
      });
      return;
    }
    for (const key in node) walk(node[key]);
  })(data);

  if (videos.length === 0) throw new Error("No videos parsed");
  return videos;
}

async function officialSearch(query) {
  if (!process.env.YOUTUBE_API_KEY) throw new Error("No YouTube API key configured");
  const res = await fetchOnceRetry(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(query)}&key=${process.env.YOUTUBE_API_KEY}`,
    { signal: AbortSignal.timeout(8000) }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "YouTube API error");
  return (data.items || []).map(item => ({
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }));
}

export async function GET(req) {
  const limited = rateLimit(req, "youtube");
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("query") || "").trim().slice(0, 100) || "RV camping";

  const cached = cache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Response.json(cached.data);
  }

  try {
    let videos;
    try {
      videos = await scrapeSearch(query);
    } catch (scrapeErr) {
      console.warn("YouTube scrape failed, trying official API:", scrapeErr.message);
      videos = await officialSearch(query);
    }
    const result = { videos };
    if (cache.size >= 200) cache.delete(cache.keys().next().value);
    cache.set(query, { data: result, timestamp: Date.now() });
    return Response.json(result);
  } catch (err) {
    console.error("YouTube fetch error:", err.message);
    if (cached) return Response.json(cached.data); // stale beats empty
    return Response.json(
      { videos: [], error: "Video search is unavailable right now." },
      { status: 500 }
    );
  }
}
