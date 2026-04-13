import Link from "next/link";
import { Calendar, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { formatDate, formatTime } from "@/lib/utils";
import type { Appointment } from "@/types";

interface AppointmentCardProps {
  appointment: Appointment;
  /** Which perspective controls which name is shown vs. hidden */
  viewAs: "patient" | "doctor" | "admin";
  /** Route to navigate to on click — pass from the parent */
  href: string;
}

export function AppointmentCard({
  appointment,
  viewAs,
  href,
}: AppointmentCardProps) {
  const slot = appointment.slot;
  const otherParty =
    viewAs === "patient" ? appointment.doctor?.user?.name : appointment.patient?.user?.name;
  const otherPartyLabel = viewAs === "patient" ? "Doctor" : "Patient";

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-border bg-card shadow-card hover:shadow-card-hover transition-shadow duration-200"
      aria-label={`Appointment with ${otherParty}`}
    >
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {otherPartyLabel}
            </p>
            <h3 className="mt-0.5 font-semibold text-foreground truncate">
              {otherParty ?? "—"}
            </h3>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        {/* Date / time */}
        {slot && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
              <span>{formatDate(slot.date)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
              <span>
                {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
              </span>
            </div>
          </div>
        )}

        {/* Reason */}
        {appointment.reason && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <User className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <p className="line-clamp-2">{appointment.reason}</p>
          </div>
        )}
      </CardContent>
    </Link>
  );
}
