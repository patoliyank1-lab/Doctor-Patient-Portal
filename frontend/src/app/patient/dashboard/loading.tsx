import { PageContainer } from "@/components/layout/PageContainer";

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-slate-200 ${className ?? ""}`} />
  );
}

export default function DashboardLoading() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-6">

        {/* Welcome Banner skeleton */}
        <Shimmer className="h-[160px] rounded-2xl" />

        {/* Stat Cards skeleton */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-2 pl-2">
                  <Shimmer className="h-3 w-16" />
                  <Shimmer className="h-9 w-12" />
                  <Shimmer className="h-2.5 w-24" />
                </div>
                <Shimmer className="h-11 w-11 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Main grid skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* Appointments panel — 3/5 cols */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <Shimmer className="h-4 w-44" />
              <Shimmer className="h-3.5 w-16" />
            </div>
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 rounded-2xl border border-slate-100 p-4">
                  <Shimmer className="h-14 w-14 shrink-0 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Shimmer className="h-4 w-32" />
                    <Shimmer className="h-3 w-20" />
                    <Shimmer className="h-3 w-44" />
                    <div className="flex gap-2 pt-1">
                      <Shimmer className="h-7 w-24 rounded-lg" />
                      <Shimmer className="h-7 w-16 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right rail — 2/5 cols */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Quick Actions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Shimmer className="mb-4 h-4 w-28" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Shimmer key={i} className="h-24 rounded-xl" />
                ))}
              </div>
              <Shimmer className="mt-4 h-10 rounded-xl" />
            </div>
            {/* Notifications */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Shimmer className="mb-4 h-4 w-36" />
              <div className="flex flex-col gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 rounded-xl px-2 py-2.5">
                    <Shimmer className="h-8 w-8 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Shimmer className="h-3 w-32" />
                      <Shimmer className="h-2.5 w-full" />
                      <Shimmer className="h-2 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
