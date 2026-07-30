// Depart uses the transit hue, arrive uses the gold/activity hue -- a fixed pair
// per the design spec (motion vs. arrival), not derived from the event's own type.
export function RouteStrip({
  from,
  to,
  duration,
}: {
  from: { place: string; time: string };
  to: { place: string; time: string };
  duration: string;
}) {
  return (
    <div className="flex items-stretch border-t border-dashed border-ink-faint bg-route-strip">
      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-1 truncate">
          Depart {from.place}
        </div>
        <div className="text-xl font-extrabold tracking-tight text-transit" style={{ fontVariantNumeric: "tabular-nums" }}>
          {from.time}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center px-2 text-ink-muted flex-shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        <span className="font-mono text-[10px] mt-1">{duration}</span>
      </div>
      <div className="flex-1 px-4 py-3 text-right min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-1 truncate">
          Arrive {to.place}
        </div>
        <div className="text-xl font-extrabold tracking-tight text-gold" style={{ fontVariantNumeric: "tabular-nums" }}>
          {to.time}
        </div>
      </div>
    </div>
  );
}
