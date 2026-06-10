import { PAIRING_LABELS } from "@/lib/types";

interface PairingBreakdownProps {
  byPairing: Record<string, number>;
  total: number;
}

const BAR_COLORS: Record<string, string> = {
  WINE_PAIRING: "var(--color-moss)",
  RESERVED_WINE_PAIRING: "var(--color-moss-mid)",
  BEVERAGE_PAIRING: "var(--color-amber)",
  NONE: "var(--color-border)",
};

export function PairingBreakdown({ byPairing, total }: PairingBreakdownProps) {
  const keys = ["WINE_PAIRING", "RESERVED_WINE_PAIRING", "BEVERAGE_PAIRING", "NONE"];
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: "var(--color-panel)", borderColor: "var(--color-border)" }}
    >
      <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "1rem" }}>
        Pairing Breakdown
      </p>
      <div className="flex flex-col gap-4">
        {keys.map((k) => {
          const count = byPairing[k] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={k}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                  {PAIRING_LABELS[k]}
                </span>
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
                  style={{ width: `${pct}%`, background: BAR_COLORS[k] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
