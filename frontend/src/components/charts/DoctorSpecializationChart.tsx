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
import type { DoctorSpecializationStat } from "@/types";

interface DoctorSpecializationChartProps {
  data: DoctorSpecializationStat[];
}

const COLORS = [
  "hsl(217 91% 50%)",
  "hsl(217 91% 60%)",
  "hsl(217 91% 70%)",
  "hsl(142 76% 36%)",
  "hsl(142 76% 50%)",
  "hsl(262 80% 58%)",
  "hsl(25 100% 55%)",
];

export function DoctorSpecializationChart({
  data,
}: DoctorSpecializationChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 12, fill: "hsl(215 16% 47%)" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="specialization"
          tick={{ fontSize: 12, fill: "hsl(215 16% 47%)" }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(214 32% 91%)",
            fontSize: "12px",
          }}
          cursor={{ fill: "hsl(214 32% 95%)" }}
        />
        <Bar dataKey="count" name="Doctors" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
