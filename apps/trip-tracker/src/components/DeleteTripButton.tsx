"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteTripButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this trip? This cannot be undone.")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/");
    } catch (err) {
      console.error("Error deleting trip:", err);
      alert("Failed to delete trip");
      setIsDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 border border-ink-faint text-ink text-sm font-medium hover:bg-panel/80 transition-colors disabled:opacity-50"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
