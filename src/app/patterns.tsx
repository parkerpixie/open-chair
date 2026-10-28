import {
  Card,
  Copy,
  ErrorMessage,
  Eyebrow,
  Heading,
  Loading,
  Screen,
  Button,
} from "../components/app/ui";
import { useRepository } from "../db/provider";
import { useResource } from "../lib/hooks";
import { addDays, localDateKey } from "../lib/dates";
import { derivePatterns } from "../features/patterns/derive";
export default function PatternsScreen() {
  const repository = useRepository();
  const resource = useResource(async () => {
    const today = localDateKey();
    return {
      today,
      recent: await repository.history(addDays(today, -29), today),
    };
  });
  const patterns = resource.data
    ? derivePatterns(resource.data.recent, resource.data.today)
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
      {!resource.error &&
        patterns.map((pattern) => (
          <Card key={pattern.id} tinted>
            <Eyebrow>
              {pattern.kind === "theme" ? "Worth keeping" : pattern.kind}
            </Eyebrow>
            <Copy>{pattern.text}</Copy>
            <Copy muted>{pattern.detail}</Copy>
          </Card>
        ))}
    </Screen>
  );
}
