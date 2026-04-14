"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Calendar, Clock, FileText,
  Loader2, CheckCircle2, XCircle, AlertCircle,
  User, NotebookPen, Save, Phone,
  DropletIcon, PersonStanding, Stethoscope,
  ShieldAlert,
} from "lucide-react";
import { getAppointmentById, updateAppointmentStatus, addAppointmentNotes } from "@/lib/api/appointments";
import { PageContainer } from "@/components/layout/PageContainer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Appointment } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Status config — keys UPPERCASE to match Prisma enum
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string; bg: string }> = {
  PENDING:     { label: "Pending",     dot: "bg-amber-400",   badge: "text-amber-700",   bg: "border-amber-200 bg-amber-50" },
  APPROVED:    { label: "Confirmed",   dot: "bg-blue-500",    badge: "text-blue-700",    bg: "border-blue-200 bg-blue-50" },
  COMPLETED:   { label: "Completed",   dot: "bg-emerald-500", badge: "text-emerald-700", bg: "border-emerald-200 bg-emerald-50" },
  CANCELLED:   { label: "Cancelled",   dot: "bg-red-400",     badge: "text-red-700",     bg: "border-red-200 bg-red-50" },
  REJECTED:    { label: "Rejected",    dot: "bg-rose-400",    badge: "text-rose-700",    bg: "border-rose-200 bg-rose-50" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso?: string | Date): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }).format(new Date(iso as string));
  } catch { return String(iso); }
}

function formatTime(iso?: string | Date): string {
  if (!iso) return "—";
  try {
    const s = String(iso);
    if (/^\d{2}:\d{2}/.test(s)) {
      const [h, m] = s.split(":");
      const d = new Date(); d.setHours(Number(h), Number(m));
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    return new Date(s).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return String(iso); }
}

function calcAge(dateOfBirth?: Date | string | null): number | null {
  if (!dateOfBirth) return null;
  try {
    return Math.floor((Date.now() - new Date(dateOfBirth as string).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  } catch { return null; }
}

function getPatientInfo(apt: Appointment) {
  const p = apt.patient as any;
  const firstName  = p?.firstName ?? "";
  const lastName   = p?.lastName ?? "";
  const fullName   = `${firstName} ${lastName}`.trim() || "Unknown Patient";
  const initials   = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "P";
  const avatar     = p?.profileImageUrl ?? p?.profileImage ?? null;
  const age        = calcAge(p?.dateOfBirth);
  const phone      = p?.phone ?? p?.user?.phone ?? null;
  const blood      = p?.bloodGroup ?? null;
  const gender     = p?.gender ?? null;
  const patientId  = p?.id ?? (apt as any).patientId ?? null;
  return { fullName, initials, avatar, age, phone, blood, gender, patientId };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function DoctorAppointmentDetailPage() {
  const { id } = useParams() as { id: string };
  const router  = useRouter();

  const [appointment, setAppointment]       = useState<Appointment | null>(null);
  const [loading, setLoading]               = useState(true);
  const [fetchError, setFetchError]         = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  // doctorNotes is the correct field name from the backend
  const [notes, setNotes]                   = useState("");
  const [savingNotes, setSavingNotes]       = useState(false);
  const [notesSaved, setNotesSaved]         = useState(false);
  const [actionError, setActionError]       = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getAppointmentById(id);
        if (!cancelled) {
          setAppointment(res);
          // Pull doctorNotes from response — the API returns this field on the detail endpoint
          setNotes((res as any).doctorNotes ?? "");
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : "Failed to load appointment.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // ── Status actions ──────────────────────────────────────────────────────────

  async function handleStatus(status: "approved" | "rejected" | "completed", rejectionReason?: string) {
    if (!appointment) return;
    setUpdatingStatus(status);
    setActionError("");
    try {
      const updated = await updateAppointmentStatus(appointment.id, status, rejectionReason);
      setAppointment((prev) => prev ? { ...prev, status: (updated as any).status } : prev);
      toast.success(`Appointment ${status === "approved" ? "confirmed" : status}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed.";
      setActionError(msg);
      toast.error(msg);
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleReject() {
    const reason = prompt("Reason for rejection (required):");
    if (reason === null) return; // user cancelled
    if (!reason.trim()) { toast.error("A rejection reason is required."); return; }
    await handleStatus("rejected", reason.trim());
  }

  // ── Notes save ──────────────────────────────────────────────────────────────

  async function handleSaveNotes(e: React.FormEvent) {
    e.preventDefault();
    if (!appointment) return;
    setSavingNotes(true);
    setNotesSaved(false);
    setActionError("");
    try {
      // addAppointmentNotes calls PUT /appointments/:id/notes (now correctly registered on backend)
      const updated = await addAppointmentNotes(appointment.id, notes);
      // Backend returns { id, status, doctorNotes, scheduledAt, … }
      setAppointment((prev) => prev ? { ...prev, ...(updated as any) } : prev);
      setNotesSaved(true);
      toast.success("Clinical notes saved.");
      setTimeout(() => setNotesSaved(false), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save notes.";
      setActionError(msg);
      toast.error(msg);
    } finally {
      setSavingNotes(false);
    }
  }

  // ── Loading / error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-28" aria-label="Loading appointment">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </PageContainer>
    );
  }

  if (fetchError || !appointment) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-400" aria-hidden="true" />
          </div>
          <div>
            <p className="font-bold text-slate-800">Appointment not found</p>
            <p className="mt-1 text-sm text-slate-500">{fetchError || "This appointment may have been deleted or you don't have access."}</p>
          </div>
          <Link
            href="/doctor/appointments"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            ← Back to Appointments
          </Link>
        </div>
      </PageContainer>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const statusKey  = String(appointment.status).toUpperCase();
  const cfg        = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.PENDING!;
  const pt         = getPatientInfo(appointment);
  const slot       = appointment.slot as any;
  const isPending  = statusKey === "PENDING";
  const isApproved = statusKey === "APPROVED";
  const isTerminal = statusKey === "COMPLETED" || statusKey === "CANCELLED" || statusKey === "REJECTED";

  return (
    <PageContainer>
      {/* ── Back nav ──────────────────────────────────────────────────── */}
      <div className="mb-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          aria-label="Go back to appointments list"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to appointments
        </button>
      </div>

      <div className="mx-auto max-w-2xl space-y-5">

        {/* ── Status banner ─────────────────────────────────────────────── */}
        <div
          className={cn("flex items-center gap-4 rounded-2xl border px-5 py-4", cfg.bg)}
          role="status"
          aria-label={`Appointment status: ${cfg.label}`}
        >
          <div className={cn("h-3 w-3 shrink-0 rounded-full", cfg.dot)} aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className={cn("font-bold", cfg.badge)}>Appointment {cfg.label}</p>
            <p className="mt-0.5 text-xs opacity-70">
              ID: {appointment.id.slice(0, 8).toUpperCase()}
              {(appointment as any).rejectionReason && (
                <> · Reason: {(appointment as any).rejectionReason}</>
              )}
            </p>
          </div>
          {isTerminal && (
            <span className="shrink-0">
              {statusKey === "COMPLETED"
                ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                : <XCircle className="h-5 w-5 text-red-500" />}
            </span>
          )}
        </div>

        {/* ── Patient card ───────────────────────────────────────────────── */}
        <section aria-label="Patient information">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                {pt.avatar ? (
                  <Image
                    src={pt.avatar}
                    alt={pt.fullName}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-extrabold text-white"
                    aria-hidden="true"
                  >
                    {pt.initials}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-lg">{pt.fullName}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {pt.age !== null && (
                    <span className="flex items-center gap-1">
                      <PersonStanding className="h-3.5 w-3.5" aria-hidden="true" />
                      {pt.age} yrs · {pt.gender ? <span className="capitalize">{pt.gender.toLowerCase()}</span> : null}
                    </span>
                  )}
                  {pt.blood && (
                    <span className="flex items-center gap-1">
                      <DropletIcon className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
                      {pt.blood}
                    </span>
                  )}
                  {pt.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {pt.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* View patient link */}
              {pt.patientId && (
                <Link
                  href={`/doctor/patients/${pt.patientId}`}
                  id="view-patient-profile"
                  className="shrink-0 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  aria-label={`View full profile for ${pt.fullName}`}
                >
                  <User className="h-3.5 w-3.5" />
                  View Patient
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ── Appointment details card ───────────────────────────────────── */}
        <section aria-label="Appointment details">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
                Appointment Details
              </h2>
            </div>
            <dl className="divide-y divide-slate-100">
              {[
                {
                  icon: <Calendar className="h-4 w-4 text-blue-500" aria-hidden="true" />,
                  label: "Date",
                  value: formatDate(slot?.date ?? (appointment as any).scheduledAt),
                },
                ...(slot?.startTime ? [{
                  icon: <Clock className="h-4 w-4 text-purple-500" aria-hidden="true" />,
                  label: "Time",
                  value: `${formatTime(slot.startTime)}${slot.endTime ? ` – ${formatTime(slot.endTime)}` : ""}`,
                }] : []),
                {
                  icon: <FileText className="h-4 w-4 text-slate-400" aria-hidden="true" />,
                  label: "Reason",
                  value: appointment.reason || "General consultation",
                },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-4 px-5 py-4">
                  <dt className="mt-0.5 shrink-0">{icon}</dt>
                  <div>
                    <p className="text-xs font-medium text-slate-400">{label}</p>
                    <dd className="mt-0.5 text-sm font-medium text-slate-800">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Action buttons ─────────────────────────────────────────────── */}
        {(isPending || isApproved) && (
          <section aria-label="Appointment actions">
            <div className="flex flex-wrap gap-3">
              {isPending && (
                <>
                  <button
                    type="button"
                    id="confirm-appointment-btn"
                    disabled={!!updatingStatus}
                    onClick={() => handleStatus("approved")}
                    aria-label="Confirm this appointment"
                    className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {updatingStatus === "approved"
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <CheckCircle2 className="h-4 w-4" />}
                    Confirm Appointment
                  </button>
                  <button
                    type="button"
                    id="reject-appointment-btn"
                    disabled={!!updatingStatus}
                    onClick={handleReject}
                    aria-label="Reject this appointment"
                    className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 disabled:opacity-60"
                  >
                    {updatingStatus === "rejected"
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <XCircle className="h-4 w-4" />}
                    Reject
                  </button>
                </>
              )}
              {isApproved && (
                <button
                  type="button"
                  id="complete-appointment-btn"
                  disabled={!!updatingStatus}
                  onClick={() => handleStatus("completed")}
                  aria-label="Mark this appointment as completed"
                  className="flex flex-1 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-60"
                >
                  {updatingStatus === "completed"
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <CheckCircle2 className="h-4 w-4" />}
                  Mark as Completed
                </button>
              )}
            </div>
          </section>
        )}

        {/* ── Action error ──────────────────────────────────────────────── */}
        {actionError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
            <p className="text-sm text-red-700">{actionError}</p>
          </div>
        )}

        {/* ── Clinical notes ────────────────────────────────────────────── */}
        <section aria-label="Clinical notes">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
              <NotebookPen className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Clinical Notes
            </h2>
            <form onSubmit={handleSaveNotes} className="space-y-3" aria-label="Save clinical notes form">
              <textarea
                id="clinical-notes-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Add diagnosis, prescriptions, follow-up instructions, observations…"
                aria-label="Clinical notes text"
                className="input-field resize-none leading-relaxed"
                maxLength={5000}
              />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {notesSaved && (
                    <span
                      role="status"
                      className="flex items-center gap-1.5 text-xs font-medium text-emerald-600"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Notes saved successfully
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">
                    {notes.length}/5000
                  </span>
                </div>
                <button
                  id="save-notes-btn"
                  type="submit"
                  disabled={savingNotes}
                  aria-label="Save clinical notes"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-900 disabled:opacity-60"
                >
                  {savingNotes
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Save className="h-4 w-4" />}
                  Save Notes
                </button>
              </div>
            </form>
          </div>
        </section>

      </div>
    </PageContainer>
  );
}
