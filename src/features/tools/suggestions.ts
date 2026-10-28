import type { Feeling, FamilyId } from "../check-in/catalog";
import { toolById, type Tool } from "./catalog";
export const exactMappings: Record<string, string> = {
  Panicked: "tipp",
  Flooded: "tipp",
  Dysregulated: "tipp",
  Furious: "stop",
  Enraged: "stop",
  Frustrated: "stop",
  Worried: "check-the-facts",
  Overthinking: "check-the-facts",
  Guilty: "check-the-facts",
  Dread: "cope-ahead",
  Uncertain: "cope-ahead",
  Resentful: "radical-acceptance",
  Betrayed: "radical-acceptance",
  Disrespected: "dear-man",
  Defensive: "fast",
  Ashamed: "opposite-action",
  Lonely: "opposite-action",
  Hopeless: "opposite-action",
  Vulnerable: "self-soothe",
  Trapped: "improve",
  Stuck: "problem-solving",
  Conflicted: "wise-mind",
  Ambivalent: "wise-mind",
};
const defaults: Partial<Record<FamilyId, string>> = {
  neutral: "halt",
  sad: "self-soothe",
  fear: "check-the-facts",
  anger: "stop",
  shame: "self-soothe",
  overwhelmed: "tipp",
};
export function suggestTools(feelings: Feeling[]): Tool[] {
  const ordered = [...feelings].sort((a, b) => {
    const rank = (f: Feeling) =>
      ["Panicked", "Flooded", "Dysregulated", "Furious", "Enraged"].includes(
        f.word,
      )
        ? 0
        : 1;
    return rank(a) - rank(b) || a.word.localeCompare(b.word);
  });
  const ids = [
    ...ordered.map((f) => exactMappings[f.word]),
    ...ordered.map((f) => defaults[f.familyId]),
  ];
  return [...new Set(ids.filter((id): id is string => !!id))]
    .slice(0, 3)
    .map((id) => toolById(id)!)
    .filter(Boolean);
}
