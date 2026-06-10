"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import heic2any from "heic2any";

interface Props {
  friendId: string;
  name: string;
  avatarUrl: string | null;
  size?: "sm" | "lg";
}

async function normalizeToBlob(file: File): Promise<Blob> {
  if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif")) {
    const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    return Array.isArray(result) ? result[0] : result;
  }
  return file;
}

function resizeToDataUrl(file: Blob, maxPx: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function uploadBlob(blob: Blob, friendId: string) {
  const normalized = blob instanceof File ? await normalizeToBlob(blob) : blob;
  const dataUrl = await resizeToDataUrl(normalized, 300);
  const res = await fetch(`/api/friends/${friendId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatarUrl: dataUrl }),
  });
  return res.ok ? dataUrl : null;
}

export function AvatarUpload({ friendId, name, avatarUrl, size = "lg" }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [current, setCurrent] = useState(avatarUrl);

  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const dim = size === "lg" ? "w-14 h-14" : "w-9 h-9";
  const textSize = size === "lg" ? "text-xl" : "text-xs";

  async function process(blob: Blob) {
    setUploading(true);
    try {
      const dataUrl = await uploadBlob(blob, friendId);
      if (dataUrl) { setCurrent(dataUrl); router.refresh(); }
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    async function handlePaste(e: ClipboardEvent) {
      const file = Array.from(e.clipboardData?.items ?? [])
        .find((i) => i.kind === "file" && i.type.startsWith("image/"))
        ?.getAsFile();
      if (file) process(file);
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [friendId, router]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { await process(file); e.target.value = ""; }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/") || /\.heic|\.heif$/i.test(f.name));
    if (file) process(file);
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`${dim} rounded-full relative flex-shrink-0 group focus:outline-none ${dragging ? "ring-2 ring-moss ring-offset-2" : ""}`}
      title="Click, drag, or paste (⌘V) a photo"
    >
      {current ? (
        <img
          src={current}
          alt={name}
          className={`${dim} rounded-full object-cover`}
        />
      ) : (
        <div className={`${dim} rounded-full bg-moss-tint text-moss font-bold ${textSize} font-display italic flex items-center justify-center`}>
          {initials}
        </div>
      )}
      <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        {uploading ? (
          <span className="text-white text-xs">…</span>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        )}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="sr-only"
        onChange={handleFile}
      />
    </button>
  );
}
