"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DoctorAnalyticsData } from "@/types";

interface DoctorSpecializationChartProps {
  /** From /admin/analytics/doctors → bySpecialization (up to top ~8) */
  data: DoctorAnalyticsData["bySpecialization"];
}

const COLORS = [
  "hsl(217 91% 55%)",
  "hsl(262 80% 58%)",
  "hsl(142 71% 45%)",
  "hsl(25 95% 53%)",
  "hsl(340 82% 52%)",
  "hsl(186 94% 40%)",
  "hsl(43 96% 56%)",
  "hsl(280 80% 60%)",
];

export function DoctorSpecializationChart({ data }: DoctorSpecializationChartProps) {
  // Show top 8, shorten labels
  const chartData = data
    .slice(0, 8)
    .map((d) => ({
      ...d,
      label:
        d.specialization.length > 18
          ? d.specialization.slice(0, 16) + "…"
          : d.specialization,
    }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 5, right: 24, left: 10, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(214 32% 91%)"
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
          axisLine={false}
          tickLine={false}
          width={88}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "10px",
            border: "1px solid hsl(214 32% 91%)",
            fontSize: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
          cursor={{ fill: "hsl(214 32% 95%)" }}
          formatter={(value) => [value as number, "Doctors"]}
          labelFormatter={(label) => label}
        />
        <Bar
          dataKey="doctorCount"
          name="Doctors"
          radius={[0, 6, 6, 0]}
          maxBarSize={22}
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
