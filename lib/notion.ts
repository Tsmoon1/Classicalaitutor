import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// --- Session Data Fetching ---

export interface SessionData {
  studentName: string;
  assignmentTitle: string;
  assignmentType: string;
  instructionsForStudent: string;
  tutorBehaviorInstructions: string;
  studentAssignmentPageId: string;
}

function extractRichText(prop: any): string {
  if (!prop?.rich_text) return "";
  return prop.rich_text.map((rt: any) => rt.plain_text).join("");
}

function extractTitle(prop: any): string {
  if (!prop?.title) return "";
  return prop.title.map((t: any) => t.plain_text).join("");
}

export async function getSessionData(
  studentAssignmentId: string
): Promise<SessionData> {
  // 1. Fetch the Student Assignment page
  const saPage = await notion.pages.retrieve({
    page_id: studentAssignmentId,
  }) as any;

  // 2. Extract relation IDs
  const studentRelation = saPage.properties["Student"]?.relation;
  const assignmentRelation = saPage.properties["Assignment"]?.relation;

  if (!studentRelation?.[0]?.id) {
    throw new Error("No student linked to this assignment");
  }
  if (!assignmentRelation?.[0]?.id) {
    throw new Error("No assignment linked to this record");
  }

  const studentPageId = studentRelation[0].id;
  const assignmentPageId = assignmentRelation[0].id;

  // 3. Fetch Student and Assignment pages in parallel
  const [studentPage, assignmentPage] = await Promise.all([
    notion.pages.retrieve({ page_id: studentPageId }) as Promise<any>,
    notion.pages.retrieve({ page_id: assignmentPageId }) as Promise<any>,
  ]);

  // 4. Extract data
  const studentName = extractTitle(studentPage.properties["Name"]);
  const assignmentTitle = extractTitle(assignmentPage.properties["Assignment Name"]);
  const assignmentType = assignmentPage.properties["Type"]?.select?.name ?? "";
  const instructionsForStudent = extractRichText(assignmentPage.properties["Instructions for Student"]);
  const tutorBehaviorInstructions = extractRichText(assignmentPage.properties["Tutor Behavior Instructions"]);

  return {
    studentName,
    assignmentTitle,
    assignmentType,
    instructionsForStudent,
    tutorBehaviorInstructions,
    studentAssignmentPageId: studentAssignmentId,
  };
}

export function buildSystemPrompt(session: SessionData): string {
  return `${session.tutorBehaviorInstructions}

The student's name is ${session.studentName}. Address them by name occasionally. Be warm and encouraging.`;
}

export function buildOpeningMessage(session: SessionData): string {
  return `Hi ${session.studentName}! Welcome to your ${session.assignmentType} exercise.

Here are your instructions:

${session.instructionsForStudent}

Let's get started — what are your initial thoughts?`;
}

// --- Transcript Saving ---

export async function saveTranscriptToNotion(
  pageId: string,
  transcript: string,
  assessment: string
) {
  // Update the page properties
  await notion.pages.update({
    page_id: pageId,
    properties: {
      Status: { select: { name: "Submitted" } },
      Transcript: {
        rich_text: [
          {
            text: {
              content: transcript.slice(0, 2000),
            },
          },
        ],
      },
      "Agent Assessment": {
        rich_text: [
          {
            text: {
              content: assessment.slice(0, 2000),
            },
          },
        ],
      },
    },
  });

  // Also add the full transcript as page content using blocks
  // First, get existing blocks and clear them
  const existingBlocks = await notion.blocks.children.list({
    block_id: pageId,
  });
  for (const block of existingBlocks.results) {
    await notion.blocks.delete({ block_id: block.id });
  }

  // Split content into chunks for Notion's 2000-char limit per block
  const transcriptChunks = splitIntoChunks(transcript, 1900);
  const assessmentChunks = splitIntoChunks(assessment, 1900);

  const blocks: any[] = [
    {
      object: "block",
      type: "heading_1",
      heading_1: {
        rich_text: [{ text: { content: "Tutoring Session Transcript" } }],
      },
    },
    ...transcriptChunks.map((chunk) => ({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ text: { content: chunk } }],
      },
    })),
    { object: "block", type: "divider", divider: {} },
    {
      object: "block",
      type: "heading_1",
      heading_1: {
        rich_text: [{ text: { content: "Agent Assessment" } }],
      },
    },
    ...assessmentChunks.map((chunk) => ({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ text: { content: chunk } }],
      },
    })),
  ];

  // Notion allows max 100 blocks per request
  for (let i = 0; i < blocks.length; i += 100) {
    await notion.blocks.children.append({
      block_id: pageId,
      children: blocks.slice(i, i + 100),
    });
  }
}

function splitIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }
    // Try to split at a newline
    let splitAt = remaining.lastIndexOf("\n", maxLength);
    if (splitAt === -1 || splitAt < maxLength / 2) {
      splitAt = maxLength;
    }
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }
  return chunks;
}
