import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string; photoId: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { photoId } = await ctx.params;
  await prisma.eventPhoto.delete({ where: { id: photoId } });
  return new Response(null, { status: 204 });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { photoId } = await ctx.params;
  const { caption } = await request.json();
  const photo = await prisma.eventPhoto.update({
    where: { id: photoId },
    data: { caption: caption?.trim() || null },
    select: { id: true, dataUrl: true, caption: true, createdAt: true },
  });
  return Response.json(photo);
}
