"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import type { AppointmentAnalyticsData } from "@/types";

interface AppointmentStatusDonutProps {
  data?: AppointmentAnalyticsData["byStatus"];
  loading?: boolean;
  error?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "hsl(43 96% 56%)",
  APPROVED:  "hsl(217 91% 55%)",
  COMPLETED: "hsl(142 71% 45%)",
  CANCELLED: "hsl(0 84% 60%)",
  REJECTED:  "hsl(215 16% 60%)",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Pending",
  APPROVED:  "Approved",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED:  "Rejected",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: { status: string } }[];
  total: number;
}

function CustomTooltip({ active, payload, total }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-slate-800">{item.name}</p>
      <p className="text-slate-600">
        {item.value} appointments ({pct}%)
      </p>
    </div>
  );
}

export function AppointmentStatusDonut({
  data,
  loading = false,
  error = false,
}: AppointmentStatusDonutProps) {
  const total = data?.reduce((s, d) => s + d.count, 0) ?? 0;

  const chartData = (data ?? [])
    .filter((d) => d.count > 0)
    .map((d) => ({
      ...d,
      name: STATUS_LABELS[d.status.toUpperCase()] ?? d.status,
      fill: STATUS_COLORS[d.status.toUpperCase()] ?? "hsl(215 16% 60%)",
    }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
          <PieIcon className="h-4 w-4 text-amber-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">
          Appointments by Status
        </h3>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-[260px]">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="h-32 w-32 rounded-full bg-slate-200" />
              <div className="h-3 w-24 rounded-md bg-slate-200" />
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[260px] text-sm text-slate-400">
            Failed to load data.
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[260px] text-sm text-slate-400">
            No appointment data yet.
          </div>
        ) : (
          <>
            {/* Total center label */}
            <p className="mb-1 text-center text-xs text-slate-500">
              Total:{" "}
              <span className="font-bold text-slate-800">{total}</span>
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="48%"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={2}
                  dataKey="count"
                  strokeWidth={0}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={(props) => (
                    <CustomTooltip {...(props as any)} total={total} />
                  )}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}
