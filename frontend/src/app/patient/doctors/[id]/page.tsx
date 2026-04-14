"use client";

import { useState, useEffect, useCallback } from "react";
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
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getDoctorById } from "@/lib/api/doctors";
import { getDoctorSlots } from "@/lib/api/slots";
import { getDoctorReviews } from "@/lib/api/reviews";
import { bookAppointment } from "@/lib/api/appointments";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Doctor, Slot, Review } from "@/types";

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

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

function formatTime(iso: string): string {
  try {
    // backend may return "HH:mm:ss" or full ISO
    if (/^\d{2}:\d{2}/.test(iso)) {
      const [h, m] = iso.split(":");
      const d = new Date();
      d.setHours(Number(h), Number(m));
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return iso;
  }
}

// Get next 7 dates for the date picker
function getNext7Days(): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params?.id as string;

  const [doctor, setDoctor]       = useState<Doctor | null>(null);
  const [slots, setSlots]         = useState<Slot[]>([]);
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [loading, setLoading]     = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0] ?? ""
  );
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reason, setReason]       = useState("");
  const [booking, setBooking]     = useState(false);
  const [bookStatus, setBookStatus] = useState<"idle" | "success" | "error">("idle");
  const [bookError, setBookError] = useState("");

  // Active tab
  const [tab, setTab] = useState<"overview" | "slots" | "reviews">("overview");

  // ── Fetch doctor + reviews ───────────────────────────────────────────────────
  useEffect(() => {
    if (!doctorId) return;
    (async () => {
      setLoading(true);
      const [docRes, revRes] = await Promise.allSettled([
        getDoctorById(doctorId),
        getDoctorReviews(doctorId),
      ]);
      if (docRes.status === "fulfilled") setDoctor(docRes.value);
      if (revRes.status === "fulfilled") setReviews(revRes.value ?? []);
      setLoading(false);
    })();
  }, [doctorId]);

  // ── Fetch slots for selected date ────────────────────────────────────────────
  const fetchSlots = useCallback(async () => {
    if (!doctorId) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const res = await getDoctorSlots(doctorId, selectedDate);
      setSlots(Array.isArray(res) ? res : []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [doctorId, selectedDate]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  // ── Book appointment ─────────────────────────────────────────────────────────
  async function handleBook() {
    if (!selectedSlot) return;
    setBooking(true);
    setBookStatus("idle");
    try {
      await bookAppointment({ slotId: selectedSlot.id, reason: reason.trim() || "General consultation" });
      setBookStatus("success");
      setSelectedSlot(null);
      setReason("");
      fetchSlots();
    } catch (err: unknown) {
      setBookStatus("error");
      setBookError(err instanceof Error ? err.message : "Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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

  const specs      = getSpecs(doctor);
  const experience = doctor.experienceYears ?? doctor.experience ?? 0;
  const rating     = doctor.avgRating ?? 0;
  const fee        = doctor.consultationFee ?? 0;
  const fullName   = `${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim();
  const avatarUrl  = getAvatarUrl(doctor);
  const next7Days  = getNext7Days();
  const availableSlots = slots.filter((s) => !s.status || s.status === "available");

  return (
    <PageContainer>
      {/* ── Back link ────────────────────────────────────────────────────── */}
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

        {/* ── Left: Doctor profile card ─────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">

          {/* Hero card */}
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
                    <Image src={avatarUrl} alt={fullName} width={80} height={80} className="h-full w-full object-cover" unoptimized />
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
                  <span key={s} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">{s}</span>
                ))}
              </div>

              {/* Rating */}
              <div className="mt-3 flex items-center gap-1.5">
                <div className="flex">
                  {[1,2,3,4,5].map((n) => (
                    <Star key={n} className={`h-4 w-4 ${n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-800">{rating > 0 ? rating.toFixed(1) : "No ratings"}</span>
                {(doctor.totalReviews ?? 0) > 0 && (
                  <span className="text-xs text-slate-400">({doctor.totalReviews} reviews)</span>
                )}
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <StatBadge icon={<Briefcase className="h-4 w-4 text-blue-600" />} label="Experience" value={experience > 0 ? `${experience} yrs` : "New"} />
                <StatBadge icon={<IndianRupee className="h-4 w-4 text-emerald-600" />} label="Consultation" value={fee > 0 ? `₹${fee.toLocaleString("en-IN")}` : "Free"} />
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
          </div>
        </div>

        {/* ── Right: Tabs ───────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Tab bar */}
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {(["overview", "slots", "reviews"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-all ${
                  tab === t ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t === "slots" ? "Book Slot" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* ── Overview tab ────────────────────────────────────────────── */}
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
                    {(doctor.qualifications ?? (doctor.qualification ? [doctor.qualification] : [])).map((q, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {!doctor.bio && !doctor.qualification && !doctor.qualifications?.length && (
                <p className="text-sm text-slate-400 italic">No additional information provided.</p>
              )}
            </div>
          )}

          {/* ── Book Slot tab ────────────────────────────────────────────── */}
          {tab === "slots" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              {/* Success banner */}
              {bookStatus === "success" && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Appointment booked! You can view it in <Link href="/patient/appointments" className="font-semibold underline">My Appointments</Link>.
                </div>
              )}
              {bookStatus === "error" && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {bookError}
                </div>
              )}

              {/* Date picker */}
              <div>
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Select a date
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {next7Days.map((date) => {
                    const iso = date.toISOString().split("T")[0] ?? "";
                    const isSelected = iso === selectedDate;
                    const isToday = iso === new Date().toISOString().split("T")[0];
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => setSelectedDate(iso)}
                        className={`flex shrink-0 flex-col items-center rounded-xl border px-4 py-2.5 text-sm transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        <span className="text-xs font-medium">
                          {isToday ? "Today" : date.toLocaleDateString("en-IN", { weekday: "short" })}
                        </span>
                        <span className={`text-lg font-bold leading-tight ${isSelected ? "" : "text-slate-800"}`}>
                          {date.getDate()}
                        </span>
                        <span className="text-xs">{date.toLocaleDateString("en-IN", { month: "short" })}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slots grid */}
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-700">
                  Available slots for {formatDate(selectedDate)}
                </p>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="rounded-xl border border-slate-100 bg-slate-50 py-8 text-center text-sm text-slate-400">
                    No available slots for this date. Try another day.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlot((prev) => prev?.id === slot.id ? null : slot)}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                          selectedSlot?.id === slot.id
                            ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {formatTime(slot.startTime)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reason + confirm */}
              {selectedSlot && (
                <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-800">
                    Selected: {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
                  </p>
                  <div className="space-y-1.5">
                    <label htmlFor="reason" className="text-xs font-semibold text-slate-600">
                      Reason for visit <span className="text-slate-400">(optional)</span>
                    </label>
                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Routine check-up, follow-up, new symptoms…"
                      rows={2}
                      className="w-full resize-none rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <button
                    id="confirm-booking-btn"
                    type="button"
                    disabled={booking}
                    onClick={handleBook}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-60"
                  >
                    {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {booking ? "Booking…" : "Confirm Appointment"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Reviews tab ──────────────────────────────────────────────── */}
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
                          {[1,2,3,4,5].map((n) => (
                            <Star key={n} className={`h-3.5 w-3.5 ${n <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(rev.createdAt))}
                        </span>
                      </div>
                      {rev.comment && <p className="mt-2 text-sm text-slate-700">{rev.comment}</p>}
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
// Small stat badge
// ─────────────────────────────────────────────────────────────────────────────

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">{icon}</div>
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}
