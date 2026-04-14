"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Calendar, Clock, MapPin, FileText,
  Loader2, CheckCircle2, XCircle, AlertCircle,
  User, NotebookPen, Save,
} from "lucide-react";
import { getAppointmentById, updateAppointmentStatus, addAppointmentNotes } from "@/lib/api/appointments";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Appointment } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  pending:     { label: "Pending",     badge: "bg-amber-100 text-amber-700 border-amber-200",   dot: "bg-amber-400" },
  approved:    { label: "Confirmed",   badge: "bg-blue-100 text-blue-700 border-blue-200",     dot: "bg-blue-400" },
  completed:   { label: "Completed",   badge: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  cancelled:   { label: "Cancelled",   badge: "bg-red-100 text-red-600 border-red-200",        dot: "bg-red-400" },
  rejected:    { label: "Rejected",    badge: "bg-rose-100 text-rose-700 border-rose-200",     dot: "bg-rose-400" },
  rescheduled: { label: "Rescheduled", badge: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-400" },
};

function formatDateTime(iso?: string) {
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

function getPatientInfo(apt: Appointment) {
  const p  = apt.patient as any;
  const firstName = p?.firstName ?? "";
  const lastName  = p?.lastName ?? "";
  const fullName  = `${firstName} ${lastName}`.trim() || "Patient";
  const age       = p?.dateOfBirth
    ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;
  const avatar  = p?.profileImageUrl ?? p?.profileImage ?? null;
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "P";
  const phone    = p?.phone ?? p?.user?.phone ?? null;
  const blood    = p?.bloodGroup ?? null;
  const gender   = p?.gender ?? null;
  const patientId = p?.id ?? (apt as any).patientId ?? null;
  return { fullName, age, avatar, initials, phone, blood, gender, patientId };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DoctorAppointmentDetailPage() {
  const { id } = useParams() as { id: string };
  const router  = useRouter();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading]         = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [notes, setNotes]             = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved]   = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getAppointmentById(id);
        setAppointment(res);
        setNotes((res as any).notes ?? "");
      } catch { setAppointment(null); }
      finally { setLoading(false); }
    })();
  }, [id]);

  async function handleStatus(status: "approved" | "rejected" | "completed") {
    if (!appointment) return;
    const labels: Record<string, string> = { approved: "Confirm", rejected: "Reject", completed: "Complete" };
    if (!confirm(`${labels[status]} this appointment?`)) return;
    setUpdatingStatus(status);
    setActionError("");
    try {
      const updated = await updateAppointmentStatus(appointment.id, status);
      setAppointment(updated);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally { setUpdatingStatus(null); }
  }

  async function handleSaveNotes(e: React.FormEvent) {
    e.preventDefault();
    if (!appointment) return;
    setSavingNotes(true);
    setNotesSaved(false);
    try {
      const updated = await addAppointmentNotes(appointment.id, notes);
      setAppointment(updated);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to save notes.");
    } finally { setSavingNotes(false); }
  }

  if (loading) {
    return <PageContainer><div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div></PageContainer>;
  }
  if (!appointment) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <AlertCircle className="h-12 w-12 text-slate-300" />
          <p className="font-semibold text-slate-800">Appointment not found.</p>
          <Link href="/doctor/appointments" className="text-sm text-blue-600 hover:underline">← Back</Link>
        </div>
      </PageContainer>
    );
  }

  const cfg    = STATUS_CONFIG[appointment.status] ?? STATUS_CONFIG.pending!;
  const pt     = getPatientInfo(appointment);
  const slot   = appointment.slot as any;
  const isPending  = appointment.status === "pending";
  const isApproved = appointment.status === "approved";

  return (
    <PageContainer>
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

        {/* Patient card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
              {pt.avatar ? (
                <Image src={pt.avatar} alt={pt.fullName} width={64} height={64} className="h-full w-full object-cover" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800 text-xl font-extrabold text-white">
                  {pt.initials}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900">{pt.fullName}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                {pt.age && <span>{pt.age} yrs</span>}
                {pt.gender && <span className="capitalize">{pt.gender}</span>}
                {pt.blood && <span>Blood: {pt.blood}</span>}
                {pt.phone && <span>{pt.phone}</span>}
              </div>
            </div>
            {pt.patientId && (
              <Link href={`/doctor/patients/${pt.patientId}`}
                className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all">
                <User className="inline h-3.5 w-3.5 mr-1" />View Patient
              </Link>
            )}
          </div>
        </div>

        {/* Appointment details */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Appointment Details</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { icon: <Calendar className="h-4 w-4 text-blue-500" />, label: "Date", value: formatDateTime(slot?.date ?? slot?.startTime ?? (appointment as any).scheduledAt) },
              ...(slot?.startTime ? [{ icon: <Clock className="h-4 w-4 text-purple-500" />, label: "Time", value: `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}` }] : []),
              { icon: <FileText className="h-4 w-4 text-slate-400" />, label: "Reason", value: appointment.reason || "General consultation" },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 px-5 py-4">
                <div className="mt-0.5 shrink-0">{icon}</div>
                <div>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        {(isPending || isApproved) && (
          <div className="flex flex-wrap gap-3">
            {isPending && (
              <>
                <button type="button" disabled={!!updatingStatus} onClick={() => handleStatus("approved")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-all">
                  {updatingStatus === "approved" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Confirm
                </button>
                <button type="button" disabled={!!updatingStatus} onClick={() => handleStatus("rejected")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 transition-all">
                  {updatingStatus === "rejected" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject
                </button>
              </>
            )}
            {isApproved && (
              <button type="button" disabled={!!updatingStatus} onClick={() => handleStatus("completed")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-all">
                {updatingStatus === "completed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Mark as Completed
              </button>
            )}
          </div>
        )}

        {actionError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {actionError}
          </div>
        )}

        {/* Clinical notes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <NotebookPen className="h-4 w-4 text-slate-400" /> Clinical Notes
          </h2>
          <form onSubmit={handleSaveNotes} className="space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add diagnosis, prescriptions, follow-up instructions…"
              className="input-field resize-none"
            />
            <div className="flex items-center justify-between">
              {notesSaved && (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Notes saved
                </span>
              )}
              <div className="ml-auto">
                <button id="save-notes-btn" type="submit" disabled={savingNotes}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60 transition-all">
                  {savingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Notes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}
