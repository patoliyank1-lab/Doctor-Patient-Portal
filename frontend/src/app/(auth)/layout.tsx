import type { Metadata } from "next";
import Link from "next/link";
import { Stethoscope } from "lucide-react";

export const metadata: Metadata = {
  title: {
    default: "Sign In | MediConnect",
    template: "%s | MediConnect",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 px-4 py-12">
      {/* Background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-white/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-white/5 blur-3xl"
      />

      {/* Logo */}
      <Link
        href="/"
        className="mb-8 flex items-center gap-2.5 text-white transition-opacity hover:opacity-90"
        aria-label="MediConnect home"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Stethoscope className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <span className="text-2xl font-bold tracking-tight">MediConnect</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md animate-fade-in rounded-2xl border border-white/10 bg-white/10 p-8 backdrop-blur-md shadow-2xl">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-blue-200/70">
        © {new Date().getFullYear()} MediConnect. All rights reserved.
      </p>
    </div>
  );
}
