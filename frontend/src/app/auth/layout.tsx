import type { Metadata } from "next";
import Link from "next/link";
import { Stethoscope, Shield, Clock, Users } from "lucide-react";

export const metadata: Metadata = {
  title: {
    default: "Sign In | MediConnect",
    template: "%s | MediConnect",
  },
};

const STATS = [
  { icon: Users,  value: "10,000+", label: "Patients Served"  },
  { icon: Stethoscope,    value: "500+",   label: "Verified Doctors" },
  { icon: Shield, value: "99.9%",  label: "Uptime & Security" },
  { icon: Clock,  value: "24 / 7", label: "Care Available"    },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* ── LEFT PANEL — Branded hero ─────────────────────────────────── */}
      <div
        className="relative hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 40%, #0a2a5e 70%, #0a3d6b 100%)" }}
      >
        {/* Animated mesh / glow blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-20 blur-[120px]"
            style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-15 blur-[100px]"
            style={{ background: "radial-gradient(circle, #0ea5e9 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full opacity-10 blur-[80px]"
            style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)" }}
          />
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Top-left logo */}
        <div className="relative z-10 p-8 xl:p-12">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="MediConnect home"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/20 ring-1 ring-blue-400/30 backdrop-blur-sm transition-all group-hover:bg-blue-500/30">
              <Stethoscope className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <span className="block text-xl font-bold tracking-tight text-white">
                MediConnect
              </span>
              <span className="block text-[10px] font-medium tracking-[0.2em] text-blue-400/70 uppercase">
                Doctor–Patient Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Centre hero content */}
        <div className="relative z-10 flex flex-col items-start px-8 xl:px-12 pb-4">
          {/* Large cross icon */}
          <div className="mb-10 flex h-28 w-28 items-center justify-center rounded-3xl bg-blue-500/10 ring-1 ring-blue-500/20 backdrop-blur-sm">
            <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" aria-hidden>
              <rect x="22" y="4" width="20" height="56" rx="4" fill="#3b82f6" fillOpacity="0.9"/>
              <rect x="4" y="22" width="56" height="20" rx="4" fill="#3b82f6" fillOpacity="0.9"/>
              {/* Glow */}
              <rect x="22" y="4" width="20" height="56" rx="4" fill="url(#gc)" fillOpacity="0.4"/>
              <rect x="4" y="22" width="56" height="20" rx="4" fill="url(#gr)" fillOpacity="0.4"/>
              <defs>
                <linearGradient id="gc" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#93c5fd"/>
                  <stop offset="1" stopColor="#2563eb" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="gr" x1="4" y1="32" x2="60" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#93c5fd"/>
                  <stop offset="1" stopColor="#2563eb" stopOpacity="0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <h2 className="mb-4 text-4xl xl:text-5xl font-bold leading-[1.1] text-white">
            Connecting Care,<br />
            <span className="text-blue-400">Empowering Health</span>
          </h2>
          <p className="mb-12 max-w-sm text-base text-slate-400 leading-relaxed">
            A unified platform for patients and doctors to manage appointments,
            medical records, and care — securely and efficiently.
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3.5 ring-1 ring-white/10 backdrop-blur-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
                  <Icon className="h-4.5 w-4.5 text-blue-300" size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{value}</p>
                  <p className="text-[11px] text-slate-400">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom testimonial strip */}
        <div className="relative z-10 p-8 xl:p-12 pt-0">
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 backdrop-blur-sm">
            <p className="text-sm text-slate-300 leading-relaxed">
              &ldquo;MediConnect completely transformed how I manage my patient appointments.
              The interface is clean and the whole experience is seamless.&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                DR
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Dr. Rajesh Kumar</p>
                <p className="text-[11px] text-slate-400">Cardiologist · Apollo Hospital</p>
              </div>
              {/* Stars */}
              <div className="ml-auto flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="h-3.5 w-3.5 fill-yellow-400" viewBox="0 0 20 20" aria-hidden>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form area ───────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-white">
        {/* Mobile logo — visible only on small screens */}
        <div className="flex items-center justify-center gap-2.5 py-6 lg:hidden border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">MediConnect</span>
        </div>

        {/* Scrollable form area */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-24">
          <div className="w-full max-w-[400px]">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 text-center">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} MediConnect · All rights reserved ·{" "}
            <Link href="/" className="hover:text-slate-600 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
