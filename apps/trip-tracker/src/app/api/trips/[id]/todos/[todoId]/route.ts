import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string; todoId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { todoId } = await ctx.params;
  const body = await req.json();
  const { label, notes, dueDate, bookedAt } = body;

  const todo = await prisma.bookingTodo.update({
    where: { id: todoId },
    data: {
      ...(label !== undefined && { label: label.trim() }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(bookedAt !== undefined && { bookedAt: bookedAt ? new Date(bookedAt) : null }),
    },
  });
  return NextResponse.json(todo);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { todoId } = await ctx.params;
  await prisma.bookingTodo.delete({ where: { id: todoId } });
  return new NextResponse(null, { status: 204 });
}
