export default function manifest() {
  return {
    name: "Waymark: RV Co-Pilot",
    short_name: "Waymark",
    description: "AI co-pilot for RV travel with an offline assistant that works with no signal.",
    start_url: "/",
    display: "standalone",
    background_color: "#0D1117",
    theme_color: "#0D1117",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
