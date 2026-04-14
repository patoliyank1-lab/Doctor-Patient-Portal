import { cn } from "@/lib/utils";

type Status = "pending" | "approved" | "rejected" | "completed" | "cancelled" | "rescheduled" | string;

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  pending: {
    label: "Pending",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  completed: {
    label: "Completed",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  },
  rejected: {
    label: "Rejected",
    className: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-red-100 bg-red-50 text-red-500",
    dot: "bg-red-400",
  },
  rescheduled: {
    label: "Rescheduled",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
};

interface AppointmentStatusBadgeProps {
  status: Status;
  className?: string;
}

export function AppointmentStatusBadge({ status, className }: AppointmentStatusBadgeProps) {
  const config = STATUS_CONFIG[status.toLowerCase()] ?? {
    label: status,
    className: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
