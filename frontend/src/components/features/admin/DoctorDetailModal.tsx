"use client";

import {
  Stethoscope, GraduationCap, Clock, Mail,
  Star, FileText, User, CheckCircle2, XCircle, CalendarDays,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DoctorStatusBadge } from "@/components/features/admin/DoctorStatusBadge";
import type { Doctor } from "@/types";

// ── Format helpers ────────────────────────────────────────────────────────────

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "short", year: "numeric",
});

function fmt(d?: string) {
  if (!d) return "—";
  try { return dateFmt.format(new Date(d)); } catch { return d; }
}

// ── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-3.5 w-3.5 text-slate-600" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm text-slate-800">{value ?? "—"}</p>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DoctorDetailModalProps {
  doctor: Doctor | null;
  open: boolean;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  actionLoading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DoctorDetailModal({
  doctor,
  open,
  onClose,
  onApprove,
  onReject,
  actionLoading = false,
}: DoctorDetailModalProps) {
  if (!doctor) return null;

  const isPending = doctor.approvalStatus?.toUpperCase() === "PENDING" ||
                    doctor.status?.toUpperCase() === "PENDING";
  const status = (doctor.approvalStatus ?? doctor.status ?? "PENDING").toUpperCase();
  const initials = `${doctor.firstName?.[0] ?? ""}${doctor.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        {/* Panel */}
        <DialogPrimitive.Content
          className={cn(
            "fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full",
            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full",
            "duration-300 focus:outline-none"
          )}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <DialogPrimitive.Title className="text-base font-semibold text-slate-900">
                Doctor Profile
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Doctor hero card */}
            <div className="flex items-start gap-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white">
              {/* Avatar */}
              {doctor.profileImageUrl ? (
                <img
                  src={doctor.profileImageUrl}
                  alt={`${doctor.firstName} ${doctor.lastName}`}
                  className="h-16 w-16 rounded-xl object-cover ring-2 ring-white/20"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl font-bold text-white ring-2 ring-white/10">
                  {initials || <User className="h-7 w-7" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold">
                  Dr. {doctor.firstName} {doctor.lastName}
                </p>
                <p className="mt-0.5 text-sm text-white/70">
                  {doctor.specializations?.join(", ") ?? doctor.specialization ?? "—"}
                </p>
                <div className="mt-2">
                  <DoctorStatusBadge status={status} size="sm" />
                </div>
              </div>
            </div>

            {/* Basic info */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Basic Information
              </h4>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4">
                <InfoRow icon={User}       label="Full Name"     value={`Dr. ${doctor.firstName} ${doctor.lastName}`} />
                <InfoRow icon={Mail}       label="Email"         value={doctor.user?.email ?? doctor.email} />
                <InfoRow icon={Clock}      label="Experience"    value={
                  (doctor.experienceYears ?? doctor.experience) != null
                    ? `${doctor.experienceYears ?? doctor.experience} years`
                    : undefined
                } />
                <InfoRow
                  icon={Star}
                  label="Consultation Fee"
                  value={doctor.consultationFee != null ? `₹${doctor.consultationFee}` : undefined}
                />
                <InfoRow icon={CalendarDays} label="Joined" value={fmt(doctor.createdAt)} />
              </div>
            </div>

            {/* Qualifications & Specializations */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Medical Background
              </h4>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4">
                <InfoRow
                  icon={Stethoscope}
                  label="Specialization(s)"
                  value={doctor.specializations?.join(", ") ?? doctor.specialization}
                />
                <InfoRow
                  icon={GraduationCap}
                  label="Qualification"
                  value={
                    Array.isArray(doctor.qualifications)
                      ? doctor.qualifications.join(", ")
                      : doctor.qualification
                  }
                />
              </div>
            </div>

            {/* Bio */}
            {doctor.bio && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  About
                </h4>
                <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <p className="text-sm leading-relaxed text-slate-700">{doctor.bio}</p>
                </div>
              </div>
            )}

            {/* Avg rating if available */}
            {doctor.avgRating != null && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                <span className="text-sm font-medium text-amber-800">
                  {doctor.avgRating} avg. rating
                  {doctor.totalReviews != null && ` · ${doctor.totalReviews} reviews`}
                </span>
              </div>
            )}
          </div>

          {/* Action footer — only for pending doctors */}
          {isPending && (onApprove || onReject) && (
            <div className="sticky bottom-0 border-t border-slate-100 bg-white px-6 py-4">
              <div className="flex gap-3">
                {onReject && (
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    onClick={() => onReject(doctor.id)}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                )}
                {onApprove && (
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => onApprove(doctor.id)}
                    isLoading={actionLoading}
                    loadingText="Approving…"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
