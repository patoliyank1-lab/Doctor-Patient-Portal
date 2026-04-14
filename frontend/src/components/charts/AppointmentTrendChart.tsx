"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AppointmentTrendChartProps {
  /** Array of { month: "YYYY-MM", count: number } from /admin/analytics/appointments monthlyTrend */
  data: { month: string; count: number }[];
}

/** Format "YYYY-MM" → "Jan", "Feb" … */
function formatMonth(ym: string): string {
  const [year, month] = ym.split("-");
  if (!year || !month) return ym;
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString("en", { month: "short" });
}

export function AppointmentTrendChart({ data }: AppointmentTrendChartProps) {
  const chartData = data.map((d) => ({ ...d, label: formatMonth(d.month) }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="appointmentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="hsl(262 80% 58%)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="hsl(262 80% 58%)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          formatter={(value) => [value as number, "Appointments"]}
          labelFormatter={(label) => `Month: ${label}`}
        />
        <Area
          type="monotone"
          dataKey="count"
          name="Appointments"
          stroke="hsl(262 80% 58%)"
          strokeWidth={2.5}
          fill="url(#appointmentGrad)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0, fill: "hsl(262 80% 58%)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
