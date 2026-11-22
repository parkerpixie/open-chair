import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Copy,
  ErrorMessage,
  Eyebrow,
  Field,
  Heading,
} from "../../components/app/ui";
import { useAction } from "../../lib/hooks";
import type { ExerciseStep } from "./exercises";

export function GuidedExercise({
  steps,
  onSave,
}: {
  steps: readonly ExerciseStep[];
  onSave: (responses: string[]) => Promise<void>;
}) {
  const emptyResponses = () => steps.map(() => "");
  const [responses, setResponses] = useState(emptyResponses);
  const [position, setPosition] = useState(0);
  const [mode, setMode] = useState<
    "ready" | "guided" | "all" | "review" | "saved"
  >("ready");
  const action = useAction();
  const hasWriting = responses.some((response) => response.trim());
  function write(index: number, text: string) {
    setResponses((values) =>
      values.map((value, i) => (i === index ? text : value)),
    );
  }
  function renderStep(step: ExerciseStep, index: number) {
    const choices = responses[index].split(", ");
    return (
      <Card key={index}>
        <Eyebrow>
          Step {index + 1} of {steps.length}
        </Eyebrow>
        <Heading small>{step.prompt}</Heading>
        {step.hint && <Copy muted>{step.hint}</Copy>}
        {step.choices?.map((choice) => (
          <Chip
            key={choice}
            label={choice}
            selected={choices.includes(choice)}
            onPress={() =>
              write(
                index,
                step
                  .choices!.filter((option) =>
                    option === choice
                      ? !choices.includes(option)
                      : choices.includes(option),
                  )
                  .join(", "),
              )
            }
          />
        ))}
        {!step.practiceOnly && !step.choices && (
          <Field
            label="Your reflection (optional)"
            accessibilityLabel={step.prompt}
            multiline
            maxLength={1000}
            value={responses[index]}
            onChangeText={(text) => write(index, text)}
          />
        )}
      </Card>
    );
  }
  if (mode === "ready" || mode === "saved") {
    return (
      <>
        {mode === "saved" && <Copy>Your reflection is in My Days.</Copy>}
        <Button
          label={mode === "saved" ? "Try again" : "Work through it"}
          onPress={() => {
            setResponses(emptyResponses());
            setPosition(0);
            setMode("guided");
          }}
        />
      </>
    );
  }
  if (mode === "review") {
    return (
      <>
        <Heading small>Your reflection</Heading>
        {hasWriting ? (
          steps.map(
            (step, index) =>
              responses[index].trim() && (
                <Card key={index}>
                  <Heading small>{step.prompt}</Heading>
                  <Copy>{responses[index].trim()}</Copy>
                </Card>
              ),
          )
        ) : (
          <Copy muted>You can finish whenever you’re ready.</Copy>
        )}
        <ErrorMessage message={action.error} />
        {hasWriting ? (
          <Button
            label={action.busy ? "Saving…" : "Save to My Days"}
            disabled={action.busy}
            onPress={() =>
              action.run(async () => {
                await onSave(responses);
                setMode("saved");
              })
            }
          />
        ) : (
          <Button label="Finish" onPress={() => setMode("ready")} />
        )}
        <Button
          secondary
          label="Keep working"
          disabled={action.busy}
          onPress={() => setMode("guided")}
        />
      </>
    );
  }
  const nextStep = () => {
    if (position === steps.length - 1) setMode("review");
    else setPosition(position + 1);
  };
  return (
    <>
      <Copy muted>Take your time. Every response is optional.</Copy>
      {mode === "all"
        ? steps.map(renderStep)
        : renderStep(steps[position], position)}
      {mode === "guided" && (
        <>
          <Button
            label={position === steps.length - 1 ? "Finish exercise" : "Next"}
            onPress={nextStep}
          />
          {!steps[position].practiceOnly &&
            position < steps.length - 1 &&
            !responses[position].trim() && (
              <Button secondary label="Skip this step" onPress={nextStep} />
            )}
          {position > 0 && (
            <Button
              secondary
              label="Back"
              onPress={() => setPosition(position - 1)}
            />
          )}
        </>
      )}
      <Button
        secondary
        label={mode === "all" ? "One step at a time" : "See all steps"}
        onPress={() => setMode(mode === "all" ? "guided" : "all")}
      />
      <Button
        secondary
        label={hasWriting ? "Review what I wrote" : "Finish for now"}
        onPress={() => setMode("review")}
      />
    </>
  );
}
