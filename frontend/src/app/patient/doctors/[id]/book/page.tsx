"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  MapPin,
  IndianRupee,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { getDoctorById } from "@/lib/api/doctors";
import { getDoctorSlots } from "@/lib/api/slots";
import { bookAppointment } from "@/lib/api/appointments";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Doctor, Slot } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(first?: string, last?: string) {
  return `${(first ?? "").charAt(0)}${(last ?? "").charAt(0)}`.toUpperCase() || "DR";
}

function getNext7Days(): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  }).format(new Date(iso));
}

function formatTime(iso: string): string {
  try {
    if (/^\d{2}:\d{2}/.test(iso)) {
      const [h, m] = iso.split(":");
      const d = new Date();
      d.setHours(Number(h), Number(m));
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return iso; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = ["Choose Date", "Pick Slot", "Details", "Confirm"] as const;
type Step = 0 | 1 | 2 | 3;

function StepBar({ current }: { current: Step }) {
  return (
    <div className="mb-8 flex items-center gap-0">
      {STEPS.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        const last    = i === STEPS.length - 1;
        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                done   ? "bg-emerald-500 text-white" :
                active ? "bg-blue-600 text-white shadow-lg shadow-blue-200" :
                         "border-2 border-slate-200 bg-white text-slate-400"
              }`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`hidden text-xs font-medium sm:block ${active ? "text-blue-600" : done ? "text-emerald-600" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
            {!last && (
              <div className={`h-0.5 flex-1 mx-2 transition-all ${done ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function BookAppointmentPage() {
  const { id: doctorId } = useParams() as { id: string };
  const router = useRouter();

  const [doctor, setDoctor]       = useState<Doctor | null>(null);
  const [docLoading, setDocLoading] = useState(true);

  const [step, setStep] = useState<Step>(0);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0] ?? ""
  );
  const [slots, setSlots]         = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reason, setReason]       = useState("");
  const [booking, setBooking]     = useState(false);
  const [bookError, setBookError] = useState("");
  const [booked, setBooked]       = useState(false);

  // ── Load doctor ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!doctorId) return;
    (async () => {
      try {
        const doc = await getDoctorById(doctorId);
        setDoctor(doc);
      } catch {
        setDoctor(null);
      } finally {
        setDocLoading(false);
      }
    })();
  }, [doctorId]);

  // ── Load slots ───────────────────────────────────────────────────────────
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

  // ── Book ─────────────────────────────────────────────────────────────────
  async function handleBook() {
    if (!selectedSlot) return;
    setBooking(true);
    setBookError("");
    try {
      await bookAppointment({
        slotId: selectedSlot.id,
        reason: reason.trim() || "General consultation",
      });
      setBooked(true);
    } catch (err: unknown) {
      setBookError(err instanceof Error ? err.message : "Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  const next7Days = getNext7Days();
  const availableSlots = slots.filter((s) => !s.status || s.status === "available");
  const fullName = `${doctor?.firstName ?? ""} ${doctor?.lastName ?? ""}`.trim();
  const avatarUrl = doctor?.profileImageUrl ?? doctor?.profileImage ?? null;
  const specs = doctor?.specializations?.length
    ? doctor.specializations
    : doctor?.specialization ? [doctor.specialization] : [];

  // ── Success screen ───────────────────────────────────────────────────────
  if (booked) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-md py-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="mb-2 text-2xl font-extrabold text-slate-900">Appointment Booked!</h1>
          <p className="mb-2 text-slate-500">
            Your appointment with <span className="font-semibold text-slate-800">Dr. {fullName}</span> has been confirmed.
          </p>
          <p className="mb-8 text-sm text-slate-400">
            {formatDate(selectedDate)} &middot; {formatTime(selectedSlot?.startTime ?? "")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/patient/appointments"
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-all"
            >
              View My Appointments
            </Link>
            <Link
              href="/patient/doctors"
              className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Find More Doctors
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Back */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => (step === 0 ? router.back() : setStep((s) => (s - 1) as Step))}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 0 ? "Back to doctor" : "Previous step"}
        </button>
      </div>

      <div className="mx-auto max-w-2xl">
        {/* Step progress bar */}
        <StepBar current={step} />

        <div className="space-y-5">

          {/* Doctor summary card (always visible) */}
          {!docLoading && doctor && (
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={fullName} width={64} height={64} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-extrabold text-white">
                    {getInitials(doctor.firstName, doctor.lastName)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">Dr. {fullName}</p>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {specs.slice(0, 2).map((s) => (
                    <span key={s} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{s}</span>
                  ))}
                </div>
              </div>
              <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                {(doctor.consultationFee ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {Number(doctor.consultationFee).toLocaleString("en-IN")}
                  </span>
                )}
                {(doctor.experienceYears ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Briefcase className="h-3 w-3" />
                    {doctor.experienceYears} yrs exp.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 0: Choose date ──────────────────────────────────────────── */}
          {step === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <Calendar className="h-5 w-5 text-blue-500" />
                Select an appointment date
              </h2>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {next7Days.map((date) => {
                  const iso = date.toISOString().split("T")[0] ?? "";
                  const isSelected = iso === selectedDate;
                  const isToday = iso === new Date().toISOString().split("T")[0];
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSelectedDate(iso)}
                      className={`flex flex-col items-center rounded-xl border px-2 py-3 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <span className="text-xs font-medium">
                        {isToday ? "Today" : date.toLocaleDateString("en-IN", { weekday: "short" })}
                      </span>
                      <span className={`text-xl font-extrabold leading-tight ${isSelected ? "" : "text-slate-800"}`}>
                        {date.getDate()}
                      </span>
                      <span className="text-xs">{date.toLocaleDateString("en-IN", { month: "short" })}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  id="date-next-btn"
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
                >
                  View Available Slots <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 1: Pick a slot ──────────────────────────────────────────── */}
          {step === 1 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-800">
                <Clock className="h-5 w-5 text-blue-500" />
                Available slots for&nbsp;
                <span className="text-blue-600">{formatDate(selectedDate)}</span>
              </h2>
              <p className="mb-4 text-xs text-slate-400">Times are shown in Indian Standard Time (IST)</p>

              {slotsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Clock className="h-10 w-10 text-slate-300" />
                  <p className="font-medium text-slate-700">No slots available on this date</p>
                  <button type="button" onClick={() => setStep(0)} className="text-sm text-blue-600 hover:underline">
                    ← Pick a different date
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => { setSelectedSlot(slot); setStep(2); }}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 ${
                        selectedSlot?.id === slot.id
                          ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {formatTime(slot.startTime)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Add reason ───────────────────────────────────────────── */}
          {step === 2 && selectedSlot && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                Add visit details
              </h2>

              {/* Selected slot recap */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm">
                <span className="text-slate-500">Selected slot: </span>
                <span className="font-semibold text-blue-800">
                  {formatDate(selectedDate)} &middot; {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
                </span>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label htmlFor="visit-reason" className="text-sm font-semibold text-slate-700">
                  Reason for visit <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="visit-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Routine check-up, follow-up from previous visit, chest pain…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end">
                <button
                  id="details-next-btn"
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
                >
                  Review Booking <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Confirm ──────────────────────────────────────────────── */}
          {step === 3 && selectedSlot && doctor && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <h2 className="text-base font-semibold text-slate-800">Confirm your appointment</h2>

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                {[
                  { label: "Doctor",       value: `Dr. ${fullName}` },
                  { label: "Speciality",   value: specs[0] ?? "—" },
                  { label: "Date",         value: formatDate(selectedDate) },
                  { label: "Time",         value: `${formatTime(selectedSlot.startTime)} – ${formatTime(selectedSlot.endTime)}` },
                  { label: "Reason",       value: reason.trim() || "General consultation" },
                  ...(Number(doctor.consultationFee) > 0
                    ? [{ label: "Fee",     value: `₹${Number(doctor.consultationFee).toLocaleString("en-IN")}` }]
                    : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-medium text-slate-900 text-right">{value}</span>
                  </div>
                ))}
              </div>

              {bookError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {bookError}
                </div>
              )}

              <button
                id="confirm-book-btn"
                type="button"
                disabled={booking}
                onClick={handleBook}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-60"
              >
                {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {booking ? "Booking…" : "Confirm Appointment"}
              </button>

              <p className="text-center text-xs text-slate-400">
                By confirming, you agree to the appointment terms. You can cancel from My Appointments.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
