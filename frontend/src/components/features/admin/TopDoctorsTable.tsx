"use client";

import { Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { DoctorAnalyticsData } from "@/types";

type TopDoctor = DoctorAnalyticsData["topDoctorsByCompletedAppointments"][number];

interface TopDoctorsTableProps {
  data?: TopDoctor[];
  loading?: boolean;
  error?: boolean;
}

const RANK_COLORS = [
  "text-amber-500",   // 1st — gold
  "text-slate-400",   // 2nd — silver
  "text-orange-400",  // 3rd — bronze
];

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(4)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded-md bg-slate-200" style={{ width: `${55 + i * 12}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function TopDoctorsTable({
  data,
  loading = false,
  error = false,
}: TopDoctorsTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <Trophy className="h-4 w-4 text-amber-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            Top Doctors
          </h3>
          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
            by completed appointments
          </span>
        </div>
        <Link
          href={ROUTES.ADMIN_DOCTORS}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">#</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Doctor</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Specialization</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : error ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                  Failed to load doctors.
                </td>
              </tr>
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                  No data available yet.
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={item.doctor?.id ?? idx}
                  className="hover:bg-slate-50 transition-colors duration-100"
                >
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        RANK_COLORS[idx] ?? "text-slate-500"
                      )}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {item.doctor
                      ? `Dr. ${item.doctor.firstName} ${item.doctor.lastName}`
                      : "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                    {item.doctor?.specializations[0] ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {item.completedAppointments}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
