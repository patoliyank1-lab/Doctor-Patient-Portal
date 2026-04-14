"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Filter, Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, RefreshCw, Eye, X, Stethoscope, User,
  ChevronDown,
} from "lucide-react";
import {
  getAdminAppointments, updateAdminAppointmentStatus,
} from "@/lib/api/admin";
import type { AdminAppointment } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return dateFmt.format(new Date(d)); } catch { return d; }
}
function fmtTime(t?: string | null) {
  if (!t) return "";
  try {
    if (/^\d{2}:\d{2}/.test(t)) {
      const [h, m] = t.split(":");
      const d = new Date(); d.setHours(Number(h), Number(m));
      return timeFmt.format(d);
    }
    return timeFmt.format(new Date(t));
  } catch { return t; }
}

type AppStatus = "PENDING" | "APPROVED" | "COMPLETED" | "CANCELLED" | "REJECTED";

const STATUS_CFG: Record<AppStatus, { label: string; badge: string; dot: string }> = {
  PENDING:   { label: "Pending",   badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",   dot: "bg-amber-400" },
  APPROVED:  { label: "Confirmed", badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",     dot: "bg-blue-400" },
  COMPLETED: { label: "Completed", badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  CANCELLED: { label: "Cancelled", badge: "bg-red-50 text-red-700 ring-1 ring-red-200",         dot: "bg-red-400" },
  REJECTED:  { label: "Rejected",  badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",      dot: "bg-rose-400" },
};

function getStatusCfg(status: string) {
  return STATUS_CFG[(status.toUpperCase() as AppStatus)] ?? STATUS_CFG.PENDING;
}

function patientName(apt: AdminAppointment): string {
  if (!apt.patient) return "—";
  return `${apt.patient.firstName} ${apt.patient.lastName}`;
}

function doctorName(apt: AdminAppointment): string {
  if (!apt.doctor) return "—";
  return `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, type, onDone }: { msg: string; type: "success" | "error"; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-xl text-sm font-medium text-white ${type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
      {type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      {msg}
    </div>
  );
}

// ── Status update dropdown ────────────────────────────────────────────────────

const STATUS_OPTIONS: AppStatus[] = ["PENDING", "APPROVED", "COMPLETED", "CANCELLED", "REJECTED"];

function StatusDropdown({
  appointmentId, current, onSuccess,
}: {
  appointmentId: string; current: string; onSuccess: (status: AppStatus) => void;
}) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function choose(status: AppStatus) {
    setOpen(false);
    if (status === current.toUpperCase()) return;
    setLoading(true);
    try {
      await updateAdminAppointmentStatus(appointmentId, status);
      onSuccess(status);
    } catch {
      // bubble
    } finally {
      setLoading(false);
    }
  }

  const cfg = getStatusCfg(current);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all ${cfg.badge} hover:opacity-80`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
        {loading ? "Updating…" : cfg.label}
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {STATUS_OPTIONS.map((s) => {
            const c = getStatusCfg(s);
            return (
              <button key={s} onClick={() => choose(s)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Appointment detail slide-over ─────────────────────────────────────────────

function AppointmentDetail({ apt, onClose, onStatusChange }: {
  apt: AdminAppointment; onClose: () => void;
  onStatusChange: (id: string, status: AppStatus) => void;
}) {
  const cfg = getStatusCfg(apt.status);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
      <div className="h-full w-full max-w-md bg-white overflow-y-auto animate-in slide-in-from-right-full duration-300">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="font-bold text-slate-900">Appointment Details</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Status banner */}
          <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${cfg.badge}`}>
            <span className={`h-3 w-3 rounded-full ${cfg.dot}`} />
            <div>
              <p className="font-semibold">{cfg.label}</p>
              <p className="text-[10px] opacity-70 font-mono">{apt.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          {/* Update status */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Update Status</p>
            <StatusDropdown
              appointmentId={apt.id}
              current={apt.status}
              onSuccess={(s) => { onStatusChange(apt.id, s); }}
            />
          </div>

          {/* Patient */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Patient</p>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100">
                <User className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{patientName(apt)}</p>
                {apt.patient?.phone && <p className="text-xs text-slate-400">{apt.patient.phone}</p>}
              </div>
            </div>
          </div>

          {/* Doctor */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Doctor</p>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                <Stethoscope className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{doctorName(apt)}</p>
                {apt.doctor?.specializations?.[0] && (
                  <p className="text-xs text-slate-400">{apt.doctor.specializations[0]}</p>
                )}
              </div>
            </div>
          </div>

          {/* Date / time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Date</p>
              </div>
              <p className="text-sm font-medium text-slate-800">
                {fmtDate(apt.slot?.date ?? apt.scheduledAt)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="h-3 w-3 text-slate-400" />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Time</p>
              </div>
              <p className="text-sm font-medium text-slate-800">
                {apt.slot?.startTime ? `${fmtTime(apt.slot.startTime)} – ${fmtTime(apt.slot.endTime)}` : "—"}
              </p>
            </div>
          </div>

          {/* Reason / notes */}
          {apt.reason && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Reason</p>
              <p className="text-sm text-slate-700">{apt.reason}</p>
            </div>
          )}
          {apt.doctorNotes && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-blue-400">Doctor's Notes</p>
              <p className="text-sm text-blue-800">{apt.doctorNotes}</p>
            </div>
          )}
          {apt.rejectionReason && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-red-400">Rejection Reason</p>
              <p className="text-sm text-red-700">{apt.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[60, 56, 44, 38, 32, 40, 10].map((w, i) => (
        <td key={i} className="px-4 py-4 first:pl-5">
          <div className="h-4 rounded bg-slate-200" style={{ width: `${w}px` }} />
        </td>
      ))}
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const LIMIT = 25;
const ALL_STATUSES: { label: string; value: AppStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending",   value: "PENDING" },
  { label: "Confirmed", value: "APPROVED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Rejected",  value: "REJECTED" },
];

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [total, setTotal]               = useState(0);
  const [totalPages, setTotalPages]     = useState(1);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);

  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDS]        = useState("");
  const [statusFilter, setStatus]       = useState<AppStatus | "">("");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [showFilters, setShowFilters]   = useState(false);

  const [selected, setSelected]         = useState<AdminAppointment | null>(null);
  const [toast, setToast]               = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { setDS(search); setPage(1); }, 400);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [search]);

  useEffect(() => { setPage(1); }, [statusFilter, dateFrom, dateTo]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getAdminAppointments({
        page, limit: LIMIT,
        status:   statusFilter  || undefined,
        search:   debouncedSearch || undefined,
        dateFrom: dateFrom || undefined,
        dateTo:   dateTo   || undefined,
      }) as any;

      // Backend returns { appointments, pagination }
      const apts   = res.appointments ?? res.data ?? [];
      const pag    = res.pagination ?? {};
      setAppointments(apts);
      setTotal(pag.total ?? 0);
      setTotalPages(pag.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, dateFrom, dateTo]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  function handleStatusChange(id: string, status: AppStatus) {
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : prev);
    setToast({ msg: `Appointment marked as ${getStatusCfg(status).label}`, type: "success" });
  }

  const activeFilters = [statusFilter, dateFrom, dateTo].filter(Boolean).length;

  return (
    <div className="space-y-6 pb-8">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      {selected && (
        <AppointmentDetail
          apt={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Appointments</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage all appointments across the platform
          </p>
        </div>
        <button onClick={fetchAppointments} disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 sm:self-auto">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {ALL_STATUSES.map((s) => (
          <button key={s.value} onClick={() => setStatus(s.value)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${statusFilter === s.value ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:border-blue-300"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              id="appointment-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient or doctor name…"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${showFilters || activeFilters > 0 ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            <Filter className="h-3.5 w-3.5" />
            Filters
            {activeFilters > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">{activeFilters}</span>
            )}
          </button>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">
              Clear dates
            </button>
          )}
          {!loading && (
            <span className="text-xs text-slate-400">{new Intl.NumberFormat("en-IN").format(total)} appointments</span>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">From Date</label>
              <input type="date" value={dateFrom} max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">To Date</label>
              <input type="date" value={dateTo} min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Patient", "Doctor", "Date", "Time Slot", "Status", "Reason", ""].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 first:pl-5 last:pr-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-500">
                    Failed to load appointments — check your connection
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Calendar className="mx-auto h-10 w-10 text-slate-200" />
                    <p className="mt-2 text-sm font-semibold text-slate-600">No appointments found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : appointments.map((apt) => (
                <tr key={apt.id} className="group hover:bg-blue-50/50 transition-colors duration-100">
                  {/* Patient */}
                  <td className="pl-5 pr-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-[10px] font-bold text-teal-700">
                        {apt.patient ? `${apt.patient.firstName.charAt(0)}${apt.patient.lastName.charAt(0)}` : "?"}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{patientName(apt)}</p>
                        {apt.patient?.phone && <p className="text-[10px] text-slate-400">{apt.patient.phone}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Doctor */}
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{doctorName(apt)}</p>
                      {apt.doctor?.specializations?.[0] && (
                        <p className="text-[10px] text-slate-400">{apt.doctor.specializations[0]}</p>
                      )}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <p className="text-xs text-slate-700">{fmtDate(apt.slot?.date ?? apt.scheduledAt)}</p>
                    <p className="text-[10px] text-slate-400">{fmtDate(apt.createdAt)}</p>
                  </td>

                  {/* Time */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {apt.slot?.startTime ? (
                      <span className="text-xs text-slate-600">
                        {fmtTime(apt.slot.startTime)} – {fmtTime(apt.slot.endTime)}
                      </span>
                    ) : <span className="text-xs text-slate-300">—</span>}
                  </td>

                  {/* Status — interactive dropdown */}
                  <td className="px-4 py-3.5">
                    <StatusDropdown
                      appointmentId={apt.id}
                      current={apt.status}
                      onSuccess={(s) => handleStatusChange(apt.id, s)}
                    />
                  </td>

                  {/* Reason */}
                  <td className="px-4 py-3.5 max-w-[180px]">
                    <p className="text-xs text-slate-500 truncate">{apt.reason ?? "—"}</p>
                  </td>

                  {/* View */}
                  <td className="py-3.5 pr-5">
                    <button onClick={() => setSelected(apt)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="View details">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} · {new Intl.NumberFormat("en-IN").format(total)} appointments
          </p>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 disabled:opacity-40 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const n = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button key={n} onClick={() => setPage(n)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${n === page ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-blue-50"}`}>
                  {n}
                </button>
              );
            })}
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 disabled:opacity-40 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
