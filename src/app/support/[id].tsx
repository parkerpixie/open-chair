import { useState } from "react";
import { Linking } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
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
import { SupportEditor } from "../../features/supports/SupportEditor";
import { nextOccurrence } from "../../features/supports/schedule";
import { displayDate } from "../../lib/dates";
import { validUrl } from "../../lib/validation";
export default function SupportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const repository = useRepository();
  const action = useAction();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const resource = useResource(async () => ({
    support: (await repository.supports()).find((s) => s.id === id),
    takeaways: await repository.takeaways(id),
  }));
  const support = resource.data?.support;
  if (resource.loading)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (resource.error)
    return (
      <Screen>
        <ErrorMessage message={resource.error} />
        <Button label="Try again" onPress={() => void resource.reload()} />
      </Screen>
    );
  if (!support)
    return (
      <Screen>
        <Heading>Support not found</Heading>
        <Copy>
          It may have been deleted. Saved takeaways remain in your history.
        </Copy>
      </Screen>
    );
  if (editing)
    return (
      <Screen>
        <Heading>Edit support</Heading>
        <SupportEditor
          initial={support}
          onSaved={() => {
            setEditing(false);
            void resource.reload();
          }}
        />
        <Button
          secondary
          label="Cancel editing"
          onPress={() => setEditing(false)}
        />
      </Screen>
    );
  const next = nextOccurrence(support);
  return (
    <Screen>
      <Eyebrow>
        {support.type} · {support.mode}
      </Eyebrow>
      <Heading>{support.name}</Heading>
      {!support.active && <Copy muted>Inactive support</Copy>}
      {next && <Copy>Next: {next.toLocaleString()}</Copy>}
      <Card>
        {support.mode === "Online" && (
          <Button
            label="Open meeting link"
            onPress={() =>
              action.run(async () => {
                if (!validUrl(support.url))
                  throw new Error(
                    "This link is not valid. Edit the support to update it.",
                  );
                await Linking.openURL(support.url);
              })
            }
          />
        )}
        {support.mode === "Phone" && (
          <Button
            label="Call support"
            onPress={() =>
              action.run(async () => {
                await Linking.openURL(
                  `tel:${support.phone.replace(/[^+\d]/g, "")}`,
                );
              })
            }
          />
        )}
        {!!support.location && <Copy>{support.location}</Copy>}
        {!!support.meeting_id && <Copy>Meeting ID: {support.meeting_id}</Copy>}
        {!!support.passcode && <Copy>Passcode: {support.passcode}</Copy>}
        {!!support.notes && <Copy>{support.notes}</Copy>}
        <Button
          secondary
          label="Edit support"
          onPress={() => setEditing(true)}
        />
      </Card>
      <Heading small>What did you take away?</Heading>
      <Copy muted>
        A thought worth keeping. Saving a takeaway does not mark attendance.
      </Copy>
      <Field
        label="Your takeaway"
        multiline
        maxLength={1000}
        value={text}
        onChangeText={setText}
      />
      <ErrorMessage message={action.error} />
      <Button
        label={action.busy ? "Saving…" : "Save takeaway"}
        disabled={action.busy || !text.trim()}
        onPress={() =>
          action.run(async () => {
            await repository.saveTakeaway(id, text);
            setText("");
            await resource.reload();
          })
        }
      />
      {resource.data!.takeaways.map((t) => (
        <Card key={t.id}>
          <Eyebrow>{displayDate(t.local_date)}</Eyebrow>
          <Copy>{t.text}</Copy>
        </Card>
      ))}
      <Button
        secondary
        label="Delete support"
        onPress={() =>
          confirmDelete(
            "Delete this support?",
            () =>
              void action.run(async () => {
                await repository.deleteSupport(id);
                router.replace("/supports");
              }),
            "Saved takeaways will remain in your history.",
          )
        }
      />
    </Screen>
  );
}
