import { useState } from "react";
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
  Screen,
} from "../../components/app/ui";
import {
  families,
  feelings,
  type Feeling,
} from "../../features/check-in/catalog";
import { suggestTools } from "../../features/tools/suggestions";
import { palette } from "../../constants/palette";
import { useRepository } from "../../db/provider";
import { useAction } from "../../lib/hooks";
export default function CheckInScreen() {
  const repository = useRepository();
  const action = useAction();
  const [selected, setSelected] = useState<Feeling[]>([]);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [reviewing, setReviewing] = useState(false);
  const [intensity, setIntensity] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState<{
    id: string;
    feelings: Feeling[];
  } | null>(null);
  function toggle(feeling: Feeling) {
    setSelected((current) =>
      current.some((f) => f.id === feeling.id)
        ? current.filter((f) => f.id !== feeling.id)
        : [...current, feeling],
    );
  }
  function save() {
    void action.run(async () => {
      const id = await repository.saveCheckIn(selected, intensity, note);
      setSaved({ id, feelings: selected });
      setSelected([]);
      setIntensity(null);
      setNote("");
      setQuery("");
      setFamily("all");
      setReviewing(false);
    });
  }
  if (saved) {
    const suggestions = suggestTools(saved.feelings);
    return (
      <Screen>
        <Card tinted>
          <Heading>Noticed. Saved.</Heading>
          <Copy>
            You can leave it here, or add something you want to remember.
          </Copy>
          <Copy>{saved.feelings.map((f) => f.word).join(" · ")}</Copy>
        </Card>
        {suggestions.length ? (
          <>
            <Heading small>If a tool feels useful</Heading>
            {suggestions.map((tool) => (
              <Button
                key={tool.id}
                secondary
                label={tool.title}
                onPress={() =>
                  router.push({
                    pathname: "/tool/[id]",
                    params: { id: tool.id, checkInId: saved.id },
                  })
                }
              />
            ))}
          </>
        ) : (
          <Copy>Worth noticing: what may have helped?</Copy>
        )}
        <Button
          label="Something worth keeping"
          onPress={() => router.navigate("/")}
        />
        <Button
          secondary
          label="Another check-in"
          onPress={() => setSaved(null)}
        />
      </Screen>
    );
  }
  return (
    <Screen
      key={reviewing ? "review" : "choose"}
      footer={
        <>
          <ErrorMessage message={action.error} />
          <Button
            label={
              action.busy
                ? "Saving…"
                : reviewing
                  ? "Save check-in"
                  : `Continue${selected.length ? ` · ${selected.length} selected` : ""}`
            }
            disabled={!selected.length || action.busy}
            onPress={reviewing ? save : () => setReviewing(true)}
          />
        </>
      }
    >
      <Heading>
        {reviewing ? "A little more context?" : "What’s here right now?"}
      </Heading>
      <Copy muted>
        {reviewing
          ? "Everything below is optional. The feeling can stand on its own."
          : "Choose more than one. You don’t need to explain why."}
      </Copy>
      {!!selected.length && (
        <Card tinted>
          <Heading small>{selected.length} selected</Heading>
          <Row>
            {selected.map((f) => (
              <Chip
                key={f.id}
                label={`${f.word} ×`}
                selected
                color={palette[f.familyId]}
                onPress={() => toggle(f)}
              />
            ))}
          </Row>
        </Card>
      )}
      {reviewing ? (
        <>
          <Button
            secondary
            label="Back to feelings"
            onPress={() => setReviewing(false)}
          />
          <Card>
            <Heading small>How strong is this right now?</Heading>
            <Copy muted>
              Optional · 1 is subtle, 5 is very strong. Tap a selected number to
              clear it.
            </Copy>
            <Row>
              {[1, 2, 3, 4, 5].map((n) => (
                <Chip
                  key={n}
                  label={String(n)}
                  selected={intensity === n}
                  onPress={() => setIntensity(intensity === n ? null : n)}
                />
              ))}
            </Row>
          </Card>
          <Field
            label="Anything happening around this? (optional)"
            multiline
            maxLength={500}
            value={note}
            onChangeText={setNote}
          />
        </>
      ) : (
        <>
          <Field
            label="Find a feeling"
            placeholder="Search all 96 words"
            value={query}
            onChangeText={setQuery}
          />
          <Row>
            <Chip
              label="All families"
              selected={family === "all"}
              onPress={() => setFamily("all")}
            />
            {families.map((f) => (
              <Chip
                key={f.id}
                label={f.short}
                selected={family === f.id}
                color={palette[f.color]}
                onPress={() => setFamily(f.id)}
              />
            ))}
          </Row>
          {families
            .filter((f) => family === "all" || family === f.id)
            .map((f) => {
              const matching = feelings.filter(
                (word) =>
                  word.familyId === f.id &&
                  word.word.toLowerCase().includes(query.trim().toLowerCase()),
              );
              return matching.length ? (
                <Card key={f.id}>
                  <Heading small>{f.label}</Heading>
                  <Copy muted>{f.copy}</Copy>
                  <Row>
                    {matching.map((word) => (
                      <Chip
                        key={word.id}
                        label={word.word}
                        selected={selected.some((s) => s.id === word.id)}
                        color={palette[f.id]}
                        onPress={() => toggle(word)}
                      />
                    ))}
                  </Row>
                </Card>
              ) : null;
            })}
          {!feelings.some(
            (f) =>
              (family === "all" || f.familyId === family) &&
              f.word.toLowerCase().includes(query.trim().toLowerCase()),
          ) && <Copy>No matching words. Try another word or family.</Copy>}
        </>
      )}
    </Screen>
  );
}
