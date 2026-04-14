"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
  Filter,
  RefreshCw,
} from "lucide-react";
import { getMyAppointments, cancelAppointment } from "@/lib/api/appointments";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Appointment } from "@/types";
import type { AppointmentStatus } from "@/lib/api/appointments";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:     { label: "Pending",     color: "bg-amber-100 text-amber-700",   icon: <Clock      className="h-3.5 w-3.5" /> },
  approved:    { label: "Confirmed",   color: "bg-blue-100 text-blue-700",     icon: <Calendar   className="h-3.5 w-3.5" /> },
  completed:   { label: "Completed",   color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  cancelled:   { label: "Cancelled",   color: "bg-red-100 text-red-600",       icon: <XCircle    className="h-3.5 w-3.5" /> },
  rejected:    { label: "Rejected",    color: "bg-rose-100 text-rose-700",     icon: <XCircle    className="h-3.5 w-3.5" /> },
  rescheduled: { label: "Rescheduled", color: "bg-purple-100 text-purple-700", icon: <RefreshCw  className="h-3.5 w-3.5" /> },
};

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    }).format(new Date(iso));
  } catch { return iso; }
}

function getDoctorName(apt: Appointment): string {
  const d = apt.doctor as any;
  if (d?.firstName || d?.lastName) return `Dr. ${d.firstName ?? ""} ${d.lastName ?? ""}`.trim();
  if (d?.user?.name) return `Dr. ${d.user.name}`;
  return "Doctor";
}

const FILTER_TABS: { label: string; value: AppointmentStatus | "" }[] = [
  { label: "All",       value: "" },
  { label: "Pending",   value: "pending" },
  { label: "Confirmed", value: "approved" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const PAGE_SIZE = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const [loading, setLoading]           = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyAppointments({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
      });
      setAppointments((res.data ?? []) as Appointment[]);
      setTotal(res.total ?? 0);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  async function handleCancel(id: string) {
    if (!confirm("Cancel this appointment?")) return;
    setCancellingId(id);
    try {
      await cancelAppointment(id);
      fetchAppointments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to cancel.");
    } finally {
      setCancellingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageContainer
      title="My Appointments"
      subtitle="View and manage all your booked appointments."
      action={
        <Link
          href="/patient/doctors"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
        >
          + Book New
        </Link>
      }
    >
      <div className="space-y-5">

        {/* Status filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 shrink-0 text-slate-400" />
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                statusFilter === tab.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
          </div>
        )}

        {/* Empty */}
        {!loading && appointments.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Calendar className="h-7 w-7 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-800">No appointments found</p>
            <p className="text-sm text-slate-500">
              {statusFilter ? "Try a different filter." : "Book your first appointment with a doctor."}
            </p>
            <Link href="/patient/doctors" className="mt-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Find Doctors
            </Link>
          </div>
        )}

        {/* Appointment cards */}
        {!loading && appointments.length > 0 && (
          <div className="space-y-3">
            {appointments.map((apt) => {
              const cfg = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.pending!;
              const isCancellable = apt.status === "pending" || apt.status === "approved";
              return (
                <div key={apt.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    {/* Color dot */}
                    <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${cfg.color.split(" ")[0]?.replace("bg-", "bg-")}`} />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{getDoctorName(apt)}</p>
                      {(apt.doctor as any)?.specializations?.[0] || (apt.doctor as any)?.specialization ? (
                        <p className="text-xs text-slate-500">
                          {(apt.doctor as any)?.specializations?.[0] ?? (apt.doctor as any)?.specialization}
                        </p>
                      ) : null}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(apt.slot?.date ?? apt.slot?.startTime ?? (apt as any).scheduledAt)}
                        </span>
                        {apt.reason && <span className="italic truncate max-w-[22ch]">{apt.reason}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:shrink-0">
                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>

                    {/* Detail link */}
                    <Link
                      href={`/patient/appointments/${apt.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all"
                      aria-label="View details"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>

                    {/* Cancel */}
                    {isCancellable && (
                      <button
                        type="button"
                        disabled={cancellingId === apt.id}
                        onClick={() => handleCancel(apt.id)}
                        className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-all"
                      >
                        {cancellingId === apt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 disabled:opacity-40 transition-all">
              ‹
            </button>
            <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 disabled:opacity-40 transition-all">
              ›
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
