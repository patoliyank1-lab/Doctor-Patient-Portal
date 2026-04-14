import { User, Appointment } from "@/types";
import { Calendar, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeBannerProps {
  user: User;
  todayAppointment: Appointment | null;
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "?";
}

export function WelcomeBanner({ user, todayAppointment }: WelcomeBannerProps) {
  // Determine greeting based on current local hour
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  const firstName = user.name ? user.name.split(" ")[0] : user.email.split("@")[0];
  
  // Format target: "Tuesday, 14 April 2026"
  const dateString = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  return (
    <div className="relative flex min-h-[140px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 p-6 sm:flex-row sm:items-center sm:p-8">
      {/* Decorative background element */}
      <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-blue-100/50 blur-3xl mix-blend-multiply pointer-events-none" />

      <div className="relative z-10 flex-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {greeting}, {firstName}
        </h2>
        <p className="mt-1.5 flex items-center gap-2 text-sm text-slate-600 sm:text-base">
          <Calendar className="h-4 w-4 shrink-0" />
          {dateString}
        </p>

        <div className="mt-6">
          {todayAppointment ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-blue-100/80 px-4 py-2.5 text-sm font-medium text-blue-800 shadow-sm ring-1 ring-blue-200/50">
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </div>
              You have an appointment today at {todayAppointment.slot.startTime} with {todayAppointment.doctor.user?.name || "your doctor"}
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-500">
              No appointments scheduled for today
            </p>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-6 hidden shrink-0 sm:mt-0 sm:block">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-bold text-blue-600 shadow-sm ring-4 ring-white/60">
          {getInitials(user.name, user.email)}
        </div>
      </div>
    </div>
  );
}
