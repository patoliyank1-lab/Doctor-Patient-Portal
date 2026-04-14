"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, User, Calendar, FileText, Star, Loader2, AlertCircle,
  Phone, Droplets, Clock, Download,
} from "lucide-react";
import { getPatientById } from "@/lib/api/patients";
import { getMyAppointments } from "@/lib/api/appointments";
import { getPatientRecords } from "@/lib/api/medical-records";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Patient, Appointment, MedicalRecord } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)); }
  catch { return iso; }
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  try {
    if (/^\d{2}:\d{2}/.test(iso)) {
      const [h, m] = iso.split(":");
      const d = new Date(); d.setHours(Number(h), Number(m));
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return iso; }
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_BADGE: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  approved:  "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
  rejected:  "bg-rose-100 text-rose-700 border-rose-200",
};

const TABS = ["Overview", "Appointments", "Records"] as const;
type Tab = (typeof TABS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DoctorPatientDetailPage() {
  const { id: patientId } = useParams() as { id: string };
  const router = useRouter();

  const [patient, setPatient]           = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords]           = useState<MedicalRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<Tab>("Overview");

  useEffect(() => {
    if (!patientId) return;
    (async () => {
      const [ptRes, aptRes, recRes] = await Promise.allSettled([
        getPatientById(patientId),
        getMyAppointments({ limit: 20, patientId }),
        getPatientRecords(patientId, { limit: 20 }),
      ]);
      if (ptRes.status  === "fulfilled") setPatient(ptRes.value);
      if (aptRes.status === "fulfilled") setAppointments((aptRes.value.data ?? []) as Appointment[]);
      if (recRes.status === "fulfilled") setRecords((recRes.value.data ?? []) as MedicalRecord[]);
      setLoading(false);
    })();
  }, [patientId]);

  if (loading) {
    return <PageContainer><div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div></PageContainer>;
  }

  if (!patient) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <AlertCircle className="h-12 w-12 text-slate-300" />
          <p className="font-semibold text-slate-800">Patient not found.</p>
          <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">← Go back</button>
        </div>
      </PageContainer>
    );
  }

  const firstName  = patient.firstName ?? (patient as any).name?.split(" ")[0] ?? "";
  const lastName   = patient.lastName  ?? (patient as any).name?.split(" ").slice(1).join(" ") ?? "";
  const fullName   = `${firstName} ${lastName}`.trim() || "Patient";
  const avatar     = patient.profileImageUrl ?? patient.profileImage ?? null;
  const initials   = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "P";
  const age        = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  return (
    <PageContainer>
      {/* Back */}
      <div className="mb-6">
        <button type="button" onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <div className="mx-auto max-w-2xl space-y-5">

        {/* Patient hero card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-4 ring-slate-100">
              {avatar ? (
                <Image src={avatar} alt={fullName} width={80} height={80} className="h-full w-full object-cover" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800 text-2xl font-extrabold text-white">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{fullName}</h1>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-slate-500">
                {age && <span>{age} yrs</span>}
                {patient.gender && <span className="capitalize">{patient.gender}</span>}
                {patient.bloodGroup && (
                  <span className="flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5 text-red-400" /> {patient.bloodGroup}
                  </span>
                )}
                {patient.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {patient.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                tab === t ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Overview ──────────────────────────────────────────────────── */}
        {tab === "Overview" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Patient Information</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { label: "Full Name",    value: fullName },
                  { label: "Date of Birth", value: formatDate(patient.dateOfBirth) },
                  { label: "Gender",        value: patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : "—" },
                  { label: "Blood Group",   value: patient.bloodGroup ?? "—" },
                  { label: "Phone",         value: patient.phone ?? "—" },
                  { label: "Address",       value: (patient as any).address ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4 px-5 py-3 text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-medium text-slate-900 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Appointments", value: appointments.length, color: "text-blue-600" },
                { label: "Completed",    value: appointments.filter(a => a.status === "completed").length, color: "text-emerald-600" },
                { label: "Records",      value: records.length, color: "text-purple-600" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Appointments ──────────────────────────────────────────────── */}
        {tab === "Appointments" && (
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Calendar className="h-10 w-10 text-slate-300" />
                <p className="text-slate-500">No appointments with this patient yet.</p>
              </div>
            ) : appointments.map((apt) => {
              const slot = apt.slot as any;
              const badge = STATUS_BADGE[apt.status] ?? STATUS_BADGE.pending!;
              return (
                <Link key={apt.id} href={`/doctor/appointments/${apt.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge}`}>
                        {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {formatDate(slot?.date ?? (apt as any).scheduledAt)}
                      {slot?.startTime && <><Clock className="ml-1 h-3 w-3" />{formatTime(slot.startTime)}</>}
                    </p>
                    {apt.reason && <p className="mt-0.5 text-xs text-slate-400 italic">{apt.reason}</p>}
                  </div>
                  <ArrowLeft className="h-4 w-4 rotate-180 shrink-0 text-slate-300" />
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Records ───────────────────────────────────────────────────── */}
        {tab === "Records" && (
          <div className="space-y-3">
            {records.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <FileText className="h-10 w-10 text-slate-300" />
                <p className="text-slate-500">No medical records found for this patient.</p>
              </div>
            ) : records.map((rec) => (
              <div key={rec.id} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">{rec.title}</p>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-400">
                    <span className="capitalize">{rec.type.replace('_', ' ')}</span>
                    {rec.fileSize && <span>{formatSize(rec.fileSize)}</span>}
                    <span>{formatDate(rec.createdAt)}</span>
                  </div>
                  {rec.description && <p className="mt-0.5 text-xs text-slate-500 italic">{rec.description}</p>}
                </div>
                {rec.fileUrl && (
                  <a href={rec.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 transition-all">
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
