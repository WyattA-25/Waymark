const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "RV camping";

  // Return cached result if fresh
  const cached = cache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("YouTube cache hit:", query);
    return Response.json(cached.data);
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(query)}&key=${process.env.YOUTUBE_API_KEY}`
    );
    const data = await res.json();

    if (!res.ok) {
      console.error("YouTube API error:", data);
      // If quota exceeded and we have stale cache, return it rather than failing
      if (cached) {
        console.log("Returning stale cache due to quota error");
        return Response.json(cached.data);
      }
      return Response.json({ videos: [] }, { status: 500 });
    }

    const videos = (data.items || []).map(item => ({
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    const result = { videos };
    cache.set(query, { data: result, timestamp: Date.now() });

    return Response.json(result);
  } catch (err) {
    console.error("YouTube fetch error:", err);
    if (cached) return Response.json(cached.data);
    return Response.json({ videos: [] }, { status: 500 });
  }
}