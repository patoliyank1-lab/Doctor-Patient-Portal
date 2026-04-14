import { PageContainer } from "@/components/layout/PageContainer";

export default function Loading() {
  return (
    <PageContainer>
      {/* Full page shimmer block simulating the dashboard sections */}
      <div className="flex flex-col gap-6">
        {/* Welcome Banner Skeleton */}
        <div className="w-full h-[120px] rounded-2xl bg-slate-100 animate-pulse border border-slate-200"></div>
        
        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-[100px] rounded-2xl bg-slate-100 animate-pulse border border-slate-200"></div>
          <div className="h-[100px] rounded-2xl bg-slate-100 animate-pulse border border-slate-200"></div>
          <div className="h-[100px] rounded-2xl bg-slate-100 animate-pulse border border-slate-200"></div>
        </div>
        
        {/* Grid Area Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
           {/* Left column - Appointments */}
           <div className="lg:col-span-3 h-[400px] rounded-2xl bg-slate-100 animate-pulse border border-slate-200"></div>
           
           {/* Right column - Actions & Notifications */}
           <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="h-[200px] rounded-2xl bg-slate-100 animate-pulse border border-slate-200"></div>
              <div className="h-[200px] rounded-2xl bg-slate-100 animate-pulse border border-slate-200"></div>
           </div>
        </div>
      </div>
    </PageContainer>
  );
}
