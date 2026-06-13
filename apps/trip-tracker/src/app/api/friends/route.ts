import { NextResponse } from "next/server";
import { fetchFriends } from "@/lib/friends";

export async function GET() {
  const friends = await fetchFriends();
  return NextResponse.json(friends);
}
