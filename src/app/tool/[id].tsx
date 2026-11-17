import { useEffect, useState } from "react";
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
  const promptCount = tool?.prompts?.length ?? 0;
  const repository = useRepository();
  const action = useAction();
  const [started, setStarted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [finishedPrivately, setFinishedPrivately] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [responses, setResponses] = useState<string[]>(() =>
    Array(promptCount).fill(""),
  );

  useEffect(() => {
    setStarted(false);
    setSaved(false);
    setFinishedPrivately(false);
    setStepIndex(0);
    setResponses(Array(promptCount).fill(""));
  }, [id, promptCount]);

  if (!tool)
    return (
      <Screen>
        <Heading>Tool not found</Heading>
        <Copy>This tool is not in the current catalog.</Copy>
      </Screen>
    );

  const isRain = tool.id === "rain";
  const restart = () => {
    setSaved(false);
    setStarted(false);
    setFinishedPrivately(false);
    setStepIndex(0);
    setResponses(Array(promptCount).fill(""));
  };
  const changeResponse = (index: number, value: string) =>
    setResponses((current) =>
      current.map((existing, i) => (i === index ? value : existing)),
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
          <Heading small>
            {finishedPrivately ? "A moment of compassion." : "Saved for you."}
          </Heading>
          <Copy>
            {finishedPrivately
              ? "You completed a private RAIN practice. Nothing was saved."
              : "Your reflection is in My Days."}
          </Copy>
          <Button secondary label="Try again" onPress={restart} />
        </Card>
      ) : (
        tool.prompts && (
          <>
            {!started ? (
              <Button label="Try it" onPress={() => setStarted(true)} />
            ) : (
              <>
                <Copy muted>
                  {isRain
                    ? "Move through each step at your own pace. Writing is optional, and nothing is saved unless you choose to save it."
                    : "Short answers are enough. These stay on this device."}
                </Copy>
                {isRain ? (
                  <Card tinted>
                    <Eyebrow>
                      Step {stepIndex + 1} of {tool.prompts.length}
                    </Eyebrow>
                    <Field
                      label={tool.prompts[stepIndex]}
                      multiline
                      maxLength={1000}
                      value={responses[stepIndex] ?? ""}
                      onChangeText={(value) =>
                        changeResponse(stepIndex, value)
                      }
                      placeholder="You can write here, or simply reflect quietly."
                    />
                  </Card>
                ) : (
                  tool.prompts.map((prompt, index) => (
                    <Field
                      key={prompt}
                      label={String(index + 1) + ". " + prompt}
                      multiline
                      maxLength={1000}
                      value={responses[index] ?? ""}
                      onChangeText={(value) =>
                        changeResponse(index, value)
                      }
                    />
                  ))
                )}
                <ErrorMessage message={action.error} />
                {isRain && stepIndex > 0 && (
                  <Button
                    secondary
                    label="← Previous step"
                    onPress={() => setStepIndex((current) => current - 1)}
                  />
                )}
                {isRain && stepIndex < tool.prompts.length - 1 ? (
                  <Button
                    label="Continue to next step →"
                    onPress={() => setStepIndex((current) => current + 1)}
                  />
                ) : (
                  <Button
                    label={
                      action.busy
                        ? "Saving…"
                        : isRain
                          ? "Save RAIN to My Days"
                          : "Save completed reflection"
                    }
                    disabled={
                      action.busy ||
                      (!tool.optionalResponses &&
                        responses.some((answer) => !answer.trim()))
                    }
                    onPress={() =>
                      action.run(async () => {
                        await repository.saveSession(
                          tool.id,
                          checkInId ?? null,
                          responses,
                        );
                        setSaved(true);
                        setFinishedPrivately(false);
                      })
                    }
                  />
                )}
                {isRain && (
                  <Button
                    secondary
                    label="Finish without saving"
                    onPress={() => {
                      setFinishedPrivately(true);
                      setSaved(true);
                      setResponses(Array(promptCount).fill(""));
                    }}
                  />
                )}
              </>
            )}
          </>
        )
      )}
    </Screen>
  );
}
