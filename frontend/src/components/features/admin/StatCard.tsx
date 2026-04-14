"use client";

import Link from "next/link";
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Tailwind color token for the icon background — e.g. "bg-blue-100" */
  iconBg?: string;
  /** Tailwind text color for icon — e.g. "text-blue-600" */
  iconColor?: string;
  /** Tailwind gradient classes for left accent bar — e.g. "from-blue-500 to-blue-400" */
  accent?: string;
  /** Optional positive/negative/neutral trend percentage string */
  trend?: number | null;
  /** Optional sub-label shown below the value */
  sub?: string;
  /** Optional link — wraps the card in a <Link> */
  href?: string;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconBg = "bg-blue-100",
  iconColor = "text-blue-600",
  accent = "from-blue-500 to-blue-400",
  trend,
  sub,
  href,
  loading = false,
}: StatCardProps) {
  const card = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        "transition-all duration-200",
        href && "hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300"
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b",
          accent
        )}
      />

      {loading ? (
        <div className="animate-pulse space-y-3 pl-2">
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded-md bg-slate-200" />
            <div className="h-9 w-9 rounded-xl bg-slate-200" />
          </div>
          <div className="h-8 w-20 rounded-md bg-slate-200" />
          <div className="h-3 w-16 rounded-md bg-slate-200" />
        </div>
      ) : (
        <div className="pl-2">
          {/* Top row — label + icon */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {label}
            </p>
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                iconBg
              )}
            >
              <Icon className={cn("h-4.5 w-4.5", iconColor)} aria-hidden />
            </div>
          </div>

          {/* Value */}
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          {/* Sub-text + trend */}
          <div className="mt-1.5 flex items-center gap-2">
            {sub && (
              <span className="text-xs text-slate-500">{sub}</span>
            )}
            {trend !== undefined && trend !== null && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  trend > 0
                    ? "bg-emerald-50 text-emerald-600"
                    : trend < 0
                    ? "bg-red-50 text-red-600"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {trend > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : trend < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }

  return card;
}
