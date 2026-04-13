import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function DoctorDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Doctor Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">Your practice overview for today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Today's Appointments", value: "6",   color: "text-emerald-600", border: "border-emerald-100" },
          { label: "Pending Approvals",    value: "2",   color: "text-amber-600",   border: "border-amber-100"   },
          { label: "Total Patients",       value: "142", color: "text-blue-600",    border: "border-blue-100"    },
          { label: "Avg. Rating",          value: "4.8", color: "text-violet-600",  border: "border-violet-100"  },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border ${s.border} bg-white p-5 shadow-sm`}>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-900">Upcoming Appointments</h3>
        <div className="space-y-3">
          {["Ananya Patel — 09:00 AM · General Checkup", "Rohan Mehta — 10:30 AM · Follow-up", "Sneha Iyer — 02:00 PM · Consultation"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
