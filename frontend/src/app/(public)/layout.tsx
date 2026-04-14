import type { Metadata } from "next";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const metadata: Metadata = {
  title: {
    default: "MediConnect — Healthcare Portal",
    template: "%s | MediConnect",
  },
};

/**
 * PublicLayout — wraps /, /about, /doctors and any other public pages.
 *
 * Uses the smart <PublicNavbar> which reads Zustand auth state to show
 * either guest buttons or a user dropdown depending on login status.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Smart auth-aware navbar — shared across all public pages */}
      <PublicNavbar />

      {/* Page content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Shared footer */}
      <PublicFooter />
    </div>
  );
}
