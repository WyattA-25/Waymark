export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "RV camping tips";

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "8");
    url.searchParams.set("order", "relevance");
    url.searchParams.set("videoDuration", "medium");
    url.searchParams.set("key", process.env.YOUTUBE_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json();
      console.error("YouTube API error:", error);
      return Response.json(
        { error: "YouTube API error", detail: error },
        { status: 500 }
      );
    }

    const data = await response.json();

    const videos = data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      published: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    return Response.json({ videos });

  } catch (err) {
    console.error("YouTube route error:", err);
    return Response.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}