"use client";

import { Shield, Stethoscope, User, Activity, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuditActionBadge, AuditEntityBadge } from "@/components/features/admin/AuditBadges";
import type { AuditLog } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const shortDateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "short", year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit", minute: "2-digit",
});

function fmtDate(d: string) {
  try { return shortDateFmt.format(new Date(d)); } catch { return d; }
}
function fmtTime(d: string) {
  try { return timeFmt.format(new Date(d)); } catch { return ""; }
}

function timeAgo(d: string): string {
  try {
    const diff = Date.now() - new Date(d).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins < 1)   return "just now";
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30)  return `${days}d ago`;
    return fmtDate(d);
  } catch { return d; }
}

function getRoleIcon(role?: string) {
  const r = role?.toUpperCase();
  if (r === "ADMIN") return <Shield className="h-3 w-3 text-violet-500" />;
  if (r === "DOCTOR") return <Stethoscope className="h-3 w-3 text-blue-500" />;
  return <User className="h-3 w-3 text-teal-500" />;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

export function AuditLogTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {["Timestamp", "User", "Action", "Entity", "Target ID", "IP", ""].map((h) => (
              <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 first:pl-5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: 10 }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              {[28, 44, 20, 18, 30, 14, 10].map((w, j) => (
                <td key={j} className="px-4 py-4 first:pl-5">
                  <div className="h-4 rounded-md bg-slate-200" style={{ width: `${w * 2}px` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Activity className="h-6 w-6 text-slate-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">No audit logs found</p>
        <p className="mt-0.5 text-xs text-slate-400">
          {filtered ? "Try adjusting your filters" : "Activity will appear here once actions are performed"}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Table
// ─────────────────────────────────────────────────────────────────────────────

interface AuditLogTableProps {
  logs: AuditLog[];
  loading?: boolean;
  error?: boolean;
  filtered?: boolean;
  onRowClick: (log: AuditLog) => void;
}

export function AuditLogTable({
  logs, loading, error, filtered, onRowClick,
}: AuditLogTableProps) {
  if (loading) return <AuditLogTableSkeleton />;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="pl-5 pr-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Timestamp
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                User
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">
                Entity
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell">
                Target ID
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden xl:table-cell">
                IP Address
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 pr-5">
                Details
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {error ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-slate-500">
                  Failed to load audit logs — check your connection
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState filtered={!!filtered} />
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const role = log.user?.role;
                const email = log.user?.email ?? "System";

                return (
                  <tr
                    key={log.id}
                    onClick={() => onRowClick(log)}
                    className="group cursor-pointer hover:bg-blue-50/60 transition-colors duration-100"
                  >
                    {/* Timestamp */}
                    <td className="pl-5 pr-4 py-3.5 whitespace-nowrap">
                      <p className="text-xs font-medium text-slate-700">{fmtDate(log.createdAt)}</p>
                      <p className="text-[10px] text-slate-400">{fmtTime(log.createdAt)}</p>
                      <p className="text-[10px] text-slate-300 mt-0.5">{timeAgo(log.createdAt)}</p>
                    </td>

                    {/* User */}
                    <td className="px-4 py-3.5 max-w-[160px]">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                            role?.toUpperCase() === "ADMIN"
                              ? "bg-violet-100"
                              : role?.toUpperCase() === "DOCTOR"
                                ? "bg-blue-100"
                                : "bg-teal-100"
                          )}
                        >
                          {getRoleIcon(role)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{email}</p>
                          <p className="text-[10px] text-slate-400">{role ?? "System"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <AuditActionBadge action={log.action} />
                    </td>

                    {/* Entity */}
                    <td className="px-4 py-3.5 hidden md:table-cell whitespace-nowrap">
                      <AuditEntityBadge entity={log.entity} />
                    </td>

                    {/* Target ID */}
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="font-mono text-[10px] text-slate-400 truncate block max-w-[100px]">
                        {log.entityId}
                      </span>
                    </td>

                    {/* IP */}
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      {log.ipAddress ? (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Globe className="h-3 w-3 text-slate-300" />
                          {log.ipAddress}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>

                    {/* View trigger */}
                    <td className="py-3.5 pr-5 text-right">
                      <span className="text-[10px] font-medium text-blue-500 opacity-0 transition-opacity group-hover:opacity-100">
                        View →
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
