import { useState } from "react";
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Button, Card, Copy, ErrorMessage, Eyebrow, Field, Heading, Loading, Row, Chip, Screen, confirmDelete } from "../components/app/ui";
import { palette as c } from "../constants/palette";
import { useRepository } from "../db/provider";
import { useAction, useResource } from "../lib/hooks";
import { newLibraryItem } from "../db/repository";
import type { LibraryItem, LibraryKind } from "../db/types";

type AppleShow = {
  collectionName?: string;
  artistName?: string;
  artworkUrl600?: string;
  artworkUrl100?: string;
  collectionViewUrl?: string;
  primaryGenreName?: string;
  trackCount?: number;
};
const labels: Record<LibraryKind, string> = {
  podcast: "Podcast", reflection: "Reflection", article: "Article", video: "Video", other: "Other",
};
const KINDS: LibraryKind[] = ["podcast", "reflection", "article", "video", "other"];

async function findPodcast(input: string): Promise<AppleShow[]> {
  const text = input.trim();
  if (!text) throw new Error("Paste a podcast link or enter the show name first.");
  // Apple Podcasts IDs give exact lookup; other platform links need a show name for matching.
  const appleId = /podcasts\.apple\.com\/[\w-]+\/podcast\/[^\s?#]*?id(\d+)/i.exec(text)?.[1]
    ?? /podcasts\.apple\.com\/[^\s]*\bid(\d+)/i.exec(text)?.[1];
  const looksUrl = /^https?:\/\//i.test(text);
  if (looksUrl && !appleId)
    throw new Error("For Spotify or other links, enter the podcast's NAME in the search field. Keep the original URL in the Link field.");
  const url = appleId
    ? `https://itunes.apple.com/lookup?id=${appleId}&entity=podcast`
    : `https://itunes.apple.com/search?term=${encodeURIComponent(text)}&media=podcast&entity=podcast&limit=8`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Apple Podcasts is unavailable. You can still enter details manually.");
  const json = (await response.json()) as { results?: AppleShow[] };
  return (json.results ?? []).filter((x) => !!x.collectionName).slice(0, 8);
}

function Art({ item, size = 68 }: { item: LibraryItem; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (!item.artwork_url || failed)
    return (
      <View style={[styles.artPlaceholder, { width: size, height: size }]}>
        <Text style={{ color: c.primary, fontSize: size > 70 ? 35 : 25 }}>
          {item.kind === "podcast" ? "♫" : item.kind === "reflection" ? "✎" : "✳"}
        </Text>
      </View>
    );
  return (
    <Image
      source={{ uri: item.artwork_url }}
      style={{ width: size, height: size, borderRadius: 14, backgroundColor: c.tint }}
      resizeMode="cover"
      onError={() => setFailed(true)}
      accessibilityLabel={item.title + " cover"}
    />
  );
}

export default function LibraryScreen() {
  const repository = useRepository();
  const action = useAction();
  const resource = useResource(() => repository.libraryItems());
  const [item, setItem] = useState<LibraryItem | null>(null);
  const [lookup, setLookup] = useState("");
  const [results, setResults] = useState<AppleShow[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [filter, setFilter] = useState<LibraryKind | "all">("all");
  const [showAll, setShowAll] = useState(false);
  const items = (resource.data ?? []).filter((x) => filter === "all" || x.kind === filter);

  function change<K extends keyof LibraryItem>(field: K, value: LibraryItem[K]) {
    setItem((current) => current ? { ...current, [field]: value } : current);
  }
  function edit(selected?: LibraryItem) {
    setItem(selected ?? newLibraryItem());
    setLookup("");
    setResults([]);
    setSearchError("");
  }
  async function search() {
    setSearchError("");
    setSearching(true);
    setResults([]);
    try {
      const found = await findPodcast(lookup);
      if (found.length === 0) setSearchError("No matching show found. Try a different show name or enter the artwork manually.");
      setResults(found);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Couldn't look up this show. You can still add it manually.");
    } finally {
      setSearching(false);
    }
  }
  function chooseShow(show: AppleShow) {
    if (!item) return;
    setItem({
      ...item,
      title: show.collectionName?.trim() || item.title,
      creator: show.artistName?.trim() || item.creator,
      artwork_url: show.artworkUrl600 || show.artworkUrl100 || item.artwork_url,
      url: item.url || show.collectionViewUrl || "",
      summary: item.summary || (show.primaryGenreName ? `Category: ${show.primaryGenreName}` : ""),
    });
    setResults([]);
    setSearchError("");
  }
  return (
    <Screen>
      <Eyebrow>Things worth returning to</Eyebrow>
      <Heading>My Library</Heading>
      <Copy muted>Podcasts, reflections, articles, and little discoveries. Your collection stays on this device.</Copy>
      {item ? (
        <>
          <Card tinted>
            <Heading small>{item.title ? "Edit your saved item" : "Add to your library"}</Heading>
            <Row>
              {KINDS.map(kind => (
                <Chip key={kind} label={labels[kind]} selected={item.kind === kind}
                  onPress={() => change("kind", kind)} />
              ))}
            </Row>
          </Card>
          {item.kind === "podcast" && (
            <Card>
              <Heading small>Find the cover art</Heading>
              <Copy muted>Search by podcast name, or paste an Apple Podcasts show link. Choose the correct match to fill in the title, creator, and artwork.</Copy>
              <Field label="Search Apple Podcasts" value={lookup} onChangeText={setLookup}
                autoCapitalize="none" placeholder="Podcast title or Apple Podcasts URL" />
              <Button label={searching ? "Searching..." : "Find podcast artwork"} disabled={searching || !lookup.trim()} onPress={() => void search()} />
              {!!searchError && <Copy muted>{searchError}</Copy>}
              {results.map((show, i) => (
                <Pressable key={i} accessibilityRole="button" onPress={() => chooseShow(show)} style={styles.result}>
                  {!!show.artworkUrl100 && <Image source={{ uri: show.artworkUrl100 }} style={styles.resultArt} />}
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.title}>{show.collectionName}</Text>
                    <Text style={styles.muted}>{show.artistName}</Text>
                    <Text style={styles.choose}>Use this artwork and details →</Text>
                  </View>
                </Pressable>
              ))}
              <Copy muted>Spotify and other listening links are welcome. Search by show name above, then paste your preferred platform's URL below.</Copy>
            </Card>
          )}
          <Card>
            <Heading small>Details</Heading>
            <Field label="Title" value={item.title} maxLength={180} onChangeText={x => change("title", x)} />
            <Field label="Creator / source (optional)" value={item.creator} maxLength={180} onChangeText={x => change("creator", x)} />
            <Field label="Link (optional)" value={item.url} onChangeText={x => change("url", x)} autoCapitalize="none" keyboardType="url" placeholder="https://..." />
            <Field label="Cover image URL (optional)" value={item.artwork_url}
              onChangeText={x => change("artwork_url", x)} autoCapitalize="none" keyboardType="url" placeholder="https://...jpg" />
            <Field label="Description (optional)" value={item.summary} onChangeText={x => change("summary", x)} maxLength={1000} multiline />
            <Field label="What I want to remember (optional)" value={item.notes} onChangeText={x => change("notes", x)} maxLength={2000} multiline />
            <Row><Chip label="★ Favorite" selected={!!item.favorite} onPress={() => change("favorite", item.favorite ? 0 : 1)} /></Row>
            {!!item.artwork_url && <View style={{ alignItems: "flex-start" }}><Art key={item.artwork_url} item={item} size={110}/></View>}
            <ErrorMessage message={action.error} />
            <Button label={action.busy ? "Saving..." : "Save to my library"} disabled={action.busy || !item.title.trim()}
              onPress={() => action.run(async () => {
                await repository.saveLibraryItem(item);
                await resource.reload();
                setItem(null);
              })} />
            <Button label="Cancel" secondary onPress={() => setItem(null)} />
          </Card>
        </>
      ) : (
        <>
          <Button label="+ Save a podcast, reflection or link" onPress={() => edit()} />
          <Row>
            <Chip label="All" selected={filter === "all"} onPress={() => setFilter("all")} />
            {KINDS.map(kind => <Chip key={kind} label={labels[kind]} selected={filter === kind} onPress={() => setFilter(kind)} />)}
          </Row>
          {resource.loading && <Loading />}
          <ErrorMessage message={resource.error} />
          {resource.error && <Button label="Reload library" secondary onPress={() => void resource.reload()} />}
          {!resource.loading && !items.length && (
            <Card tinted><Heading small>Your shelf is waiting.</Heading><Copy>Add a favorite podcast or a reflection that matters to you. Cover artwork makes it feel like your own collection.</Copy></Card>
          )}
          {items.slice(0, showAll ? undefined : 100).map(saved => (
            <Card key={saved.id}>
              <View style={styles.saved}>
                <Art key={saved.id + saved.artwork_url} item={saved} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.title}>{saved.favorite ? "★ " : ""}{saved.title}</Text>
                  <Text style={styles.muted}>{labels[saved.kind]}{saved.creator ? " · " + saved.creator : ""}</Text>
                  {!!saved.summary && <Text numberOfLines={3} style={styles.muted}>{saved.summary}</Text>}
                </View>
              </View>
              {!!saved.notes && <Copy>{saved.notes}</Copy>}
              <Row>
                {!!saved.url && <Button secondary label="Open link" onPress={() => void Linking.openURL(saved.url).catch(() => Alert.alert("Can't open link", "Check the saved URL."))} />}
                <Button secondary label="Edit" onPress={() => edit(saved)} />
                <Button secondary label="Delete" onPress={() => confirmDelete("Remove from My Library?", () => void action.run(async () => { await repository.deleteLibraryItem(saved.id); await resource.reload(); }))} />
              </Row>
            </Card>
          ))}
          {items.length > 100 && !showAll && <Button label="Show all saved items" secondary onPress={() => setShowAll(true)} />}
          <Copy muted>Private and saved locally. Uninstalling without a backup may remove this collection. A cross-device backup is planned, not available in this build.</Copy>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  saved: { flexDirection: "row", gap: 13, alignItems: "flex-start" },
  title: { color: c.ink, fontSize: 16, fontWeight: "700", lineHeight: 22 },
  muted: { color: c.muted, fontSize: 13, lineHeight: 19 },
  choose: { color: c.primary, fontSize: 13, fontWeight: "700" },
  result: { backgroundColor: c.tint, padding: 12, borderRadius: 14, flexDirection: "row", gap: 12, alignItems: "center" },
  resultArt: { height: 56, width: 56, borderRadius: 10, backgroundColor: c.background },
  artPlaceholder: { backgroundColor: c.tint, borderRadius: 14, justifyContent: "center", alignItems: "center" },
});
