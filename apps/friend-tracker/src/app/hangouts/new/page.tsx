import { prisma } from "@/lib/prisma";
import { HangoutForm } from "@/components/HangoutForm";

export const dynamic = "force-dynamic";

export default async function NewHangoutPage({
  searchParams,
}: {
  searchParams: Promise<{ friendId?: string }>;
}) {
  const { friendId } = await searchParams;

  const friends = await prisma.friend.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-display font-semibold text-ink mb-8">Log a hangout</h1>
      {friends.length === 0 ? (
        <p className="text-ink-muted text-sm">Add a friend first before logging a hangout.</p>
      ) : (
        <HangoutForm friends={friends} defaultFriendId={friendId} />
      )}
    </div>
  );
}
