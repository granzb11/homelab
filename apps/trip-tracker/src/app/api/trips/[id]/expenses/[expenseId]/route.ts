import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSplitParticipants } from "@/lib/split";

type Ctx = { params: Promise<{ id: string; expenseId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id, expenseId } = await ctx.params;
  const body = await req.json();
  const { title, amount, currency, date, category, notes, splitMode, paidBy, splitParticipants, friendIds } = body;

  const parsedParticipants = parseSplitParticipants({ splitParticipants, friendIds });

  try {
    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        title: title !== undefined ? title : undefined,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        currency: currency !== undefined ? currency : undefined,
        date: date !== undefined ? (date ? new Date(date) : null) : undefined,
        category: category !== undefined ? category : undefined,
        notes: notes !== undefined ? notes : undefined,
        splitMode: splitMode !== undefined ? splitMode : undefined,
        paidBy: paidBy !== undefined ? paidBy : undefined,
        participants:
          parsedParticipants
            ? {
                deleteMany: {},
                create: parsedParticipants.map((p) => ({
                  friendId: p.friendId,
                  inSplit: p.inSplit,
                  splitValue: p.splitValue ? parseFloat(String(p.splitValue)) : null,
                })),
              }
            : undefined,
      },
      include: {
        participants: true,
      },
    });

    return NextResponse.json(expense);
  } catch (err) {
    console.error("Error updating expense:", err);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id, expenseId } = await ctx.params;

  try {
    await prisma.expense.delete({
      where: { id: expenseId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting expense:", err);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
