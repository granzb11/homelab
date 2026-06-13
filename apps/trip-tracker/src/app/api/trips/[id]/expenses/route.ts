import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSplitParticipants } from "@/lib/split";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { title, amount, currency, date, category, notes, splitMode, paidBy, splitParticipants, friendIds } = body;

  const parsedParticipants = parseSplitParticipants({ splitParticipants, friendIds });
  const participants = parsedParticipants || [{ friendId: "__you__", inSplit: true, splitValue: null }];

  try {
    const expense = await prisma.expense.create({
      data: {
        tripId: id,
        title,
        amount: parseFloat(amount),
        currency: currency || "USD",
        date: date ? new Date(date) : null,
        category: category || "OTHER",
        notes: notes || null,
        splitMode: splitMode || "EVEN",
        paidBy: paidBy || "__you__",
        participants: {
          create: participants.map((p) => ({
            friendId: p.friendId,
            inSplit: p.inSplit,
            splitValue: p.splitValue ? parseFloat(String(p.splitValue)) : null,
          })),
        },
      },
      include: {
        participants: true,
      },
    });

    return NextResponse.json(expense);
  } catch (err) {
    console.error("Error creating expense:", err);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
