"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Star,
  Briefcase,
  IndianRupee,
  FileText,
  Loader2,
  XCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { getAppointmentById, cancelAppointment } from "@/lib/api/appointments";
import { submitReview } from "@/lib/api/reviews";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Appointment } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  pending:     { label: "Pending",     dot: "bg-amber-400",   badge: "bg-amber-100 text-amber-700 border-amber-200" },
  approved:    { label: "Confirmed",   dot: "bg-blue-400",    badge: "bg-blue-100 text-blue-700 border-blue-200" },
  completed:   { label: "Completed",   dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelled:   { label: "Cancelled",   dot: "bg-red-400",     badge: "bg-red-100 text-red-600 border-red-200" },
  rejected:    { label: "Rejected",    dot: "bg-rose-400",    badge: "bg-rose-100 text-rose-700 border-rose-200" },
  rescheduled: { label: "Rescheduled", dot: "bg-purple-400",  badge: "bg-purple-100 text-purple-700 border-purple-200" },
};

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    }).format(new Date(iso));
  } catch { return iso; }
}

function formatTime(iso?: string): string {
  if (!iso) return "—";
  try {
    if (/^\d{2}:\d{2}/.test(iso)) {
      const [h, m] = iso.split(":");
      const d = new Date(); d.setHours(Number(h), Number(m));
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return iso; }
}

function getDoctorInfo(apt: Appointment) {
  const d = apt.doctor as any;
  const firstName = d?.firstName ?? "";
  const lastName  = d?.lastName ?? "";
  const fullName  = `${firstName} ${lastName}`.trim() || "Doctor";
  const spec      = d?.specializations?.[0] ?? d?.specialization ?? "";
  const avatar    = d?.profileImageUrl ?? d?.profileImage ?? null;
  const initials  = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "DR";
  const fee       = Number(d?.consultationFee ?? 0);
  const exp       = d?.experienceYears ?? 0;
  const clinic    = d?.clinicName ?? d?.clinicAddress ?? "";
  return { fullName, spec, avatar, initials, fee, exp, clinic };
}

// ─────────────────────────────────────────────────────────────────────────────
// Review modal
// ─────────────────────────────────────────────────────────────────────────────

function ReviewModal({
  appointmentId,
  onClose,
  onDone,
}: { appointmentId: string; onClose: () => void; onDone: () => void }) {
  const [rating, setRating]   = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await submitReview({ appointmentId, rating, comment: comment.trim() || undefined });
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Leave a Review</h2>
        <p className="mb-5 text-sm text-slate-500">How was your experience?</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star rating */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Rating</label>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star className={`h-8 w-8 transition-all ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200 hover:text-amber-300"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label htmlFor="review-comment" className="text-sm font-semibold text-slate-700">
              Comment <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience…"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" id="submit-review-btn" disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-all">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AppointmentDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading]         = useState(true);
  const [cancelling, setCancelling]   = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [showReview, setShowReview]   = useState(false);
  const [reviewed, setReviewed]       = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await getAppointmentById(id);
      setAppointment(res);
    } catch {
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleCancel() {
    if (!appointment || !confirm("Cancel this appointment?")) return;
    setCancelling(true);
    setCancelError("");
    try {
      const updated = await cancelAppointment(appointment.id);
      setAppointment(updated);
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : "Failed to cancel.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </PageContainer>
    );
  }

  if (!appointment) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <AlertCircle className="h-12 w-12 text-slate-300" />
          <p className="font-semibold text-slate-800">Appointment not found.</p>
          <Link href="/patient/appointments" className="text-sm text-blue-600 hover:underline">← Back to appointments</Link>
        </div>
      </PageContainer>
    );
  }

  const cfg    = STATUS_CONFIG[appointment.status] ?? STATUS_CONFIG.pending!;
  const doc    = getDoctorInfo(appointment);
  const slot   = appointment.slot as any;
  const isCancellable = appointment.status === "pending" || appointment.status === "approved";
  const isCompleted   = appointment.status === "completed";

  return (
    <>
      {showReview && (
        <ReviewModal
          appointmentId={appointment.id}
          onClose={() => setShowReview(false)}
          onDone={() => { setShowReview(false); setReviewed(true); }}
        />
      )}

      <PageContainer>
        {/* Back */}
        <div className="mb-6">
          <button type="button" onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to appointments
          </button>
        </div>

        <div className="mx-auto max-w-2xl space-y-5">

          {/* Status banner */}
          <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${cfg.badge}`}>
            <div className={`h-3 w-3 shrink-0 rounded-full ${cfg.dot}`} />
            <div>
              <p className="font-semibold">Appointment {cfg.label}</p>
              <p className="text-xs opacity-75">ID: {appointment.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          {/* Doctor card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                {doc.avatar ? (
                  <Image src={doc.avatar} alt={doc.fullName} width={64} height={64} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-extrabold text-white">
                    {doc.initials}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">Dr. {doc.fullName}</p>
                {doc.spec && <p className="text-sm text-slate-500">{doc.spec}</p>}
                <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-400">
                  {doc.exp > 0 && (
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{doc.exp} yrs exp.</span>
                  )}
                  {doc.fee > 0 && (
                    <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />₹{doc.fee.toLocaleString("en-IN")}</span>
                  )}
                  {doc.clinic && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{doc.clinic}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Appointment details */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Appointment Details</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                {
                  icon: <Calendar className="h-4 w-4 text-blue-500" />,
                  label: "Date & Time",
                  value: formatDateTime(slot?.date ?? slot?.startTime ?? (appointment as any).scheduledAt),
                },
                ...(slot?.startTime ? [{
                  icon: <Clock className="h-4 w-4 text-purple-500" />,
                  label: "Time Slot",
                  value: `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`,
                }] : []),
                {
                  icon: <FileText className="h-4 w-4 text-slate-400" />,
                  label: "Reason",
                  value: appointment.reason || "General consultation",
                },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 px-5 py-4">
                  <div className="mt-0.5 shrink-0">{icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor's notes (if any) */}
          {(appointment as any).notes && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                <FileText className="h-4 w-4" /> Doctor&apos;s Notes
              </h2>
              <p className="text-sm leading-relaxed text-slate-700">{(appointment as any).notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {isCancellable && (
              <button
                id="cancel-appointment-btn"
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-all"
              >
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                {cancelling ? "Cancelling…" : "Cancel Appointment"}
              </button>
            )}

            {isCompleted && !reviewed && (
              <button
                id="leave-review-btn"
                type="button"
                onClick={() => setShowReview(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-all"
              >
                <Star className="h-4 w-4" /> Leave a Review
              </button>
            )}

            {isCompleted && reviewed && (
              <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Review submitted!
              </div>
            )}

            <Link
              href={`/patient/doctors/${(appointment.doctor as any)?.id ?? (appointment as any).doctorId}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              View Doctor Profile
            </Link>
          </div>

          {cancelError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {cancelError}
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
