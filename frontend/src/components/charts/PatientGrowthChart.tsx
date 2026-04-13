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
import type { PatientGrowthStat } from "@/types";

interface PatientGrowthChartProps {
  data: PatientGrowthStat[];
}

export function PatientGrowthChart({ data }: PatientGrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "hsl(215 16% 47%)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "hsl(215 16% 47%)" }}
          axisLine={false}
          tickLine={false}
          width={32}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(214 32% 91%)",
            fontSize: "12px",
          }}
          cursor={{ fill: "hsl(214 32% 95%)" }}
        />
        <Bar
          dataKey="count"
          name="New Patients"
          fill="hsl(217 91% 50%)"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
