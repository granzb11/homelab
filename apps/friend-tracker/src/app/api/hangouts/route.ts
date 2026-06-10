// Compatibility shim — delegates to /api/events
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  url.pathname = "/api/events";
  return fetch(url.toString(), { headers: req.headers });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Map legacy friendId/friendIds to new shape
  const { friendId, friendIds: rawIds, date, ...rest } = body;
  const friendIds: string[] = rawIds?.length ? rawIds : friendId ? [friendId] : [];
  return fetch(new URL("/api/events", req.url).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...rest, friendIds, startDate: date }),
  });
}
