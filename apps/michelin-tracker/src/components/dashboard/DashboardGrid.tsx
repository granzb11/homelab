import { StatCard } from "./StatCard";
import { StarBreakdown } from "./StarBreakdown";
import { PairingBreakdown } from "./PairingBreakdown";

interface Stats {
  total: number;
  byStars: Record<number, number>;
  avgRating: number;
  avgPairingPrice: number;
  totalPairingSpend: number;
  wouldReturn: number;
  byPairing: Record<string, number>;
}

export function DashboardGrid({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Visited" value={stats.total} accent />
        <StatCard
          label="Avg Rating"
          value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"}
          sub="out of 10"
        />
        <StatCard
          label="Would Return"
          value={stats.wouldReturn}
          sub={`${stats.total > 0 ? Math.round((stats.wouldReturn / stats.total) * 100) : 0}% of visits`}
        />
        <StatCard
          label="Pairing Spend"
          value={stats.totalPairingSpend ? `$${stats.totalPairingSpend.toFixed(0)}` : "$0"}
          sub={
            stats.avgPairingPrice
              ? `avg $${stats.avgPairingPrice.toFixed(0)}`
              : undefined
          }
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StarBreakdown byStars={stats.byStars} total={stats.total} />
        <PairingBreakdown byPairing={stats.byPairing} total={stats.total} />
      </div>
    </div>
  );
}
