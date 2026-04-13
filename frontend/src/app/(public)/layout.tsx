import Link from "next/link";
import { Stethoscope } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "MediConnect — Healthcare Portal",
    template: "%s | MediConnect",
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-foreground"
            aria-label="MediConnect home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Stethoscope
                className="h-4.5 w-4.5 text-white"
                aria-hidden="true"
              />
            </div>
            <span className="text-lg tracking-tight">MediConnect</span>
          </Link>

          {/* Nav links */}
          <nav
            className="hidden items-center gap-6 text-sm font-medium sm:flex"
            aria-label="Public navigation"
          >
            <Link
              href="/doctors"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Find Doctors
            </Link>
            <Link
              href="/about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
          </nav>

          {/* Auth links */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground transition-colors sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <Stethoscope className="h-4 w-4 text-primary" aria-hidden="true" />
              MediConnect
            </Link>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} MediConnect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
