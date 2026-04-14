import Link from "next/link";
import { Search, CalendarDays, FileText, UserCircle, ArrowRight } from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  iconColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "find-doctor",
    label: "Find a Doctor",
    description: "Search by specialty or name",
    href: "/doctors",
    icon: Search,
    gradient: "from-blue-50 to-blue-100/50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "book-appointment",
    label: "Book Appointment",
    description: "Pick a slot from available times",
    href: "/doctors",
    icon: CalendarDays,
    gradient: "from-indigo-50 to-indigo-100/50",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    id: "medical-records",
    label: "Medical Records",
    description: "View prescriptions & reports",
    href: "/patient/medical-records",
    icon: FileText,
    gradient: "from-emerald-50 to-emerald-100/50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    id: "update-profile",
    label: "Update Profile",
    description: "Edit your personal details",
    href: "/patient/profile",
    icon: UserCircle,
    gradient: "from-violet-50 to-violet-100/50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
];

export function QuickActionsPanel() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-bold text-slate-900">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map(({ id, label, description, href, icon: Icon, gradient, iconBg, iconColor }) => (
          <Link
            key={id}
            href={href}
            className={`group flex flex-col gap-3 rounded-xl bg-gradient-to-br ${gradient} p-3.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-white/60`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg} transition-transform group-hover:scale-110`}>
              <Icon className={`h-4.5 w-4.5 ${iconColor}`} size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">{label}</p>
              <p className="mt-0.5 text-[10px] text-slate-400 leading-tight">{description}</p>
            </div>
          </Link>
        ))}
      </div>
      <Link
        href="/patient/appointments"
        className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
      >
        View All Appointments <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
