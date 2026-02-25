import Anthropic from "@anthropic-ai/sdk";
import { assignment } from "@/lib/assignment";
import { saveTranscriptToNotion } from "@/lib/notion";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Format the transcript
    const transcript = formatTranscript(messages);

    // Generate agent assessment
    const assessmentResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: `You are an educational assessment specialist. You will read a tutoring session transcript and produce a structured assessment. The student's name is ${assignment.studentName}. The assignment was: ${assignment.title}.

Produce an assessment covering:
1. ENGAGEMENT & EFFORT - Did the student engage genuinely? Did they attempt ideas before asking for help?
2. INDEPENDENT THINKING - Did the student generate their own ideas and arguments?
3. KEY IDEAS DEVELOPED - List the main arguments or ideas the student produced
4. NUANCE - Did the student acknowledge complexity rather than taking a simplistic position?
5. AREAS FOR DEVELOPMENT - What could the student improve?
6. OVERALL - A brief summary of readiness and quality of thinking

Be specific and reference actual moments from the transcript.`,
      messages: [
        {
          role: "user",
          content: `Here is the tutoring session transcript:\n\n${transcript}\n\nPlease provide the structured assessment.`,
        },
      ],
    });

    const assessment =
      assessmentResponse.content[0].type === "text"
        ? assessmentResponse.content[0].text
        : "";

    // Save to Notion
    await saveTranscriptToNotion(assignment.notionPageId, transcript, assessment);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error saving transcript:", error);
    return Response.json(
      { error: "Failed to save transcript" },
      { status: 500 }
    );
  }
}

function formatTranscript(
  messages: Array<{ role: string; content: string }>
): string {
  const lines = [
    `TUTORING SESSION TRANSCRIPT`,
    `Student: ${assignment.studentName}`,
    `Assignment: ${assignment.title}`,
    `Tutor Mode: Socratic Brainstorming`,
    `Date: ${new Date().toLocaleDateString()}`,
    ``,
    `---`,
    ``,
  ];

  for (const msg of messages) {
    const speaker =
      msg.role === "user"
        ? assignment.studentName.toUpperCase()
        : "TUTOR";
    lines.push(`${speaker}: ${msg.content}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("END OF SESSION");

  return lines.join("\n");
}
