"use client";

import {
  Eye, CheckCircle2, XCircle, MoreHorizontal,
  Stethoscope, User
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DoctorStatusBadge } from "@/components/features/admin/DoctorStatusBadge";
import type { Doctor } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "short", year: "numeric",
});

function fmtDate(d?: string) {
  if (!d) return "—";
  try { return dateFmt.format(new Date(d)); } catch { return d; }
}

function doctorStatus(doc: Doctor): string {
  return (doc.approvalStatus ?? doc.status ?? "PENDING").toUpperCase();
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[60, 45, 35, 25, 30, 20].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div
            className="h-4 rounded-md bg-slate-200"
            style={{ width: `${w}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Row actions ───────────────────────────────────────────────────────────────

interface RowActionsProps {
  doctor: Doctor;
  actionLoading?: boolean;
  onView: (doc: Doctor) => void;
  onApprove: (doc: Doctor) => void;
  onReject: (doc: Doctor) => void;
}

function RowActions({ doctor, actionLoading, onView, onApprove, onReject }: RowActionsProps) {
  const status = doctorStatus(doctor);
  const isPending = status === "PENDING";

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Always visible: View */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onView(doctor)}
        className="h-8 px-2.5 text-slate-600 hover:bg-slate-100"
        title="View details"
      >
        <Eye className="h-3.5 w-3.5" />
        <span className="hidden sm:inline ml-1 text-xs">View</span>
      </Button>

      {/* Pending: show Approve + Reject inline */}
      {isPending && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReject(doctor)}
            disabled={actionLoading}
            className="h-8 px-2.5 text-red-600 hover:bg-red-50"
            title="Reject"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span className="hidden md:inline ml-1 text-xs">Reject</span>
          </Button>
          <Button
            size="sm"
            onClick={() => onApprove(doctor)}
            disabled={actionLoading}
            className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            title="Approve"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline ml-1 text-xs">Approve</span>
          </Button>
        </>
      )}

      {/* Non-pending: overflow menu */}
      {!isPending && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="z-50 min-w-[160px] rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
            >
              {status !== "APPROVED" && (
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-emerald-700 outline-none hover:bg-emerald-50"
                  onSelect={() => onApprove(doctor)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </DropdownMenu.Item>
              )}
              {status !== "REJECTED" && (
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 outline-none hover:bg-red-50"
                  onSelect={() => onReject(doctor)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </DropdownMenu.Item>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </div>
  );
}

// ── Main Table ────────────────────────────────────────────────────────────────

interface DoctorTableProps {
  doctors: Doctor[];
  loading?: boolean;
  error?: boolean;
  actionLoading?: boolean;
  onView: (doc: Doctor) => void;
  onApprove: (doc: Doctor) => void;
  onReject: (doc: Doctor) => void;
}

export function DoctorTable({
  doctors,
  loading = false,
  error = false,
  actionLoading = false,
  onView,
  onApprove,
  onReject,
}: DoctorTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Head */}
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Doctor
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">
                Specialization
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell">
                Experience
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell">
                Joined
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                      <XCircle className="h-6 w-6 text-red-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Failed to load doctors</p>
                    <p className="text-xs text-slate-400">Check your connection and try again</p>
                  </div>
                </td>
              </tr>
            ) : doctors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                      <Stethoscope className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No doctors found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              doctors.map((doc) => {
                const status = doctorStatus(doc);
                const initials = `${doc.firstName?.[0] ?? ""}${doc.lastName?.[0] ?? ""}`.toUpperCase();

                return (
                  <tr
                    key={doc.id}
                    className="group hover:bg-slate-50/80 transition-colors duration-100"
                  >
                    {/* Doctor name + email */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {doc.profileImageUrl ? (
                          <img
                            src={doc.profileImageUrl}
                            alt={`Dr. ${doc.firstName}`}
                            className="h-9 w-9 rounded-xl object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-bold text-white">
                            {initials || <User className="h-4 w-4" />}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p
                            className="font-semibold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors truncate"
                            onClick={() => onView(doc)}
                          >
                            Dr. {doc.firstName} {doc.lastName}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {doc.user?.email ?? doc.email ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Specialization */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        <Stethoscope className="h-3 w-3" />
                        {doc.specializations?.[0] ?? doc.specialization ?? "—"}
                      </span>
                    </td>

                    {/* Experience */}
                    <td className="px-4 py-4 text-slate-600 hidden lg:table-cell">
                      {(doc.experienceYears ?? doc.experience) != null
                        ? `${doc.experienceYears ?? doc.experience} yrs`
                        : "—"}
                    </td>

                    {/* Joined date */}
                    <td className="px-4 py-4 text-slate-500 hidden lg:table-cell text-xs">
                      {fmtDate(doc.createdAt)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <DoctorStatusBadge status={status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <RowActions
                        doctor={doc}
                        actionLoading={actionLoading}
                        onView={onView}
                        onApprove={onApprove}
                        onReject={onReject}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
