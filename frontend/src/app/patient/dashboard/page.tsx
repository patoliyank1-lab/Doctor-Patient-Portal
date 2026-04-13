import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function PatientDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome back 👋</h2>
        <p className="mt-1 text-sm text-slate-500">Here&apos;s an overview of your health activity.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Upcoming Appointments", value: "2", color: "bg-blue-50 text-blue-600", border: "border-blue-100" },
          { label: "Medical Records",        value: "8", color: "bg-emerald-50 text-emerald-600", border: "border-emerald-100" },
          { label: "Doctors Consulted",      value: "3", color: "bg-violet-50 text-violet-600", border: "border-violet-100" },
          { label: "Reviews Given",          value: "5", color: "bg-amber-50 text-amber-600", border: "border-amber-100" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border ${s.border} bg-white p-5 shadow-sm`}>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`mt-2 text-3xl font-bold ${s.color.split(" ")[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder content area */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-900">Recent Activity</h3>
        <div className="space-y-3">
          {["Appointment with Dr. Rajesh Kumar — Tomorrow 10:00 AM", "Lab report uploaded — Chest X-ray", "Review submitted for Dr. Priya Sharma"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
