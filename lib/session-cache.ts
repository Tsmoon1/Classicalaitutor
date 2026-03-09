import { SessionData, getSessionData } from "./notion";

const cache = new Map<string, { data: SessionData; timestamp: number }>();
const TTL = 10 * 60 * 1000; // 10 minutes

export async function getCachedSessionData(
  sessionId: string
): Promise<SessionData> {
  const cached = cache.get(sessionId);
  if (cached && Date.now() - cached.timestamp < TTL) {
    return cached.data;
  }

  const data = await getSessionData(sessionId);
  cache.set(sessionId, { data, timestamp: Date.now() });
  return data;
}
