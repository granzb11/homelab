interface StarBreakdownProps {
  byStars: Record<number, number>;
  total: number;
}

const STAR_LABEL = ["", "One Star", "Two Stars", "Three Stars"];

export function StarBreakdown({ byStars, total }: StarBreakdownProps) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: "var(--color-panel)", borderColor: "var(--color-border)" }}
    >
      <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "1rem" }}>
        By Star Level
      </p>
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((s) => {
          const count = byStars[s] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={s}>
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--color-amber)", letterSpacing: "0.05em", fontSize: "0.875rem" }}>
                    {"★".repeat(s)}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                    {STAR_LABEL[s]}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-fraunces)",
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: "var(--color-ink)",
                  }}
                >
                  {count}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--color-border)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    background: s === 3
                      ? "var(--color-moss)"
                      : s === 2
                      ? "var(--color-moss-mid)"
                      : "var(--color-amber)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
