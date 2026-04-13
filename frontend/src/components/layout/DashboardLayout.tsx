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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        role={role}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <TopHeader onMenuClick={() => setIsMobileOpen((v) => !v)} />

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-6"
        >
          {/* Global event listener — renders nothing visually */}
          <AuthEventListener />

          {/* Page */}
          <div className="animate-page-in mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
