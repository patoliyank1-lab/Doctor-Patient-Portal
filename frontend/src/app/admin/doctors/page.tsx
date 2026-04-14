"use client";

import {
  useState, useEffect, useCallback, useMemo, useRef,
} from "react";
import { toast } from "sonner";
import {
  Stethoscope, Clock, CheckCircle2, XCircle, RefreshCw, AlertCircle,
} from "lucide-react";

// API
import { getAdminDoctors, approveDoctor, rejectDoctor } from "@/lib/api/admin";

// Types
import type { Doctor } from "@/types";

// Components
import { DoctorTable } from "@/components/features/admin/DoctorTable";
import { DoctorFilterBar, type DoctorStatusFilter } from "@/components/features/admin/DoctorFilterBar";
import { DoctorDetailModal } from "@/components/features/admin/DoctorDetailModal";
import { ApproveDoctorDialog } from "@/components/features/admin/ApproveDoctorDialog";
import { RejectDoctorDialog } from "@/components/features/admin/RejectDoctorDialog";
import { Pagination } from "@/components/features/Pagination";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const LIMIT = 15;

function getStatus(doc: Doctor) {
  return (doc.approvalStatus ?? doc.status ?? "PENDING").toUpperCase();
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini stat card
// ─────────────────────────────────────────────────────────────────────────────

function MiniStat({
  label, value, icon: Icon, iconBg, iconColor, loading,
}: {
  label: string; value: number; icon: React.ElementType;
  iconBg: string; iconColor: string; loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {loading ? (
          <div className="mt-0.5 h-5 w-10 animate-pulse rounded-md bg-slate-200" />
        ) : (
          <p className="text-xl font-bold text-slate-900">{fmt(value)}</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDoctorsPage() {
  // ── Data ────────────────────────────────────────────────────────────────────
  const [doctors, setDoctors]       = useState<Doctor[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [totalDocs, setTotalDocs]   = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [search, setSearch]                   = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter]       = useState<DoctorStatusFilter>("ALL");
  const debounceRef                           = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const [selectedDoc, setSelectedDoc]     = useState<Doctor | null>(null);
  const [detailOpen, setDetailOpen]       = useState(false);
  const [approveTarget, setApproveTarget] = useState<Doctor | null>(null);
  const [rejectTarget, setRejectTarget]   = useState<Doctor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── All-statuses summary (from current page data) ───────────────────────────
  const pendingCount  = useMemo(() => doctors.filter((d) => getStatus(d) === "PENDING").length,  [doctors]);
  const approvedCount = useMemo(() => doctors.filter((d) => getStatus(d) === "APPROVED").length, [doctors]);
  const rejectedCount = useMemo(() => doctors.filter((d) => getStatus(d) === "REJECTED").length, [doctors]);

  // ── Debounce search input ───────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [statusFilter]);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getAdminDoctors({
        page,
        limit: LIMIT,
        search: debouncedSearch || undefined,
        approvalStatus: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      // fetchWithAuth already unwraps the outer { success, data } envelope
      // so res = { doctors: Doctor[], pagination: {...} }
      setDoctors(res.doctors ?? []);
      setTotalDocs(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  // ── Optimistic update ───────────────────────────────────────────────────────
  function updateDocStatus(id: string, newStatus: string) {
    setDoctors((prev) => prev.map((d) =>
      d.id === id ? { ...d, approvalStatus: newStatus as any, status: newStatus as any } : d
    ));
    setSelectedDoc((prev) =>
      prev?.id === id ? { ...prev, approvalStatus: newStatus as any, status: newStatus as any } : prev
    );
  }

  // ── Approve flow ─────────────────────────────────────────────────────────────
  function handleApproveClick(doc: Doctor) { setApproveTarget(doc); }

  async function handleApproveConfirm() {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await approveDoctor(approveTarget.id);
      updateDocStatus(approveTarget.id, "APPROVED");
      toast.success(`Dr. ${approveTarget.firstName} ${approveTarget.lastName} approved successfully`);
      setApproveTarget(null);
      setDetailOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to approve doctor");
    } finally {
      setActionLoading(false);
    }
  }

  // ── Reject flow ──────────────────────────────────────────────────────────────
  function handleRejectClick(doc: Doctor) { setRejectTarget(doc); }

  async function handleRejectConfirm(reason: string) {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await rejectDoctor(rejectTarget.id, reason || undefined);
      updateDocStatus(rejectTarget.id, "REJECTED");
      toast.success(`Dr. ${rejectTarget.firstName} ${rejectTarget.lastName} rejected`);
      setRejectTarget(null);
      setDetailOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to reject doctor");
    } finally {
      setActionLoading(false);
    }
  }

  // ── View detail ──────────────────────────────────────────────────────────────
  function handleViewDoc(doc: Doctor) {
    setSelectedDoc(doc);
    setDetailOpen(true);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Doctor Management</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Review, approve, and manage all doctor registrations
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDoctors}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Total Doctors"  value={totalDocs}     icon={Stethoscope}  iconBg="bg-blue-100"    iconColor="text-blue-600"    loading={loading} />
        <MiniStat label="Pending Review" value={pendingCount}  icon={Clock}        iconBg="bg-amber-100"   iconColor="text-amber-600"   loading={loading} />
        <MiniStat label="Approved"       value={approvedCount} icon={CheckCircle2} iconBg="bg-emerald-100" iconColor="text-emerald-600" loading={loading} />
        <MiniStat label="Rejected"       value={rejectedCount} icon={XCircle}      iconBg="bg-red-100"     iconColor="text-red-500"     loading={loading} />
      </div>

      {/* Pending alert banner */}
      {!loading && pendingCount > 0 && statusFilter !== "PENDING" && (
        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className="w-full flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left transition-colors hover:bg-amber-100"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm font-medium text-amber-800">
            {pendingCount} doctor{pendingCount !== 1 ? "s" : ""} pending review —{" "}
            <span className="underline underline-offset-2">click to review</span>
          </p>
        </button>
      )}

      {/* Filter bar */}
      <DoctorFilterBar
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        total={totalDocs}
        pendingCount={pendingCount}
      />

      {/* Table */}
      <DoctorTable
        doctors={doctors}
        loading={loading}
        error={error}
        actionLoading={actionLoading}
        onView={handleViewDoc}
        onApprove={handleApproveClick}
        onReject={handleRejectClick}
      />

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-1">
          <p className="text-xs text-slate-500">
            Showing {doctors.length} of {fmt(totalDocs)} doctors
          </p>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Doctor detail slide-in panel */}
      <DoctorDetailModal
        doctor={selectedDoc}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onApprove={(id) => {
          const doc = doctors.find((d) => d.id === id) ?? selectedDoc;
          if (doc) handleApproveClick(doc);
        }}
        onReject={(id) => {
          const doc = doctors.find((d) => d.id === id) ?? selectedDoc;
          if (doc) handleRejectClick(doc);
        }}
        actionLoading={actionLoading}
      />

      {/* Approve confirmation */}
      <ApproveDoctorDialog
        open={!!approveTarget}
        onOpenChange={(v) => !v && setApproveTarget(null)}
        doctorName={approveTarget ? `${approveTarget.firstName} ${approveTarget.lastName}` : ""}
        onConfirm={handleApproveConfirm}
        isLoading={actionLoading}
      />

      {/* Reject dialog with reason field */}
      <RejectDoctorDialog
        open={!!rejectTarget}
        onOpenChange={(v) => !v && setRejectTarget(null)}
        doctorName={rejectTarget ? `${rejectTarget.firstName} ${rejectTarget.lastName}` : ""}
        onConfirm={handleRejectConfirm}
        isLoading={actionLoading}
      />

    </div>
  );
}
