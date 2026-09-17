import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NasaDailyPoint } from "@/lib/nasa.functions";
import { CategoryTag } from "./data-status";

export type ChartPoint = { label: string; value: number | null; compare?: number | null };

export function aggregate(
  series: NasaDailyPoint[],
  key: "t2m" | "precip" | "solar",
): { points: ChartPoint[]; resolution: string } {
  const valid = series.filter((s) => s[key] !== null);
  if (series.length <= 120) {
    return {
      points: series.map((s) => ({ label: s.date, value: s[key] })),
      resolution: "Daily values",
    };
  }
  const buckets = new Map<string, number[]>();
  for (const s of valid) {
    const month = s.date.slice(0, 7);
    const arr = buckets.get(month) ?? [];
    arr.push(s[key] as number);
    buckets.set(month, arr);
  }
  const points = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({
      label: month,
      value: Math.round((values.reduce((x, y) => x + y, 0) / values.length) * 100) / 100,
    }));
  return { points, resolution: "Monthly mean of NASA daily values" };
}

type Props = {
  title: string;
  variable: string;
  unit: string;
  resolution: string;
  points: ChartPoint[];
  color: string;
  kind?: "line" | "bar" | "area";
  source?: string;
  compareLabel?: string;
};

export function SeriesChart({
  title,
  variable,
  unit,
  resolution,
  points,
  color,
  kind = "line",
  source = "NASA POWER — REAL OBSERVED/REANALYZED DATA",
  compareLabel,
}: Props) {
  const axis = {
    stroke: "var(--color-muted-foreground)",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
  };
  const tooltip = (
    <Tooltip
      contentStyle={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "6px",
        fontSize: "12px",
      }}
      labelStyle={{ color: "var(--color-muted-foreground)" }}
      formatter={(v: number | string) => [`${v} ${unit}`, ""]}
    />
  );

  return (
    <section className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="label-tag mt-1">
            {variable} · unit {unit} · {resolution}
          </p>
        </div>
        <CategoryTag kind={compareLabel ? "scenario" : "nasa"} />
      </div>

      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {kind === "bar" ? (
            <BarChart data={points} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axis} tickMargin={8} minTickGap={24} />
              <YAxis {...axis} width={48} />
              {tooltip}
              <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
              {compareLabel && <Bar dataKey="compare" fill="var(--color-warning)" radius={[2, 2, 0, 0]} />}
            </BarChart>
          ) : kind === "area" ? (
            <AreaChart data={points} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axis} tickMargin={8} minTickGap={24} />
              <YAxis {...axis} width={48} />
              {tooltip}
              <Area
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.15}
                strokeWidth={1.6}
                connectNulls={false}
                dot={false}
              />
            </AreaChart>
          ) : (
            <LineChart data={points} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axis} tickMargin={8} minTickGap={24} />
              <YAxis {...axis} width={48} />
              {tooltip}
              <Line
                dataKey="value"
                stroke={color}
                strokeWidth={1.8}
                dot={false}
                connectNulls={false}
              />
              {compareLabel && (
                <Line
                  dataKey="compare"
                  stroke="var(--color-warning)"
                  strokeWidth={1.8}
                  strokeDasharray="4 3"
                  dot={false}
                  connectNulls={false}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Source: {source}
        {compareLabel ? ` · Dashed/second series: ${compareLabel} (hypothetical, not NASA data)` : ""}
      </p>
    </section>
  );
}
