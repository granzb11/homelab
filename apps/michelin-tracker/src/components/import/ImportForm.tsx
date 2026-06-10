"use client";

import { useRef, useState } from "react";

interface ImportResult {
  imported: number;
  total: number;
}

export function ImportForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setStatus("loading");
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult(data);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  };

  return (
    <div style={{ maxWidth: "32rem" }}>
      <h1
        style={{
          fontFamily: "var(--font-fraunces)",
          fontWeight: 600,
          fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          color: "var(--color-ink)",
          marginBottom: "0.35rem",
        }}
      >
        Import from Excel
      </h1>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginBottom: "2rem" }}>
        Upload your{" "}
        <code
          style={{
            background: "var(--color-panel)",
            border: "1px solid var(--color-border)",
            borderRadius: "0.25rem",
            padding: "0.125rem 0.375rem",
            fontSize: "0.75rem",
          }}
        >
          michelin_tracker.xlsx
        </code>{" "}
        file. Existing records (matched by name + date) will be skipped.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div
          style={{
            border: `2px dashed ${fileName ? "var(--color-moss)" : "var(--color-border)"}`,
            borderRadius: "0.75rem",
            padding: "3rem 2rem",
            textAlign: "center",
            background: fileName ? "var(--color-moss-light)" : "var(--color-panel)",
            transition: "border-color 150ms, background 150ms",
            cursor: "pointer",
          }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          <div
            style={{
              fontSize: "2rem",
              marginBottom: "0.75rem",
              color: fileName ? "var(--color-moss)" : "var(--color-muted)",
            }}
          >
            {fileName ? "✓" : "↑"}
          </div>
          {fileName ? (
            <p style={{ fontSize: "0.875rem", color: "var(--color-moss)", fontWeight: 500 }}>
              {fileName}
            </p>
          ) : (
            <>
              <p style={{ fontSize: "0.875rem", color: "var(--color-ink)", marginBottom: "0.25rem" }}>
                Click to select a file
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>.xlsx or .xls</p>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={status === "loading" || !fileName}
          style={{
            padding: "0.625rem 1rem",
            background: !fileName || status === "loading" ? "var(--color-border)" : "var(--color-moss)",
            color: !fileName || status === "loading" ? "var(--color-muted)" : "var(--color-surface)",
            border: "none",
            borderRadius: "0.375rem",
            fontSize: "0.8125rem",
            cursor: !fileName || status === "loading" ? "not-allowed" : "pointer",
            fontFamily: "var(--font-mono)",
            transition: "background 150ms",
          }}
          onMouseEnter={(e) => {
            if (fileName && status !== "loading")
              e.currentTarget.style.background = "oklch(0.28 0.10 140)";
          }}
          onMouseLeave={(e) => {
            if (fileName && status !== "loading")
              e.currentTarget.style.background = "var(--color-moss)";
          }}
        >
          {status === "loading" ? "Importing…" : "Import"}
        </button>
      </form>

      {status === "success" && result && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "var(--color-moss-light)",
            border: "1px solid oklch(0.82 0.05 140)",
            borderRadius: "0.75rem",
            fontSize: "0.8125rem",
            color: "var(--color-moss)",
          }}
        >
          Imported {result.imported} of {result.total} restaurants
          {result.total - result.imported > 0 &&
            ` — ${result.total - result.imported} skipped as duplicates`}
        </div>
      )}

      {status === "error" && error && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "oklch(0.96 0.02 15)",
            border: "1px solid oklch(0.85 0.08 15)",
            borderRadius: "0.75rem",
            fontSize: "0.8125rem",
            color: "oklch(0.45 0.18 15)",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
