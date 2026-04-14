"use client";

import Link from "next/link";
import { Stethoscope, Users, Calendar, Shield, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  hoverBorder: string;
}

const ACTIONS: QuickAction[] = [
  {
    label: "Pending Doctors",
    description: "Review applications",
    href: ROUTES.ADMIN_DOCTORS,
    icon: Stethoscope,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    hoverBorder: "hover:border-amber-200",
  },
  {
    label: "All Patients",
    description: "Manage patients",
    href: ROUTES.ADMIN_PATIENTS,
    icon: Users,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
    hoverBorder: "hover:border-blue-200",
  },
  {
    label: "Appointments",
    description: "View & filter all",
    href: ROUTES.ADMIN_APPOINTMENTS,
    icon: Calendar,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-700",
    hoverBorder: "hover:border-violet-200",
  },
  {
    label: "Audit Logs",
    description: "Full activity trail",
    href: ROUTES.ADMIN_AUDIT_LOGS,
    icon: Shield,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-700",
    hoverBorder: "hover:border-slate-300",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={cn(
            "group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3",
            "transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5",
            action.hoverBorder
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
              action.iconBg
            )}
          >
            <action.icon className={cn("h-4 w-4", action.iconColor)} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {action.label}
            </p>
            <p className="text-xs text-slate-500 truncate">{action.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
