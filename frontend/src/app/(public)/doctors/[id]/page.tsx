import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck, Star, Clock, IndianRupee, GraduationCap,
  Stethoscope, BookOpen, CalendarDays, ChevronRight,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { BookButton, BookButtonSidebar } from "@/components/features/BookButton";

// ─────────────────────────────────────────────────────────────────────────────
// Types — exact backend response shapes
// ─────────────────────────────────────────────────────────────────────────────

interface BackendDoctor {
  id: string;
  firstName: string;
  lastName: string;
  specializations: string[];
  qualification?: string;
  experienceYears?: number;
  bio?: string;
  profileImageUrl?: string;
  consultationFee?: string | number;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface BackendReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  patient: { id: string; firstName: string; lastName: string; profileImageUrl?: string };
  appointment?: { id: string; scheduledAt: string };
}

interface BackendSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data fetching helpers
// ─────────────────────────────────────────────────────────────────────────────

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/v1";

async function getDoctor(id: string): Promise<BackendDoctor | null> {
  try {
    const res = await fetch(`${BASE}/doctors/${id}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as BackendDoctor;
  } catch {
    return null;
  }
}

/** Reviews require auth — best-effort, empty on failure */
async function getReviews(doctorId: string): Promise<BackendReview[]> {
  try {
    const res = await fetch(`${BASE}/reviews/doctor/${doctorId}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      credentials: "include" as RequestCredentials,
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data as BackendReview[]) ?? [];
  } catch {
    return [];
  }
}

/** Slots require auth — best-effort, empty on failure */
async function getSlots(doctorId: string): Promise<BackendSlot[]> {
  try {
    const res = await fetch(`${BASE}/slots/doctor/${doctorId}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      credentials: "include" as RequestCredentials,
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data as BackendSlot[]) ?? [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const doctor = await getDoctor(id);
  if (!doctor) return { title: "Doctor Not Found | MediConnect" };
  return {
    title: `Dr. ${doctor.firstName} ${doctor.lastName} | MediConnect`,
    description: doctor.bio?.slice(0, 160) ?? `${doctor.specializations.join(", ")} specialist with ${doctor.experienceYears ?? "several"} years of experience.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "from-blue-500 to-blue-700",
  "from-emerald-500 to-emerald-700",
  "from-violet-500 to-violet-700",
  "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-600",
];
function avatarGradient(name: string) {
  const code = (name.charCodeAt(0) ?? 0) + (name.charCodeAt(1) ?? 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length]!;
}

function avgRating(reviews: BackendReview[]) {
  if (!reviews.length) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return avg.toFixed(1);
}

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return dateStr; }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  } catch { return dateStr; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DoctorProfilePage({ params }: PageProps) {
  const { id } = await params;

  const [doctor, reviews, slots] = await Promise.all([
    getDoctor(id),
    getReviews(id),
    getSlots(id),
  ]);

  if (!doctor) notFound();

  const fullName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
  const initials = `${doctor.firstName[0] ?? "D"}${doctor.lastName[0] ?? "R"}`.toUpperCase();
  const gradient = avatarGradient(doctor.firstName);
  const rating = avgRating(reviews);
  const fee = doctor.consultationFee
    ? Number(doctor.consultationFee).toLocaleString("en-IN")
    : null;

  // Group upcoming slots by date (next 5 dates)
  const now = new Date();
  const upcomingSlots = slots
    .filter((s) => new Date(s.date) >= now && !("isBooked" in s))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 15);

  const slotsByDate = upcomingSlots.reduce<Record<string, BackendSlot[]>>((acc, s) => {
    const day = s.date.split("T")[0]!;
    (acc[day] ??= []).push(s);
    return acc;
  }, {});

  const bookPath = `/doctors/${id}/book`;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero banner ────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 50%, #0a2a5e 100%)" }}
      >
        {/* Glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 right-20 h-80 w-80 rounded-full opacity-20 blur-[120px]"
            style={{ background: "radial-gradient(circle,#3b82f6,transparent)" }} />
          <div className="absolute bottom-0 left-10 h-60 w-60 rounded-full opacity-10 blur-[80px]"
            style={{ background: "radial-gradient(circle,#0ea5e9,transparent)" }} />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
            {/* Avatar */}
            <div className="relative shrink-0">
              {doctor.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doctor.profileImageUrl}
                  alt={fullName}
                  className="h-32 w-32 rounded-3xl object-cover ring-4 ring-white/20"
                />
              ) : (
                <div className={`flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br ${gradient} text-4xl font-bold text-white ring-4 ring-white/20`}>
                  {initials}
                </div>
              )}
              {/* Verified */}
              <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 ring-3 ring-white shadow-lg">
                <BadgeCheck className="h-4.5 w-4.5 text-white" size={18} />
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{fullName}</h1>
              <p className="mt-1 text-sm font-medium text-blue-300">
                {doctor.specializations.join(" · ")}
              </p>
              {doctor.qualification && (
                <p className="mt-1 text-xs text-slate-400">{doctor.qualification}</p>
              )}

              {/* Stat pills */}
              <div className="mt-4 flex flex-wrap gap-3">
                {doctor.experienceYears !== undefined && (
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm">
                    <Clock className="h-4 w-4 text-blue-300" />
                    <span className="text-sm font-semibold text-white">{doctor.experienceYears} yrs</span>
                    <span className="text-xs text-slate-400">experience</span>
                  </div>
                )}
                {rating && (
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-white">{rating}</span>
                    <span className="text-xs text-slate-400">({reviews.length} reviews)</span>
                  </div>
                )}
                {fee && (
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm">
                    <IndianRupee className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-white">₹{fee}</span>
                    <span className="text-xs text-slate-400">per visit</span>
                  </div>
                )}
              </div>
            </div>

            {/* Book CTA */}
            <div className="shrink-0">
              <BookButton doctorId={id} size="lg" />
              <p className="mt-2 text-center text-xs text-slate-500">
                Instant confirmation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* ── Left column ──────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* About */}
            {doctor.bio && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeader icon={BookOpen} title="About" />
                <p className="text-sm leading-relaxed text-slate-600">{doctor.bio}</p>
              </section>
            )}

            {/* Specializations */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeader icon={Stethoscope} title="Specializations" />
              <div className="flex flex-wrap gap-2">
                {doctor.specializations.map((s) => (
                  <span key={s} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                    {s}
                  </span>
                ))}
              </div>
            </section>

            {/* Qualification */}
            {doctor.qualification && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeader icon={GraduationCap} title="Qualifications" />
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                    <GraduationCap className="h-5 w-5 text-violet-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-800">{doctor.qualification}</p>
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between mb-5">
                <SectionHeader icon={Star} title={`Reviews (${reviews.length})`} />
                {rating && (
                  <div className="flex flex-col items-end">
                    <span className="text-3xl font-extrabold text-slate-900">{rating}</span>
                    <StarRow rating={Number(rating)} />
                    <span className="text-xs text-slate-400 mt-1">{reviews.length} reviews</span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <Star className="h-7 w-7 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">No reviews yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Reviews appear after completed appointments. Sign in to see reviews.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((rev) => {
                    const patientName = `${rev.patient.firstName} ${rev.patient.lastName}`;
                    const patientInitials = `${rev.patient.firstName[0] ?? "P"}${rev.patient.lastName[0] ?? ""}`.toUpperCase();
                    return (
                      <article key={rev.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                          {/* Patient avatar */}
                          {rev.patient.profileImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={rev.patient.profileImageUrl}
                              alt={patientName}
                              className="h-10 w-10 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                              {patientInitials}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-900">{patientName}</p>
                              <time className="text-xs text-slate-400">{formatDate(rev.createdAt)}</time>
                            </div>
                            <StarRow rating={rev.rating} />
                            {rev.comment && (
                              <p className="mt-2 text-sm leading-relaxed text-slate-600">{rev.comment}</p>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  {reviews.length > 5 && (
                    <p className="text-center text-xs text-slate-400 pt-2">
                      + {reviews.length - 5} more reviews
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ── Right sidebar ─────────────────────────────────────────── */}
          <div className="w-full space-y-5 lg:w-80 lg:shrink-0">

            {/* Quick info card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Quick Info</h3>

              <div className="space-y-3">
                {doctor.experienceYears !== undefined && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Experience</p>
                      <p className="text-sm font-semibold text-slate-900">{doctor.experienceYears} years</p>
                    </div>
                  </div>
                )}
                {fee && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                      <IndianRupee className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Consultation Fee</p>
                      <p className="text-sm font-semibold text-slate-900">₹{fee} per visit</p>
                    </div>
                  </div>
                )}
                {rating && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Patient Rating</p>
                      <p className="text-sm font-semibold text-slate-900">{rating} / 5.0</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
                    <Stethoscope className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Primary Specialty</p>
                    <p className="text-sm font-semibold text-slate-900">{doctor.specializations[0] ?? "—"}</p>
                  </div>
                </div>
              </div>

              {/* Book button */}
              <BookButtonSidebar doctorId={id} />
            </div>

            {/* Availability preview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader icon={CalendarDays} title="Available Slots" />

              {upcomingSlots.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <CalendarDays className="mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-500">
                    No upcoming slots available
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    <Link href={ROUTES.LOGIN} className="text-blue-600 hover:underline">Sign in</Link> to see all slots
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(slotsByDate).slice(0, 4).map(([date, daySlots]) => (
                    <div key={date}>
                      <p className="mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                        {formatDate(date)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {daySlots.slice(0, 6).map((slot) => (
                          <Link
                            key={slot.id}
                            href={bookPath}
                            className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            {formatTime(slot.startTime)}
                          </Link>
                        ))}
                        {daySlots.length > 6 && (
                          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
                            +{daySlots.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <Link
                    href={bookPath}
                    className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    See all & book
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Back to listing */}
            <Link
              href="/doctors"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
            >
              ← Back to all doctors
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
