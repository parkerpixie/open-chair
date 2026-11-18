import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  Button,
  Card,
  Copy,
  ErrorMessage,
  Eyebrow,
  Field,
  Heading,
  Screen,
} from "../../components/app/ui";
import { toolById } from "../../features/tools/catalog";
import { useRepository } from "../../db/provider";
import { useAction } from "../../lib/hooks";
export default function ToolDetail() {
  const { id, checkInId } = useLocalSearchParams<{
    id: string;
    checkInId?: string;
  }>();
  const tool = toolById(id);
  const repository = useRepository();
  const action = useAction();
  const [started, setStarted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [responses, setResponses] = useState(["", "", ""]);
  if (!tool)
    return (
      <Screen>
        <Heading>Tool not found</Heading>
        <Copy>This tool is not in the current catalog.</Copy>
      </Screen>
    );
  return (
    <Screen>
      <Eyebrow>{tool.category}</Eyebrow>
      <Heading>{tool.title}</Heading>
      <Copy>{tool.when}</Copy>
      <Card>
        <Copy>{tool.explanation}</Copy>
      </Card>
      {saved ? (
        <Card tinted>
          <Heading small>Saved for you.</Heading>
          <Copy>Your reflection is in My Days.</Copy>
          <Button
            secondary
            label="Try again"
            onPress={() => {
              setSaved(false);
              setStarted(false);
              setResponses(["", "", ""]);
            }}
          />
        </Card>
      ) : (
        tool.prompts && (
          <>
            {!started ? (
              <Button label="Try it" onPress={() => setStarted(true)} />
            ) : (
              <>
                <Copy muted>
                  Short answers are enough. These stay on this device.
                </Copy>
                {tool.prompts.map((prompt, index) => (
                  <Field
                    key={prompt}
                    label={`${index + 1}. ${prompt}`}
                    multiline
                    maxLength={1000}
                    value={responses[index]}
                    onChangeText={(text) =>
                      setResponses((current) =>
                        current.map((value, i) => (i === index ? text : value)),
                      )
                    }
                  />
                ))}
                <ErrorMessage message={action.error} />
                <Button
                  label={action.busy ? "Saving…" : "Save completed reflection"}
                  disabled={action.busy || responses.some((r) => !r.trim())}
                  onPress={() =>
                    action.run(async () => {
                      await repository.saveSession(
                        tool.id,
                        checkInId ?? null,
                        responses,
                      );
                      setSaved(true);
                    })
                  }
                />
              </>
            )}
          </>
        )
      )}
    </Screen>
  );
}
