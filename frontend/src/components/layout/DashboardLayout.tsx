"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { AuthEventListener } from "./AuthEventListener";
import type { UserRole } from "@/types";

interface DashboardLayoutProps {
  role: UserRole;
  children: React.ReactNode;
}

export function DashboardLayout({ role, children }: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        role={role}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main column — flex-1 + min-h-0 ensures it never exceeds the viewport */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <TopHeader onMenuClick={() => setIsMobileOpen((v) => !v)} />

        {/* Page content — this is the ONLY scrollable region */}
        <main
          id="main-content"
          className="animate-page-in min-h-0 flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-6"
        >
          {/* Global event listener — renders nothing visually */}
          <AuthEventListener />

          {children}
        </main>
      </div>
    </div>
  );
}
