import { useState } from "react";
import { router } from "expo-router";
import {
  Button,
  Card,
  Copy,
  ErrorMessage,
  Eyebrow,
  Heading,
  Loading,
  Screen,
} from "../../components/app/ui";
import { useRepository } from "../../db/provider";
import { useResource } from "../../lib/hooks";
import { addDays, displayDate, localDateKey } from "../../lib/dates";
import { derivePatterns } from "../../features/patterns/derive";
import { toolById } from "../../features/tools/catalog";
export default function PatternsScreen() {
  const repository = useRepository();
  const [offset, setOffset] = useState(0);
  const resource = useResource(async () => {
    const today = localDateKey();
    return {
      today,
      recent: await repository.history(addDays(today, -29), today),
      page: await repository.history(
        addDays(today, -offset - 29),
        addDays(today, -offset),
      ),
    };
  }, offset);
  const data = resource.data;
  const patterns = data ? derivePatterns(data.recent, data.today) : [];
  const history = data?.page;
  const days = history
    ? [
        ...new Set(
          [
            ...history.checkIns,
            ...history.reflections,
            ...history.sessions,
            ...history.takeaways,
          ].map((e) => e.local_date),
        ),
      ]
        .sort()
        .reverse()
    : [];
  return (
    <Screen>
      <Eyebrow>Across the days</Eyebrow>
      <Heading>Patterns worth noticing</Heading>
      <Copy muted>
        Observations from your entries. No scores, diagnoses, or conclusions
        about why.
      </Copy>
      {resource.loading && <Loading />}
      <ErrorMessage message={resource.error} />
      {resource.error && (
        <Button
          secondary
          label="Try again"
          onPress={() => void resource.reload()}
        />
      )}
      {!resource.loading && !resource.error && !patterns.length && (
        <Card tinted>
          <Heading small>No pattern needs a label yet.</Heading>
          <Copy>
            One or two check-ins can’t tell the whole story. Keep checking in
            when it feels useful.
          </Copy>
        </Card>
      )}
      {patterns.map((pattern) => (
        <Card key={pattern.id} tinted>
          <Eyebrow>
            {pattern.kind === "theme" ? "Worth keeping" : pattern.kind}
          </Eyebrow>
          <Copy>{pattern.text}</Copy>
          <Copy muted>{pattern.detail}</Copy>
        </Card>
      ))}
      <Heading small>Recent days</Heading>
      <Copy muted>
        {offset
          ? `${offset + 1}–${offset + 30} days back`
          : "The last 30 calendar days"}
      </Copy>
      {!resource.loading && !days.length && (
        <Card>
          <Copy>No entries in this window.</Copy>
        </Card>
      )}
      {days.map((day) => (
        <Card key={day}>
          <Heading small>{displayDate(day)}</Heading>
          {history!.checkIns
            .filter((c) => c.local_date === day)
            .map((entry) => (
              <Card key={entry.id}>
                <Eyebrow>
                  Check-in ·{" "}
                  {new Date(entry.created_at).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Eyebrow>
                <Copy>{entry.feelings.map((f) => f.word).join(" · ")}</Copy>
                {entry.intensity !== null && (
                  <Copy muted>Intensity {entry.intensity} / 5</Copy>
                )}
                {!!entry.note && <Copy>{entry.note}</Copy>}
              </Card>
            ))}
          {history!.reflections
            .filter((e) => e.local_date === day)
            .map((e) => (
              <Card key={e.id}>
                <Eyebrow>Worth keeping</Eyebrow>
                <Copy>{e.text}</Copy>
              </Card>
            ))}
          {history!.sessions
            .filter((e) => e.local_date === day)
            .map((e) => (
              <Card key={e.id}>
                <Eyebrow>
                  Tool · {toolById(e.tool_id)?.title ?? e.tool_id}
                </Eyebrow>
                {(JSON.parse(e.responses) as string[]).map((response, i) => (
                  <Copy key={i}>{response}</Copy>
                ))}
                <Button
                  secondary
                  label="Open tool"
                  onPress={() =>
                    router.push({
                      pathname: "/tool/[id]",
                      params: { id: e.tool_id },
                    })
                  }
                />
              </Card>
            ))}
          {history!.takeaways
            .filter((e) => e.local_date === day)
            .map((e) => (
              <Card key={e.id}>
                <Eyebrow>Support takeaway</Eyebrow>
                <Copy>{e.text}</Copy>
              </Card>
            ))}
        </Card>
      ))}
      <Button
        secondary
        label="Earlier 30 days"
        onPress={() => {
          setOffset((n) => n + 30);
        }}
      />
      {offset > 0 && (
        <Button
          secondary
          label="Back to recent days"
          onPress={() => {
            setOffset(0);
          }}
        />
      )}
    </Screen>
  );
}
