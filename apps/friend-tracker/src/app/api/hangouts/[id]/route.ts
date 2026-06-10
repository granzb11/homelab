// Compatibility shim — delegates to /api/events/[id]
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await request.json();
  return fetch(new URL(`/api/events/${id}`, request.url).toString(), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return fetch(new URL(`/api/events/${id}`, request.url).toString(), { method: "DELETE" });
}
