import { PageContainer } from "@/components/layout/PageContainer";
import { getMe } from "@/lib/api/auth";
import {
  getUpcomingAppointments,
  getPendingCount,
  getTotalCount,
  getCompletedCount,
  getCancelledCount,
} from "@/lib/api/appointments";
import { getRecentNotifications } from "@/lib/api/notifications";
import { WelcomeBanner } from "@/components/features/patient/dashboard/WelcomeBanner";
import { StatCardsRow } from "@/components/features/patient/dashboard/StatCardsRow";
import { UpcomingAppointmentsPanel } from "@/components/features/patient/dashboard/UpcomingAppointmentsPanel";
import type { DashboardAppointment } from "@/components/features/patient/dashboard/UpcomingAppointmentsPanel";
import { QuickActionsPanel } from "@/components/features/patient/dashboard/QuickActionsPanel";
import { RecentNotificationsPanel } from "@/components/features/patient/dashboard/RecentNotificationsPanel";
import type { DashboardNotification } from "@/components/features/patient/dashboard/RecentNotificationsPanel";

export const metadata = {
  title: "Dashboard | MediConnect",
  robots: { index: false, follow: false },
};

// Revalidate every 60 s — balances freshness with server load
export const revalidate = 60;

export default async function PatientDashboardPage() {
  // ── Fetch all data in parallel (allSettled = one failure won't crash the page) ──
  const [
    userResult,
    upcomingResult,
    pendingResult,
    totalResult,
    completedResult,
    cancelledResult,
    notificationsResult,
  ] = await Promise.allSettled([
    getMe(),
    getUpcomingAppointments(5),
    getPendingCount(),
    getTotalCount(),
    getCompletedCount(),
    getCancelledCount(),
    getRecentNotifications(3),
  ]);

  // ── Safely unwrap settled results with fallbacks ─────────────────────────────
  const user        = userResult.status        === "fulfilled" ? userResult.value          : null;
  const upcomingRes = upcomingResult.status    === "fulfilled" ? upcomingResult.value       : null;
  const pendingCount    = pendingResult.status    === "fulfilled" ? pendingResult.value    : 0;
  const totalCount      = totalResult.status      === "fulfilled" ? totalResult.value      : 0;
  const completedCount  = completedResult.status  === "fulfilled" ? completedResult.value  : 0;
  const cancelledCount  = cancelledResult.status  === "fulfilled" ? cancelledResult.value  : 0;
  const notificationsRes = notificationsResult.status === "fulfilled" ? notificationsResult.value : null;

  // ── Compute today's appointment ──────────────────────────────────────────────
  const today = new Date().toDateString();
  const appointments = ((upcomingRes?.data ?? []) as unknown as DashboardAppointment[]);

  const todayAppointment =
    appointments.find(
      (app) => new Date(app.slot.date).toDateString() === today
    ) ?? null;

  const notifications = ((notificationsRes?.data ?? []) as unknown as DashboardNotification[]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">

        {/* ── Welcome Banner ─────────────────────────────────────── */}
        <WelcomeBanner user={(user ?? { name: undefined, email: "" }) as any} todayAppointment={todayAppointment} />

        {/* ── Stat Cards ────────────────────────────────────────── */}
        <StatCardsRow
          total={totalCount}
          pending={pendingCount}
          completed={completedCount}
          cancelled={cancelledCount}
        />

        {/* ── Main Grid: Appointments (left) + Right Rail ───────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* Upcoming Appointments — 3/5 cols on large screens */}
          <div className="lg:col-span-3">
            <UpcomingAppointmentsPanel appointments={appointments} />
          </div>

          {/* Right Rail: Quick Actions + Notifications — 2/5 cols */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <QuickActionsPanel />
            <RecentNotificationsPanel notifications={notifications} />
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
