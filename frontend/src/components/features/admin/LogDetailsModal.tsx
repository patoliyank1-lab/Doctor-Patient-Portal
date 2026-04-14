"use client";

import { useState } from "react";
import {
  X, User, Shield, Stethoscope, Activity,
  Globe, Monitor, Clock, ChevronDown, ChevronUp,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { AuditActionBadge, AuditEntityBadge } from "@/components/features/admin/AuditBadges";
import type { AuditLog } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
});

function fmtFull(d: string) {
  try { return dateFmt.format(new Date(d)); } catch { return d; }
}

function getRoleIcon(role?: string) {
  const r = role?.toUpperCase();
  if (r === "ADMIN") return <Shield className="h-3.5 w-3.5 text-violet-500" />;
  if (r === "DOCTOR") return <Stethoscope className="h-3.5 w-3.5 text-blue-500" />;
  return <User className="h-3.5 w-3.5 text-teal-500" />;
}

function getRoleBadge(role?: string) {
  const r = role?.toUpperCase();
  if (r === "ADMIN") return "bg-violet-50 text-violet-700 ring-1 ring-violet-200";
  if (r === "DOCTOR") return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
  return "bg-teal-50 text-teal-700 ring-1 ring-teal-200";
}

// ── Collapsible JSON block ────────────────────────────────────────────────────

function JsonBlock({
  label, data, defaultOpen = false,
}: {
  label: string; data: Record<string, unknown> | null | undefined; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!data) return null;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        {label}
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {open && (
        <pre className="overflow-x-auto bg-slate-950 p-4 text-[11px] leading-relaxed text-emerald-400 max-h-72">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────────────────────

interface LogDetailsModalProps {
  log: AuditLog | null;
  open: boolean;
  onClose: () => void;
}

export function LogDetailsModal({ log, open, onClose }: LogDetailsModalProps) {
  if (!log) return null;

  const role = log.user?.role;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          className={cn(
            "fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full",
            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full",
            "duration-300 focus:outline-none"
          )}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <DialogPrimitive.Title className="text-sm font-bold text-slate-900">
                  Audit Log Detail
                </DialogPrimitive.Title>
                <p className="text-[10px] text-slate-400 font-mono">{log.id}</p>
              </div>
            </div>
            <DialogPrimitive.Close
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="space-y-5 px-6 py-5">

            {/* Action + entity hero */}
            <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <AuditActionBadge action={log.action} />
              <span className="text-slate-300">·</span>
              <AuditEntityBadge entity={log.entity} />
              <span className="text-slate-300">·</span>
              <span className="text-xs font-mono text-slate-500 truncate max-w-[160px]">
                ID: {log.entityId}
              </span>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <Clock className="h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Timestamp</p>
                <p className="text-sm text-slate-800">{fmtFull(log.createdAt)}</p>
              </div>
            </div>

            {/* User info */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Performed By</h4>
              {log.user ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900">
                    {getRoleIcon(role)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{log.user.email ?? "—"}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", getRoleBadge(role))}>
                        {getRoleIcon(role)}
                        {role ?? "Unknown"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{log.userId ?? "—"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-500">System action (no user)</span>
                </div>
              )}
            </div>

            {/* IP + User Agent */}
            {(log.ipAddress || log.userAgent) && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Request Info</h4>
                <div className="space-y-2">
                  {log.ipAddress && (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">IP Address</p>
                        <p className="font-mono text-sm text-slate-700">{log.ipAddress}</p>
                      </div>
                    </div>
                  )}
                  {log.userAgent && (
                    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                      <Monitor className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">User Agent</p>
                        <p className="text-xs text-slate-600 break-all">{log.userAgent}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Old / New values */}
            {(log.oldValue || log.newValue) && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Changes</h4>
                <div className="space-y-2">
                  <JsonBlock label="Before (Old Value)" data={log.oldValue} />
                  <JsonBlock label="After (New Value)"  data={log.newValue} defaultOpen />
                </div>
              </div>
            )}

          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
