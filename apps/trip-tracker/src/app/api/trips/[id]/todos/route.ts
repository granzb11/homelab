import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const todos = await prisma.bookingTodo.findMany({
    where: { tripId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(todos);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { label, notes, dueDate } = body;
  if (!label?.trim()) return NextResponse.json({ error: "label required" }, { status: 400 });

  const todo = await prisma.bookingTodo.create({
    data: {
      tripId: id,
      label: label.trim(),
      notes: notes?.trim() || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  return NextResponse.json(todo, { status: 201 });
}
