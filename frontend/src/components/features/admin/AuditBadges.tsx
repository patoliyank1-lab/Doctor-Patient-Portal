"use client";

import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Action badge config
// ─────────────────────────────────────────────────────────────────────────────

interface BadgeCfg {
  label: string;
  bg: string;
  text: string;
  ring: string;
  dot: string;
}

const ACTION_MAP: Record<string, BadgeCfg> = {
  CREATE:    { label: "Create",    bg: "bg-emerald-50",  text: "text-emerald-700",  ring: "ring-emerald-200",  dot: "bg-emerald-400" },
  UPDATE:    { label: "Update",    bg: "bg-blue-50",     text: "text-blue-700",     ring: "ring-blue-200",     dot: "bg-blue-400" },
  DELETE:    { label: "Delete",    bg: "bg-red-50",      text: "text-red-700",      ring: "ring-red-200",      dot: "bg-red-400" },
  LOGIN:     { label: "Login",     bg: "bg-slate-100",   text: "text-slate-600",    ring: "ring-slate-200",    dot: "bg-slate-400" },
  LOGOUT:    { label: "Logout",    bg: "bg-slate-100",   text: "text-slate-500",    ring: "ring-slate-200",    dot: "bg-slate-300" },
  APPROVE:   { label: "Approve",   bg: "bg-emerald-50",  text: "text-emerald-700",  ring: "ring-emerald-200",  dot: "bg-emerald-500" },
  REJECT:    { label: "Reject",    bg: "bg-red-50",      text: "text-red-700",      ring: "ring-red-200",      dot: "bg-red-400" },
  SUSPEND:   { label: "Suspend",   bg: "bg-amber-50",    text: "text-amber-700",    ring: "ring-amber-200",    dot: "bg-amber-400" },
  UPLOAD:    { label: "Upload",    bg: "bg-violet-50",   text: "text-violet-700",   ring: "ring-violet-200",   dot: "bg-violet-400" },
  REGISTER:  { label: "Register",  bg: "bg-teal-50",     text: "text-teal-700",     ring: "ring-teal-200",     dot: "bg-teal-400" },
  CANCEL:    { label: "Cancel",    bg: "bg-orange-50",   text: "text-orange-700",   ring: "ring-orange-200",   dot: "bg-orange-400" },
  COMPLETE:  { label: "Complete",  bg: "bg-emerald-50",  text: "text-emerald-700",  ring: "ring-emerald-200",  dot: "bg-emerald-400" },
  VIEW:      { label: "View",      bg: "bg-sky-50",      text: "text-sky-700",      ring: "ring-sky-200",      dot: "bg-sky-400" },
};

function getActionCfg(action: string): BadgeCfg {
  // Try exact match first
  const upper = action.toUpperCase();
  if (ACTION_MAP[upper]) return ACTION_MAP[upper];

  // Try prefix match (e.g. "DOCTOR_APPROVED" → APPROVE)
  const keys = Object.keys(ACTION_MAP);
  for (const key of keys) {
    if (upper.includes(key)) return { ...ACTION_MAP[key], label: prettyLabel(action) };
  }

  return { label: prettyLabel(action), bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-200", dot: "bg-slate-400" };
}

function prettyLabel(action: string): string {
  return action
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface AuditActionBadgeProps {
  action: string;
  size?: "sm" | "md";
}

export function AuditActionBadge({ action, size = "md" }: AuditActionBadgeProps) {
  const cfg = getActionCfg(action);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1",
        cfg.bg, cfg.text, cfg.ring,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
      )}
    >
      <span className={cn("rounded-full", cfg.dot, size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")} />
      {cfg.label}
    </span>
  );
}

// ──  Entity badge ─────────────────────────────────────────────────────────────

const ENTITY_COLORS: Record<string, string> = {
  doctor:      "bg-blue-50 text-blue-700 ring-blue-200",
  patient:     "bg-teal-50 text-teal-700 ring-teal-200",
  appointment: "bg-violet-50 text-violet-700 ring-violet-200",
  user:        "bg-slate-100 text-slate-600 ring-slate-200",
  review:      "bg-amber-50 text-amber-700 ring-amber-200",
  payment:     "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function AuditEntityBadge({ entity }: { entity: string }) {
  const key = entity.toLowerCase();
  const colors = ENTITY_COLORS[key] ?? "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
        colors
      )}
    >
      {entity.charAt(0).toUpperCase() + entity.slice(1).toLowerCase()}
    </span>
  );
}
