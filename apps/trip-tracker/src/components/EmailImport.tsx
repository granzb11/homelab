"use client";

import { useState, useRef } from "react";

type ParsedBooking = {
  kind: "booking";
  type: string;
  title: string;
  provider: string | null;
  confirmationCode: string | null;
  startDate: string | null;
  endDate: string | null;
  startLocation: string | null;
  endLocation: string | null;
  price: string | null;
  currency: string;
  notes: string | null;
};

type ParsedExcursion = {
  kind: "excursion";
  type: string;
  title: string;
  location: string | null;
  date: string | null;
  startTime: string | null;
  durationMinutes: number | null;
  price: string | null;
  currency: string;
  confirmationCode: string | null;
  notes: string | null;
};

type ParseResult = ParsedBooking | ParsedExcursion | { kind: "unknown"; error: string };

const KIND_LABEL: Record<string, string> = {
  FLIGHT: "✈ Flight", HOTEL: "🏨 Hotel", AIRBNB: "🏠 Airbnb",
  TRAIN: "🚂 Train", BUS: "🚌 Bus", RENTAL_CAR: "🚗 Rental car", OTHER: "📋 Other",
  FOOD_TOUR: "🍜 Food tour", CITY_TOUR: "🗺 City tour", MUSEUM: "🏛 Museum",
  RESTAURANT: "🍽 Restaurant", ACTIVITY: "🎯 Activity",
};

type Mode = "text" | "image";

export default function EmailImport({
  tripId,
  onImported,
}: {
  tripId: string;
  onImported: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("text");
  const [emailText, setEmailText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    setOpen(false);
    setEmailText("");
    setImagePreview(null);
    setImageData(null);
    setResult(null);
    setError("");
  }

  function loadImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please drop an image file (PNG, JPG, WEBP, etc.)");
      return;
    }
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      // strip the data:image/...;base64, prefix
      setImageData(dataUrl.split(",")[1]);
      setError("");
    };
    reader.readAsDataURL(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadImageFile(file);
  }

  async function parse() {
    setParsing(true);
    setResult(null);
    setError("");

    const body =
      mode === "image" && imageData
        ? { imageData, mimeType: imageMime }
        : { emailText };

    const res = await fetch("/api/parse-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to parse");
      setParsing(false);
      return;
    }
    setResult(data);
    setParsing(false);
  }

  async function save() {
    if (!result || result.kind === "unknown") return;
    setSaving(true);
    const url =
      result.kind === "booking"
        ? `/api/trips/${tripId}/bookings`
        : `/api/trips/${tripId}/excursions`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
    if (res.ok) {
      onImported();
      handleClose();
    } else {
      setError("Failed to save");
    }
    setSaving(false);
  }

  const canParse = mode === "text" ? emailText.trim().length > 0 : imageData !== null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-ink-muted border border-ink-faint px-3 py-1.5 hover:border-moss hover:text-ink"
      >
        ✉ Import from email or photo
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 px-4 z-50">
          <div className="bg-surface w-full max-w-xl border border-ink-faint">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-faint">
              <div>
                <h2 className="font-display italic text-lg font-semibold">Import confirmation</h2>
                <p className="text-xs text-ink-muted mt-0.5">Paste email text or drop a screenshot / photo</p>
              </div>
              <button onClick={handleClose} className="text-ink-muted hover:text-ink">✕</button>
            </div>

            {/* Mode tabs */}
            {!result && (
              <div className="flex border-b border-ink-faint">
                {(["text", "image"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(""); }}
                    className={`px-4 py-2 text-sm border-b-2 -mb-px ${
                      mode === m
                        ? "border-moss text-ink font-medium"
                        : "border-transparent text-ink-muted hover:text-ink"
                    }`}
                  >
                    {m === "text" ? "✉ Paste email" : "🖼 Image / photo"}
                  </button>
                ))}
              </div>
            )}

            <div className="p-5 space-y-4">
              {!result ? (
                <>
                  {mode === "text" ? (
                    <textarea
                      value={emailText}
                      onChange={(e) => setEmailText(e.target.value)}
                      placeholder="Paste the full text of your confirmation email here…"
                      rows={10}
                      autoFocus
                      className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-moss focus:outline-none resize-none font-mono"
                    />
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={onDrop}
                      onClick={() => !imagePreview && fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed transition-colors ${
                        dragging ? "border-moss bg-moss-tint" : "border-ink-faint hover:border-moss"
                      } ${!imagePreview ? "cursor-pointer" : ""} min-h-48 flex items-center justify-center`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) loadImageFile(f);
                          e.target.value = "";
                        }}
                      />
                      {imagePreview ? (
                        <div className="relative w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imagePreview} alt="Preview" className="max-h-64 w-full object-contain" />
                          <button
                            onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageData(null); }}
                            className="absolute top-2 right-2 bg-surface border border-ink-faint text-ink-muted hover:text-red-500 w-6 h-6 flex items-center justify-center text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="text-center p-8">
                          <p className="text-3xl mb-2">🖼</p>
                          <p className="text-sm text-ink-muted">Drop a screenshot or photo here</p>
                          <p className="text-xs text-ink-muted mt-1">or click to browse</p>
                          <p className="text-xs text-ink-faint mt-3">Works with email screenshots, boarding passes, hotel vouchers, ticket photos</p>
                        </div>
                      )}
                    </div>
                  )}

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex gap-3">
                    <button
                      onClick={parse}
                      disabled={parsing || !canParse}
                      className="bg-moss text-white text-sm px-4 py-2 hover:bg-moss-dark disabled:opacity-50"
                    >
                      {parsing ? "Parsing…" : "Parse"}
                    </button>
                    <button onClick={handleClose} className="text-sm text-ink-muted hover:text-ink px-3">
                      Cancel
                    </button>
                  </div>
                </>
              ) : result.kind === "unknown" ? (
                <div className="space-y-4">
                  <div className="bg-gold-tint border border-gold/30 p-4 text-sm text-ink">
                    <p className="font-medium mb-1">Couldn&apos;t parse this confirmation</p>
                    <p className="text-ink-muted">{result.error}</p>
                  </div>
                  <button onClick={() => { setResult(null); setError(""); }} className="text-sm text-moss hover:text-moss-dark">← Try again</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-moss-tint border border-moss/20 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-moss text-white px-2 py-0.5">
                        {result.kind === "booking" ? "Booking" : "Excursion"}
                      </span>
                      <span className="text-sm font-medium text-ink">
                        {KIND_LABEL[result.type] ?? result.type}
                      </span>
                    </div>
                    <p className="font-display italic text-lg font-semibold text-ink">{result.title}</p>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-muted">
                      {"provider" in result && result.provider && (
                        <><dt>Provider</dt><dd className="text-ink">{result.provider}</dd></>
                      )}
                      {result.confirmationCode && (
                        <><dt>Confirmation</dt><dd className="text-ink font-medium">{result.confirmationCode}</dd></>
                      )}
                      {"startDate" in result && result.startDate && (
                        <><dt>Dates</dt><dd className="text-ink">{result.startDate}{result.endDate && result.endDate !== result.startDate ? ` → ${result.endDate}` : ""}</dd></>
                      )}
                      {"date" in result && result.date && (
                        <><dt>Date</dt><dd className="text-ink">{result.date}{result.startTime ? ` at ${result.startTime}` : ""}</dd></>
                      )}
                      {"startLocation" in result && result.startLocation && (
                        <><dt>Route</dt><dd className="text-ink">{result.startLocation}{result.endLocation ? ` → ${result.endLocation}` : ""}</dd></>
                      )}
                      {"location" in result && result.location && (
                        <><dt>Location</dt><dd className="text-ink">{result.location}</dd></>
                      )}
                      {result.price && (
                        <><dt>Price</dt><dd className="text-ink">{result.price} {result.currency}</dd></>
                      )}
                    </dl>
                    {result.notes && (
                      <p className="text-xs text-ink-muted italic border-t border-moss/20 pt-2 mt-2">{result.notes}</p>
                    )}
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex gap-3">
                    <button
                      onClick={save}
                      disabled={saving}
                      className="bg-moss text-white text-sm px-4 py-2 hover:bg-moss-dark disabled:opacity-50"
                    >
                      {saving ? "Saving…" : `Add as ${result.kind}`}
                    </button>
                    <button onClick={() => { setResult(null); setError(""); }} className="text-sm text-ink-muted hover:text-ink px-3">
                      ← Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
