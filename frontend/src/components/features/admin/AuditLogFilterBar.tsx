"use client";

import { useState } from "react";
import { Filter, X, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuditLogFilters {
  action: string;
  entity: string;
  dateFrom: string;
  dateTo: string;
  search: string;  // searches action text
}

const ACTIONS = [
  "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT",
  "APPROVE", "REJECT", "SUSPEND", "UPLOAD", "REGISTER", "CANCEL", "COMPLETE",
];

const ENTITIES = [
  "Doctor", "Patient", "Appointment", "User", "Review", "MedicalRecord",
];

interface AuditLogFilterBarProps {
  filters: AuditLogFilters;
  onFiltersChange: (f: AuditLogFilters) => void;
  total: number;
  loading?: boolean;
}

function Select({
  value, onChange, placeholder, options, id,
}: {
  value: string; onChange: (v: string) => void;
  placeholder: string; options: string[]; id: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100",
          value ? "text-slate-900 font-medium" : "text-slate-400"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

export function AuditLogFilterBar({
  filters,
  onFiltersChange,
  total,
  loading,
}: AuditLogFilterBarProps) {
  const [open, setOpen] = useState(false);

  function set<K extends keyof AuditLogFilters>(key: K, val: AuditLogFilters[K]) {
    onFiltersChange({ ...filters, [key]: val });
  }

  const activeCount = [filters.action, filters.entity, filters.dateFrom, filters.dateTo]
    .filter(Boolean).length;

  function clearAll() {
    onFiltersChange({ action: "", entity: "", dateFrom: "", dateTo: "", search: filters.search });
  }

  return (
    <div className="space-y-3">
      {/* Top row: search + filter toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            id="audit-search"
            type="text"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Search by action or entity…"
            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => set("search", "")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Total count */}
          {!loading && (
            <span className="text-xs text-slate-400">
              {new Intl.NumberFormat("en-IN").format(total)} log{total !== 1 ? "s" : ""}
            </span>
          )}

          {/* Filter toggle button */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              open || activeCount > 0
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {activeCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>

          {/* Clear button */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expandable filter panel */}
      {open && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Action Type
            </label>
            <Select
              id="filter-action"
              value={filters.action}
              onChange={(v) => set("action", v)}
              placeholder="All actions"
              options={ACTIONS}
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Entity
            </label>
            <Select
              id="filter-entity"
              value={filters.entity}
              onChange={(v) => set("entity", v)}
              placeholder="All entities"
              options={ENTITIES}
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              From Date
            </label>
            <input
              id="filter-date-from"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => set("dateFrom", e.target.value)}
              max={filters.dateTo || undefined}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              To Date
            </label>
            <input
              id="filter-date-to"
              type="date"
              value={filters.dateTo}
              onChange={(e) => set("dateTo", e.target.value)}
              min={filters.dateFrom || undefined}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
