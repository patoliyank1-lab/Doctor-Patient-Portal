import Image from "next/image";
import Link from "next/link";
import { Star, Briefcase, IndianRupee, MapPin, ChevronRight } from "lucide-react";
import type { Doctor } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(first?: string, last?: string): string {
  return `${(first ?? "").charAt(0)}${(last ?? "").charAt(0)}`.toUpperCase() || "DR";
}

function getAvatarUrl(doc: Doctor): string | null {
  return doc.profileImageUrl ?? doc.profileImage ?? null;
}

function getSpecializations(doc: Doctor): string[] {
  if (doc.specializations?.length) return doc.specializations;
  if (doc.specialization) return [doc.specialization];
  return [];
}

function getExperience(doc: Doctor): number {
  return doc.experienceYears ?? doc.experience ?? 0;
}

// Consistent pastel background per doctor (based on id hash)
const GRAD_PAIRS = [
  ["from-blue-500", "to-indigo-600"],
  ["from-violet-500", "to-purple-600"],
  ["from-teal-500", "to-emerald-600"],
  ["from-rose-500", "to-pink-600"],
  ["from-amber-500", "to-orange-600"],
  ["from-cyan-500", "to-sky-600"],
];

function gradientForId(id: string): string {
  const code = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  const pair = GRAD_PAIRS[code % GRAD_PAIRS.length]!;
  return `bg-gradient-to-br ${pair[0]} ${pair[1]}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface DoctorCardProps {
  doctor: Doctor;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const avatarUrl     = getAvatarUrl(doctor);
  const specs         = getSpecializations(doctor);
  const experience    = getExperience(doctor);
  const rating        = doctor.avgRating ?? 0;
  const reviewCount   = doctor.totalReviews ?? 0;
  const fee           = doctor.consultationFee ?? 0;
  const fullName      = `${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim() || "Doctor";
  const gradient      = gradientForId(doctor.id);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1">

      {/* Top colour strip */}
      <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />

      <div className="flex flex-col flex-1 p-5 gap-4">

        {/* Avatar + name row */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 h-16 w-16 overflow-hidden rounded-2xl ring-2 ring-slate-100 shadow">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName}
                width={64}
                height={64}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center ${gradient} text-xl font-extrabold text-white`}>
                {getInitials(doctor.firstName, doctor.lastName)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="truncate text-base font-bold text-slate-900">Dr. {fullName}</h3>

            {/* Specializations */}
            <div className="mt-1 flex flex-wrap gap-1">
              {specs.slice(0, 2).map((s) => (
                <span
                  key={s}
                  className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                >
                  {s}
                </span>
              ))}
              {specs.length > 2 && (
                <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  +{specs.length - 2}
                </span>
              )}
            </div>

            {/* Star rating */}
            <div className="mt-1.5 flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-slate-800">
                {rating > 0 ? rating.toFixed(1) : "New"}
              </span>
              {reviewCount > 0 && (
                <span className="text-xs text-slate-400">({reviewCount} reviews)</span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Stats row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Briefcase className="h-4 w-4 text-slate-400" />
            <span>
              {experience > 0 ? `${experience} yr${experience !== 1 ? "s" : ""} exp.` : "New"}
            </span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-emerald-700">
            <IndianRupee className="h-3.5 w-3.5" />
            <span>{fee > 0 ? fee.toLocaleString("en-IN") : "Free"}</span>
            <span className="text-xs font-normal text-slate-400">/visit</span>
          </div>
        </div>

        {/* Clinic */}
        {(doctor.clinicName || doctor.clinicAddress) && (
          <div className="flex items-start gap-1.5 text-xs text-slate-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{doctor.clinicName ?? doctor.clinicAddress}</span>
          </div>
        )}

        {/* Book button */}
        <Link
          href={`/patient/doctors/${doctor.id}`}
          id={`book-doctor-${doctor.id}`}
          className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95"
        >
          View Profile & Book
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
