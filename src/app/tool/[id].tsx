import { useState } from "react";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import {
  Button,
  Card,
  Copy,
  Eyebrow,
  Heading,
  Screen,
} from "../../components/app/ui";
import { skillGuides } from "../../features/tools/guides";
import { toolById } from "../../features/tools/catalog";
import { useRepository } from "../../db/provider";
import { GuidedExercise } from "../../features/tools/GuidedExercise";
import { stepsForTool } from "../../features/tools/exercises";
export default function ToolDetail() {
  const { id, checkInId, guide } = useLocalSearchParams<{
    id: string;
    checkInId?: string;
    guide?: string;
  }>();
  const tool = toolById(id);
  const artwork = skillGuides[id];
  const [showGuide, setShowGuide] = useState(guide === "1");
  const repository = useRepository();
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
      {artwork && (
        <>
          <Button
            secondary
            label={
              showGuide ? "Hide illustrated guide" : "View illustrated guide"
            }
            onPress={() => setShowGuide((visible) => !visible)}
          />
          {showGuide && (
            <Image
              source={artwork.source}
              style={{ width: "100%", aspectRatio: artwork.aspectRatio }}
              contentFit="contain"
              accessible
              accessibilityLabel={`${tool.title} illustrated skill guide`}
            />
          )}
        </>
      )}
      <Card>
        <Copy>{tool.explanation}</Copy>
      </Card>
      <GuidedExercise
        key={tool.id}
        steps={stepsForTool(tool)}
        onSave={(responses) =>
          repository.saveSession(tool.id, checkInId ?? null, responses)
        }
      />
    </Screen>
  );
}
