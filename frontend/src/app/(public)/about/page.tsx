import type { Metadata } from "next";
import Link from "next/link";
import {
  Stethoscope,
  Heart,
  Shield,
  Zap,
  Users,
  Target,
  ArrowRight,
  CheckCircle,
  Globe,
  Award,
  Code2,
  HeartHandshake,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about MediConnect — our mission, values, and the team building the future of accessible healthcare.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const VALUES = [
  {
    icon: Heart,
    title: "Patient First",
    description:
      "Every decision we make starts with one question: does this make it easier for patients to access quality care?",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Shield,
    title: "Privacy & Trust",
    description:
      "Your health data is deeply personal. We protect it with end-to-end encryption, strict access controls, and zero data selling — ever.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Zap,
    title: "Simplicity",
    description:
      "Great healthcare software disappears into the background. We obsess over removing friction so you can focus on what matters.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Globe,
    title: "Accessibility",
    description:
      "Quality healthcare shouldn't depend on your geography or income. We're building tools that work for everyone, everywhere.",
    color: "bg-green-50 text-green-600",
  },
] as const;

const STATS = [
  { value: "2024", label: "Founded" },
  { value: "500+", label: "Verified Doctors" },
  { value: "50K+", label: "Patients Served" },
  { value: "15+", label: "Specializations" },
];

const MILESTONES = [
  {
    year: "Jan 2024",
    title: "MediConnect Founded",
    description:
      "Started with a simple idea — what if booking a doctor was as easy as booking a flight?",
  },
  {
    year: "Mar 2024",
    title: "Beta Launch",
    description:
      "Onboarded the first 50 doctors and 500 patients across three cities. Feedback was overwhelmingly positive.",
  },
  {
    year: "Jun 2024",
    title: "Medical Records Feature",
    description:
      "Launched secure digital medical record storage, allowing patients to carry their history everywhere.",
  },
  {
    year: "Sep 2024",
    title: "50,000 Patients Milestone",
    description:
      "Reached 50,000 registered patients and expanded to 20+ cities with 500+ verified doctors.",
  },
  {
    year: "2025",
    title: "What's Next",
    description:
      "Telemedicine, AI-assisted doctor matching, and expanding to tier-2 cities across India.",
  },
];

const TEAM = [
  {
    name: "Aarav Mehta",
    role: "Co-founder & CEO",
    bg: "bg-blue-600",
    initials: "AM",
    bio: "Former healthcare operations lead. Passionate about technology that improves lives.",
  },
  {
    name: "Dr. Sanya Kapoor",
    role: "Co-founder & Chief Medical Officer",
    bg: "bg-green-600",
    initials: "SK",
    bio: "Practising physician who experienced firsthand the gap between patients and quality care.",
  },
  {
    name: "Rohan Desai",
    role: "Head of Engineering",
    bg: "bg-purple-600",
    initials: "RD",
    bio: "10+ years building scalable healthcare platforms. Led engineering at two successful health-tech startups.",
  },
  {
    name: "Priya Nair",
    role: "Head of Design",
    bg: "bg-rose-600",
    initials: "PN",
    bio: "Crafts interfaces that are intuitive and accessible. Believes great design is invisible.",
  },
];

const TECH_STACK = [
  { icon: Code2, label: "Next.js 14 (App Router)" },
  { icon: Shield, label: "End-to-end encrypted" },
  { icon: Zap, label: "Real-time notifications" },
  { icon: Globe, label: "HIPAA-aligned data handling" },
  { icon: Award, label: "99.9% uptime SLA" },
  { icon: HeartHandshake, label: "Strict role-based access" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 px-4 py-24 sm:px-6 sm:py-32">
        {/* Blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-1/4 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-400/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100 backdrop-blur-sm">
            <Stethoscope className="h-4 w-4" aria-hidden />
            Our Story
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Healthcare that works{" "}
            <span className="text-blue-200">for everyone</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-blue-100/90">
            MediConnect was born out of frustration — the kind you feel when a
            loved one needs a specialist but can&apos;t get an appointment for
            three weeks. We&apos;re here to change that.
          </p>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <dt className="text-3xl font-extrabold text-primary">{value}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Mission ───────────────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left */}
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
                Our Mission
              </p>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Connecting patients with the care they deserve
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                We believe access to quality healthcare is a fundamental right,
                not a privilege. MediConnect makes it effortless for patients to
                find verified doctors, book appointments, and manage their health
                records — all in one place.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                For doctors, we eliminate administrative overhead so they can
                spend more time with patients and less time on paperwork.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Reduce wait times from weeks to hours",
                  "Give every patient a complete health record",
                  "Help doctors reclaim their time",
                  "Make healthcare transparent and trustworthy",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — decorative card */}
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-blue-50 to-indigo-50 p-8 shadow-card">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow">
                    <Target className="h-6 w-6 text-white" aria-hidden />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Our Vision</p>
                    <p className="text-xs text-muted-foreground">
                      Where we&apos;re headed
                    </p>
                  </div>
                </div>
                <p className="text-base leading-relaxed text-muted-foreground">
                  To become India&apos;s most trusted healthcare platform — one
                  where every patient can access the right doctor at the right
                  time, and every doctor can practice medicine without
                  administrative friction.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { label: "Cities", value: "20+" },
                    { label: "Specializations", value: "15+" },
                    { label: "Avg. Booking Time", value: "< 2 min" },
                    { label: "Patient Satisfaction", value: "4.9 / 5" },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-border bg-white p-3 text-center shadow-sm"
                    >
                      <p className="text-lg font-bold text-primary">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────────────────── */}
      <section className="bg-muted/40 px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              What We Believe
            </p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Our core values
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${color}`}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ──────────────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              Our Journey
            </p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              From idea to impact
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div
              aria-hidden
              className="absolute left-5 top-0 h-full w-px bg-border sm:left-1/2"
            />

            <ol className="space-y-10">
              {MILESTONES.map(({ year, title, description }, idx) => (
                <li key={year} className="relative flex gap-6 sm:gap-0">
                  {/* Left side (sm+) */}
                  <div
                    className={`hidden sm:block sm:w-1/2 ${idx % 2 === 0 ? "pr-10 text-right" : "order-last pl-10 text-left"}`}
                  >
                    <p className="text-sm font-bold text-primary">{year}</p>
                    <h3 className="mt-1 font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>

                  {/* Dot */}
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-background bg-primary sm:absolute sm:left-1/2 sm:-translate-x-1/2">
                    <CheckCircle className="h-4 w-4 text-white" aria-hidden />
                  </div>

                  {/* Mobile content */}
                  <div className="flex-1 sm:hidden">
                    <p className="text-sm font-bold text-primary">{year}</p>
                    <h3 className="mt-0.5 font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>

                  {/* Right spacer (sm+) */}
                  {idx % 2 === 0 && (
                    <div className="hidden sm:block sm:w-1/2" />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Team ──────────────────────────────────────────────────────────── */}
      <section className="bg-muted/40 px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              The People
            </p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Meet the team
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              A small team of builders and healthcare professionals obsessed with
              making medicine more human.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map(({ name, role, bg, initials, bio }) => (
              <div
                key={name}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover"
              >
                {/* Avatar block */}
                <div
                  className={`${bg} flex h-32 items-center justify-center`}
                  aria-hidden
                >
                  <span className="text-3xl font-bold text-white">
                    {initials}
                  </span>
                </div>

                {/* Info */}
                <div className="p-5">
                  <p className="font-semibold text-foreground">{name}</p>
                  <p className="mt-0.5 text-xs font-medium text-primary">
                    {role}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech & Trust ──────────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              Built to Last
            </p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Technology you can trust
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              We use best-in-class infrastructure and security practices because
              your health data deserves nothing less.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TECH_STACK.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <p className="text-sm font-medium text-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Be part of the movement
          </h2>
          <p className="mt-4 text-blue-100/90">
            Whether you&apos;re a patient looking for care or a doctor ready to
            serve more patients — MediConnect is built for you.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg hover:bg-blue-50 transition-all active:scale-[0.98]"
            >
              Join MediConnect
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link
              href="/"
              className="text-base font-medium text-blue-100 underline-offset-4 hover:text-white hover:underline transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
