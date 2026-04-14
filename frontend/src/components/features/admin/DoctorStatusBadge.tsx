"use client";

import { cn } from "@/lib/utils";

type DoctorApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | string;

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; ring: string; dot: string }
> = {
  PENDING:   { label: "Pending",   bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   dot: "bg-amber-400" },
  APPROVED:  { label: "Approved",  bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-400" },
  REJECTED:  { label: "Rejected",  bg: "bg-red-50",     text: "text-red-700",     ring: "ring-red-200",     dot: "bg-red-400" },
  SUSPENDED: { label: "Suspended", bg: "bg-slate-100",  text: "text-slate-600",   ring: "ring-slate-200",   dot: "bg-slate-400" },
};

interface DoctorStatusBadgeProps {
  status: DoctorApprovalStatus;
  size?: "sm" | "md";
}

export function DoctorStatusBadge({ status, size = "md" }: DoctorStatusBadgeProps) {
  const key = status.toUpperCase();
  const cfg = STATUS_CONFIG[key] ?? {
    label: status,
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "ring-slate-200",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1",
        cfg.bg,
        cfg.text,
        cfg.ring,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
      )}
    >
      <span className={cn("rounded-full", cfg.dot, size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")} />
      {cfg.label}
    </span>
  );
}
