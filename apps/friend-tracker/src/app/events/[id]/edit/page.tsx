import { prisma } from "@/lib/prisma";
import { HangoutForm } from "@/components/HangoutForm";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [event, friends] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: { friends: { select: { id: true, name: true } } },
    }),
    prisma.friend.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!event) notFound();

  const toDateStr = (d: Date | null) =>
    d ? new Date(d).toISOString().split("T")[0] : "";

  return (
    <div className="max-w-lg">
      <Link href="/" className="text-sm text-ink-muted hover:text-ink mb-6 inline-block">← Dashboard</Link>
      <h1 className="text-3xl font-display font-semibold text-ink mb-8">Edit event</h1>
      <HangoutForm
        friends={friends}
        defaultValues={{
          id: event.id,
          title: event.title ?? "",
          eventType: event.eventType ?? "",
          location: event.location ?? "",
          city: event.city ?? "",
          startDate: toDateStr(event.startDate),
          endDate: toDateStr(event.endDate),
          whoTraveled: event.whoTraveled ?? "",
          notes: event.notes ?? "",
          friendIds: event.friends.map((f) => f.id),
        }}
      />
    </div>
  );
}
