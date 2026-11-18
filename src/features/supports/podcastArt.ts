/** Search artwork without changing the user's preferred listening platform. */
export type PodcastMatch = {
  title: string;
  creator: string;
  artwork: string;
  source: "Apple Podcasts" | "Spotify";
};

export async function findPodcastCovers(nameOrUrl: string, titleFallback: string): Promise<PodcastMatch[]> {
  const input = nameOrUrl.trim();
  const name = titleFallback.trim();
  if (!input && !name) throw new Error("Enter the show name or a podcast link.");
  if (/^https:\/\/open\.spotify\.com\/(show|episode)\//i.test(input)) {
    const response = await fetch("https://open.spotify.com/oembed?url=" + encodeURIComponent(input));
    if (!response.ok) throw new Error("Spotify couldn't load the artwork. You can search by title.");
    const data = await response.json() as { title?: string; author_name?: string; thumbnail_url?: string };
    return data.thumbnail_url ? [{
      title: data.title || name,
      creator: data.author_name || "",
      artwork: data.thumbnail_url,
      source: "Spotify",
    }] : [];
  }
  const appleId = /^https:\/\/podcasts\.apple\.com\//i.test(input)
    ? /\/id(\d+)/i.exec(input)?.[1] : undefined;
  // Amazon Music doesn't offer unauthenticated public artwork lookup from arbitrary
  // shared links. Use show-name matching instead, and retain the Amazon URL.
  const term = /^https?:\/\//i.test(input) ? name : input || name;
  if (!appleId && !term) throw new Error("Enter the podcast name to find artwork for this link.");
  const endpoint = appleId
    ? "https://itunes.apple.com/lookup?id=" + appleId + "&entity=podcast"
    : "https://itunes.apple.com/search?media=podcast&entity=podcast&limit=8&term=" + encodeURIComponent(term);
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error("Artwork search is unavailable. You can still paste a cover image URL.");
  const data = await response.json() as { results?: {
    collectionName?: string; artistName?: string; artworkUrl600?: string; artworkUrl100?: string;
  }[] };
  return (data.results || []).filter(x => !!x.collectionName && !!(x.artworkUrl600 || x.artworkUrl100))
    .slice(0, 8).map(x => ({
      title: x.collectionName || "",
      creator: x.artistName || "",
      artwork: x.artworkUrl600 || x.artworkUrl100 || "",
      source: "Apple Podcasts" as const,
    }));
}
