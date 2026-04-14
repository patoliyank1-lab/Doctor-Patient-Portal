"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PatientGrowthChartProps {
  /** Array of { month: "YYYY-MM", count: number } from /admin/analytics/patients */
  data: { month: string; count: number }[];
}

/** Format "YYYY-MM" → "Jan", "Feb" … */
function formatMonth(ym: string): string {
  const [year, month] = ym.split("-");
  if (!year || !month) return ym;
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString("en", { month: "short" });
}

export function PatientGrowthChart({ data }: PatientGrowthChartProps) {
  const chartData = data.map((d) => ({ ...d, label: formatMonth(d.month) }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(214 32% 91%)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
          axisLine={false}
          tickLine={false}
          width={28}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "10px",
            border: "1px solid hsl(214 32% 91%)",
            fontSize: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
          cursor={{ fill: "hsl(214 32% 95%)", radius: 4 }}
          formatter={(value) => [value as number, "New Patients"]}
          labelFormatter={(label) => `Month: ${label}`}
        />
        <Bar
          dataKey="count"
          name="New Patients"
          fill="hsl(217 91% 55%)"
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
