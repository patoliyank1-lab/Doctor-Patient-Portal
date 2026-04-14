"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar, CheckCircle2, Clock, Users, Star,
  Loader2, ChevronRight, TrendingUp, Activity,
} from "lucide-react";
import { getMyDoctorProfile } from "@/lib/api/doctors";
import { getMyAppointments } from "@/lib/api/appointments";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Doctor, Appointment } from "@/types";

function formatTime(iso?: string): string {
  if (!iso) return "—";
  try {
    if (/^\d{2}:\d{2}/.test(iso)) {
      const [h, m] = iso.split(":");
      const d = new Date(); d.setHours(Number(h), Number(m));
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return iso; }
}

function getPatientName(apt: Appointment): string {
  const p = apt.patient as any;
  if (p?.firstName || p?.lastName) return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  if (p?.user?.name) return p.user.name;
  return "Patient";
}

const STATUS_DOT: Record<string, string> = {
  pending:   "bg-amber-400",
  approved:  "bg-blue-400",
  completed: "bg-emerald-500",
  cancelled: "bg-red-400",
  rejected:  "bg-rose-400",
};

export default function DoctorDashboardPage() {
  const [doctor, setDoctor]           = useState<Doctor | null>(null);
  const [todayApts, setTodayApts]     = useState<Appointment[]>([]);
  const [pending, setPending]         = useState(0);
  const [completed, setCompleted]     = useState(0);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const [docRes, todayRes, pendRes, compRes] = await Promise.allSettled([
        getMyDoctorProfile(),
        getMyAppointments({ limit: 5, date: today }),
        getMyAppointments({ limit: 1, status: "pending" }),
        getMyAppointments({ limit: 1, status: "completed" }),
      ]);
      if (docRes.status   === "fulfilled") setDoctor(docRes.value);
      if (todayRes.status === "fulfilled") setTodayApts((todayRes.value.data ?? []) as Appointment[]);
      if (pendRes.status  === "fulfilled") setPending(pendRes.value.total ?? 0);
      if (compRes.status  === "fulfilled") setCompleted(compRes.value.total ?? 0);
      setLoading(false);
    })();
  }, []);

  const stats = [
    { label: "Today's Appointments", value: loading ? "—" : todayApts.length, color: "text-blue-600", bg: "bg-blue-50", icon: <Calendar className="h-5 w-5 text-blue-500" /> },
    { label: "Pending Approvals",    value: loading ? "—" : pending,           color: "text-amber-600", bg: "bg-amber-50", icon: <Clock className="h-5 w-5 text-amber-500" /> },
    { label: "Completed Visits",     value: loading ? "—" : completed,         color: "text-emerald-600", bg: "bg-emerald-50", icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" /> },
    { label: "Avg. Rating",          value: doctor ? (doctor.avgRating ?? 0) > 0 ? (doctor.avgRating!).toFixed(1) : "New" : "—", color: "text-purple-600", bg: "bg-purple-50", icon: <Star className="h-5 w-5 text-purple-500" /> },
  ];

  return (
    <PageContainer
      title={doctor ? `Welcome, Dr. ${doctor.firstName ?? ""}!` : "Doctor Dashboard"}
      subtitle="Your practice overview and today's schedule."
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>{s.icon}</div>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`mt-1 text-3xl font-extrabold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Approval status banner */}
      {doctor && doctor.approvalStatus !== "APPROVED" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <Activity className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">Profile Under Review</p>
            <p className="text-sm text-amber-700">Your doctor profile is pending admin approval. You can still manage your schedule, but you won&apos;t appear in patient searches until approved.</p>
          </div>
        </div>
      )}

      {/* Today's appointments */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">Today&apos;s Appointments</h2>
          <Link href="/doctor/appointments" className="text-sm font-medium text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : todayApts.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No appointments scheduled for today.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {todayApts.map((apt) => {
              const slot = apt.slot as any;
              return (
                <li key={apt.id}>
                  <Link href={`/doctor/appointments/${apt.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[apt.status] ?? "bg-slate-300"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 truncate">{getPatientName(apt)}</p>
                      <p className="text-xs text-slate-500">
                        {formatTime(slot?.startTime)} {apt.reason ? `· ${apt.reason}` : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { href: "/doctor/appointments", icon: <Calendar className="h-5 w-5" />, label: "Manage Appointments", color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
          { href: "/doctor/availability", icon: <Clock className="h-5 w-5" />, label: "Set Availability", color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" },
          { href: "/doctor/profile",      icon: <TrendingUp className="h-5 w-5" />, label: "Edit Profile", color: "text-purple-600 bg-purple-50 hover:bg-purple-100" },
        ].map((a) => (
          <Link key={a.href} href={a.href}
            className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold transition-all hover:shadow-md ${a.color}`}>
            {a.icon} {a.label}
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
