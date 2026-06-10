const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function cellColor(count: number, isToday: boolean): string {
  if (isToday)    return "oklch(0.65 0.15 60)";
  if (count === 0) return "oklch(0.94 0.004 140)";
  if (count === 1) return "oklch(0.62 0.09 140)";
  if (count === 2) return "oklch(0.48 0.10 140)";
  return                  "oklch(0.35 0.11 140)";
}

export function YearTimeline({ hangoutDates, year = 2026 }: { hangoutDates: string[]; year?: number }) {
  const countByDate = new Map<string, number>();
  for (const d of hangoutDates) {
    const key = d.slice(0, 10);
    countByDate.set(key, (countByDate.get(key) ?? 0) + 1);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  const jan1 = new Date(`${year}-01-01`);
  const dec31 = new Date(`${year}-12-31`);
  const startPad = jan1.getDay();
  const weeks: (string | null)[][] = [];
  const cur = new Date(jan1);
  cur.setDate(cur.getDate() - startPad);

  while (cur <= dec31) {
    const week: (string | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const inYear = cur >= jan1 && cur <= dec31;
      week.push(inYear ? cur.toISOString().slice(0, 10) : null);
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  const monthCols: { label: string; col: number }[] = [];
  weeks.forEach((week, wi) => {
    const first = week.find(Boolean);
    if (first) {
      const m = parseInt(first.slice(5, 7)) - 1;
      const d = parseInt(first.slice(8, 10));
      if (d <= 7 && !monthCols.some((mc) => mc.label === MONTHS[m])) {
        monthCols.push({ label: MONTHS[m], col: wi });
      }
    }
  });

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px] mb-1 text-[10px] text-ink-muted">
        {weeks.map((_, wi) => {
          const mc = monthCols.find((m) => m.col === wi);
          return (
            <div key={wi} className="w-3 flex-shrink-0 text-center">
              {mc ? mc.label : ""}
            </div>
          );
        })}
      </div>
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) =>
              day ? (
                <div
                  key={di}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: cellColor(countByDate.get(day) ?? 0, day === todayStr) }}
                  title={`${day}: ${countByDate.get(day) ?? 0} hangout(s)`}
                />
              ) : (
                <div key={di} className="w-3 h-3" />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
