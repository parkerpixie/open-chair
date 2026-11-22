import type { Tool } from "./catalog";

export interface ExerciseStep {
  prompt: string;
  hint?: string;
  choices?: readonly string[];
  practiceOnly?: boolean;
}

const exercises: Partial<Record<string, readonly ExerciseStep[]>> = {
  halt: [
    {
      prompt: "What needs attention right now?",
      choices: ["Hungry", "Angry", "Lonely", "Tired"],
    },
    {
      prompt: "What is one small thing that could help?",
      hint: "A snack, a pause, a text, or a few minutes to rest can count.",
    },
  ],
  "check-the-facts": [
    { prompt: "What happened?", hint: "Write what you could see or hear." },
    {
      prompt: "What did your mind fill in?",
      hint: "What are you assuming it means?",
    },
    {
      prompt: "What else might explain it?",
      hint: "What would you need to find out before you could know?",
    },
    { prompt: "What feels like a reasonable next move?" },
  ],
  "dear-man": [
    {
      prompt: "How would you describe what happened?",
      hint: "Start with a sentence you could actually say.",
    },
    { prompt: "What do you want them to understand about how you feel?" },
    {
      prompt: "What are you asking for or saying no to?",
      hint: "Try putting the request or boundary into one clear sentence.",
    },
    { prompt: "What would your request make possible?" },
    {
      prompt: "What can you say if the conversation gets sidetracked?",
      hint: "Try a steady repeat of your request. Consider what you could negotiate.",
    },
  ],
  rain: [
    {
      prompt: "Recognize what’s here",
      hint: "What feeling or sensation can you name right now?",
    },
    {
      prompt: "Allow a little room for it",
      hint: "Take a moment. What happens if you let it be here for one breath?",
    },
    {
      prompt: "Get gently curious",
      hint: "Where do you notice it, or what might it need? You can pass on this step.",
    },
    {
      prompt: "Offer yourself some kindness",
      hint: "What would you say or do for a friend feeling this way?",
    },
  ],
  grounding: [
    { prompt: "Notice five things you can see", practiceOnly: true },
    { prompt: "Notice four things you can feel", practiceOnly: true },
    { prompt: "Notice three things you can hear", practiceOnly: true },
    { prompt: "Notice two things you can smell", practiceOnly: true },
    { prompt: "Notice one thing you can taste", practiceOnly: true },
    {
      prompt: "Anything you want to remember?",
      hint: "You can finish here or jot down what you noticed.",
    },
  ],
  what: [
    {
      prompt: "What do you notice right now?",
      hint: "Start with one sensation, thought, or detail around you.",
    },
    { prompt: "How would you describe it in plain words?" },
    { prompt: "What could you give your full attention to for a moment?" },
  ],
  how: [
    {
      prompt: "What judgment is showing up?",
      hint: "Try describing the moment in plain words.",
    },
    { prompt: "What’s one thing you can give your attention to?" },
    { prompt: "What would work for you in this situation?" },
  ],
  give: [
    { prompt: "How could you open this conversation gently?" },
    { prompt: "What could you ask to understand their perspective?" },
    { prompt: "What about their experience can you acknowledge?" },
    { prompt: "What might make the conversation feel a little easier?" },
  ],
};

export const stepsForTool = (tool: Tool): readonly ExerciseStep[] =>
  exercises[tool.id] ?? (tool.prompts ?? []).map((prompt) => ({ prompt }));
