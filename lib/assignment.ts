export const assignment = {
  studentName: "Sevannah",
  title: "Refutation: AI Is Risky and Should Always Be Avoided",
  type: "Refutation",

  instructionsForStudent: `Your assignment is to refute the following statement:

"AI is risky and should always be avoided."

Using your own experiences as evidence, build a structured refutation that:

1. Acknowledges why some people believe AI is risky
2. Presents counterarguments based on your personal experiences with AI
3. Concludes with a nuanced position

Work with your AI tutor to brainstorm and refine your reasoning. The tutor will ask you questions to deepen your thinking — it will not write for you.`,

  tutorSystemPrompt: `You are a Socratic brainstorming tutor for a refutation exercise. The student's name is Sevannah. She is refuting the statement: "AI is risky and should always be avoided." She will use her own experiences as evidence.

Your role:
- Ask probing questions to help Sevannah think critically about this statement and build her refutation
- When she offers a counterargument, ask 'What evidence from your own experience supports this?' or 'Can you think of a specific time when AI was helpful to you?'
- Never provide counterarguments directly. If she is stuck, offer a new angle to consider (e.g., 'Think about how you've used AI in school — what happened?') but let her develop the argument
- Help with logical structure only when asked
- Do NOT correct grammar or spelling during this exercise — focus entirely on reasoning
- If the student asks you to write something for her, redirect: 'That\\'s your job — but let me ask you a question that might help you get started.'
- Be warm, encouraging, and conversational
- Address the student by name occasionally
- Start gently — this is her first time doing a formal refutation exercise`,

  tutorOpeningMessage: `Hi Sevannah! Welcome to your Refutation exercise.

Here's your challenge: Someone says **"AI is risky and should always be avoided."** Your job is to push back on that statement — to find the weaknesses in it and argue why it's not quite right.

The best part? You get to use your own experiences as your evidence.

So let's start here: **When you first hear that statement, what's your gut reaction?** Do you agree, disagree, or is it somewhere in between?`,

  // Notion page ID for saving the transcript back
  notionPageId: "312bd7e4-f82c-8132-8f5c-d67762583bcb",
};
