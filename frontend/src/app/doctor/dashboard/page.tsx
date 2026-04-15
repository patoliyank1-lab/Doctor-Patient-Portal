"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  Loader2,
  ChevronRight,
  TrendingUp,
  Activity,
  AlertCircle,
  Bell,
  Users,
  Stethoscope,
  ArrowUpRight,
  RefreshCw,
  UserCheck,
  XCircle,
  Hourglass,
  CalendarCheck,
} from "lucide-react";
import { getMyDoctorProfile } from "@/lib/api/doctors";
import { getMyAppointments } from "@/lib/api/appointments";
import { getRecentNotifications } from "@/lib/api/notifications";
import { PageContainer } from "@/components/layout/PageContainer";
import { cn } from "@/lib/utils";
import type { Doctor, Appointment, Notification } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(iso?: string): string {
  if (!iso) return "—";
  try {
    if (/^\d{2}:\d{2}/.test(iso)) {
      const [h, m] = iso.split(":");
      const d = new Date();
      d.setHours(Number(h), Number(m));
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return iso;
  }
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function timeAgo(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

function getPatientName(apt: Appointment): string {
  const p = apt.patient as any;
  if (p?.firstName || p?.lastName) return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  if (p?.user?.name) return p.user.name;
  if (p?.user?.email) return p.user.email.split("@")[0];
  return "Patient";
}

function getPatientInitials(apt: Appointment): string {
  const name = getPatientName(apt);
  const parts = name.split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { dot: string; badge: string; label: string; icon: React.ElementType }> = {
  pending: { dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200", label: "Pending", icon: Hourglass },
  approved: { dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200", label: "Approved", icon: CalendarCheck },
  completed: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Completed", icon: CheckCircle2 },
  cancelled: { dot: "bg-red-400", badge: "bg-red-50 text-red-700 border-red-200", label: "Cancelled", icon: XCircle },
  rejected: { dot: "bg-rose-400", badge: "bg-rose-50 text-rose-700 border-rose-200", label: "Rejected", icon: XCircle },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
      <div className="mb-3 h-10 w-10 rounded-xl bg-slate-100" />
      <div className="h-3 w-24 rounded bg-slate-100 mb-2" />
      <div className="h-8 w-16 rounded bg-slate-100" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { badge: "bg-slate-50 text-slate-600 border-slate-200", label: status };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize", cfg.badge)}>
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DoctorDashboardPage() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [todayApts, setTodayApts] = useState<Appointment[]>([]);
  const [upcomingApts, setUpcomingApts] = useState<Appointment[]>([]);
  const [pendingApts, setPendingApts] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pending, setPending] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [totalApts, setTotalApts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split("T")[0];
      const [docRes, todayRes, upcomingRes, pendRes, compRes, totalRes, notifsRes, pendingListRes] =
        await Promise.allSettled([
          getMyDoctorProfile(),
          getMyAppointments({ limit: 5, date: today }),
          getMyAppointments({ limit: 3, status: "approved" }),
          getMyAppointments({ limit: 1, status: "pending" }),
          getMyAppointments({ limit: 1, status: "completed" }),
          getMyAppointments({ limit: 1 }),
          getRecentNotifications(4),
          getMyAppointments({ limit: 3, status: "pending" }),
        ]);

      if (docRes.status === "fulfilled") setDoctor(docRes.value);
      if (todayRes.status === "fulfilled") setTodayApts((todayRes.value.data ?? []) as Appointment[]);
      if (upcomingRes.status === "fulfilled") setUpcomingApts((upcomingRes.value.data ?? []) as Appointment[]);
      if (pendRes.status === "fulfilled") setPending(pendRes.value.total ?? 0);
      if (compRes.status === "fulfilled") setCompleted(compRes.value.total ?? 0);
      if (totalRes.status === "fulfilled") setTotalApts(totalRes.value.total ?? 0);
      if (notifsRes.status === "fulfilled") setNotifications((notifsRes.value.data ?? []) as Notification[]);
      if (pendingListRes.status === "fulfilled") setPendingApts((pendingListRes.value.data ?? []) as Appointment[]);
    } catch {
      setError("Failed to load dashboard data. Please refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived: greeting based on time of day ──────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const doctorName = doctor ? `Dr. ${doctor.firstName ?? ""}` : "Doctor";

  // ── Stats cards ──────────────────────────────────────────────────────────────
  const stats = [
    {
      label: "Today's Appointments",
      value: loading ? null : todayApts.length,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
      href: "/doctor/appointments",
      trend: null,
    },
    {
      label: "Pending Approvals",
      value: loading ? null : pending,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      href: "/doctor/appointments",
      trend: pending > 0 ? "Needs attention" : null,
    },
    {
      label: "Completed Visits",
      value: loading ? null : completed,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      href: "/doctor/appointments",
      trend: null,
    },
    {
      label: "Avg. Rating",
      value: loading ? null : (doctor ? (doctor.avgRating ?? 0) > 0 ? (doctor.avgRating!).toFixed(1) : "New" : "—"),
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
      icon: <Star className="h-5 w-5 text-violet-500" />,
      href: "/doctor/profile",
      trend: doctor?.totalReviews ? `${doctor.totalReviews} reviews` : null,
    },
  ];

  return (
    <PageContainer>
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {loading ? (
            <>
              <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-4 w-48 animate-pulse rounded-lg bg-slate-100" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                {greeting},{" "}
                <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  {doctorName}!
                </span>
              </h1>
              <p className="text-sm text-slate-500">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                {" · "}Your practice overview and today's schedule.
              </p>
            </>
          )}
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={() => fetchData(true)}
          disabled={refreshing || loading}
          aria-label="Refresh dashboard"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
          <div>
            <p className="font-semibold text-red-800">Loading Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* ── Approval Status Banner ────────────────────────────────────────── */}
      {!loading && doctor && doctor.approvalStatus === "approved" && (
        <div
          role="status"
          aria-label="Profile approval status"
          className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4"
        >
          <Activity className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            < p className="font-semibold text-amber-800">Profile Under Review</p>
            <p className="text-sm text-amber-700">
              Your doctor profile is pending admin approval. You can still manage your schedule, but you
              won&apos;t appear in patient searches until approved.
            </p>
          </div>
        </div>
      )}

      {/* ── Stats Grid ────────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        aria-label="Dashboard statistics"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              aria-label={`${s.label}: ${s.value}`}
              className={cn(
                "group rounded-2xl border bg-white p-5 shadow-sm",
                "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                s.border
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl", s.bg)}>
                  {s.icon}
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" aria-hidden="true" />
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">{s.label}</p>
              <p className={cn("mt-1 text-3xl font-extrabold", s.color)}>{s.value ?? "—"}</p>
              {s.trend && (
                <p className="mt-1 text-[11px] font-medium text-slate-400">{s.trend}</p>
              )}
            </Link>
          ))}
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Left Column (col-span-2): Appointments ────────────────────── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Today's Appointments */}
          <section aria-label="Today's appointments">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                    <Calendar className="h-4 w-4 text-blue-500" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-800">Today&apos;s Appointments</h2>
                    {!loading && (
                      <p className="text-xs text-slate-400">
                        {todayApts.length === 0 ? "No appointments" : `${todayApts.length} scheduled`}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href="/doctor/appointments"
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  aria-label="View all appointments"
                >
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12" aria-label="Loading appointments">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : todayApts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                    <CalendarCheck className="h-7 w-7 text-slate-300" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">No appointments today</p>
                    <p className="text-xs text-slate-400 mt-0.5">Your schedule is clear for today.</p>
                  </div>
                  <Link
                    href="/doctor/availability"
                    id="set-availability-cta"
                    className="mt-1 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    Set Availability
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100" role="list">
                  {todayApts.map((apt) => {
                    const slot = apt.slot as any;
                    const cfg = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.pending;
                    return (
                      <li key={apt.id}>
                        <Link
                          href={`/doctor/appointments/${apt.id}`}
                          id={`apt-${apt.id}`}
                          className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50"
                          aria-label={`Appointment with ${getPatientName(apt)} at ${formatTime(slot?.startTime)}`}
                        >
                          {/* Patient avatar */}
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white">
                            {getPatientInitials(apt)}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-slate-800">{getPatientName(apt)}</p>
                            <p className="text-xs text-slate-500">
                              {formatTime(slot?.startTime)}
                              {apt.reason ? ` · ${apt.reason}` : ""}
                            </p>
                          </div>

                          {/* Status badge + chevron */}
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={apt.status} />
                            <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Pending Approvals */}
          <section aria-label="Pending appointment approvals">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                    <Hourglass className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-800">Pending Approvals</h2>
                    {!loading && (
                      <p className="text-xs text-slate-400">
                        {pendingApts.length === 0 ? "All clear" : `${pending} awaiting your action`}
                      </p>
                    )}
                  </div>
                </div>
                {pending > 0 && (
                  <Link
                    href="/doctor/appointments"
                    id="view-pending-appointments"
                    className="flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline transition-colors"
                  >
                    Review all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                </div>
              ) : pendingApts.length === 0 ? (
                <div className="flex items-center gap-3 px-5 py-8 text-center justify-center">
                  <UserCheck className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                  <p className="text-sm text-slate-500">No pending approvals. You&apos;re all caught up!</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100" role="list">
                  {pendingApts.map((apt) => {
                    const slot = apt.slot as any;
                    return (
                      <li key={apt.id}>
                        <Link
                          href={`/doctor/appointments/${apt.id}`}
                          id={`pending-apt-${apt.id}`}
                          className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-amber-50/50"
                          aria-label={`Pending appointment from ${getPatientName(apt)}`}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-xs font-bold text-white">
                            {getPatientInitials(apt)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-slate-800">{getPatientName(apt)}</p>
                            <p className="text-xs text-slate-500">
                              {slot?.date ? formatDate(slot.date) : "Date TBD"}
                              {slot?.startTime ? ` · ${formatTime(slot.startTime)}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                              Pending
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section aria-label="Quick actions">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  href: "/doctor/appointments",
                  id: "action-manage-appointments",
                  icon: <Calendar className="h-5 w-5" aria-hidden="true" />,
                  label: "Manage Appointments",
                  desc: "View & update status",
                  color: "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100",
                },
                {
                  href: "/doctor/availability",
                  id: "action-set-availability",
                  icon: <Clock className="h-5 w-5" aria-hidden="true" />,
                  label: "Set Availability",
                  desc: "Manage your schedule",
                  color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-100",
                },
                {
                  href: "/doctor/profile",
                  id: "action-edit-profile",
                  icon: <TrendingUp className="h-5 w-5" aria-hidden="true" />,
                  label: "Edit Profile",
                  desc: "Update your info",
                  color: "text-violet-600 bg-violet-50 hover:bg-violet-100 border-violet-100",
                },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  id={a.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border bg-white px-5 py-4",
                    "font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                    a.color
                  )}
                >
                  <div className="shrink-0">{a.icon}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{a.label}</p>
                    <p className="text-xs font-normal opacity-70">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* ── Right Column (col-span-1): Profile + Notifications ────────── */}
        <div className="space-y-6">

          {/* Doctor Profile Card */}
          <section aria-label="Doctor profile summary">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Gradient header */}
              <div className="h-16 bg-gradient-to-r from-blue-600 to-blue-400" />
              <div className="px-5 pb-5">
                {/* Avatar */}
                <div className="-mt-8 mb-3 flex items-end justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-bold text-white shadow-sm">
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white/70" />
                    ) : (
                      <>
                        {doctor?.profileImageUrl ? (
                          <img
                            src={doctor.profileImageUrl}
                            alt={`Dr. ${doctor.firstName}`}
                            className="h-full w-full rounded-xl object-cover"
                          />
                        ) : (
                          <span>
                            {doctor
                              ? `${doctor.firstName?.[0] ?? ""}${doctor.lastName?.[0] ?? ""}`.toUpperCase()
                              : "DR"}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <Link
                    href="/doctor/profile"
                    id="edit-profile-btn"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                    aria-label="Edit doctor profile"
                  >
                    Edit Profile
                  </Link>
                </div>

                {loading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-5 w-40 rounded bg-slate-100" />
                    <div className="h-3 w-28 rounded bg-slate-100" />
                    <div className="h-3 w-32 rounded bg-slate-100" />
                  </div>
                ) : doctor ? (
                  <>
                    <h3 className="font-bold text-slate-900">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {Array.isArray(doctor.specializations) && doctor.specializations.length > 0
                        ? doctor.specializations.join(", ")
                        : doctor.specialization ?? "General Physician"}
                    </p>
                    {doctor.clinicName && (
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Stethoscope className="h-3 w-3" aria-hidden="true" />
                        {doctor.clinicName}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex flex-col items-center py-3 px-2 text-center">
                        <p className="text-base font-bold text-slate-800">{totalApts}</p>
                        <p className="text-[10px] text-slate-400 leading-tight">Total</p>
                      </div>
                      <div className="flex flex-col items-center py-3 px-2 text-center">
                        <p className="text-base font-bold text-emerald-600">{completed}</p>
                        <p className="text-[10px] text-slate-400 leading-tight">Done</p>
                      </div>
                      <div className="flex flex-col items-center py-3 px-2 text-center">
                        <p className="text-base font-bold text-violet-600">
                          {doctor.avgRating && doctor.avgRating > 0 ? doctor.avgRating.toFixed(1) : "—"}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-tight flex items-center gap-0.5 justify-center">
                          <Star className="h-2.5 w-2.5 fill-violet-500 text-violet-500" />
                          Rating
                        </p>
                      </div>
                    </div>

                    {doctor.experienceYears || doctor.experience ? (
                      <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                        <Activity className="h-3 w-3 shrink-0 text-blue-400" aria-hidden="true" />
                        {doctor.experienceYears ?? doctor.experience} years of experience
                      </p>
                    ) : null}

                    {doctor.consultationFee ? (
                      <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                        <span className="text-emerald-500 font-medium">₹</span>
                        Consultation fee: ₹{doctor.consultationFee}
                      </p>
                    ) : null}

                    {/* Approval status pill */}
                    <div className="mt-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
                          doctor.approvalStatus === "approved"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : doctor.approvalStatus === "rejected" || doctor.approvalStatus === "suspended"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                        )}
                      >
                        {doctor.approvalStatus === "approved" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Activity className="h-3 w-3" />
                        )}
                        {doctor.approvalStatus ?? "pending"} profile
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Profile not set up yet.</p>
                )}
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section aria-label="Recent notifications">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
                    <Bell className="h-4 w-4 text-rose-500" aria-hidden="true" />
                  </div>
                  <h2 className="font-semibold text-slate-800">Notifications</h2>
                </div>
                <Link
                  href="/doctor/notifications"
                  id="view-all-notifications"
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                  aria-label="View all notifications"
                >
                  All <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <Bell className="h-8 w-8 text-slate-200" aria-hidden="true" />
                  <p className="text-sm text-slate-400">No new notifications</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100" role="list">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <Link
                        href="/doctor/notifications"
                        id={`notif-${n.id}`}
                        className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                        aria-label={`Notification: ${n.title}`}
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                            n.isRead ? "bg-slate-100" : "bg-blue-100"
                          )}
                        >
                          <Bell
                            className={cn("h-3.5 w-3.5", n.isRead ? "text-slate-400" : "text-blue-500")}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate text-xs font-semibold", n.isRead ? "text-slate-500" : "text-slate-800")}>
                            {n.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-400">{n.message}</p>
                          <p className="mt-1 text-[10px] text-slate-300">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.isRead && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-label="Unread" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Upcoming Appointments (compact) */}
          <section aria-label="Upcoming approved appointments">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                    <Users className="h-4 w-4 text-blue-500" aria-hidden="true" />
                  </div>
                  <h2 className="font-semibold text-slate-800">Upcoming</h2>
                </div>
                <Link
                  href="/doctor/appointments"
                  id="view-upcoming-appointments"
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                  aria-label="View all upcoming appointments"
                >
                  All <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : upcomingApts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <CalendarCheck className="h-8 w-8 text-slate-200" aria-hidden="true" />
                  <p className="text-sm text-slate-400">No upcoming appointments</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100" role="list">
                  {upcomingApts.map((apt) => {
                    const slot = apt.slot as any;
                    return (
                      <li key={apt.id}>
                        <Link
                          href={`/doctor/appointments/${apt.id}`}
                          id={`upcoming-${apt.id}`}
                          className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                          aria-label={`Upcoming appointment with ${getPatientName(apt)}`}
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-[11px] font-bold text-white">
                            {getPatientInitials(apt)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-800">{getPatientName(apt)}</p>
                            <p className="text-[11px] text-slate-400">
                              {slot?.date ? formatDate(slot.date) : ""}
                              {slot?.startTime ? ` · ${formatTime(slot.startTime)}` : ""}
                            </p>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
