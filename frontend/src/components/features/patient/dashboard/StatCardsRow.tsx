"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Clock, CheckCircle2, XCircle } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  accentColor: string;
  bgColor: string;
  iconColor: string;
  description?: string;
}

function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

function StatCard({ label, value, icon: Icon, accentColor, bgColor, iconColor, description }: StatCardProps) {
  // Guard: treat NaN / undefined / null as 0 so useCountUp never animates to NaN
  const safeValue = Number.isFinite(value) ? value : 0;
  const animated = useCountUp(safeValue);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl ${accentColor}`} />

      <div className="flex items-start justify-between pl-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-4xl font-extrabold text-slate-900">{animated}</p>
          {description && (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          )}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bgColor}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

interface StatCardsRowProps {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
}

export function StatCardsRow({ total, pending, completed, cancelled }: StatCardsRowProps) {
  // Coerce to safe integers — API may return undefined/NaN when requests fail
  const safeTotal     = Number.isFinite(total)     ? total     : 0;
  const safePending   = Number.isFinite(pending)   ? pending   : 0;
  const safeCompleted = Number.isFinite(completed) ? completed : 0;
  const safeCancelled = Number.isFinite(cancelled) ? cancelled : 0;
  const upcoming = Math.max(0, safeTotal - safeCompleted - safeCancelled);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total"
        value={safeTotal}
        icon={CalendarDays}
        accentColor="bg-blue-500"
        bgColor="bg-blue-50"
        iconColor="text-blue-600"
        description="All appointments"
      />
      <StatCard
        label="Upcoming"
        value={upcoming}
        icon={Clock}
        accentColor="bg-indigo-500"
        bgColor="bg-indigo-50"
        iconColor="text-indigo-600"
        description="Scheduled ahead"
      />
      <StatCard
        label="Pending"
        value={safePending}
        icon={Clock}
        accentColor="bg-amber-400"
        bgColor="bg-amber-50"
        iconColor="text-amber-600"
        description="Awaiting approval"
      />
      <StatCard
        label="Completed"
        value={safeCompleted}
        icon={CheckCircle2}
        accentColor="bg-emerald-500"
        bgColor="bg-emerald-50"
        iconColor="text-emerald-600"
        description="Successfully done"
      />
    </div>
  );
}
