"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Filter, Users, UserCheck, UserX, Eye, ShieldOff, ShieldCheck,
  ChevronLeft, ChevronRight, RefreshCw, Phone, Mail, Calendar, X,
  Activity, AlertCircle,
} from "lucide-react";
import {
  getAdminPatients, deactivateUser, activateUser,
} from "@/lib/api/admin";
import type { AdminPatient } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return dateFmt.format(new Date(d)); } catch { return d; }
}

function calcAge(dob?: string | null): string {
  if (!dob) return "—";
  try {
    const diff = Date.now() - new Date(dob).getTime();
    return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))} yrs`;
  } catch { return "—"; }
}

function getInitials(p: AdminPatient["patient"]): string {
  if (!p) return "?";
  return `${p.firstName.charAt(0)}${p.lastName.charAt(0)}`.toUpperCase();
}

function getFullName(p: AdminPatient["patient"]): string {
  if (!p) return "Unknown";
  return `${p.firstName} ${p.lastName}`;
}

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type, onDone }: { msg: string; type: "success" | "error"; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-xl text-sm font-medium text-white ${type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
      {type === "success" ? <ShieldCheck className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      {msg}
    </div>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  title, description, confirmLabel, confirmClass, onConfirm, onCancel, loading,
}: {
  title: string; description: string; confirmLabel: string; confirmClass: string;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-1.5 text-sm text-slate-500">{description}</p>
        <div className="mt-5 flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${confirmClass}`}>
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Patient detail modal ──────────────────────────────────────────────────────

function PatientDetailModal({ patient, onClose }: { patient: AdminPatient; onClose: () => void }) {
  const p = patient.patient;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <h2 className="font-bold text-slate-900">Patient Profile</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Avatar header */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-extrabold text-white">
              {p ? getInitials(p) : "?"}
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{getFullName(p)}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${patient.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {patient.isActive ? "Active" : "Blocked"}
                </span>
                {p?.bloodGroup && <span className="text-xs text-slate-400 font-mono">{p.bloodGroup}</span>}
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Email",    value: patient.email,            icon: Mail },
              { label: "Phone",    value: p?.phone ?? "—",           icon: Phone },
              { label: "Age",      value: calcAge(p?.dateOfBirth),   icon: Calendar },
              { label: "Gender",   value: p?.gender ?? "—",          icon: Users },
              { label: "Joined",   value: fmtDate(patient.createdAt), icon: Calendar },
              { label: "Appointments", value: String(p?._count?.appointments ?? 0), icon: Activity },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className="h-3 w-3 text-slate-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                </div>
                <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
              </div>
            ))}
          </div>

          {p?.address && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Address</p>
              <p className="text-sm text-slate-700">{p.address}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[48, 64, 40, 36, 32, 48, 60].map((w, i) => (
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

const LIMIT = 20;

export default function AdminPatientsPage() {
  const [patients, setPatients]     = useState<AdminPatient[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);

  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDS]    = useState("");
  const [statusFilter, setStatus]   = useState<"" | "active" | "inactive">("");

  const [selectedPatient, setSelected]      = useState<AdminPatient | null>(null);
  const [confirmAction, setConfirmAction]   = useState<{ patient: AdminPatient; type: "block" | "unblock" } | null>(null);
  const [actionLoading, setActionLoading]   = useState(false);
  const [toast, setToast]                   = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { setDS(search); setPage(1); }, 400);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [search]);

  useEffect(() => { setPage(1); }, [statusFilter]);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const isActive = statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined;
      const res = await getAdminPatients({ page, limit: LIMIT, search: debouncedSearch || undefined, isActive });
      setPatients(res.patients ?? []);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  async function handleToggleStatus() {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      const fn = confirmAction.type === "block" ? deactivateUser : activateUser;
      await fn(confirmAction.patient.id);
      setToast({ msg: `Patient ${confirmAction.type === "block" ? "blocked" : "unblocked"} successfully`, type: "success" });
      setConfirmAction(null);
      fetchPatients();
    } catch (e: any) {
      setToast({ msg: e?.message ?? "Action failed", type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  const activeCount   = patients.filter((p) => p.isActive).length;
  const inactiveCount = patients.filter((p) => !p.isActive).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* Confirm modal */}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === "block" ? "Block Patient?" : "Unblock Patient?"}
          description={`${confirmAction.type === "block" ? "Blocking" : "Unblocking"} ${getFullName(confirmAction.patient.patient)} will ${confirmAction.type === "block" ? "prevent them from logging in." : "restore their access."}`}
          confirmLabel={confirmAction.type === "block" ? "Block" : "Unblock"}
          confirmClass={confirmAction.type === "block" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}
          loading={actionLoading}
          onConfirm={handleToggleStatus}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Patient detail modal */}
      {selectedPatient && <PatientDetailModal patient={selectedPatient} onClose={() => setSelected(null)} />}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Patients</h2>
          <p className="mt-0.5 text-sm text-slate-500">Manage all registered patients on the platform</p>
        </div>
        <button onClick={fetchPatients} disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 sm:self-auto">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",    value: total,        icon: Users,      bg: "bg-blue-50",    text: "text-blue-600" },
          { label: "Active",   value: activeCount,  icon: UserCheck,  bg: "bg-emerald-50", text: "text-emerald-600" },
          { label: "Blocked",  value: inactiveCount, icon: UserX,    bg: "bg-red-50",     text: "text-red-600" },
        ].map(({ label, value, icon: Icon, bg, text }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
              <Icon className={`h-4 w-4 ${text}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              {loading ? <div className="mt-0.5 h-5 w-10 animate-pulse rounded bg-slate-200" /> : (
                <p className="text-xl font-bold text-slate-900">{new Intl.NumberFormat("en-IN").format(value)}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            id="patient-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          {(["", "active", "inactive"] as const).map((v) => (
            <button key={v} onClick={() => setStatus(v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${statusFilter === v ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:border-blue-300"}`}>
              {v === "" ? "All" : v === "active" ? "Active" : "Blocked"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Patient", "Email", "Phone", "Age / Gender", "Appointments", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 first:pl-5 last:pr-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-500">
                    Failed to load patients — check your connection
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Users className="mx-auto h-10 w-10 text-slate-200" />
                    <p className="mt-2 text-sm font-semibold text-slate-600">No patients found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : patients.map((pat) => {
                const p   = pat.patient;
                const age = calcAge(p?.dateOfBirth);
                return (
                  <tr key={pat.id} className="group hover:bg-blue-50/50 transition-colors duration-100">
                    {/* Name + avatar */}
                    <td className="pl-5 pr-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {p?.profileImageUrl ? (
                          <img src={p.profileImageUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 text-xs font-bold text-white">
                            {getInitials(p)}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{getFullName(p)}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{p?.id?.slice(0, 8) ?? "—"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-600">{pat.email}</span>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-500">{p?.phone ?? "—"}</span>
                    </td>

                    {/* Age / Gender */}
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-slate-700">{age}</p>
                      <p className="text-[10px] capitalize text-slate-400">{p?.gender ?? "—"}</p>
                    </td>

                    {/* Appointments */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {p?._count?.appointments ?? 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${pat.isActive ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
                        {pat.isActive ? "Active" : "Blocked"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 pr-5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setSelected(pat)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="View details">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {pat.isActive ? (
                          <button onClick={() => setConfirmAction({ patient: pat, type: "block" })}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Block patient">
                            <ShieldOff className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => setConfirmAction({ patient: pat, type: "unblock" })}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                            title="Unblock patient">
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} · {new Intl.NumberFormat("en-IN").format(total)} patients
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
