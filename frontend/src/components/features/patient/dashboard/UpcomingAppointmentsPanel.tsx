import Link from "next/link";
import { CalendarDays, ArrowRight } from "lucide-react";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import { CancelAppointmentButton } from "./CancelAppointmentButton";
import { EmptyState } from "./EmptyState";

// ── Shape that matches the actual backend response ─────────────────────────────
export interface DashboardAppointment {
  id: string;
  status: string;
  scheduledAt: string;
  createdAt: string;
  reason?: string;
  slot: {
    id: string;
    date: string;       // ISO date
    startTime: string;  // ISO datetime (time part used)
    endTime: string;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specializations: string[];
    profileImageUrl?: string | null;
    consultationFee?: string | number | null;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSlotDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatSlotTime(timeStr: string): string {
  try {
    return new Date(timeStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timeStr;
  }
}

const AVATAR_COLORS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700",
  "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-600",
];
function avatarGradient(name: string) {
  const code = (name.charCodeAt(0) ?? 0) + (name.charCodeAt(1) ?? 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length]!;
}

const CANCELLABLE = ["pending", "approved"];

// ── AppointmentCard ───────────────────────────────────────────────────────────

function AppointmentCard({ appointment }: { appointment: DashboardAppointment }) {
  const { id, status, slot, doctor, reason } = appointment;
  const fullName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
  const initials = `${doctor.firstName[0] ?? "D"}${doctor.lastName[0] ?? "R"}`.toUpperCase();
  const gradient = avatarGradient(doctor.firstName);
  const spec = doctor.specializations[0] ?? "Specialist";
  const canCancel = CANCELLABLE.includes(status.toLowerCase());

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-100 sm:flex-row sm:items-start sm:gap-4">
      {/* Doctor Avatar */}
      <div className="shrink-0">
        {doctor.profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doctor.profileImageUrl}
            alt={fullName}
            className="h-14 w-14 rounded-2xl object-cover"
          />
        ) : (
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-sm font-bold text-white`}>
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-slate-900">{fullName}</p>
            <p className="text-xs font-medium text-blue-600">{spec}</p>
          </div>
          <AppointmentStatusBadge status={status} />
        </div>

        {/* Date & Time */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {formatSlotDate(slot.date)}
          </span>
          <span>
            🕐 {formatSlotTime(slot.startTime)} – {formatSlotTime(slot.endTime)}
          </span>
        </div>

        {reason && (
          <p className="text-xs text-slate-400 line-clamp-1">
            <span className="font-medium text-slate-500">Reason:</span> {reason}
          </p>
        )}

        {/* Actions */}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Link
            href={`/patient/appointments/${id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            View Details <ArrowRight className="h-3 w-3" />
          </Link>
          {canCancel && <CancelAppointmentButton appointmentId={id} />}
        </div>
      </div>
    </div>
  );
}

// ── UpcomingAppointmentsPanel ─────────────────────────────────────────────────

interface UpcomingAppointmentsPanelProps {
  appointments: DashboardAppointment[];
}

export function UpcomingAppointmentsPanel({ appointments }: UpcomingAppointmentsPanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Upcoming Appointments</h2>
          <p className="text-xs text-slate-400">{appointments.length} appointment{appointments.length !== 1 ? "s" : ""} loaded</p>
        </div>
        <Link
          href="/patient/appointments"
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* List or Empty */}
      {appointments.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-8 w-8 text-slate-300" />}
          title="No upcoming appointments"
          description="You have no approved appointments scheduled. Book one to get started."
          action={{ label: "Find a Doctor", href: "/doctors" }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {appointments.map((appt) => (
            <AppointmentCard key={appt.id} appointment={appt} />
          ))}
        </div>
      )}
    </div>
  );
}
