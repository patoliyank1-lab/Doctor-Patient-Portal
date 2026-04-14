"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Briefcase,
  IndianRupee,
  MapPin,
  Phone,
  BookOpen,
  MessageSquare,
  Loader2,
  CalendarDays,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { getDoctorById } from "@/lib/api/doctors";
import { getDoctorReviews } from "@/lib/api/reviews";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Doctor, Review } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(first?: string, last?: string) {
  return `${(first ?? "").charAt(0)}${(last ?? "").charAt(0)}`.toUpperCase() || "DR";
}

function getAvatarUrl(doc: Doctor): string | null {
  return doc.profileImageUrl ?? doc.profileImage ?? null;
}

function getSpecs(doc: Doctor): string[] {
  if (doc.specializations?.length) return doc.specializations;
  if (doc.specialization) return [doc.specialization];
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function DoctorDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const doctorId = params?.id as string;

  // ── State ────────────────────────────────────────────────────────────────────
  const [doctor, setDoctor]         = useState<Doctor | null>(null);
  const [reviews, setReviews]       = useState<Review[]>([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [tab, setTab]               = useState<"overview" | "reviews">("overview");

  // ── Fetch doctor + reviews ───────────────────────────────────────────────────
  useEffect(() => {
    if (!doctorId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const [docRes, revRes] = await Promise.allSettled([
          getDoctorById(doctorId),
          getDoctorReviews(doctorId),
        ]);

        if (cancelled) return;

        if (docRes.status === "fulfilled") {
          setDoctor(docRes.value);
        } else {
          const err = docRes.reason as Error | undefined;
          setFetchError(err?.message ?? "Failed to load doctor profile.");
        }

        if (revRes.status === "fulfilled") {
          setReviews(revRes.value ?? []);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : "Failed to load doctor profile.");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [doctorId]);

  // ── Guard renders ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </PageContainer>
    );
  }

  if (fetchError) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-base font-semibold text-slate-800">Failed to load doctor profile</p>
          <p className="text-sm text-slate-500">{fetchError}</p>
          <Link href="/patient/doctors" className="text-sm text-blue-600 hover:underline">
            ← Back to all doctors
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (!doctor) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="text-lg font-semibold text-slate-800">Doctor not found.</p>
          <Link href="/patient/doctors" className="text-sm text-blue-600 hover:underline">
            ← Back to all doctors
          </Link>
        </div>
      </PageContainer>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const specs      = getSpecs(doctor);
  const experience = doctor.experienceYears ?? doctor.experience ?? 0;
  const rating     = doctor.avgRating ?? 0;
  const fee        = doctor.consultationFee ?? 0;
  const fullName   = `${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim();
  const avatarUrl  = getAvatarUrl(doctor);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <PageContainer>
      {/* ── Back link ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to doctors
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">

        {/* ── Left: Doctor profile card ───────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Banner */}
            <div
              className="h-24"
              style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 55%, #0a2a5e 100%)" }}
            />
            <div className="px-5 pb-5">
              <div className="-mt-10 mb-4">
                <div className="h-20 w-20 overflow-hidden rounded-2xl ring-4 ring-white shadow-lg">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={fullName}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-extrabold text-white">
                      {getInitials(doctor.firstName, doctor.lastName)}
                    </div>
                  )}
                </div>
              </div>

              <h1 className="text-xl font-bold text-slate-900">Dr. {fullName}</h1>
              <div className="mt-1 flex flex-wrap gap-1">
                {specs.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Rating */}
              <div className="mt-3 flex items-center gap-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-4 w-4 ${
                        n <= Math.round(rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  {rating > 0 ? rating.toFixed(1) : "No ratings"}
                </span>
                {(doctor.totalReviews ?? 0) > 0 && (
                  <span className="text-xs text-slate-400">
                    ({doctor.totalReviews} reviews)
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <StatBadge
                  icon={<Briefcase className="h-4 w-4 text-blue-600" />}
                  label="Experience"
                  value={experience > 0 ? `${experience} yrs` : "New"}
                />
                <StatBadge
                  icon={<IndianRupee className="h-4 w-4 text-emerald-600" />}
                  label="Consultation"
                  value={fee > 0 ? `₹${fee.toLocaleString("en-IN")}` : "Free"}
                />
              </div>
            </div>

            {/* Contact */}
            {(doctor.phone || doctor.clinicName || doctor.clinicAddress) && (
              <div className="border-t border-slate-100 px-5 py-4 space-y-2.5">
                {doctor.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {doctor.phone}
                  </div>
                )}
                {(doctor.clinicName || doctor.clinicAddress) && (
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>{doctor.clinicName ?? doctor.clinicAddress}</span>
                  </div>
                )}
              </div>
            )}

            {/* Book Appointment CTA */}
            <div className="border-t border-slate-100 px-5 py-4">
              <Link
                href={`/patient/doctors/${doctorId}/book`}
                id="book-appointment-btn"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
              >
                <CalendarDays className="h-4 w-4" />
                Book Appointment
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Right: Tabs ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Tab bar — only Overview and Reviews; Book goes to /book page */}
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {(["overview", "reviews"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-all ${
                  tab === t
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
            {/* Book Slot — navigates to the dedicated booking page */}
            <Link
              href={`/patient/doctors/${doctorId}/book`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-slate-500 transition-all hover:bg-blue-50 hover:text-blue-700"
            >
              <CalendarDays className="h-4 w-4" />
              Book Slot
            </Link>
          </div>

          {/* ── Overview tab ──────────────────────────────────────────────── */}
          {tab === "overview" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              {doctor.bio && (
                <section>
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                    <BookOpen className="h-4 w-4" /> About
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-700">{doctor.bio}</p>
                </section>
              )}
              {(doctor.qualifications?.length || doctor.qualification) && (
                <section>
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                    <BookOpen className="h-4 w-4" /> Qualifications
                  </h2>
                  <ul className="space-y-1">
                    {(doctor.qualifications ?? (doctor.qualification ? [doctor.qualification] : [])).map(
                      (q, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          {q}
                        </li>
                      )
                    )}
                  </ul>
                </section>
              )}
              {!doctor.bio && !doctor.qualification && !doctor.qualifications?.length && (
                <p className="text-sm text-slate-400 italic">No additional information provided.</p>
              )}

              {/* Inline CTA to book */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-blue-900">Ready to book an appointment?</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Choose a date and available slot that works for you.
                  </p>
                </div>
                <Link
                  href={`/patient/doctors/${doctorId}/book`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
                >
                  <CalendarDays className="h-4 w-4" />
                  Book Now
                </Link>
              </div>
            </div>
          )}

          {/* ── Reviews tab ───────────────────────────────────────────────── */}
          {tab === "reviews" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-800">
                  Patient Reviews ({reviews.length})
                </h2>
              </div>
              {reviews.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400 italic">
                  No reviews yet. Be the first to review!
                </p>
              ) : (
                <ul className="space-y-4">
                  {reviews.map((rev) => (
                    <li key={rev.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`h-3.5 w-3.5 ${
                                n <= rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Intl.DateTimeFormat("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(rev.createdAt))}
                        </span>
                      </div>
                      {rev.comment && (
                        <p className="mt-2 text-sm text-slate-700">{rev.comment}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
        {icon}
      </div>
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}
