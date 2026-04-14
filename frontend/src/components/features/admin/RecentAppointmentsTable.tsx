"use client";

import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { AdminDashboardData } from "@/types";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

type RecentAppointment = AdminDashboardData["recentAppointments"][number];

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING:   { label: "Pending",   bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-400" },
  APPROVED:  { label: "Approved",  bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-400" },
  COMPLETED: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700",dot: "bg-emerald-400" },
  CANCELLED: { label: "Cancelled", bg: "bg-red-50",     text: "text-red-700",    dot: "bg-red-400" },
  REJECTED:  { label: "Rejected",  bg: "bg-slate-100",  text: "text-slate-600",  dot: "bg-slate-400" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status.toUpperCase()] ?? STATUS_CONFIG.PENDING;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        cfg.bg,
        cfg.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ── Format helpers ────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return dateFmt.format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatTime(iso: string) {
  try {
    return timeFmt.format(new Date(iso));
  } catch {
    return "";
  }
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded-md bg-slate-200" style={{ width: `${60 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface RecentAppointmentsTableProps {
  data?: RecentAppointment[];
  loading?: boolean;
  error?: boolean;
}

export function RecentAppointmentsTable({
  data,
  loading = false,
  error = false,
}: RecentAppointmentsTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
            <Calendar className="h-4 w-4 text-violet-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Recent Appointments</h3>
        </div>
        <Link
          href={ROUTES.ADMIN_APPOINTMENTS}
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
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Doctor</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Specialization</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Date</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                  Failed to load appointments.
                </td>
              </tr>
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                  No recent appointments found.
                </td>
              </tr>
            ) : (
              data.map((appt) => (
                <tr
                  key={appt.id}
                  className="hover:bg-slate-50 transition-colors duration-100"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {appt.patient.firstName} {appt.patient.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    Dr. {appt.doctor.firstName} {appt.doctor.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                    {appt.doctor.specializations[0] ?? "—"}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-slate-700">{formatDate(appt.scheduledAt)}</span>
                    <span className="ml-1.5 text-slate-400 text-xs">{formatTime(appt.scheduledAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={appt.status} />
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
