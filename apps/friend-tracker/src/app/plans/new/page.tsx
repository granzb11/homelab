import { prisma } from "@/lib/prisma";
import { HangoutForm } from "@/components/HangoutForm";

export const dynamic = "force-dynamic";

export default async function NewPlanPage() {
  const friends = await prisma.friend.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-display font-semibold text-ink mb-2">Plan a trip</h1>
      <p className="text-sm text-ink-muted mb-8">
        Add a city you&apos;d like to visit before anything&apos;s booked. It lives on your
        dashboard until you mark it as happened.
      </p>
      <HangoutForm friends={friends} mode="plan" />
    </div>
  );
}
