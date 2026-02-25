import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

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
