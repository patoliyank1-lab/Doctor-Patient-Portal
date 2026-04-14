"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Stethoscope,
  Calendar,
  Star,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import type { Metadata } from "next";
import type {
  AdminDashboardData,
  PatientAnalyticsData,
  DoctorAnalyticsData,
  AppointmentAnalyticsData,
} from "@/types";
import {
  getDashboard,
  getPatientAnalytics,
  getDoctorAnalytics,
  getAppointmentAnalytics,
} from "@/lib/api/admin";

import { StatCard } from "@/components/features/admin/StatCard";
import { QuickActions } from "@/components/features/admin/QuickActions";
import { RecentAppointmentsTable } from "@/components/features/admin/RecentAppointmentsTable";
import { AppointmentStatusDonut } from "@/components/features/admin/AppointmentStatusDonut";
import { TopDoctorsTable } from "@/components/features/admin/TopDoctorsTable";
import { PatientGrowthChart } from "@/components/charts/PatientGrowthChart";
import { AppointmentTrendChart } from "@/components/charts/AppointmentTrendChart";
import { DoctorSpecializationChart } from "@/components/charts/DoctorSpecializationChart";

// ─────────────────────────────────────────────────────────────────────────────
// Metadata (server-exported — no conflict since page itself is a client comp)
// ─────────────────────────────────────────────────────────────────────────────

// NOTE: metadata export is kept in layout, not here (client component constraint)

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  return new Intl.NumberFormat("en-IN").format(n);
}

function greetingTime(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart section wrapper — card with header
// ─────────────────────────────────────────────────────────────────────────────

interface ChartCardProps {
  title: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: boolean;
}

function ChartCard({
  title,
  icon: Icon,
  iconBg,
  iconColor,
  children,
  loading = false,
  error = false,
}: ChartCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}
        >
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="h-[260px] w-full rounded-xl bg-slate-100" />
          </div>
        ) : error ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
            Failed to load chart data.
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard page
// ─────────────────────────────────────────────────────────────────────────────

interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
}

function useAsync<T>() {
  const [state, setState] = useState<DataState<T>>({
    data: null,
    loading: true,
    error: false,
  });
  return [state, setState] as const;
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard]         = useAsync<AdminDashboardData>();
  const [patientStats, setPatientStats]   = useAsync<PatientAnalyticsData>();
  const [doctorStats, setDoctorStats]     = useAsync<DoctorAnalyticsData>();
  const [apptStats, setApptStats]         = useAsync<AppointmentAnalyticsData>();
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    // Start all 4 loaders immediately
    setDashboard((s)     => ({ ...s, loading: true, error: false }));
    setPatientStats((s)  => ({ ...s, loading: true, error: false }));
    setDoctorStats((s)   => ({ ...s, loading: true, error: false }));
    setApptStats((s)     => ({ ...s, loading: true, error: false }));

    const [dashResult, patientResult, doctorResult, apptResult] =
      await Promise.allSettled([
        getDashboard(),
        getPatientAnalytics(),
        getDoctorAnalytics(),
        getAppointmentAnalytics(),
      ]);

    setDashboard({
      data:    dashResult.status === "fulfilled" ? dashResult.value : null,
      loading: false,
      error:   dashResult.status === "rejected",
    });
    setPatientStats({
      data:    patientResult.status === "fulfilled" ? patientResult.value : null,
      loading: false,
      error:   patientResult.status === "rejected",
    });
    setDoctorStats({
      data:    doctorResult.status === "fulfilled" ? doctorResult.value : null,
      loading: false,
      error:   doctorResult.status === "rejected",
    });
    setApptStats({
      data:    apptResult.status === "fulfilled" ? apptResult.value : null,
      loading: false,
      error:   apptResult.status === "rejected",
    });

    setLastRefreshed(new Date());
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const d = dashboard.data;
  const p = patientStats.data;
  const doc = doctorStats.data;
  const a = apptStats.data;

  const timeFmt = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="space-y-6 pb-8">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {greetingTime()}, Admin 👋
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Platform overview · Last updated {timeFmt.format(lastRefreshed)}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAll}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <QuickActions />

      {/* ── Primary stat cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Patients"
          value={fmt(d?.users.patients)}
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          accent="from-blue-500 to-blue-400"
          sub={p ? `+${p.totals.newThisMonth} this month` : undefined}
          loading={dashboard.loading}
        />
        <StatCard
          label="Total Doctors"
          value={fmt(d?.doctors.total)}
          icon={Stethoscope}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          accent="from-emerald-500 to-emerald-400"
          sub={doc ? `${doc.totals.approved} approved` : undefined}
          loading={dashboard.loading}
        />
        <StatCard
          label="Pending Doctors"
          value={fmt(d?.doctors.pending)}
          icon={Clock}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          accent="from-amber-500 to-amber-400"
          sub="Awaiting review"
          href="/admin/doctors"
          loading={dashboard.loading}
        />
        <StatCard
          label="Appointments"
          value={fmt(d?.appointments.total)}
          icon={Calendar}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          accent="from-violet-500 to-violet-400"
          sub={a ? `${a.rates.completionRate}% completion` : undefined}
          loading={dashboard.loading}
        />
        <StatCard
          label="Avg. Rating"
          value={d?.reviews.averageRating != null ? `${d.reviews.averageRating} ★` : "—"}
          icon={Star}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          accent="from-yellow-500 to-yellow-400"
          sub={d ? `from ${fmt(d.reviews.total)} reviews` : undefined}
          loading={dashboard.loading}
        />
        <StatCard
          label="Medical Records"
          value={fmt(d?.medicalRecords.total)}
          icon={FileText}
          iconBg="bg-pink-100"
          iconColor="text-pink-600"
          accent="from-pink-500 to-pink-400"
          loading={dashboard.loading}
        />
      </div>

      {/* ── Secondary metric cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Completed (All time)"
          value={fmt(d?.appointments.completed)}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          accent="from-emerald-400 to-teal-400"
          sub={a ? `${a.totals.completedThisMonth} this month` : undefined}
          loading={dashboard.loading || apptStats.loading}
        />
        <StatCard
          label="Cancelled (All time)"
          value={fmt(d?.appointments.cancelled)}
          icon={XCircle}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          accent="from-red-400 to-rose-400"
          sub={a ? `${a.totals.cancelledThisMonth} this month` : undefined}
          loading={dashboard.loading || apptStats.loading}
        />
        <StatCard
          label="Completion Rate"
          value={a ? `${a.rates.completionRate}%` : "—"}
          icon={Activity}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          accent="from-indigo-500 to-blue-400"
          sub={a ? `${a.rates.cancellationRate}% cancellation rate` : undefined}
          loading={apptStats.loading}
        />
      </div>

      {/* ── Charts row 1 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="New Patient Registrations"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          loading={patientStats.loading}
          error={patientStats.error}
        >
          {p && p.monthlyGrowth.length > 0 ? (
            <PatientGrowthChart data={p.monthlyGrowth} />
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
              No growth data available yet.
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Monthly Appointment Trend"
          icon={TrendingUp}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          loading={apptStats.loading}
          error={apptStats.error}
        >
          {a && a.monthlyTrend.length > 0 ? (
            <AppointmentTrendChart data={a.monthlyTrend} />
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
              No trend data available yet.
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Charts row 2 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Doctors by Specialization"
          icon={Stethoscope}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={doctorStats.loading}
          error={doctorStats.error}
        >
          {doc && doc.bySpecialization.length > 0 ? (
            <DoctorSpecializationChart data={doc.bySpecialization} />
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
              No specialization data available yet.
            </div>
          )}
        </ChartCard>

        <AppointmentStatusDonut
          data={a?.byStatus}
          loading={apptStats.loading}
          error={apptStats.error}
        />
      </div>

      {/* ── Bottom tables ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RecentAppointmentsTable
          data={d?.recentAppointments}
          loading={dashboard.loading}
          error={dashboard.error}
        />
        <TopDoctorsTable
          data={doc?.topDoctorsByCompletedAppointments}
          loading={doctorStats.loading}
          error={doctorStats.error}
        />
      </div>

    </div>
  );
}
