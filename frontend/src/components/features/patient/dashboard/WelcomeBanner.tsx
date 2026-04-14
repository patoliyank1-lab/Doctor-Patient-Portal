import { Calendar, Sparkles } from "lucide-react";
import Link from "next/link";

interface WelcomeBannerUser {
  name?: string;
  email: string;
}

interface WelcomeBannerAppointment {
  id: string;
  slot: { startTime: string };
  doctor: { firstName: string; lastName: string };
}

interface WelcomeBannerProps {
  user: WelcomeBannerUser;
  todayAppointment: WelcomeBannerAppointment | null;
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return (email ?? "").slice(0, 2).toUpperCase();
}

function formatTime(timeStr: string): string {
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

export function WelcomeBanner({ user, todayAppointment }: WelcomeBannerProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const emoji = hour < 12 ? "☀️" : hour < 18 ? "🌤️" : "🌙";

  const firstName =
    user.name?.trim().split(" ")[0] ?? user.email.split("@")[0] ?? "there";

  const dateString = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const initials = getInitials(user.name, user.email);

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
      style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 55%, #0a2a5e 100%)",
      }}
    >
      {/* Glow blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-20 blur-[80px]"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 left-20 h-40 w-40 rounded-full opacity-10 blur-[60px]"
        style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
      />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left — greeting + date + status */}
        <div className="flex-1 min-w-0">
          {/* Badge */}
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-blue-300" />
            Patient Dashboard
          </div>

          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            {emoji} {greeting}, {firstName}!
          </h1>

          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-400">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            {dateString}
          </p>

          {/* Today's appointment chip */}
          <div className="mt-5">
            {todayAppointment ? (
              <Link
                href={`/patient/appointments/${todayAppointment.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/20 px-4 py-2.5 text-sm font-medium text-blue-200 backdrop-blur-sm transition-all hover:bg-blue-500/30"
              >
                {/* Pulsing dot */}
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
                </span>
                Appointment today at{" "}
                {formatTime(todayAppointment.slot.startTime)} with Dr.{" "}
                {todayAppointment.doctor.firstName}{" "}
                {todayAppointment.doctor.lastName}
              </Link>
            ) : (
              <p className="text-sm font-medium text-slate-500">
                No appointments scheduled for today.{" "}
                <Link
                  href="/doctors"
                  className="text-blue-400 underline-offset-2 hover:underline"
                >
                  Find a doctor
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Right — Avatar */}
        <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end sm:gap-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 text-2xl font-extrabold text-white ring-4 ring-white/10 shadow-lg">
            {initials}
          </div>
          <p className="text-xs text-slate-500 text-right max-w-[80px] truncate">{user.email}</p>
        </div>
      </div>
    </div>
  );
}
