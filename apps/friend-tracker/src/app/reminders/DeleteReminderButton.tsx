"use client";

import { useRouter } from "next/navigation";

export default function DeleteReminderButton({ id }: { id: string }) {
  const router = useRouter();

  async function remove() {
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button onClick={remove} className="text-xs text-ink-muted hover:text-red-500">
      Delete
    </button>
  );
}
