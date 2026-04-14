import { PageContainer } from "@/components/layout/PageContainer";
import { getMe } from "@/lib/api/auth";
import { getUpcomingAppointments, getPendingCount, getTotalCount } from "@/lib/api/appointments";
import { getRecentNotifications } from "@/lib/api/notifications";
import { WelcomeBanner } from "@/components/features/patient/dashboard/WelcomeBanner";

export const metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
  }
};

// Route Segment Config: Heavily caches the dashboard layout to solve rapid re-render API exhaustion
export const revalidate = 60;

export default async function PatientDashboardPage() {
  // Fetch all dashboard data in parallel
  const [
    user,
    upcomingRes,
    pendingCount,
    totalCount,
    notificationsRes
  ] = await Promise.all([
    getMe(),
    getUpcomingAppointments(5),
    getPendingCount(),
    getTotalCount(),
    getRecentNotifications(3)
  ]);

  // Determine if there is an appointment today
  const today = new Date().toDateString();
  const todayAppointment = upcomingRes.data.find(
    (app) => new Date(app.slot.date).toDateString() === today
  ) || null;

  return (
    <PageContainer>
      {/* 
        This is a shell page. 
        As we build the UI components in Part 4, they will be dropped in here.
      */}
      <div className="flex flex-col gap-6">
        <WelcomeBanner user={user as any} todayAppointment={todayAppointment} />

        {/* Placeholder for Stat Cards */}
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          Stat Cards Section Ready (Total: {totalCount}, Pending: {pendingCount})
        </div>

        {/* Placeholder for Grid Area: Appointments + Right Rail (Actions & Notifications) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 lg:col-span-3">
            Upcoming Appointments Panel Ready (Loaded {upcomingRes.data.length})
          </div>
          
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              Quick Actions Panel Ready
            </div>
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              Recent Notifications Panel Ready (Loaded {notificationsRes.data.length})
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
