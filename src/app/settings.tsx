import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Button,
  Card,
  Copy,
  ErrorMessage,
  Eyebrow,
  Heading,
  Screen,
  confirmDelete,
} from "../components/app/ui";
import { palette as c } from "../constants/palette";
import { useRepository } from "../db/provider";
import { useAction } from "../lib/hooks";

const flowSteps = [
  {
    title: "Notice",
    body: "Pause and name what is here.",
  },
  {
    title: "Understand",
    body: "Get curious about what may be underneath the surface.",
  },
  {
    title: "Respond",
    body: "Choose a tool, support, or small next step.",
  },
  {
    title: "Remember",
    body: "Keep what mattered, helped, or felt true.",
  },
  {
    title: "Notice patterns",
    body: "Over time, see what repeats and what helps.",
  },
];

const dbtAreas = [
  {
    title: "Mindfulness",
    body: "Notice what is happening in the present moment without immediately judging it or reacting to it.",
  },
  {
    title: "Emotion Regulation",
    body: "Understand emotions, what influences them, and how to respond with more intention.",
  },
  {
    title: "Distress Tolerance",
    body: "Get through difficult moments without making the situation worse, especially when it cannot be fixed right away.",
  },
  {
    title: "Interpersonal Effectiveness",
    body: "Communicate needs, set boundaries, navigate conflict, and care for relationships while respecting yourself.",
  },
];

export default function Settings() {
  const repository = useRepository();
  const action = useAction();
  const [message, setMessage] = useState("");

  return (
    <Screen>
      <Heading>About & Settings</Heading>
      <Copy muted>Open Chair · Reflect. Adjust. Grow.</Copy>

      <Card tinted>
        <Eyebrow>How Open Chair works</Eyebrow>
        <Copy>
          Open Chair is built to help you slow down, notice what is happening,
          and respond with more intention.
        </Copy>

        <View style={styles.flowList}>
          {flowSteps.map((step, index) => (
            <View key={step.title}>
              <View style={styles.flowCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.flowCopy}>
                  <Text style={styles.flowTitle}>{step.title}</Text>
                  <Text style={styles.flowBody}>{step.body}</Text>
                </View>
              </View>
              {index < flowSteps.length - 1 && (
                <Text accessibilityElementsHidden style={styles.flowArrow}>
                  ↓
                </Text>
              )}
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Eyebrow>About the tools</Eyebrow>
        <Copy>
          Many of the tools in Open Chair are inspired by skills used in DBT,
          or Dialectical Behavior Therapy.
        </Copy>

        <View style={styles.dbtGrid}>
          {dbtAreas.map((area) => (
            <View key={area.title} style={styles.dbtCard}>
              <Text style={styles.dbtTitle}>{area.title}</Text>
              <Text style={styles.dbtBody}>{area.body}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card tinted>
        <Eyebrow>What is DBT?</Eyebrow>
        <Copy>
          DBT stands for Dialectical Behavior Therapy. It is an evidence-based
          form of therapy that teaches practical skills for handling intense
          emotions, stressful situations, relationships, and overwhelming
          moments.
        </Copy>
        <Copy>
          One of its core ideas is that two things can be true at the same
          time: you can accept what you are feeling right now and still choose
          to respond differently.
        </Copy>
        <Copy muted>
          Open Chair uses DBT-informed tools to support reflection, grounding,
          and intentional action. You do not need to know DBT or be in therapy
          to use them.
        </Copy>
      </Card>

      <Card>
        <Eyebrow>About this space</Eyebrow>
        <Copy>
          Open Chair is a reflection and self-awareness tool. It does not
          provide medical or mental health diagnosis, therapy, or emergency
          support.
        </Copy>
        <Copy muted>
          Feelings are information. Patterns describe entries, not causes.
        </Copy>
      </Card>

      <Card>
        <Eyebrow>Privacy & your data</Eyebrow>
        <Copy>
          Your reflections stay on this device in this version of Open Chair.
        </Copy>
        <Copy muted>
          No accounts, analytics, ads, tracking, cloud sync, or remote AI.
          Device backups may include app data according to your device settings.
          Uninstalling may remove your local history; export is not available
          yet.
        </Copy>
      </Card>

      <Card>
        <Eyebrow>Beta feedback</Eyebrow>
        <Copy>
          If you are testing Open Chair through TestFlight, you can use Send
          Beta Feedback in TestFlight or share notes with the person who invited
          you.
        </Copy>
        <Copy muted>
          Helpful feedback includes anything confusing, broken, unexpectedly
          useful, or missing.
        </Copy>
      </Card>

      <Card>
        <Eyebrow>App info</Eyebrow>
        <Copy>Open Chair 1.0.0 · Beta</Copy>
      </Card>

      {__DEV__ && (
        <Card>
          <Eyebrow>Development only</Eyebrow>
          <Copy>
            Demo history is synthetic, marked internally, and only added when
            you choose. Seeding replaces previous demo entries.
          </Copy>
          <Button
            label={action.busy ? "Working…" : "Seed demo history"}
            disabled={action.busy}
            onPress={() =>
              action.run(async () => {
                await repository.seed();
                setMessage(
                  "18 days of demo history added. Open Patterns to explore.",
                );
              })
            }
          />
          <Button
            secondary
            label="Clear demo data"
            disabled={action.busy}
            onPress={() =>
              confirmDelete(
                "Clear demo history?",
                () =>
                  void action.run(async () => {
                    await repository.clear(true);
                    setMessage("Demo history cleared.");
                  }),
              )
            }
          />
          <Button
            secondary
            label="Clear all local data"
            disabled={action.busy}
            onPress={() =>
              confirmDelete(
                "Delete all local data?",
                () =>
                  void action.run(async () => {
                    await repository.clear();
                    setMessage("All local data cleared.");
                  }),
                "This permanently removes check-ins, reflections, tool sessions, supports, and takeaways from this device.",
              )
            }
          />
          <ErrorMessage message={action.error} />
          {!!message && <Copy>{message}</Copy>}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flowList: {
    gap: 0,
  },
  flowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primary,
  },
  stepNumberText: {
    color: c.onPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  flowCopy: {
    flex: 1,
    gap: 3,
  },
  flowTitle: {
    color: c.ink,
    fontSize: 17,
    fontWeight: "700",
  },
  flowBody: {
    color: c.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  flowArrow: {
    alignSelf: "center",
    color: c.primary,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "600",
  },
  dbtGrid: {
    gap: 10,
  },
  dbtCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.tint,
    gap: 5,
  },
  dbtTitle: {
    color: c.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  dbtBody: {
    color: c.ink,
    fontSize: 14,
    lineHeight: 20,
  },
});
