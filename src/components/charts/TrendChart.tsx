"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";
import { CATEGORICAL, CHROME } from "@/lib/chartColors";

export interface Series {
  key: string;
  label: string;
  colorIndex: number; // index into CATEGORICAL, assign by entity not by loop position
}

export interface TrendPoint {
  date: number;
  [seriesKey: string]: number;
}

export function TrendChart({
  data,
  series,
  yDomain = [0, 100],
  yUnit = "%",
  height = 280,
  phaseMarkers,
}: {
  data: TrendPoint[];
  series: Series[];
  yDomain?: [number, number];
  yUnit?: string;
  height?: number;
  phaseMarkers?: { date: number; label: string }[];
}) {
  if (data.length === 0) {
    return <div className="h-40 flex items-center justify-center text-sm text-ink-muted">Not enough data yet.</div>;
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid stroke={CHROME.gridline} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => format(new Date(v), "MMM d")}
            tick={{ fontSize: 11, fill: CHROME.inkMuted }}
            axisLine={{ stroke: CHROME.baseline }}
            tickLine={false}
          />
          <YAxis
            domain={yDomain}
            tickFormatter={(v) => `${v}${yUnit}`}
            tick={{ fontSize: 11, fill: CHROME.inkMuted }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            labelFormatter={(v) => format(new Date(v as number), "MMM d, yyyy")}
            formatter={(value: any, name: any) => [`${Number(value).toFixed(0)}${yUnit}`, name]}
            contentStyle={{ borderRadius: 10, border: `1px solid ${CHROME.gridline}`, fontSize: 12 }}
          />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {phaseMarkers?.map((m) => (
            <ReferenceLine
              key={m.date}
              x={m.date}
              stroke={CHROME.inkMuted}
              strokeDasharray="3 3"
              label={{ value: m.label, position: "insideTopLeft", fontSize: 10, fill: CHROME.inkMuted }}
            />
          ))}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={CATEGORICAL[s.colorIndex]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
