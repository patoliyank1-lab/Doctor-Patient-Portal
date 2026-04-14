"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, X, Star, Briefcase, IndianRupee,
  MapPin, ChevronLeft, ChevronRight, UserRound,
  AlertCircle, SlidersHorizontal, ChevronRight as Arrow,
} from "lucide-react";
import { getDoctors } from "@/lib/api/doctors";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Doctor } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SPECIALIZATIONS = [
  "Cardiologist", "Dermatologist", "Neurologist", "Orthopedist",
  "Pediatrician", "Psychiatrist", "General Physician", "ENT Specialist",
  "Ophthalmologist", "Gynecologist", "Oncologist", "Radiologist",
  "Gastroenterologist", "Pulmonologist", "Endocrinologist",
];

const PAGE_SIZE = 12;

// Avatar gradient palette — deterministic per doctor id
const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-teal-500 to-emerald-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-sky-600",
];

function gradientFor(id: string) {
  const code = (id.charCodeAt(0) ?? 0) + (id.charCodeAt(id.length - 1) ?? 0);
  return GRADIENTS[code % GRADIENTS.length]!;
}

function getInitials(first?: string, last?: string) {
  return `${(first ?? "").charAt(0)}${(last ?? "").charAt(0)}`.toUpperCase() || "DR";
}

function getSpecs(doc: Doctor): string[] {
  if (doc.specializations?.length) return doc.specializations;
  if (doc.specialization) return [doc.specialization];
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// DoctorCard
// ─────────────────────────────────────────────────────────────────────────────

function DoctorCard({ doctor }: { doctor: Doctor }) {
  const avatarUrl = doctor.profileImageUrl ?? doctor.profileImage ?? null;
  const specs     = getSpecs(doctor);
  const exp       = doctor.experienceYears ?? doctor.experience ?? 0;
  const rating    = doctor.avgRating ?? 0;
  const reviews   = doctor.totalReviews ?? 0;
  const fee       = doctor.consultationFee ?? 0;
  const fullName  = `${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim() || "Doctor";
  const gradient  = gradientFor(doctor.id);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      {/* Accent top stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Avatar + Name */}
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0 h-16 w-16">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName}
                width={64}
                height={64}
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-slate-100"
                unoptimized
              />
            ) : (
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-xl font-extrabold text-white ring-2 ring-slate-100`}
              >
                {getInitials(doctor.firstName, doctor.lastName)}
              </div>
            )}
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-bold text-slate-900">
              Dr. {fullName}
            </h3>

            {/* Specializations */}
            <div className="mt-1 flex flex-wrap gap-1">
              {specs.slice(0, 2).map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700"
                >
                  {s}
                </span>
              ))}
              {specs.length > 2 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                  +{specs.length - 2}
                </span>
              )}
            </div>

            {/* Stars */}
            <div className="mt-1.5 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`h-3 w-3 shrink-0 ${
                    rating > 0 && n <= Math.round(rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-200"
                  }`}
                />
              ))}
              <span className="ml-0.5 text-xs font-semibold text-slate-700">
                {rating > 0 ? rating.toFixed(1) : "New"}
              </span>
              {reviews > 0 && (
                <span className="text-[11px] text-slate-400">({reviews})</span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium">
              {exp > 0 ? `${exp} yr${exp !== 1 ? "s" : ""} exp.` : "New"}
            </span>
          </div>
          <div className="flex items-center gap-1 font-bold text-emerald-600">
            <IndianRupee className="h-3.5 w-3.5" />
            <span>{fee > 0 ? fee.toLocaleString("en-IN") : "Free"}</span>
            <span className="text-[11px] font-normal text-slate-400">/visit</span>
          </div>
        </div>

        {/* Clinic */}
        {(doctor.clinicName || doctor.clinicAddress) && (
          <div className="flex items-start gap-1.5 text-xs text-slate-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{doctor.clinicName ?? doctor.clinicAddress}</span>
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/patient/doctors/${doctor.id}`}
          id={`view-doctor-${doctor.id}`}
          className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
        >
          View Profile & Book
          <Arrow className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton card — matches DoctorCard layout exactly
// ─────────────────────────────────────────────────────────────────────────────

function DoctorCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse">
      <div className="h-1.5 w-full bg-slate-200" />
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3.5">
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-slate-200" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-3/4 rounded-lg bg-slate-200" />
            <div className="flex gap-1">
              <div className="h-3 w-20 rounded-full bg-slate-200" />
              <div className="h-3 w-16 rounded-full bg-slate-200" />
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => <div key={i} className="h-3 w-3 rounded-sm bg-slate-200" />)}
            </div>
          </div>
        </div>
        <div className="h-px bg-slate-100" />
        <div className="flex justify-between">
          <div className="h-3.5 w-24 rounded-lg bg-slate-200" />
          <div className="h-3.5 w-20 rounded-lg bg-slate-200" />
        </div>
        <div className="h-10 w-full rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination helper
// ─────────────────────────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): (number | -1)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, -1, total];
  if (current >= total - 3) return [1, -1, total - 4, total - 3, total - 2, total - 1, total];
  return [1, -1, current - 1, current, current + 1, -1, total];
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function FindDoctorsPage() {
  const [doctors, setDoctors]           = useState<Doctor[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("");
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── Debounce search ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // ── Fetch doctors ────────────────────────────────────────────────────────────
  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDoctors({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        specialization: selectedSpec || undefined,
      });
      setDoctors((res.data ?? []) as Doctor[]);
      setTotal(res.total ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load doctors.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedSpec]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = !!debouncedSearch || !!selectedSpec;

  function clearFilters() {
    setSearch("");
    setSelectedSpec("");
    setPage(1);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <PageContainer
      title="Find Doctors"
      subtitle="Search and book appointments with trusted, verified specialists."
    >
      <div className="space-y-6">

        {/* ── Search + clear row ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="doctor-search"
              type="text"
              placeholder="Search by name or specialization…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Clear all filters button */}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
          )}
        </div>

        {/* ── Specialization filter pills ───────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Filter by specialization
            </span>
            {selectedSpec && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
                1
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => {
                  setSelectedSpec((prev) => (prev === spec ? "" : spec));
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  selectedSpec === spec
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results count ─────────────────────────────────────────────── */}
        {!loading && !error && (
          <p className="text-sm text-slate-500">
            {total > 0
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} doctor${total !== 1 ? "s" : ""}`
              : hasFilters
              ? "No doctors match your filters."
              : "No doctors found."}
          </p>
        )}

        {/* ── Error state ───────────────────────────────────────────────── */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-100 bg-red-50 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Failed to load doctors</p>
              <p className="mt-1 text-sm text-slate-500">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchDoctors}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Skeleton loader ───────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <DoctorCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!loading && !error && doctors.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
              <UserRound className="h-8 w-8 text-slate-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">No doctors found</p>
              {hasFilters && (
                <p className="mt-1 text-sm text-slate-500">
                  Try a different search or{" "}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-blue-600 hover:underline"
                  >
                    clear your filters
                  </button>
                  .
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Doctor cards grid ─────────────────────────────────────────── */}
        {!loading && !error && doctors.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {doctors.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              id="doctors-prev-page"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getPageNumbers(page, totalPages).map((pg, i) =>
              pg === -1 ? (
                <span key={`ellipsis-${i}`} className="px-1 text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setPage(pg)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    pg === page
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {pg}
                </button>
              )
            )}

            <button
              id="doctors-next-page"
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </PageContainer>
  );
}
