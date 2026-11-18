import { useState } from "react";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { palette as c } from "../../constants/palette";
import {
  Button, Copy, ErrorMessage, Field, Loading, Screen,
} from "../../components/app/ui";
import { useRepository } from "../../db/provider";
import { useAction, useResource } from "../../lib/hooks";
import { addDays, displayDate, localDateKey } from "../../lib/dates";
import { scheduledForDate, upcoming } from "../../features/supports/schedule";

const reflections = [
  {
    title: "You can begin again without starting over.",
    body: "The work you've already done doesn't disappear because today is difficult. A hard moment is a moment, not your whole story.",
    question: "What is one thing you know now that you didn't know a year ago?",
  },
  {
    title: "A feeling can be true without being in charge.",
    body: "You don't have to argue with your emotions to choose your next action. You can make room for both the feeling and your values.",
    question: "What would acting from your values look like today?",
  },
  {
    title: "Connection doesn't require a polished version of you.",
    body: "There is room for you at the table before you find the right words. Showing up as you are is already a beginning.",
    question: "Who helps you feel like you can arrive as yourself?",
  },
  {
    title: "Rest is part of the work.",
    body: "Your body is not a separate project from your recovery. Sleep, nourishment, and a little breathing room are forms of care.",
    question: "What does your body need that you've been overlooking?",
  },
  {
    title: "You are allowed to notice what went well.",
    body: "Growth isn't only visible in what you fix. Sometimes it shows up in a conversation you enjoyed or a moment you let yourself feel safe.",
    question: "What small part of today deserves to be remembered?",
  },
  {
    title: "Being accountable doesn't require being cruel to yourself.",
    body: "You can name your part, make a repair, and refuse to turn the lesson into a verdict on your worth.",
    question: "What would a useful repair look like, without self-punishment?",
  },
  {
    title: "Today is not an exam you need to pass.",
    body: "You can have a good day, a tangled day, or an ordinary one. All of them belong in the story of a life you're still living.",
    question: "What would make today a little more yours?",
  },
];

const shortcuts: Array<{
  title: string; description: string; glyph: string; action: () => void;
}> = [
  { title: "How I feel", description: "Name what's here", glyph: "♡", action: () => router.navigate("/check-in") },
  { title: "My Days", description: "Your story so far", glyph: "▦", action: () => router.navigate("/my-days") },
  { title: "My Toolbox", description: "Skills for this moment", glyph: "✳", action: () => router.navigate("/tools") },
  { title: "My Supports", description: "People and meetings", glyph: "♧", action: () => router.navigate("/supports") },
  { title: "Explore patterns", description: "What you may notice", glyph: "◈", action: () => router.push("/patterns") },
  { title: "A little more", description: "About Open Chair", glyph: "☼", action: () => router.push("/settings") },
];

function Shortcut({ title, description, glyph, action }: (typeof shortcuts)[number]) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title + ". " + description}
      onPress={action}
      style={({ pressed }) => [styles.shortcut, pressed && { opacity: 0.72 }]}
    >
      <View style={styles.shortcutIcon}><Text style={styles.shortcutGlyph}>{glyph}</Text></View>
      <Text style={styles.shortcutTitle}>{title}</Text>
      <Text style={styles.shortcutDescription}>{description}</Text>
    </Pressable>
  );
}

export default function TodayScreen() {
  const repository = useRepository();
  const action = useAction();
  const [journal, setJournal] = useState("");
  const [expanded, setExpanded] = useState(false);
  const resource = useResource(async () => {
    const today = localDateKey();
    return {
      today,
      history: await repository.history(addDays(today, -29), today),
      supports: await repository.supports(),
    };
  });
  const today = resource.data?.today ?? localDateKey();
  const history = resource.data?.history;
  const supports = resource.data?.supports ?? [];
  const todayMeetings = scheduledForDate(supports, today);
  const nextMeeting = todayMeetings[0] ?? upcoming(supports)[0] ?? null;
  const checkIns = history?.checkIns.filter(entry => entry.local_date === today) ?? [];
  const currentReflection = reflections[Math.floor(new Date(today + "T12:00:00").getTime() / 86400000) % reflections.length];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const meetingDetail = nextMeeting
    ? nextMeeting.date.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })
    : "";
  return (
    <Screen>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>{displayDate(today).toUpperCase()}</Text>
        <Text style={styles.greeting}>{greeting}.{"\n"}There's room for you here.</Text>
        <Text style={styles.subtle}>Come as you are. Stay for what helps.</Text>
      </View>

      <View style={styles.meetingCard}>
        <View style={styles.overlineRow}>
          <Text style={styles.lightEyebrow}>YOUR NEXT MEETING OR SUPPORT</Text>
          <Text style={styles.meetingGlyph}>✺</Text>
        </View>
        {nextMeeting ? (
          <>
            <Text style={styles.meetingName}>{nextMeeting.support.name}</Text>
            <Text style={styles.meetingInfo}>{meetingDetail}  ·  {nextMeeting.support.mode}</Text>
            <Button
              label="Open meeting details"
              onPress={() => router.push({ pathname: "/support/[id]", params: { id: nextMeeting.support.id } })}
            />
            {todayMeetings.length > 1 && (
              <Text style={styles.meetingInfo}>{todayMeetings.length - 1} more scheduled for today</Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.meetingName}>Find your people.</Text>
            <Text style={styles.meetingInfo}>Add your regular meetings, people, or places of support to see what's coming up.</Text>
            <Button label="Add a meeting or support" onPress={() => router.push("/support/new")} />
          </>
        )}
        <Pressable
          onPress={() => router.navigate("/supports")}
          accessibilityRole="button"
          style={styles.meetingLink}
        >
          <Text style={styles.meetingLinkText}>See all my supports  →</Text>
        </Pressable>
      </View>

      <View style={styles.reflectionCard}>
        <View style={styles.overlineRow}>
          <Text style={styles.eyebrow}>A THOUGHT FOR TODAY</Text>
          <Text style={styles.reflectionGlyph}>❋</Text>
        </View>
        <Text style={styles.reflectionTitle}>{currentReflection.title}</Text>
        <Text style={styles.reflectionBody}>{currentReflection.body}</Text>
        <View style={styles.questionBox}>
          <Text style={styles.questionLabel}>SOMETHING TO SIT WITH</Text>
          <Text style={styles.questionText}>{currentReflection.question}</Text>
        </View>
        {!expanded ? (
          <Pressable accessibilityRole="button" style={styles.reflectButton} onPress={() => setExpanded(true)}>
            <Text style={styles.reflectButtonText}>Reflect on this  ✎</Text>
          </Pressable>
        ) : (
          <View style={styles.journalBox}>
            <Field
              label="My reflection"
              value={journal}
              onChangeText={setJournal}
              multiline
              maxLength={500}
              placeholder="A few words are enough. You can use your phone's keyboard microphone to dictate."
            />
            <ErrorMessage message={action.error} />
            <Button
              label={action.busy ? "Saving..." : "Save to My Days"}
              disabled={action.busy || !journal.trim()}
              onPress={() => action.run(async () => {
                await repository.saveReflection(journal.trim());
                setJournal("");
                setExpanded(false);
                await resource.reload();
                Alert.alert("Saved", "Your reflection is in My Days.");
              })}
            />
            <Button label="Not now" secondary onPress={() => setExpanded(false)} />
          </View>
        )}
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Your space, your pace</Text>
        <Text style={styles.subtle}>Pick what feels useful. Nothing to complete.</Text>
      </View>
      <View style={styles.shortcutGrid}>
        {shortcuts.map(item => <Shortcut key={item.title} {...item} />)}
      </View>

      <View style={styles.endCard}>
        <Text style={styles.endTitle}>A little care goes a long way.</Text>
        <Text style={styles.endBody}>
          Sleep, food, movement, and body check-ins are part of our next build. For now, you can start with your feelings, your people, or a tool.
        </Text>
        <Text style={styles.endBody}>
          {checkIns.length ? `You've checked in ${checkIns.length} time${checkIns.length === 1 ? "" : "s"} today.` : "You don't have to check in to be welcome here."}
        </Text>
      </View>

      {resource.loading && <Loading />}
      <ErrorMessage message={resource.error} />
      {resource.error && <Button label="Try again" secondary onPress={() => void resource.reload()} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: 8, paddingTop: 8, paddingBottom: 6 },
  eyebrow: { color: c.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1.7 },
  lightEyebrow: { color: "#E8F2E5", fontSize: 11, fontWeight: "800", letterSpacing: 1.1, flex: 1 },
  greeting: { fontSize: 29, lineHeight: 36, fontWeight: "700", color: c.ink, letterSpacing: -0.7 },
  subtle: { color: c.muted, fontSize: 14, lineHeight: 21 },
  meetingCard: { backgroundColor: "#345740", borderRadius: 24, padding: 21, gap: 13 },
  overlineRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  meetingGlyph: { color: "#CFE2BF", fontSize: 24 },
  meetingName: { color: "#FFFFFF", fontSize: 23, lineHeight: 30, fontWeight: "700" },
  meetingInfo: { color: "#E3ECDD", fontSize: 14, lineHeight: 21 },
  meetingLink: { paddingVertical: 5, alignSelf: "flex-start" },
  meetingLinkText: { color: "#F6FFF0", fontSize: 14, fontWeight: "600" },
  reflectionCard: { backgroundColor: "#FFFDF8", borderRadius: 24, padding: 21, borderWidth: 1, borderColor: c.border, gap: 14 },
  reflectionGlyph: { color: "#92AD86", fontSize: 24 },
  reflectionTitle: { color: c.ink, fontSize: 23, lineHeight: 30, fontWeight: "700", letterSpacing: -0.3 },
  reflectionBody: { color: c.ink, fontSize: 16, lineHeight: 26 },
  questionBox: { backgroundColor: "#E9EFE4", borderRadius: 14, padding: 15, gap: 8 },
  questionLabel: { color: c.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  questionText: { color: c.ink, fontSize: 15, lineHeight: 23, fontWeight: "500" },
  reflectButton: { borderRadius: 14, backgroundColor: c.tint, alignItems: "center", padding: 15 },
  reflectButtonText: { color: c.primary, fontWeight: "700", fontSize: 15 },
  journalBox: { gap: 12 },
  sectionHead: { gap: 5, paddingTop: 8 },
  sectionTitle: { color: c.ink, fontSize: 23, fontWeight: "700", lineHeight: 29 },
  shortcutGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  shortcut: { width: "48%", flexGrow: 1, flexBasis: "43%", minHeight: 145, padding: 15, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, gap: 7, justifyContent: "flex-start" },
  shortcutIcon: { width: 39, height: 39, backgroundColor: c.tint, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  shortcutGlyph: { color: c.primary, fontSize: 23, fontWeight: "700" },
  shortcutTitle: { color: c.ink, fontSize: 15, fontWeight: "700" },
  shortcutDescription: { color: c.muted, fontSize: 12, lineHeight: 18 },
  endCard: { borderRadius: 20, padding: 19, backgroundColor: "#E8EEE0", gap: 9 },
  endTitle: { color: c.primary, fontSize: 17, fontWeight: "700" },
  endBody: { color: c.ink, fontSize: 14, lineHeight: 22 },
});
