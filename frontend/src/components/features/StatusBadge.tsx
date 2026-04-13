import { cn, getStatusColors, getStatusLabel } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

/**
 * Colored status pill. Automatically picks the right colors and label
 * based on the status string (pending, approved, rejected, completed, etc.)
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        getStatusColors(status),
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}
