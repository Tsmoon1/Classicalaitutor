import { getSessionData, buildSystemPrompt, buildOpeningMessage } from "@/lib/notion";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionData(id);

    return Response.json({
      studentName: session.studentName,
      assignmentTitle: session.assignmentTitle,
      assignmentType: session.assignmentType,
      instructionsForStudent: session.instructionsForStudent,
      tutorSystemPrompt: buildSystemPrompt(session),
      openingMessage: buildOpeningMessage(session),
      notionPageId: session.studentAssignmentPageId,
    });
  } catch (error: any) {
    console.error("Error fetching session:", error);
    if (error?.code === "object_not_found") {
      return Response.json(
        { error: "Session not found. Please check your link." },
        { status: 404 }
      );
    }
    return Response.json(
      { error: error.message || "Failed to load session" },
      { status: 500 }
    );
  }
}
