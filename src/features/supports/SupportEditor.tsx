import { useState } from "react";
import { Image, Text, View } from "react-native";
import { findPodcastCovers, type PodcastMatch } from "./podcastArt";
import { router } from "expo-router";
import {
  Button,
  Card,
  Chip,
  Copy,
  ErrorMessage,
  Field,
  Heading,
  Row,
} from "../../components/app/ui";
import type { Support } from "../../db/types";
import { useRepository } from "../../db/provider";
import { useAction } from "../../lib/hooks";

function toDisplayTime(value: string): { time: string; period: "AM" | "PM" } {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute))
    return { time: "9:00", period: "AM" };
  return {
    time: `${hour % 12 || 12}:${String(minute).padStart(2, "0")}`,
    period: hour >= 12 ? "PM" : "AM",
  };
}
function toSavedTime(value: string, period: "AM" | "PM"): string | null {
  const match = /^(1[0-2]|0?[1-9]):([0-5][0-9])$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]) % 12 + (period === "PM" ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

export function SupportEditor({
  initial,
  onSaved,
}: {
  initial: Support;
  onSaved?: () => void;
}) {
  const [support, setSupport] = useState(initial);
  const [displayTime, setDisplayTime] = useState(() => toDisplayTime(initial.time).time);
  const [period, setPeriod] = useState<"AM" | "PM">(() => toDisplayTime(initial.time).period);
  const [lookup, setLookup] = useState("");
  const [matches, setMatches] = useState<PodcastMatch[]>([]);
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const repository = useRepository();
  const action = useAction();
  function update<K extends keyof Support>(key: K, value: Support[K]) {
    setSupport((current) => ({ ...current, [key]: value }));
  }
  return (
    <>
      <Field
        label="Name"
        value={support.name}
        onChangeText={(v) => update("name", v)}
        maxLength={100}
      />
      <Heading small>Kind of support</Heading>
      <Row>
        {[
          "Meeting",
          "Podcast",
          "Therapy",
          "Support group",
          "Appointment",
          "Coaching",
          "Class",
          "Call",
          "Other",
        ].map((type) => (
          <Chip
            key={type}
            label={type}
            selected={support.type === type}
            onPress={() => update("type", type)}
          />
        ))}
      </Row>
      {support.type === "Podcast" && (
        <Card>
          <Heading small>Listen to your podcast</Heading>
          <Copy muted>Add your Amazon Music, Spotify, Apple Podcasts or other podcast link. The button will open the actual link you save.</Copy>
          <Row>
            {["Amazon Music", "Spotify", "Apple Podcasts", "Other"].map(source => (
              <Chip key={source} label={source} selected={support.platform === source} onPress={() => update("platform", source)} />
            ))}
          </Row>
          <Field label="Podcast listening URL" autoCapitalize="none" keyboardType="url"
            maxLength={2000} placeholder="https://music.amazon.com/podcasts/..."
            value={support.url} onChangeText={v => update("url", v)} />
          <Field label="Find cover art using a podcast name or Spotify / Apple URL"
            autoCapitalize="none" value={lookup} onChangeText={setLookup}
            placeholder="The Mel Robbins Podcast" />
          <Button secondary label={looking ? "Searching..." : "Find podcast artwork"}
            disabled={looking || (!lookup.trim() && !support.name.trim())}
            onPress={() => {
              setLooking(true);
              setLookupError("");
              setMatches([]);
              void findPodcastCovers(lookup || support.url, support.name).then(found => {
                setMatches(found);
                if (!found.length) setLookupError("No matching cover found. You can paste an artwork URL below.");
              }).catch(e => setLookupError(e instanceof Error ? e.message : "Artwork lookup failed. You can still save this podcast."))
                .finally(() => setLooking(false));
            }} />
          {!!lookupError && <Copy muted>{lookupError}</Copy>}
          {matches.map((match, i) => (
            <Card key={i}>
              <Row>
                <Image source={{ uri: match.artwork }} style={{ width: 60, height: 60, borderRadius: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text>{match.title}</Text>
                  <Text>{match.creator} · {match.source}</Text>
                  <Button secondary label="Use this cover" onPress={() => {
                    setSupport(current => ({...current, name: current.name.trim() || match.title, artwork_url: match.artwork }));
                    setMatches([]);
                  }} />
                </View>
              </Row>
            </Card>
          ))}
          <Field label="Cover image URL (optional)" autoCapitalize="none" keyboardType="url"
            value={support.artwork_url} onChangeText={v => update("artwork_url", v)}
            placeholder="https://.../cover.jpg" />
          {!!support.artwork_url && <Image source={{ uri: support.artwork_url }}
            style={{ width: 110, height: 110, borderRadius: 14 }} resizeMode="cover" />}
        </Card>
      )}
      {support.type !== "Podcast" && <Heading small>How you connect</Heading>}
      {support.type !== "Podcast" && <Row>
        {["In person", "Online", "Phone", "Flexible / other"].map((mode) => (
          <Chip
            key={mode}
            label={mode}
            selected={support.mode === mode}
            onPress={() => update("mode", mode)}
          />
        ))}
      </Row>}
      {support.type !== "Podcast" && support.mode === "Online" && (
        <>
          <Field
            label="Meeting link"
            autoCapitalize="none"
            keyboardType="url"
            maxLength={2000}
            value={support.url}
            onChangeText={(v) => update("url", v)}
            placeholder="https://…"
          />
          <Field
            label="Meeting ID (optional)"
            maxLength={100}
            value={support.meeting_id}
            onChangeText={(v) => update("meeting_id", v)}
          />
          <Field
            label="Passcode (optional)"
            maxLength={100}
            value={support.passcode}
            onChangeText={(v) => update("passcode", v)}
          />
        </>
      )}
      {support.type !== "Podcast" && support.mode === "In person" && (
        <Field
          label="Place or address"
          maxLength={500}
          value={support.location}
          onChangeText={(v) => update("location", v)}
        />
      )}
      {support.type !== "Podcast" && support.mode === "Phone" && (
        <Field
          label="Phone number"
          maxLength={40}
          keyboardType="phone-pad"
          value={support.phone}
          onChangeText={(v) => update("phone", v)}
        />
      )}
      {support.type !== "Podcast" && <Card>
        <Heading small>Weekly rhythm</Heading>
        <Copy muted>
          Choose any days, or leave them blank for an unscheduled support. Times
          follow this device’s local time zone.
        </Copy>
        <Row>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
            <Chip
              key={day}
              label={day}
              selected={support.weekdays.includes(i)}
              onPress={() =>
                update(
                  "weekdays",
                  support.weekdays.includes(i)
                    ? support.weekdays.filter((d) => d !== i)
                    : [...support.weekdays, i],
                )
              }
            />
          ))}
        </Row>
        {!!support.weekdays.length && (
          <>
            <Field
              label="Meeting time (hour:minute)"
              placeholder="7:30"
              maxLength={5}
              keyboardType="numbers-and-punctuation"
              value={displayTime}
              onChangeText={setDisplayTime}
            />
            <Row>
              <Chip label="AM" selected={period === "AM"} onPress={() => setPeriod("AM")} />
              <Chip label="PM" selected={period === "PM"} onPress={() => setPeriod("PM")} />
            </Row>
          </>
        )}
      </Card>}
      <Field
        label="Notes (optional)"
        multiline
        maxLength={1000}
        value={support.notes}
        onChangeText={(v) => update("notes", v)}
      />
      <Row>
        <Chip
          label="Favorite"
          selected={!!support.favorite}
          onPress={() => update("favorite", support.favorite ? 0 : 1)}
        />
        <Chip
          label="Active"
          selected={!!support.active}
          onPress={() => update("active", support.active ? 0 : 1)}
        />
      </Row>
      <Copy muted>Reminders are not scheduled in this version.</Copy>
      <ErrorMessage message={action.error} />
      <Button
        label={action.busy ? "Saving…" : "Save support"}
        disabled={action.busy || !support.name.trim()}
        onPress={() =>
          action.run(async () => {
            const savedTime = support.weekdays.length ? toSavedTime(displayTime, period) : support.time;
            if (support.weekdays.length && !savedTime)
              throw new Error("Enter a time like 7:30, then choose AM or PM.");
            await repository.saveSupport({ ...support, weekdays: support.type === "Podcast" ? [] : support.weekdays, time: savedTime || support.time });
            if (onSaved) onSaved();
            else
              router.replace({
                pathname: "/support/[id]",
                params: { id: support.id },
              });
          })
        }
      />
    </>
  );
}
