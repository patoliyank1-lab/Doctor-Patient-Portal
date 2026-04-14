"use client";

import { useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard fetch error:", error);
  }, [error]);

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
        <p className="text-slate-600 max-w-md mx-auto mb-8">
          We couldn't load your dashboard data. Please check your connection or try logging out and back in.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 shadow-sm"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh Dashboard
        </button>
      </div>
    </PageContainer>
  );
}
