"use client";

import { useRef } from "react";
import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DoctorStatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

interface DoctorFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: DoctorStatusFilter;
  onStatusChange: (v: DoctorStatusFilter) => void;
  total: number;
  pendingCount?: number;
}

const STATUS_TABS: { value: DoctorStatusFilter; label: string }[] = [
  { value: "ALL",      label: "All" },
  { value: "PENDING",  label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export function DoctorFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  total,
  pendingCount,
}: DoctorFilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Status tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {STATUS_TABS.map((tab) => {
          const active = status === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onStatusChange(tab.value)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                active
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
              {tab.value === "PENDING" && pendingCount !== undefined && pendingCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
              {tab.value === "ALL" && (
                <span className="text-[10px] font-normal text-slate-400">
                  ({total})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search box */}
      <div className="relative flex-shrink-0">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or email…"
          className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-64"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              onSearchChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
