"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface Photo {
  id: string;
  dataUrl: string;
  caption: string | null;
  createdAt: Date | string;
}

interface HangoutEvent {
  id: string;
  title: string | null;
  eventType: string | null;
  location: string | null;
  city: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  whoTraveled: string | null;
  notes: string | null;
  friends: { id: string; name: string; avatarUrl: string | null }[];
  photos: Photo[];
}

// Per-type color themes: [heroBg, accentText, badgeBg, badgeText, emoji]
const EVENT_THEMES: Record<string, {
  heroBg: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  icon: string;
}> = {
  Wedding:        { heroBg: "bg-rose-50",   accent: "text-rose-700",   badgeBg: "bg-rose-100",   badgeText: "text-rose-700",   icon: "💍" },
  Birthday:       { heroBg: "bg-amber-50",  accent: "text-amber-700",  badgeBg: "bg-amber-100",  badgeText: "text-amber-700",  icon: "🎂" },
  "Holiday Party":{ heroBg: "bg-violet-50", accent: "text-violet-700", badgeBg: "bg-violet-100", badgeText: "text-violet-700", icon: "🎉" },
  Dinner:         { heroBg: "bg-orange-50", accent: "text-orange-700", badgeBg: "bg-orange-100", badgeText: "text-orange-700", icon: "🍷" },
  Lunch:          { heroBg: "bg-lime-50",   accent: "text-lime-700",   badgeBg: "bg-lime-100",   badgeText: "text-lime-700",   icon: "🥗" },
  Coffee:         { heroBg: "bg-yellow-50", accent: "text-yellow-700", badgeBg: "bg-yellow-100", badgeText: "text-yellow-700", icon: "☕" },
  Trip:           { heroBg: "bg-sky-50",    accent: "text-sky-700",    badgeBg: "bg-sky-100",    badgeText: "text-sky-700",    icon: "✈️" },
  Vacation:       { heroBg: "bg-teal-50",   accent: "text-teal-700",   badgeBg: "bg-teal-100",   badgeText: "text-teal-700",   icon: "🏖️" },
  Concert:        { heroBg: "bg-purple-50", accent: "text-purple-700", badgeBg: "bg-purple-100", badgeText: "text-purple-700", icon: "🎵" },
  "Music Festival":{ heroBg: "bg-pink-50", accent: "text-pink-700",   badgeBg: "bg-pink-100",   badgeText: "text-pink-700",   icon: "🎪" },
  Other:          { heroBg: "bg-moss-tint", accent: "text-moss",       badgeBg: "bg-moss-tint",  badgeText: "text-moss",       icon: "🤝" },
};
const DEFAULT_THEME = { heroBg: "bg-moss-tint", accent: "text-moss", badgeBg: "bg-moss-tint", badgeText: "text-moss", icon: "🤝" };

function parseLocalDate(v: Date | string): Date {
  const iso = typeof v === "string" ? v : v.toISOString();
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateRange(start: Date | string, end: Date | string | null): string {
  const s = parseLocalDate(start);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const fmt = (d: Date) => `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  if (!end) return fmt(s);
  const e = parseLocalDate(end);
  if (s.toDateString() === e.toDateString()) return fmt(s);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth())
    return `${months[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
  return `${fmt(s)} – ${fmt(e)}`;
}

function Avatar({ friend }: { friend: { id: string; name: string; avatarUrl: string | null } }) {
  const initials = friend.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <Link href={`/friends/${friend.id}`} className="flex flex-col items-center gap-1.5 group">
      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm group-hover:scale-105 transition-transform duration-150">
        {friend.avatarUrl ? (
          <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-moss-tint flex items-center justify-center text-moss text-base font-semibold">
            {initials}
          </div>
        )}
      </div>
      <span className="text-xs text-ink-muted group-hover:text-moss transition-colors">{friend.name.split(" ")[0]}</span>
    </Link>
  );
}

function NotesCard({ eventId, initialNotes }: { eventId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function startEdit() {
    setDraft(notes);
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  async function save() {
    if (draft === notes) { setEditing(false); return; }
    setSaving(true);
    await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: draft }),
    });
    setNotes(draft);
    setEditing(false);
    setSaving(false);
  }

  function cancel() {
    setDraft(notes);
    setEditing(false);
  }

  return (
    <div className="relative">
      {editing ? (
        <div
          style={{ animation: "fade-up 150ms ease-out both" }}
          className="space-y-3"
        >
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
            }}
            rows={5}
            placeholder="What made this hangout memorable?"
            className="w-full text-sm text-ink leading-relaxed bg-transparent border border-moss rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-moss/30 placeholder:text-ink-muted/50"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="bg-moss text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-moss-dark disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={cancel}
              className="text-sm text-ink-muted hover:text-ink px-3 py-1.5 transition-colors"
            >
              Cancel
            </button>
            <span className="text-xs text-ink-muted ml-auto">⌘↵ to save</span>
          </div>
        </div>
      ) : (
        <button
          onClick={startEdit}
          className="w-full text-left group"
          title="Click to edit"
        >
          {notes ? (
            <p
              className="text-sm text-ink leading-relaxed whitespace-pre-wrap group-hover:text-ink transition-colors"
              style={{ maxWidth: "65ch" }}
            >
              {notes}
              <span className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-ink-muted text-xs align-middle">
                edit
              </span>
            </p>
          ) : (
            <p className="text-sm text-ink-muted italic group-hover:text-moss transition-colors">
              Add a memory — what made this special?
            </p>
          )}
        </button>
      )}
    </div>
  );
}

function isVideo(src: string) {
  if (src.startsWith("data:video/")) return true;
  if (src.startsWith("/api/media/")) {
    const ext = src.split(".").pop()?.toLowerCase();
    return ["mp4", "mov", "webm", "avi", "mkv", "m4v"].includes(ext ?? "");
  }
  return false;
}

function VideoThumbnail({ dataUrl, onClick }: { dataUrl: string; onClick: () => void }) {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    // metadata only — don't download the whole video just for a thumbnail
    video.preload = "metadata";
    video.src = dataUrl;

    function capture() {
      if (cancelled || video.videoWidth === 0) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          setThumb(canvas.toDataURL("image/jpeg", 0.75));
        }
      } catch {
        // canvas taint or unsupported — leave thumb null, show icon fallback
      }
    }

    // loadeddata fires when the first frame is decodable — capture it directly,
    // no seek needed, so we don't trigger extra network range requests.
    video.addEventListener("loadeddata", capture, { once: true });

    // On some mobile browsers loadeddata never fires with preload=metadata;
    // fall back to seeking after metadata arrives.
    video.addEventListener("loadedmetadata", () => {
      if (cancelled) return;
      video.currentTime = 0.001;
    });
    video.addEventListener("seeked", capture, { once: true });

    video.load();

    return () => {
      cancelled = true;
      video.src = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl]);

  return (
    <div className="relative w-full bg-black/10" onClick={onClick}>
      {thumb ? (
        <img src={thumb} alt="Video thumbnail" className="w-full block object-cover" />
      ) : (
        // Fallback placeholder while thumbnail generates
        <div className="w-full aspect-video bg-ink-faint/30 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-ink-muted">
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
          </svg>
        </div>
      )}
      {/* Play badge */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
            <path d="M5 3.5l8 4.5-8 4.5V3.5z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function PhotoGrid({ eventId, initialPhotos }: { eventId: string; initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  // Keyboard nav for lightbox
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = useCallback((e: KeyboardEvent) => {
    if (lightboxIdx === null) return;
    if (e.key === "ArrowRight") setLightboxIdx((i) => Math.min(i! + 1, photos.length - 1));
    if (e.key === "ArrowLeft")  setLightboxIdx((i) => Math.max(i! - 1, 0));
    if (e.key === "Escape") setLightboxIdx(null);
  }, [lightboxIdx, photos.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const processFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const accepted = Array.from(files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (accepted.length === 0) return;

    setUploadCount(accepted.length);
    setUploading(true);
    let done = 0;

    accepted.forEach(async (file) => {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`/api/events/${eventId}/photos`, {
        method: "POST",
        body: form,
        // No Content-Type header — browser sets it with the boundary
      });
      if (res.ok) {
        const photo = await res.json();
        setPhotos((prev) => [...prev, photo]);
      }
      done++;
      if (done === accepted.length) {
        setUploading(false);
        setUploadCount(0);
      }
    });
  }, [eventId]);

  function deletePhoto(photoId: string) {
    startTransition(async () => {
      await fetch(`/api/events/${eventId}/photos/${photoId}`, { method: "DELETE" });
      setPhotos((prev) => {
        const next = prev.filter((p) => p.id !== photoId);
        if (lightboxIdx !== null) {
          setLightboxIdx(next.length === 0 ? null : Math.min(lightboxIdx, next.length - 1));
        }
        return next;
      });
    });
  }

  function startEditCaption(photo: Photo) {
    setEditingId(photo.id);
    setCaptionDraft(photo.caption ?? "");
  }

  async function saveCaption(photoId: string) {
    const res = await fetch(`/api/events/${eventId}/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: captionDraft }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPhotos((prev) => prev.map((p) => (p.id === photoId ? updated : p)));
    }
    setEditingId(null);
  }

  const lightboxItem = lightboxIdx !== null ? photos[lightboxIdx] : null;

  return (
    <div>
      {/* Upload zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload photos or videos"
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group select-none ${
          isDragging
            ? "border-moss bg-moss-tint scale-[1.01]"
            : "border-ink-faint hover:border-moss hover:bg-moss-tint/40"
        }`}
        style={isDragging ? { animation: "pulse-border 1s ease infinite" } : undefined}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2">
          <span
            className={`text-3xl transition-transform duration-200 ${isDragging ? "scale-125" : "group-hover:scale-110"}`}
            aria-hidden
          >
            {uploading ? "⏳" : isDragging ? "📸" : "🎞️"}
          </span>
          <p className={`text-sm font-medium transition-colors ${isDragging ? "text-moss" : "text-ink-muted group-hover:text-moss"}`}>
            {uploading
              ? `Uploading ${uploadCount} file${uploadCount !== 1 ? "s" : ""}…`
              : isDragging
              ? "Drop to add"
              : "Drop photos or videos, or click to upload"}
          </p>
          {!uploading && !isDragging && (
            <p className="text-xs text-ink-muted/60">Photos and videos supported</p>
          )}
        </div>
      </div>

      {/* Media grid */}
      {photos.length > 0 && (
        <div className="mt-5 columns-2 sm:columns-3 gap-3 space-y-3">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="group relative break-inside-avoid rounded-xl overflow-hidden cursor-pointer"
              style={{ animation: `photo-appear 300ms ease-out ${i * 40}ms both` }}
            >
              {isVideo(photo.dataUrl) ? (
                <VideoThumbnail dataUrl={photo.dataUrl} onClick={() => setLightboxIdx(i)} />
              ) : (
                <img
                  src={photo.dataUrl}
                  alt={photo.caption ?? "Hangout photo"}
                  className="w-full block object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  onClick={() => setLightboxIdx(i)}
                />
              )}
              {/* Hover overlay */}
              <div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 flex flex-col justify-end pointer-events-none"
              >
                {photo.caption && (
                  <div className="translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-200 px-2.5 py-2">
                    <p className="text-[11px] text-white leading-tight">{photo.caption}</p>
                  </div>
                )}
              </div>
              {/* Action buttons */}
              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  onClick={(e) => { e.stopPropagation(); startEditCaption(photo); }}
                  className="w-7 h-7 rounded-full bg-white/95 flex items-center justify-center text-ink hover:bg-white shadow-sm text-xs"
                  title="Edit caption"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }}
                  className="w-7 h-7 rounded-full bg-white/95 flex items-center justify-center text-red-500 hover:bg-white shadow-sm text-xs font-bold"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Caption editor */}
      {editingId && (() => {
        const photo = photos.find((p) => p.id === editingId)!;
        return (
          <div
            className="mt-4 p-4 border border-moss/30 rounded-2xl bg-moss-tint/40 space-y-3"
            style={{ animation: "fade-up 150ms ease-out both" }}
          >
            <div className="flex gap-3 items-start">
              {isVideo(photo.dataUrl) ? (
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-ink-faint flex items-center justify-center text-ink-muted text-lg">▶</div>
              ) : (
                <img src={photo.dataUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 space-y-2">
                <p className="text-xs font-medium text-ink-muted">Caption</p>
                <input
                  autoFocus
                  value={captionDraft}
                  onChange={(e) => setCaptionDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveCaption(editingId);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  placeholder="Describe the moment…"
                  className="w-full border border-ink-faint rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => saveCaption(editingId)} className="bg-moss text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-moss-dark">Save</button>
              <button onClick={() => setEditingId(null)} className="text-sm text-ink-muted px-3 py-1.5 hover:text-ink">Cancel</button>
            </div>
          </div>
        );
      })()}

      {/* Lightbox — portalled to body so parent transforms don't break fixed positioning */}
      {lightboxItem && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "oklch(0.05 0 0 / 0.92)" }}
          onClick={() => setLightboxIdx(null)}
        >
          <div
            className="relative w-full max-w-5xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "pop-in 200ms ease-out both" }}
          >
            {/* Media */}
            {isVideo(lightboxItem.dataUrl) ? (
              <video
                key={lightboxItem.id}
                src={lightboxItem.dataUrl}
                controls
                autoPlay
                className="max-h-[80vh] w-auto rounded-2xl shadow-2xl bg-black"
              />
            ) : (
              <img
                key={lightboxItem.id}
                src={lightboxItem.dataUrl}
                alt={lightboxItem.caption ?? ""}
                className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl"
              />
            )}

            {/* Caption */}
            {lightboxItem.caption && (
              <p className="mt-3 text-sm text-white/70 text-center max-w-md">{lightboxItem.caption}</p>
            )}

            {/* Strip thumbnail nav */}
            {photos.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto max-w-full pb-1">
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setLightboxIdx(i)}
                    className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                      i === lightboxIdx
                        ? "border-white scale-110"
                        : "border-transparent opacity-50 hover:opacity-80"
                    }`}
                  >
                    {isVideo(p.dataUrl) ? (
                      <VideoThumbnail dataUrl={p.dataUrl} onClick={() => {}} />
                    ) : (
                      <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Prev / next arrows */}
            {photos.length > 1 && (
              <div className="absolute inset-x-0 top-1/3 -translate-y-1/2 flex justify-between px-2 pointer-events-none">
                <button
                  onClick={() => setLightboxIdx((i) => Math.max(i! - 1, 0))}
                  disabled={lightboxIdx === 0}
                  className="pointer-events-auto w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white text-xl backdrop-blur-sm disabled:opacity-20 transition-all"
                >
                  ‹
                </button>
                <button
                  onClick={() => setLightboxIdx((i) => Math.min(i! + 1, photos.length - 1))}
                  disabled={lightboxIdx === photos.length - 1}
                  className="pointer-events-auto w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white text-xl backdrop-blur-sm disabled:opacity-20 transition-all"
                >
                  ›
                </button>
              </div>
            )}

            {/* Counter + close */}
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {photos.length > 1 && (
                <span className="text-xs text-white/60 bg-black/30 rounded-full px-2.5 py-1 backdrop-blur-sm">
                  {lightboxIdx! + 1} / {photos.length}
                </span>
              )}
              <button
                onClick={() => setLightboxIdx(null)}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white text-sm backdrop-blur-sm transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export function HangoutDetail({ event }: { event: HangoutEvent }) {
  const theme = event.eventType ? (EVENT_THEMES[event.eventType] ?? DEFAULT_THEME) : DEFAULT_THEME;
  const place = [event.location, event.city].filter(Boolean).join(" · ");
  const dateRange = formatDateRange(event.startDate, event.endDate);

  const multiDay = event.endDate &&
    new Date(event.startDate).toDateString() !== new Date(event.endDate).toDateString();
  const duration = multiDay
    ? Math.round((new Date(event.endDate!).getTime() - new Date(event.startDate).getTime()) / 86400000) + 1
    : null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className={`${theme.heroBg} rounded-3xl px-6 pt-8 pb-6 relative overflow-hidden`}
        style={{ animation: "fade-up 200ms ease-out both" }}
      >
        {/* Edit link */}
        <Link
          href={`/events/${event.id}/edit`}
          className="absolute top-4 right-4 text-xs px-3 py-1.5 rounded-lg border border-current/20 text-current/60 hover:text-current/90 hover:border-current/40 transition-colors font-medium bg-white/40 backdrop-blur-sm"
        >
          Edit
        </Link>

        {/* Big emoji */}
        <div
          className="text-6xl mb-4 select-none leading-none"
          style={{ animation: "pop-in 350ms ease-out 80ms both" }}
        >
          {theme.icon}
        </div>

        {/* Event type badge */}
        {event.eventType && (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${theme.badgeBg} ${theme.badgeText} mb-2`}>
            {event.eventType}
          </div>
        )}

        {/* Title */}
        <h1 className="font-display text-3xl font-semibold text-ink leading-tight text-wrap-balance">
          {event.title || event.eventType || "Hangout"}
        </h1>

        {/* Date + meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
          <span className="text-sm text-ink-muted flex items-center gap-1.5">
            <span aria-hidden>📅</span>
            {dateRange}
            {duration && <span className="text-xs text-ink-muted/70">· {duration} days</span>}
          </span>
          {place && (
            <span className="text-sm text-ink-muted flex items-center gap-1.5">
              <span aria-hidden>📍</span>
              {place}
            </span>
          )}
          {event.whoTraveled && event.whoTraveled !== "Neither" && (
            <span className="text-sm text-ink-muted flex items-center gap-1.5">
              <span aria-hidden>✈️</span>
              {event.whoTraveled === "You" ? "You traveled"
                : event.whoTraveled === "Them" ? "They traveled"
                : "Both traveled"}
            </span>
          )}
        </div>
      </div>

      {/* Friends */}
      {event.friends.length > 0 && (
        <section style={{ animation: "fade-up 200ms ease-out 60ms both" }}>
          <p className="text-xs font-medium text-ink-muted mb-3">With</p>
          <div className="flex flex-wrap gap-5">
            {event.friends.map((f, i) => (
              <div key={f.id} style={{ animation: `pop-in 250ms ease-out ${80 + i * 50}ms both` }}>
                <Avatar friend={f} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Memory / Notes */}
      <section
        className="bg-amber-50/60 border border-amber-100 rounded-2xl p-5"
        style={{ animation: "fade-up 200ms ease-out 120ms both" }}
      >
        <p className="text-xs font-medium text-amber-700/70 mb-3 flex items-center gap-1.5">
          <span aria-hidden>✨</span> Memory
        </p>
        <NotesCard eventId={event.id} initialNotes={event.notes} />
      </section>

      {/* Photos */}
      <section style={{ animation: "fade-up 200ms ease-out 160ms both" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-ink-muted">Photos</p>
          {event.photos.length > 0 && (
            <span className="text-xs text-ink-muted bg-ink-faint px-2 py-0.5 rounded-full">
              {event.photos.length}
            </span>
          )}
        </div>
        <PhotoGrid eventId={event.id} initialPhotos={event.photos} />
      </section>
    </div>
  );
}
