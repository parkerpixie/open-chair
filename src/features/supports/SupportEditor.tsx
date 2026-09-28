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
} from "../../components/app/ui";
import type { Support } from "../../db/types";
import { useRepository } from "../../db/provider";
import { useAction } from "../../lib/hooks";
export function SupportEditor({
  initial,
  onSaved,
}: {
  initial: Support;
  onSaved?: () => void;
}) {
  const [support, setSupport] = useState(initial);
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
      <Heading small>How you connect</Heading>
      <Row>
        {["In person", "Online", "Phone", "Flexible / other"].map((mode) => (
          <Chip
            key={mode}
            label={mode}
            selected={support.mode === mode}
            onPress={() => update("mode", mode)}
          />
        ))}
      </Row>
      {support.mode === "Online" && (
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
      {support.mode === "In person" && (
        <Field
          label="Place or address"
          maxLength={500}
          value={support.location}
          onChangeText={(v) => update("location", v)}
        />
      )}
      {support.mode === "Phone" && (
        <Field
          label="Phone number"
          maxLength={40}
          keyboardType="phone-pad"
          value={support.phone}
          onChangeText={(v) => update("phone", v)}
        />
      )}
      <Card>
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
          <Field
            label="Time (24-hour HH:MM)"
            placeholder="09:00"
            maxLength={5}
            value={support.time}
            onChangeText={(v) => update("time", v)}
          />
        )}
      </Card>
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
            await repository.saveSupport(support);
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
