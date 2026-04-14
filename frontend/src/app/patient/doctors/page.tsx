"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, SlidersHorizontal, X, Loader2, UserRound, ChevronLeft, ChevronRight } from "lucide-react";
import { getDoctors } from "@/lib/api/doctors";
import { DoctorCard } from "@/components/features/patient/doctors/DoctorCard";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Doctor } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Common specializations for the quick-filter pills
// ─────────────────────────────────────────────────────────────────────────────

const SPECIALIZATIONS = [
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Orthopedist",
  "Pediatrician",
  "Psychiatrist",
  "General Physician",
  "ENT Specialist",
  "Ophthalmologist",
  "Gynecologist",
  "Oncologist",
  "Radiologist",
  "Gastroenterologist",
  "Pulmonologist",
  "Endocrinologist",
];

const PAGE_SIZE = 12;

// ─────────────────────────────────────────────────────────────────────────────
// Page component
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

  // ── Derived values ───────────────────────────────────────────────────────────
  const totalPages   = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters   = !!debouncedSearch || !!selectedSpec;

  function clearFilters() {
    setSearch("");
    setSelectedSpec("");
    setPage(1);
  }

  function handleSpecClick(spec: string) {
    setSelectedSpec((prev) => (prev === spec ? "" : spec));
    setPage(1);
  }

  return (
    <PageContainer
      title="Find Doctors"
      subtitle="Search and book appointments with trusted, verified specialists."
    >
      <div className="space-y-6">

        {/* ── Search + Filter bar ─────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="doctor-search"
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* ── Specialization pills ────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => handleSpecClick(spec)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  selectedSpec === spec
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results count ────────────────────────────────────────────── */}
        {!loading && (
          <p className="text-sm text-slate-500">
            {total > 0
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} doctors`
              : hasFilters
              ? "No doctors match your filters."
              : "No doctors found."}
          </p>
        )}

        {/* ── Loading skeleton ─────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <DoctorCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ── Error state ──────────────────────────────────────────────── */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <UserRound className="h-7 w-7 text-red-400" />
            </div>
            <p className="font-semibold text-slate-800">Failed to load doctors</p>
            <p className="text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={fetchDoctors}
              className="mt-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {!loading && !error && doctors.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <UserRound className="h-7 w-7 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-800">No doctors found</p>
            {hasFilters && (
              <p className="text-sm text-slate-500">
                Try a different search or{" "}
                <button onClick={clearFilters} className="text-blue-600 hover:underline">
                  clear your filters
                </button>
                .
              </p>
            )}
          </div>
        )}

        {/* ── Doctor cards grid ────────────────────────────────────────── */}
        {!loading && !error && doctors.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {doctors.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────────── */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              id="doctors-prev-page"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                const pg = getPageNumbers(page, totalPages)[i];
                if (pg === undefined) return null;
                if (pg === -1) {
                  return <span key={`ellipsis-${i}`} className="px-1 text-slate-400">…</span>;
                }
                return (
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
                );
              })}
            </div>

            <button
              id="doctors-next-page"
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Loading indicator for page change ───────────────────────── */}
        {loading && page > 1 && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}

      </div>
    </PageContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────────────────────────────────────

function DoctorCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse">
      <div className="h-2 w-full bg-slate-200" />
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
            <div className="h-3 w-1/3 rounded bg-slate-200" />
          </div>
        </div>
        <div className="h-px bg-slate-100" />
        <div className="flex justify-between">
          <div className="h-3 w-1/3 rounded bg-slate-200" />
          <div className="h-3 w-1/4 rounded bg-slate-200" />
        </div>
        <div className="h-10 w-full rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page number helper (smart ellipsis)
// ─────────────────────────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, -1, total];
  if (current >= total - 3) return [1, -1, total - 4, total - 3, total - 2, total - 1, total];
  return [1, -1, current - 1, current, current + 1, -1, total];
}
