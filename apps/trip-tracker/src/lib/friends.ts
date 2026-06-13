export type Friend = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

const FRIEND_TRACKER_URL =
  process.env.FRIEND_TRACKER_URL ??
  "http://friend-tracker.friend-tracker.svc.cluster.local";

const FRIEND_TRACKER_HOST = process.env.FRIEND_TRACKER_HOST ?? null;

export async function fetchFriends(): Promise<Friend[]> {
  try {
    const res = await fetch(`${FRIEND_TRACKER_URL}/api/friends`, {
      next: { revalidate: 60 },
      headers: FRIEND_TRACKER_HOST ? { Host: FRIEND_TRACKER_HOST } : {},
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as Friend[]) : [];
  } catch {
    return [];
  }
}

export async function fetchFriendMap(): Promise<Map<string, Friend>> {
  const friends = await fetchFriends();
  return new Map(friends.map((f) => [f.id, f]));
}

// --- Write side: push hangouts into Friend Tracker's Event API ---

export type HangoutPayload = {
  friendIds: string[];
  startDate: string; // ISO
  endDate?: string; // ISO
  title?: string;
  eventType?: string;
  city?: string;
  notes?: string;
  whoTraveled?: string;
};

function hangoutHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(FRIEND_TRACKER_HOST ? { Host: FRIEND_TRACKER_HOST } : {}),
  };
}

/** Create a hangout. Returns the new event id, or null if Friend Tracker is unreachable. */
export async function createHangout(payload: HangoutPayload): Promise<string | null> {
  try {
    const res = await fetch(`${FRIEND_TRACKER_URL}/api/events`, {
      method: "POST",
      headers: hangoutHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.id === "string" ? data.id : null;
  } catch {
    return null;
  }
}

/**
 * Update an existing hangout.
 * - "ok": updated.
 * - "missing": event no longer exists (404) — caller should recreate.
 * - "error": transient failure — caller should leave the stored id alone (avoid duplicates).
 */
export async function updateHangout(
  eventId: string,
  payload: HangoutPayload
): Promise<"ok" | "missing" | "error"> {
  try {
    const res = await fetch(`${FRIEND_TRACKER_URL}/api/events/${eventId}`, {
      method: "PATCH",
      headers: hangoutHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.status === 404) return "missing";
    return res.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

/** Delete a hangout. Best-effort; swallows all errors. */
export async function deleteHangout(eventId: string): Promise<void> {
  try {
    await fetch(`${FRIEND_TRACKER_URL}/api/events/${eventId}`, {
      method: "DELETE",
      headers: hangoutHeaders(),
    });
  } catch {
    // best-effort
  }
}
