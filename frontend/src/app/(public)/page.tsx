import Link from "next/link";
import type { Metadata } from "next";
import {
  Calendar,
  FileText,
  Shield,
  Star,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "MediConnect — Doctor Patient Portal",
  description:
    "MediConnect is a modern healthcare portal connecting patients with doctors. Book appointments, manage medical records, and access care — all in one place.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "500+",   label: "Verified Doctors"      },
  { value: "50K+",   label: "Happy Patients"         },
  { value: "200K+",  label: "Appointments Booked"    },
  { value: "4.9★",   label: "Average Rating"         },
];

const FEATURES = [
  {
    icon: Calendar,
    title: "Easy Appointment Booking",
    description:
      "Browse verified doctors, view real-time availability, and book your appointment in under 60 seconds.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: FileText,
    title: "Digital Medical Records",
    description:
      "Securely upload and access prescriptions, lab reports, and imaging files from anywhere, anytime.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Shield,
    title: "Safe & Secure Platform",
    description:
      "Your health data is protected with enterprise-grade encryption and strict role-based access control.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Star,
    title: "Verified Reviews",
    description:
      "Make informed decisions with honest reviews from real patients who have visited the doctor.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Clock,
    title: "Real-time Notifications",
    description:
      "Stay informed with instant updates on appointment confirmations, reminders, and status changes.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description:
      "Dedicated portals for patients, doctors, and administrators — each with tailored tools and workflows.",
    color: "bg-indigo-50 text-indigo-600",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create your account",
    description:
      "Sign up as a patient or doctor. Verify your email and complete your profile in minutes.",
  },
  {
    step: "02",
    title: "Find the right doctor",
    description:
      "Search by specialization, location, or rating. View profiles, fee, and availability.",
  },
  {
    step: "03",
    title: "Book & attend",
    description:
      "Pick an available slot, provide your reason for visit, and attend your appointment.",
  },
  {
    step: "04",
    title: "Access records & reviews",
    description:
      "Your medical records are stored securely. Leave a review to help other patients.",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "Patient",
    rating: 5,
    text: "Booking an appointment used to be such a hassle. With MediConnect I found a cardiologist and got a slot within minutes!",
    initials: "PS",
    bg: "bg-blue-600",
  },
  {
    name: "Dr. Rahul Mehta",
    role: "Cardiologist",
    rating: 5,
    text: "The doctor portal is incredibly well-designed. Managing my availability, appointments, and patient notes is seamless.",
    initials: "RM",
    bg: "bg-green-600",
  },
  {
    name: "Aditya Patel",
    role: "Patient",
    rating: 5,
    text: "I love that all my medical records are in one place. No more carrying paper files to every appointment!",
    initials: "AP",
    bg: "bg-purple-600",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Landing Page — rendered inside (public)/layout.tsx which provides
// the shared PublicNavbar + PublicFooter.
// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 px-4 py-24 sm:px-6 sm:py-32">
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/3 h-[600px] w-[600px] rounded-full bg-white/5 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            Trusted by 50,000+ patients across India
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Your Health,{" "}
            <span className="relative">
              <span className="relative z-10">Connected</span>
              <span
                aria-hidden
                className="absolute bottom-1 left-0 right-0 h-3 -skew-x-3 bg-white/20"
              />
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-blue-100/90">
            MediConnect bridges the gap between patients and qualified doctors.
            Book appointments, manage medical records, and access quality
            healthcare — all in one seamless platform.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg hover:bg-blue-50 transition-all active:scale-[0.98]"
            >
              Book an Appointment
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link
              href="/auth/register?role=doctor"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-all"
            >
              Join as a Doctor
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {["No hidden fees", "Verified doctors only", "Instant confirmation"].map(
              (item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-blue-100/80">
                  <CheckCircle className="h-4 w-4 text-green-400" aria-hidden />
                  {item}
                </div>
              )
            )}
          </div>
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

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              Everything You Need
            </p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Healthcare made simple
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              MediConnect brings together all the tools patients and doctors need
              into a single, beautifully designed platform.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
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

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-muted/40 px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              Simple Process
            </p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              How MediConnect works
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ step, title, description }, idx) => (
              <div key={step} className="relative">
                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute left-[calc(50%+2rem)] top-6 hidden h-px w-[calc(100%-2rem)] bg-border lg:block"
                  />
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-lg">
                    {step}
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section id="testimonials" className="px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              Real Stories
            </p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Loved by patients &amp; doctors
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, rating, text, initials, bg }) => (
              <div
                key={name}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                {/* Stars */}
                <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                      aria-hidden
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${bg} text-xs font-bold text-white`}
                    aria-hidden
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to take charge of your health?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-blue-100/90">
            Join thousands of patients and doctors who trust MediConnect for
            seamless, modern healthcare.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg hover:bg-blue-50 transition-all active:scale-[0.98]"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link
              href="/auth/login"
              className="text-base font-medium text-blue-100 underline-offset-4 hover:text-white hover:underline transition-colors"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
