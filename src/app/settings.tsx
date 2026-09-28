import { useState } from "react";
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
import { useRepository } from "../db/provider";
import { useAction } from "../lib/hooks";
export default function Settings() {
  const repository = useRepository();
  const action = useAction();
  const [message, setMessage] = useState("");
  return (
    <Screen>
      <Heading>Undergrowth</Heading>
      <Copy muted>
        Working version 1.0 · A little closer to what’s underneath.
      </Copy>
      <Card>
        <Eyebrow>Privacy</Eyebrow>
        <Copy>
          Your reflections stay on this device in this version of Undergrowth.
        </Copy>
        <Copy muted>
          No accounts, analytics, ads, tracking, cloud sync, or remote AI.
          Device backups may include app data according to your device settings.
          Uninstalling may remove your local history; export is not available
          yet.
        </Copy>
      </Card>
      <Card>
        <Eyebrow>About this space</Eyebrow>
        <Copy>
          Undergrowth is a reflection and self-awareness tool. It does not
          provide medical or mental health diagnosis or emergency support.
        </Copy>
        <Copy muted>
          Feelings are information. Patterns describe entries, not causes.
        </Copy>
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
