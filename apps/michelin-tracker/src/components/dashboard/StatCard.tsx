interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        background: accent ? "var(--color-moss-light)" : "var(--color-panel)",
        borderColor: accent ? "oklch(0.82 0.05 140)" : "var(--color-border)",
      }}
    >
      <p
        style={{
          fontSize: "0.75rem",
          color: accent ? "var(--color-moss)" : "var(--color-muted)",
          letterSpacing: "0.01em",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-fraunces)",
          fontWeight: 600,
          fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          color: accent ? "var(--color-moss)" : "var(--color-ink)",
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-muted)",
            marginTop: "0.375rem",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
