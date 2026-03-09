import SessionChat from "./SessionChat";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SessionChat sessionId={id} />;
}
