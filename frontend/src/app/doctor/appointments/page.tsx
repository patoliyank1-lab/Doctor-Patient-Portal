"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar, Clock, CheckCircle2, XCircle, Loader2,
  Filter, ChevronRight, RefreshCw,
} from "lucide-react";
import { getMyAppointments, updateAppointmentStatus } from "@/lib/api/appointments";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Appointment } from "@/types";
import type { AppointmentStatus } from "@/lib/api/appointments";

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  pending:     { label: "Pending",     badge: "bg-amber-100 text-amber-700 border-amber-200" },
  approved:    { label: "Confirmed",   badge: "bg-blue-100 text-blue-700 border-blue-200" },
  completed:   { label: "Completed",   badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelled:   { label: "Cancelled",   badge: "bg-red-100 text-red-600 border-red-200" },
  rejected:    { label: "Rejected",    badge: "bg-rose-100 text-rose-700 border-rose-200" },
  rescheduled: { label: "Rescheduled", badge: "bg-purple-100 text-purple-700 border-purple-200" },
};

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    }).format(new Date(iso));
  } catch { return iso; }
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  try {
    if (/^\d{2}:\d{2}/.test(iso)) {
      const [h, m] = iso.split(":");
      const d = new Date(); d.setHours(Number(h), Number(m));
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return iso; }
}

function getPatientName(apt: Appointment): string {
  const p = apt.patient as any;
  if (p?.firstName || p?.lastName) return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  return "Patient";
}

const TABS: { label: string; value: AppointmentStatus | "" }[] = [
  { label: "All",       value: "" },
  { label: "Pending",   value: "pending" },
  { label: "Confirmed", value: "approved" },
  { label: "Completed", value: "completed" },
];

const PAGE_SIZE = 10;

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [filter, setFilter]             = useState<AppointmentStatus | "">("");
  const [loading, setLoading]           = useState(true);
  const [updatingId, setUpdatingId]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyAppointments({ page, limit: PAGE_SIZE, status: filter || undefined });
      setAppointments((res.data ?? []) as Appointment[]);
      setTotal(res.total ?? 0);
    } catch { setAppointments([]); }
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { fetch(); }, [fetch]);

  async function handleStatus(id: string, status: "approved" | "rejected" | "completed") {
    setUpdatingId(id);
    try {
      const updated = await updateAppointmentStatus(id, status);
      setAppointments((prev) => prev.map((a) => a.id === id ? updated : a));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setUpdatingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageContainer
      title="Appointments"
      subtitle="Review and manage your patient appointments."
    >
      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 shrink-0 text-slate-400" />
        {TABS.map((t) => (
          <button key={t.value} type="button"
            onClick={() => { setFilter(t.value); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              filter === t.value
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-blue-500" /></div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Calendar className="h-12 w-12 text-slate-300" />
          <p className="font-semibold text-slate-700">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const cfg  = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.pending!;
            const slot = apt.slot as any;
            const isPending = apt.status === "pending";
            const isApproved = apt.status === "approved";
            return (
              <div key={apt.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{getPatientName(apt)}</p>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(slot?.date ?? slot?.startTime ?? (apt as any).scheduledAt)}
                      </span>
                      {slot?.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                        </span>
                      )}
                      {apt.reason && <span className="italic truncate max-w-[28ch]">{apt.reason}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Quick actions for pending */}
                    {isPending && (
                      <>
                        <button
                          type="button"
                          disabled={updatingId === apt.id}
                          onClick={() => handleStatus(apt.id, "approved")}
                          className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-all"
                        >
                          {updatingId === apt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={updatingId === apt.id}
                          onClick={() => handleStatus(apt.id, "rejected")}
                          className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-all"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {/* Mark complete for approved */}
                    {isApproved && (
                      <button
                        type="button"
                        disabled={updatingId === apt.id}
                        onClick={() => handleStatus(apt.id, "completed")}
                        className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-all"
                      >
                        {updatingId === apt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Mark Complete
                      </button>
                    )}
                    <Link href={`/doctor/appointments/${apt.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 disabled:opacity-40">‹</button>
          <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 disabled:opacity-40">›</button>
        </div>
      )}
    </PageContainer>
  );
}
