"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar, Clock, CheckCircle2, XCircle, Loader2,
  ChevronRight, RefreshCw, Search, Users, Filter,
  AlertCircle, Hourglass, CalendarCheck, SlidersHorizontal,
} from "lucide-react";
import { getMyAppointments, updateAppointmentStatus } from "@/lib/api/appointments";
import { PageContainer } from "@/components/layout/PageContainer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Appointment } from "@/types";
import type { AppointmentStatus } from "@/lib/api/appointments";

// ─────────────────────────────────────────────────────────────────────────────
// Status config — keys are UPPERCASE to match the Prisma enum returned by the API
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  PENDING:     { label: "Pending",     dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED:    { label: "Confirmed",   dot: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 border-blue-200" },
  COMPLETED:   { label: "Completed",   dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED:   { label: "Cancelled",   dot: "bg-red-400",     badge: "bg-red-50 text-red-600 border-red-200" },
  REJECTED:    { label: "Rejected",    dot: "bg-rose-400",    badge: "bg-rose-50 text-rose-700 border-rose-200" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso?: string | Date): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    }).format(new Date(iso as string));
  } catch { return String(iso); }
}

function formatTime(iso?: string | Date): string {
  if (!iso) return "";
  try {
    const s = String(iso);
    // Handle "HH:MM:SS" time-only strings from Prisma @db.Time
    if (/^\d{2}:\d{2}/.test(s)) {
      const [h, m] = s.split(":");
      const d = new Date();
      d.setHours(Number(h), Number(m));
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    return new Date(s).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return String(iso); }
}

function getPatientName(apt: Appointment): string {
  const p = apt.patient as any;
  if (p?.firstName || p?.lastName) return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  if (p?.user?.name) return p.user.name;
  return "Unknown Patient";
}

function getPatientInitials(apt: Appointment): string {
  const p = apt.patient as any;
  const f = p?.firstName?.[0] ?? "";
  const l = p?.lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "P";
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab config
// ─────────────────────────────────────────────────────────────────────────────

interface Tab { label: string; value: AppointmentStatus | ""; icon: React.ElementType; color: string }

const TABS: Tab[] = [
  { label: "All",       value: "",           icon: SlidersHorizontal, color: "text-slate-600" },
  { label: "Pending",   value: "pending",    icon: Hourglass,         color: "text-amber-600" },
  { label: "Confirmed", value: "approved",   icon: CalendarCheck,     color: "text-blue-600" },
  { label: "Completed", value: "completed",  icon: CheckCircle2,      color: "text-emerald-600" },
  { label: "Cancelled", value: "cancelled",  icon: XCircle,           color: "text-red-500" },
];

const PAGE_SIZE = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton row
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 animate-pulse">
      <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-40 rounded bg-slate-100" />
        <div className="h-3 w-56 rounded bg-slate-100" />
      </div>
      <div className="h-6 w-20 rounded-full bg-slate-100" />
      <div className="h-8 w-8 rounded-xl bg-slate-100" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [filter, setFilter]             = useState<AppointmentStatus | "">("");
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [updatingId, setUpdatingId]     = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);

  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchList = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getMyAppointments({
        page,
        limit: PAGE_SIZE,
        status: filter || undefined,
        search: debouncedSearch || undefined,
      });
      setAppointments((res.data ?? []) as Appointment[]);
      setTotal(res.total ?? 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load appointments.";
      setError(msg);
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, filter, debouncedSearch]);

  useEffect(() => { fetchList(); }, [fetchList]);

  // When filter/search changes, reset to page 1
  function handleTabChange(val: AppointmentStatus | "") {
    setFilter(val);
    setPage(1);
  }
  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
  }

  async function handleStatusUpdate(id: string, status: "approved" | "rejected" | "completed", rejectionReason?: string) {
    setUpdatingId(id);
    try {
      const updated = await updateAppointmentStatus(id, status, rejectionReason);
      // Optimistically replace in-list — status will be uppercase from API
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: (updated as any).status } : a));
      toast.success(`Appointment ${status === "approved" ? "confirmed" : status}.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleReject(id: string) {
    const reason = prompt("Reason for rejection (required):");
    if (reason === null) return; // user cancelled prompt
    if (!reason.trim()) { toast.error("A rejection reason is required."); return; }
    await handleStatusUpdate(id, "rejected", reason.trim());
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageContainer
      title="Appointments"
      subtitle="Review and manage your patient appointments."
      action={
        <button
          type="button"
          onClick={() => fetchList(true)}
          disabled={refreshing || loading}
          aria-label="Refresh appointments"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </button>
      }
    >
      {/* ── Filter tabs + Search row ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Filter appointments by status"
          className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = filter === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                id={`tab-${t.value || "all"}`}
                onClick={() => handleTabChange(t.value)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="appointment-search"
            type="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search patients…"
            aria-label="Search appointments by patient name"
            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-56"
          />
        </div>
      </div>

      {/* ── Total count row ───────────────────────────────────────────── */}
      {!loading && (
        <div className="flex items-center gap-2 text-xs text-slate-500" aria-live="polite">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {total === 0 ? "No appointments" : `${total} appointment${total !== 1 ? "s" : ""}`}
            {filter ? ` · ${TABS.find((t) => t.value === filter)?.label}` : ""}
            {debouncedSearch ? ` matching "${debouncedSearch}"` : ""}
          </span>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
          <div>
            <p className="font-semibold text-red-800">Error loading appointments</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* ── List ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3" aria-label="Loading appointments">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : appointments.length === 0 && !error ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center" role="status">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <Calendar className="h-8 w-8 text-slate-300" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">No appointments found</p>
            <p className="mt-1 text-sm text-slate-400">
              {debouncedSearch
                ? `No results for "${debouncedSearch}"`
                : filter
                ? `No ${TABS.find((t) => t.value === filter)?.label.toLowerCase()} appointments`
                : "Your appointment list is empty."}
            </p>
          </div>
          {(filter || debouncedSearch) && (
            <button
              type="button"
              onClick={() => { setFilter(""); setSearch(""); }}
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2" role="list" aria-label="Appointments list">
          {appointments.map((apt) => {
            // Status from API is UPPERCASE (Prisma enum). Normalize for lookup.
            const statusKey = String(apt.status).toUpperCase();
            const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.PENDING!;
            const slot = apt.slot as any;
            const isPending  = statusKey === "PENDING";
            const isApproved = statusKey === "APPROVED";
            const isUpdating = updatingId === apt.id;

            return (
              <article
                key={apt.id}
                role="listitem"
                aria-label={`Appointment with ${getPatientName(apt)}, status: ${cfg.label}`}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white"
                    aria-hidden="true"
                  >
                    {getPatientInitials(apt)}
                  </div>

                  {/* Core info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{getPatientName(apt)}</p>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                          cfg.badge
                        )}
                        aria-label={`Status: ${cfg.label}`}
                      >
                        <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", cfg.dot)} aria-hidden="true" />
                        {cfg.label}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-slate-500">
                      {(slot?.date || slot?.startTime || (apt as any).scheduledAt) && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          {formatDate(slot?.date ?? (apt as any).scheduledAt)}
                        </span>
                      )}
                      {slot?.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {formatTime(slot.startTime)}{slot.endTime ? ` – ${formatTime(slot.endTime)}` : ""}
                        </span>
                      )}
                      {apt.reason && (
                        <span className="italic truncate max-w-[24ch]" title={apt.reason}>
                          {apt.reason}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          id={`approve-${apt.id}`}
                          disabled={isUpdating}
                          onClick={() => handleStatusUpdate(apt.id, "approved")}
                          aria-label={`Approve appointment for ${getPatientName(apt)}`}
                          className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {isUpdating
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Approve
                        </button>
                        <button
                          type="button"
                          id={`reject-${apt.id}`}
                          disabled={isUpdating}
                          onClick={() => handleReject(apt.id)}
                          aria-label={`Reject appointment for ${getPatientName(apt)}`}
                          className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <button
                        type="button"
                        id={`complete-${apt.id}`}
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(apt.id, "completed")}
                        aria-label={`Mark appointment with ${getPatientName(apt)} as completed`}
                        className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-100 disabled:opacity-50"
                      >
                        {isUpdating
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Complete
                      </button>
                    )}

                    {/* Detail link */}
                    <Link
                      href={`/doctor/appointments/${apt.id}`}
                      id={`detail-${apt.id}`}
                      aria-label={`View details for appointment with ${getPatientName(apt)}`}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3"
          aria-label="Pagination"
        >
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="prev-page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-blue-50 disabled:opacity-40"
            >
              ‹
            </button>
            {/* Page number pills */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  aria-label={`Go to page ${p}`}
                  aria-current={page === p ? "page" : undefined}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl text-xs font-semibold transition-all",
                    page === p
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-blue-50"
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              id="next-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-blue-50 disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
