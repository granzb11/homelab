export type ItineraryAccent = "lodging" | "transit" | "activity" | "food";

// Every type gets a tinted background at low opacity -- never a flat gray/neutral
// fill, which reads as a dark block on a light surface. "activity" intentionally
// aliases the app's existing gold token rather than getting a fifth accent.
const TILE_CLASSES: Record<ItineraryAccent, string> = {
  lodging: "bg-lodging-tint text-lodging",
  transit: "bg-transit-tint text-transit",
  activity: "bg-gold-tint text-gold",
  food: "bg-food-tint text-food",
};

export function IconTile({
  accent,
  icon,
  muted,
}: {
  accent: ItineraryAccent;
  icon: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-2xl leading-none flex-shrink-0 ${
        muted ? "bg-panel text-ink-muted" : TILE_CLASSES[accent]
      }`}
    >
      {icon}
    </div>
  );
}
