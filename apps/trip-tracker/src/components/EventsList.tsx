"use client";

import { useState } from "react";
import { formatDateRange, formatPrice } from "@/lib/utils";
import { personName } from "@/lib/split";
import type { Friend } from "@/lib/friends";
import EventFormModal from "./EventFormModal";
import {
  EVENT_ICONS,
  TYPE_COLORS,
  getTimeDisplayLabels,
  type Event,
} from "./eventFormShared";

export { TYPE_COLORS };

export default function EventsList({
  tripId,
  events: initialEvents,
  friendMap,
  onUpdate,
  isReadOnly = false,
}: {
  tripId: string;
  events: Event[];
  friendMap: Record<string, Friend>;
  onUpdate: (events: Event[]) => void;
  isReadOnly?: boolean;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  function openAdd() {
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(e: Event) {
    setEditId(e.id);
    setShowForm(true);
  }

  function handleSaved(saved: Event | Event[]) {
    const next = Array.isArray(saved)
      ? [...events, ...saved].sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))
      : editId
      ? events.map((e) => (e.id === editId ? saved : e))
      : [...events, saved].sort((a, b) =>
          (a.startDate ?? "").localeCompare(b.startDate ?? "")
        );
    setEvents(next);
    onUpdate(next);
    setShowForm(false);
  }

  async function deleteEvent(id: string) {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/trips/${tripId}/events/${id}`, { method: "DELETE" });
    const next = events.filter((e) => e.id !== id);
    setEvents(next);
    onUpdate(next);
  }

  async function uploadFile(eventId: string, file: File) {
    setUploadingFor(eventId);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/trips/${tripId}/events/${eventId}/attachments`, {
      method: "POST",
      body: fd,
    });
    if (res.ok) {
      const att = await res.json();
      const next = events.map((e) =>
        e.id === eventId ? { ...e, attachments: [...e.attachments, att] } : e
      );
      setEvents(next);
      onUpdate(next);
    }
    setUploadingFor(null);
  }

  async function deleteAttachment(eventId: string, attachmentId: string) {
    await fetch(`/api/trips/${tripId}/events/${eventId}/attachments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachmentId }),
    });
    const next = events.map((e) =>
      e.id === eventId
        ? { ...e, attachments: e.attachments.filter((a) => a.id !== attachmentId) }
        : e
    );
    setEvents(next);
    onUpdate(next);
  }

  return (
    <div className="space-y-4">
      {!isReadOnly && (
        <div className="flex justify-end">
          <button
            onClick={openAdd}
            className="bg-moss text-white text-sm px-4 py-2 hover:bg-moss"
          >
            + Add event
          </button>
        </div>
      )}

      {events.length === 0 && !showForm && (
        <div className="border border-dashed border-ink-faint p-10 text-center">
          <p className="font-display text-xl text-ink mb-1">No events yet</p>
          <p className="text-sm text-ink">Add flights, hotels, activities, and more.</p>
        </div>
      )}

      {events.map((e) => {
        const tl = getTimeDisplayLabels(e.type);
        return (
          <div key={e.id} className={`border p-4 ${TYPE_COLORS[e.type] ?? "bg-panel border-ink-faint"}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none mt-0.5">{EVENT_ICONS[e.type] ?? "📋"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-ink">{e.title}</h3>
                    <p className="text-xs text-ink">{e.type.replace(/_/g, " ").toLowerCase()}</p>
                  </div>
                  {!isReadOnly && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => openEdit(e)} className="text-xs text-ink hover:text-ink">Edit</button>
                      <button onClick={() => deleteEvent(e.id)} className="text-xs text-ink hover:text-red-500">Delete</button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 text-xs text-ink">
                  {(e.startDate || e.endDate) && (
                    <span>{formatDateRange(e.startDate, e.endDate)}</span>
                  )}
                  {(e.startTime || e.endTime) && (
                    <span className="font-mono">
                      {e.startTime && <span>{tl.start}: <span className="text-ink font-medium">{e.startTime}</span></span>}
                      {e.startTime && e.endTime && <span className="mx-1">·</span>}
                      {e.endTime && <span>{tl.end}: <span className="text-ink font-medium">{e.endTime}</span></span>}
                    </span>
                  )}
                  {e.durationMinutes && <span>{e.durationMinutes} min</span>}
                  {(e.startLocation || e.endLocation) && (
                    <span>{e.startLocation}{e.startLocation && e.endLocation ? " → " : ""}{e.endLocation}</span>
                  )}
                  {(e.city || e.state) && (
                    <span>{[e.city, e.state].filter(Boolean).join(", ")}</span>
                  )}
                  {e.provider && <span>{e.provider}</span>}
                  {["RESTAURANT", "BREAKFAST", "LUNCH", "DINNER"].includes(e.type) && e.partySize && <span>👥 {e.partySize}</span>}
                  {e.confirmationCode && <span>Conf: <span className="text-ink font-medium">{e.confirmationCode}</span></span>}
                  {e.price && <span>{formatPrice(e.price, e.currency)}</span>}
                </div>

                {e.notes && <p className="text-xs text-ink mt-1.5 italic">{e.notes}</p>}

                {e.participants.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex -space-x-2">
                      {e.participants.map((p) => {
                        const friend = friendMap[p.friendId];
                        return (
                          <div
                            key={p.friendId}
                            className="w-8 h-8 rounded-full border-2 border-surface bg-ink-faint flex items-center justify-center flex-shrink-0 overflow-hidden"
                            title={personName(p.friendId, friendMap)}
                          >
                            {friend?.avatarUrl ? (
                              <img
                                src={friend.avatarUrl}
                                alt={friend.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-medium text-ink">
                                {friend?.name?.charAt(0).toUpperCase() ?? "?"}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-xs text-ink">
                      {e.participants.length} {e.participants.length === 1 ? "participant" : "participants"}
                    </span>
                  </div>
                )}

                <div className="mt-2 space-y-1">
                  {e.attachments.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 text-xs">
                      <a
                        href={`/api/media/${a.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-moss hover:underline truncate max-w-48"
                      >
                        {a.originalName}
                      </a>
                      {!isReadOnly && (
                        <button
                          onClick={() => deleteAttachment(e.id, a.id)}
                          className="text-ink hover:text-red-500 flex-shrink-0"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {!isReadOnly && (
                    <label className="cursor-pointer text-xs text-ink hover:text-ink flex items-center gap-1">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(ev) => {
                          const f = ev.target.files?.[0];
                          if (f) uploadFile(e.id, f);
                          ev.target.value = "";
                        }}
                      />
                      {uploadingFor === e.id ? "Uploading…" : "+ Attach file"}
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {showForm && (
        <EventFormModal
          tripId={tripId}
          friendMap={friendMap}
          editingEvent={editId ? events.find((e) => e.id === editId) ?? null : null}
          onSaved={handleSaved}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
