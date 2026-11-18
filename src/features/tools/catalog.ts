export interface Tool {
  id: string;
  title: string;
  category: string;
  when: string;
  explanation: string;
  prompts?: readonly [string, string, string];
}
export const tools: Tool[] = [
  {
    id: "halt",
    title: "HALT",
    category: "Body / reset",
    when: "When a basic need might deserve attention.",
    explanation:
      "Pause to notice hunger, anger, loneliness, and tiredness. You do not need a perfect explanation to meet a small need.",
    prompts: [
      "What do you notice about food, rest, connection, or irritation?",
      "Which need could you make a little room for?",
      "What small step feels available now?",
    ],
  },
  {
    id: "abc-please",
    title: "ABC PLEASE",
    category: "Body / reset",
    when: "When you want to look at the conditions around your day.",
    explanation:
      "Make space for enjoyable moments, build a skill, and prepare for challenges. Notice physical care: food, sleep, movement, illness, and substances. Follow your own care plan.",
    prompts: [
      "Which everyday condition needs some attention?",
      "What enjoyable or manageable activity could fit today?",
      "What would make that step easier to begin?",
    ],
  },
  {
    id: "tipp",
    title: "TIPP",
    category: "Body / reset",
    when: "When feelings are intense and thinking feels difficult.",
    explanation:
      "TIPP explores temperature, movement, paced breathing, and muscle release. Choose something gentle and comfortable, such as a cool cloth or relaxing your shoulders. Skip temperature extremes or strenuous activity, especially if a health condition makes them unsuitable.",
    prompts: [
      "What is your body noticing right now?",
      "Would a cool cloth, gentle movement, or easy breathing feel comfortable?",
      "After a short pause, what do you notice?",
    ],
  },
  {
    id: "stop",
    title: "STOP",
    category: "Pause / mindfulness",
    when: "When you want a pause between a feeling and an action.",
    explanation:
      "Stop briefly, take a step back, observe what is happening, and proceed with attention. A pause does not require you to dismiss your feeling.",
    prompts: [
      "What can wait while you take a pause?",
      "What do you notice inside and around you?",
      "What next action fits what matters to you?",
    ],
  },
  {
    id: "wise-mind",
    title: "Wise Mind",
    category: "Pause / mindfulness",
    when: "When your thoughts and feelings pull in different directions.",
    explanation:
      "Give both feeling and reasoning a place in the conversation. Look for a next step that can acknowledge both.",
    prompts: [
      "What is the feeling side asking for?",
      "What facts or practical limits are also present?",
      "What next step could respect both?",
    ],
  },
  {
    id: "what",
    title: "What",
    category: "Pause / mindfulness",
    when: "When you want a simple way to pay attention.",
    explanation:
      "Observe a moment, describe what you notice without adding a verdict, or participate fully in one activity. Choose just one of these ways to begin.",
  },
  {
    id: "how",
    title: "How",
    category: "Pause / mindfulness",
    when: "When attention feels scattered or judgmental.",
    explanation:
      "Try doing one thing at a time, describing rather than judging, and choosing what works for the situation. Return gently when your attention wanders.",
  },
  {
    id: "check-the-facts",
    title: "Check The Facts",
    category: "Think / plan",
    when: "When you want to separate what happened from what you suspect.",
    explanation:
      "Describe what you can observe, then notice assumptions and missing information. Your feeling can be real even when some details remain uncertain.",
    prompts: [
      "What happened that someone else could observe?",
      "What are you assuming, and what remains unknown?",
      "With that distinction, what response seems useful?",
    ],
  },
  {
    id: "cope-ahead",
    title: "Cope Ahead",
    category: "Think / plan",
    when: "When a coming situation feels difficult.",
    explanation:
      "Imagine a likely challenge and rehearse one workable response. Leave room for the situation to unfold differently.",
    prompts: [
      "What situation are you preparing for?",
      "What might be hard, and what support could help?",
      "How would you like to respond in that moment?",
    ],
  },
  {
    id: "problem-solving",
    title: "Problem Solving",
    category: "Think / plan",
    when: "When part of a situation can be changed.",
    explanation:
      "Name a specific problem, consider a few options, and try a small step. You can review the result without judging yourself.",
    prompts: [
      "What specific part could be changed?",
      "What are two possible steps, even imperfect ones?",
      "Which step will you try, and when will you review it?",
    ],
  },
  {
    id: "radical-acceptance",
    title: "Radical Acceptance",
    category: "Accept / cope / act",
    when: "When something is real even though you wish it were different.",
    explanation:
      "Acknowledging reality is not approval or giving up. Notice what is outside your control while keeping room for boundaries and choices.",
    prompts: [
      "What fact is difficult to acknowledge?",
      "What can you influence, and what is outside your control?",
      "What would caring for yourself within this reality look like?",
    ],
  },
  {
    id: "opposite-action",
    title: "Opposite Action",
    category: "Accept / cope / act",
    when: "When an urge may not fit the facts or your aims.",
    explanation:
      "First consider whether the feeling and urge fit the situation. If acting on the urge would not help, choose a small, safe alternative. Do not use this to override danger or a needed boundary.",
    prompts: [
      "What is the urge, and does it fit the facts?",
      "Would following it support what matters to you?",
      "If not, what safe alternative could you try?",
    ],
  },
  {
    id: "improve",
    title: "IMPROVE",
    category: "Accept / cope / act",
    when: "When you need to make a hard moment more bearable.",
    explanation:
      "Try imagery, meaning, a personal grounding practice, relaxation, one thing at a time, a brief break, or encouraging words. Choose what fits your beliefs and circumstances.",
    prompts: [
      "What would make this moment slightly more bearable?",
      "Could a quiet image, brief break, or grounding phrase fit?",
      "What will you try for the next few minutes?",
    ],
  },
  {
    id: "self-soothe",
    title: "Self Soothe",
    category: "Accept / cope / act",
    when: "When a little sensory comfort feels welcome.",
    explanation:
      "Notice a sound, texture, scent, sight, or taste that feels comfortable. Keep the choice simple and accessible.",
    prompts: [
      "Which sense would you like to attend to?",
      "What comfortable sensation is available nearby?",
      "What do you notice when you give it your attention?",
    ],
  },
  {
    id: "dear-man",
    title: "DEAR MAN",
    category: "Relationships",
    when: "When you want to make a request or state a boundary.",
    explanation:
      "Describe the situation, express your perspective, ask clearly, and explain what the request could make possible. Stay on topic, use a steady manner, and consider negotiation where appropriate.",
    prompts: [
      "What happened, and how would you describe your perspective?",
      "What clear request or boundary do you want to express?",
      "What is negotiable, and what needs to stay firm?",
    ],
  },
  {
    id: "fast",
    title: "FAST",
    category: "Relationships",
    when: "When you want to keep self-respect in a conversation.",
    explanation:
      "Be fair to yourself and others, avoid apologizing for simply having needs, stay with your values, and be truthful. Accountability and self-respect can coexist.",
    prompts: [
      "What would fairness to everyone include?",
      "Which value do you want to keep in view?",
      "What can you say honestly without minimizing your needs?",
    ],
  },
  {
    id: "give",
    title: "GIVE",
    category: "Relationships",
    when: "When you want to care for a relationship during a conversation.",
    explanation:
      "Use a gentle manner, show interest, acknowledge the other person’s perspective, and allow some ease where it fits. Understanding someone does not require agreeing with them.",
  },
];
export const toolById = (id: string) => tools.find((tool) => tool.id === id);
