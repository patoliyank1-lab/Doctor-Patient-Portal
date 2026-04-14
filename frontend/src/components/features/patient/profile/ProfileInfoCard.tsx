import Image from "next/image";
import {
  Calendar,
  Droplets,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import type { Patient, User as UserType } from "@/types";

interface ProfileInfoCardProps {
  patient: Patient | null;
  user: UserType | null;
}

function getInitials(first?: string, last?: string): string {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (!f && !l) return "?";
  return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ProfileInfoCard({ patient, user }: ProfileInfoCardProps) {
  const firstName = patient?.firstName ?? "";
  const lastName  = patient?.lastName  ?? "";
  const fullName  = `${firstName} ${lastName}`.trim() || user?.email?.split("@")[0] || "Patient";
  const avatarUrl = patient?.profileImageUrl ?? patient?.profileImage;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Banner gradient */}
      <div
        className="h-20"
        style={{
          background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 55%, #0a2a5e 100%)",
        }}
      />

      {/* Avatar — overlaps the banner */}
      <div className="relative px-5 pb-5">
        <div className="-mt-10 mb-3 flex items-end justify-between">
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
                {getInitials(firstName, lastName)}
              </div>
            )}
          </div>
        </div>

        <h3 className="truncate text-lg font-bold text-slate-900">{fullName}</h3>
        <p className="truncate text-sm text-slate-500">{user?.email ?? "—"}</p>

        {/* Quick stats */}
        <div className="mt-4 space-y-2.5">
          <InfoItem icon={<Phone className="h-3.5 w-3.5" />} value={patient?.phone ?? "—"} />
          <InfoItem
            icon={<Calendar className="h-3.5 w-3.5" />}
            value={formatDate(patient?.dateOfBirth)}
          />
          <InfoItem
            icon={<User className="h-3.5 w-3.5" />}
            value={
              patient?.gender
                ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
                : "—"
            }
          />
          <InfoItem
            icon={<Droplets className="h-3.5 w-3.5 text-red-400" />}
            value={patient?.bloodGroup ?? "—"}
          />
          <InfoItem
            icon={<MapPin className="h-3.5 w-3.5" />}
            value={patient?.address ?? "—"}
            multiline
          />
        </div>
      </div>
    </div>
  );
}

// ── Small helper ──────────────────────────────────────────────────────────────

function InfoItem({
  icon,
  value,
  multiline = false,
}: {
  icon: React.ReactNode;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className={`flex gap-2 text-sm text-slate-700 ${multiline ? "items-start" : "items-center"}`}>
      <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
      <span className={`min-w-0 ${multiline ? "" : "truncate"}`}>{value}</span>
    </div>
  );
}
