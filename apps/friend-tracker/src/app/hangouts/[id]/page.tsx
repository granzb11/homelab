import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { HangoutDetail } from "./HangoutDetail";

export const dynamic = "force-dynamic";

export default async function HangoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      friends: { select: { id: true, name: true, avatarUrl: true } },
      photos: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!event) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/" className="text-sm text-ink-muted hover:text-ink mb-6 inline-block">
        ← Dashboard
      </Link>
      <HangoutDetail event={event} />
    </div>
  );
}
