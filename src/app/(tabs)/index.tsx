import { useState } from "react";
import { router } from "expo-router";
import {
  Button,
  Card,
  Copy,
  ErrorMessage,
  Eyebrow,
  Field,
  Heading,
  Loading,
  Screen,
  confirmDelete,
} from "../../components/app/ui";
import { useRepository } from "../../db/provider";
import { useAction, useResource } from "../../lib/hooks";
import { addDays, displayDate, localDateKey } from "../../lib/dates";
import { derivePatterns } from "../../features/patterns/derive";
import {
  scheduledForDate,
  upcoming,
} from "../../features/supports/schedule";

export default function TodayScreen() {
  const repository = useRepository();
  const action = useAction();
  const [text, setText] = useState("");
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
  const checkIns =
    history?.checkIns.filter((c) => c.local_date === today) ?? [];
  const reflections =
    history?.reflections.filter((r) => r.local_date === today) ?? [];
  const supports = resource.data?.supports ?? [];
  const todaysSupports = scheduledForDate(supports, today);
  const next = todaysSupports.length ? null : upcoming(supports)[0];
  const pattern = history ? derivePatterns(history, today)[0] : null;
  const hour = new Date().getHours();

  return (
    <Screen>
      <Eyebrow>{displayDate(today)}</Eyebrow>
      <Heading>
        Good {hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}.
      </Heading>
      <Copy muted>Notice what’s happening underneath.</Copy>

      <Card tinted>
        <Eyebrow>A moment for you</Eyebrow>
        <Heading>What’s here today?</Heading>
        <Copy>
          {checkIns.length
            ? `${checkIns.length} check-in${checkIns.length === 1 ? "" : "s"} today. Things can still shift.`
            : "Start with a feeling. There is no right answer."}
        </Copy>
        <Button
          label="Check in with yourself"
          onPress={() => router.navigate("/check-in")}
        />
      </Card>

      {resource.loading && <Loading />}
      <ErrorMessage message={resource.error} />
      {resource.error && (
        <Button
          label="Try loading again"
          secondary
          onPress={() => void resource.reload()}
        />
      )}

      {!!checkIns.length && (
        <>
          <Heading small>Last check-in</Heading>
          <Card>
            <Copy>{checkIns[0].feelings.map((f) => f.word).join(" · ")}</Copy>
            {!!checkIns[0].note && <Copy muted>{checkIns[0].note}</Copy>}
          </Card>
        </>
      )}

      {todaysSupports.length ? (
        <>
          <Heading small>Today’s supports</Heading>
          {todaysSupports.map(({ support, date }) => (
            <Card key={support.id}>
              <Copy>{support.name}</Copy>
              <Copy muted>
                Today at{" "}
                {date.toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                · {support.mode}
              </Copy>
              <Button
                secondary
                label="Open support"
                onPress={() =>
                  router.push({
                    pathname: "/support/[id]",
                    params: { id: support.id },
                  })
                }
              />
            </Card>
          ))}
        </>
      ) : (
        <>
          <Heading small>Next support</Heading>
          <Card>
            {next ? (
              <>
                <Copy>{next.support.name}</Copy>
                <Copy muted>
                  {next.date.toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  · {next.support.mode}
                </Copy>
                <Button
                  secondary
                  label="Open support"
                  onPress={() =>
                    router.push({
                      pathname: "/support/[id]",
                      params: { id: next.support.id },
                    })
                  }
                />
              </>
            ) : (
              <>
                <Copy muted>A person, a practice, a place to turn.</Copy>
                <Button
                  secondary
                  label="Add a support"
                  onPress={() => router.push("/support/new")}
                />
              </>
            )}
          </Card>
        </>
      )}

      <Heading small>Something worth keeping</Heading>
      <Copy muted>
        What felt good, mattered, helped, or is something you don’t want to lose
        from today?
      </Copy>
      <Field
        label="A small thing to remember"
        multiline
        maxLength={500}
        value={text}
        onChangeText={setText}
      />
      <ErrorMessage message={action.error} />
      <Button
        label={action.busy ? "Saving…" : "Keep this"}
        disabled={action.busy || !text.trim()}
        onPress={() =>
          action.run(async () => {
            await repository.saveReflection(text);
            setText("");
            await resource.reload();
          })
        }
      />

      {reflections.map((entry) => (
        <Card key={entry.id}>
          <Copy>{entry.text}</Copy>
          <Button
            secondary
            label="Delete reflection"
            onPress={() =>
              confirmDelete(
                "Delete this reflection?",
                () =>
                  void action.run(async () => {
                    await repository.deleteReflection(entry.id);
                    await resource.reload();
                  }),
              )
            }
          />
        </Card>
      ))}

      {pattern && (
        <Card tinted>
          <Eyebrow>Worth noticing</Eyebrow>
          <Copy>{pattern.text}</Copy>
          <Button
            secondary
            label="Explore patterns"
            onPress={() => router.navigate("/patterns")}
          />
        </Card>
      )}
    </Screen>
  );
}
