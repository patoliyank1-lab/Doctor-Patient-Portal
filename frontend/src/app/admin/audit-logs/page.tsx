"use client";

import {
  useState, useEffect, useCallback, useMemo, useRef,
} from "react";
import { Activity, Shield, AlertTriangle, RefreshCw } from "lucide-react";

// API
import { getAuditLogs } from "@/lib/api/admin";

// Types
import type { AuditLog } from "@/types";

// Components
import { AuditLogTable }    from "@/components/features/admin/AuditLogTable";
import { AuditLogFilterBar, type AuditLogFilters } from "@/components/features/admin/AuditLogFilterBar";
import { LogDetailsModal }  from "@/components/features/admin/LogDetailsModal";
import { Pagination }       from "@/components/features/Pagination";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LIMIT = 25;
const DEBOUNCE_MS = 400;

const DEFAULT_FILTERS: AuditLogFilters = {
  action: "",
  entity: "",
  dateFrom: "",
  dateTo: "",
  search: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Mini stat card
// ─────────────────────────────────────────────────────────────────────────────

function MiniStat({
  label, value, icon: Icon, iconBg, iconColor, loading,
}: {
  label: string; value: number | string; icon: React.ElementType;
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
          <div className="mt-0.5 h-5 w-12 animate-pulse rounded-md bg-slate-200" />
        ) : (
          <p className="text-xl font-bold text-slate-900">
            {typeof value === "number"
              ? new Intl.NumberFormat("en-IN").format(value)
              : value}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [logs, setLogs]           = useState<AuditLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [filters, setFilters]     = useState<AuditLogFilters>(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Selected log for detail modal ───────────────────────────────────────────
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailOpen, setDetailOpen]   = useState(false);

  // ── Debounce search ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPage(1);
    }, DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filters.search]);

  // Reset page when static filters change
  useEffect(() => { setPage(1); }, [filters.action, filters.entity, filters.dateFrom, filters.dateTo]);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getAuditLogs({
        page,
        limit: LIMIT,
        action:   filters.action   || (debouncedSearch ? debouncedSearch : undefined),
        entity:   filters.entity   || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo:   filters.dateTo   || undefined,
      });

      // fetchWithAuth unwraps { success, data } → res = { logs, pagination }
      setLogs(res.logs ?? []);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filters.action, filters.entity, filters.dateFrom, filters.dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Computed stats from current page ────────────────────────────────────────
  const uniqueActors = useMemo(
    () => new Set(logs.map((l) => l.userId).filter(Boolean)).size,
    [logs]
  );

  const hasActiveFilters = !!(
    filters.action || filters.entity || filters.dateFrom || filters.dateTo || filters.search
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleRowClick(log: AuditLog) {
    setSelectedLog(log);
    setDetailOpen(true);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-8">

      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Audit Logs</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Track all system activity — who did what, when, and where
          </p>
        </div>
        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Security notice banner */}
      <div className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
        <Shield className="h-4 w-4 shrink-0 text-violet-500 mt-0.5" />
        <p className="text-sm text-violet-800">
          <span className="font-semibold">Security Audit Trail</span> — All admin actions are immutably logged.
          This page is access-controlled to Admins only.
        </p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MiniStat
          label="Total Logs"
          value={total}
          icon={Activity}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          loading={loading}
        />
        <MiniStat
          label="Active Actors (page)"
          value={uniqueActors}
          icon={Shield}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          loading={loading}
        />
        <MiniStat
          label="Showing"
          value={`${logs.length} / ${new Intl.NumberFormat("en-IN").format(total)}`}
          icon={AlertTriangle}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          loading={loading}
        />
      </div>

      {/* Filter bar */}
      <AuditLogFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        total={total}
        loading={loading}
      />

      {/* Table */}
      <AuditLogTable
        logs={logs}
        loading={loading}
        error={error}
        filtered={hasActiveFilters}
        onRowClick={handleRowClick}
      />

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-1">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} ·{" "}
            {new Intl.NumberFormat("en-IN").format(total)} total logs
          </p>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Log detail slide-in panel */}
      <LogDetailsModal
        log={selectedLog}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
