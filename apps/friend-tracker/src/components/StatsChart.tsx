"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChartEntry {
  name: string;
  count: number;
}

const COLORS = [
  "oklch(0.35 0.11 140)",
  "oklch(0.48 0.10 140)",
  "oklch(0.55 0.09 140)",
  "oklch(0.62 0.08 140)",
  "oklch(0.65 0.15 60)",
  "oklch(0.55 0.12 60)",
  "oklch(0.42 0.10 140)",
  "oklch(0.38 0.10 140)",
];

export function StatsChart({ data }: { data: ChartEntry[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-ink-muted">No hangouts recorded yet. Start logging some!</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fontFamily: "inherit", fill: "oklch(0.44 0.015 140)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fontFamily: "inherit", fill: "oklch(0.44 0.015 140)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value) => {
            const v = Number(value ?? 0);
            return [`${v} hangout${v !== 1 ? "s" : ""}`, ""] as [string, string];
          }}
          cursor={{ fill: "oklch(0.94 0.004 140)" }}
          contentStyle={{
            fontFamily: "inherit",
            fontSize: "12px",
            border: "1px solid oklch(0.88 0.004 140)",
            borderRadius: "8px",
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
