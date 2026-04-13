"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  X,
  SlidersHorizontal,
  Stethoscope,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  BadgeCheck,
  IndianRupee,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { SPECIALIZATIONS, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types — match the REAL backend response shape
// GET /api/v1/doctors → { success, data: { doctors[], pagination } }
// ─────────────────────────────────────────────────────────────────────────────

interface BackendDoctor {
  id: string;
  firstName: string;
  lastName: string;
  specializations: string[];
  qualification?: string;
  experienceYears?: number;
  bio?: string;
  profileImageUrl?: string;
  consultationFee?: string | number;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface BackendPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DoctorsApiEnvelope {
  success: boolean;
  data: {
    doctors: BackendDoctor[];
    pagination: BackendPagination;
  };
}

async function fetchDoctors(params: {
  page: number;
  limit: number;
  search?: string;
  specialization?: string;
}): Promise<{ doctors: BackendDoctor[]; pagination: BackendPagination }> {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.specialization) query.set("specialization", params.specialization);

  const res = await fetchWithAuth<DoctorsApiEnvelope>(`/doctors?${query}`, {
    _skipRefresh: true, // Public page — no auth needed
  } as Parameters<typeof fetchWithAuth>[1]);

  return {
    doctors: res?.data?.doctors ?? [],
    pagination: res?.data?.pagination ?? {
      total: 0, page: 1, limit: params.limit, totalPages: 1,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "from-blue-500 to-blue-700",
  "from-emerald-500 to-emerald-700",
  "from-violet-500 to-violet-700",
  "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-600",
  "from-cyan-500 to-cyan-700",
];

function avatarGradient(name: string): string {
  const code = (name.charCodeAt(0) ?? 0) + (name.charCodeAt(1) ?? 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length]!;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="h-20 w-20 shrink-0 rounded-2xl bg-slate-200" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 w-1/3 rounded bg-slate-200" />
        <div className="h-3 w-1/4 rounded bg-slate-200" />
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-slate-200" />
          <div className="h-6 w-20 rounded-full bg-slate-200" />
        </div>
        <div className="h-3 w-3/4 rounded bg-slate-200" />
      </div>
      <div className="flex flex-col items-end gap-3 shrink-0">
        <div className="h-6 w-16 rounded bg-slate-200" />
        <div className="h-10 w-28 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DoctorCard — horizontal list style
// ─────────────────────────────────────────────────────────────────────────────

function DoctorListCard({ doctor }: { doctor: BackendDoctor }) {
  const fullName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
  const initials = `${doctor.firstName[0] ?? "D"}${doctor.lastName[0] ?? "R"}`.toUpperCase();
  const gradient = avatarGradient(doctor.firstName);
  const primarySpec = doctor.specializations[0] ?? "General Medicine";
  const fee = doctor.consultationFee
    ? `₹${Number(doctor.consultationFee).toLocaleString("en-IN")}`
    : "Free";

  return (
    <article className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-200 sm:flex-row sm:items-start">
      {/* Avatar */}
      <div className="relative shrink-0">
        {doctor.profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doctor.profileImageUrl}
            alt={fullName}
            className="h-20 w-20 rounded-2xl object-cover"
          />
        ) : (
          <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-xl font-bold text-white`}>
            {initials}
          </div>
        )}
        {/* Verified badge */}
        <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 ring-2 ring-white">
          <BadgeCheck className="h-3 w-3 text-white" />
        </span>
      </div>

      {/* Main info */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        {/* Name + badge */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {fullName}
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-blue-600 font-medium">
              <Stethoscope className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {primarySpec}
            </p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            Available
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
          {doctor.experienceYears !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{doctor.experienceYears} yr exp</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
            <span className="font-medium text-slate-700">4.8</span>
            <span>(120+ reviews)</span>
          </div>
          {doctor.qualification && (
            <span className="text-slate-400">{doctor.qualification}</span>
          )}
        </div>

        {/* Bio */}
        {doctor.bio && (
          <p className="text-sm leading-relaxed text-slate-500 line-clamp-2">
            {doctor.bio}
          </p>
        )}

        {/* Specialization chips */}
        <div className="flex flex-wrap gap-1.5">
          {doctor.specializations.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel — fee + CTA */}
      <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
        <div className="text-right">
          <p className="flex items-center gap-0.5 text-lg font-bold text-slate-900">
            <IndianRupee className="h-4 w-4" />
            {fee.replace("₹", "")}
          </p>
          <p className="text-xs text-slate-400">per visit</p>
        </div>
        <Link
          href={`/doctors/${doctor.id}`}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 hover:shadow-[0_4px_14px_rgba(37,99,235,0.4)] active:scale-[0.98]"
        >
          View Profile
        </Link>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
        <Stethoscope className="h-10 w-10 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">No doctors found</h3>
      <p className="mt-2 text-sm text-slate-500">
        {hasFilters
          ? "Try adjusting your filters or search term."
          : "No approved doctors are listed yet. Check back soon."}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Debounce helper (defined inline to remove the lib/utils dependency on debounce)
// ─────────────────────────────────────────────────────────────────────────────

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns an array of page numbers (and "..." strings for ellipsis) to render.
 * Always shows first & last page, the current page, and one neighbour on each side.
 * Example for 12 pages on page 6: [1, "...", 5, 6, 7, "...", 12]
 */
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [];
  const add = (n: number | "...") => {
    if (pages[pages.length - 1] !== n) pages.push(n);
  };

  add(1);
  if (current > 3) add("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) add(p);
  if (current < total - 2) add("...");
  add(total);

  return pages;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const LIMIT = 8;

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<BackendDoctor[]>([]);
  const [pagination, setPagination] = useState<BackendPagination>({
    total: 0, page: 1, limit: LIMIT, totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Debounce search
  const debouncedSetSearch = useCallback(
    debounce((v: string) => {
      setDebouncedSearch(v);
      setPage(1);
    }, 400),
    []
  );

  function handleSearch(v: string) {
    setSearch(v);
    debouncedSetSearch(v);
  }

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setSpecialization("");
    setPage(1);
  }

  function goToPage(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Fetch
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await fetchDoctors({
          page,
          limit: LIMIT,
          search: debouncedSearch || undefined,
          specialization: specialization || undefined,
        });
        if (!cancelled) {
          setDoctors(result.doctors);
          setPagination(result.pagination);
        }
      } catch {
        if (!cancelled) {
          setDoctors([]);
          setPagination({ total: 0, page: 1, limit: LIMIT, totalPages: 1 });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [page, debouncedSearch, specialization]);

  const hasFilters = !!(search || specialization);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-4 py-14 sm:px-6"
        style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 50%, #0a2a5e 100%)" }}
      >
        {/* Glow blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 right-10 h-72 w-72 rounded-full opacity-20 blur-[100px]"
            style={{ background: "radial-gradient(circle,#3b82f6,transparent)" }} />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full opacity-15 blur-[80px]"
            style={{ background: "radial-gradient(circle,#0ea5e9,transparent)" }} />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <BadgeCheck className="h-3.5 w-3.5 text-blue-400" />
            {pagination.total > 0 ? `${pagination.total}+` : "Verified"} Doctors
          </div>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            Find the Right Doctor
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Browse verified specialists across 15+ specializations. Book an appointment in minutes.
          </p>

          {/* Search */}
          <div className="relative mt-8 mx-auto max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or specialization…"
              className="h-12 w-full rounded-xl border border-white/20 bg-white pl-11 pr-12 text-sm text-slate-900 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label="Search doctors"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row">

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <aside className="w-full lg:w-64 lg:shrink-0">
            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="mb-4 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium shadow-sm lg:hidden"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                Filters
                {hasFilters && (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">On</span>
                )}
              </div>
              <Filter className="h-4 w-4 text-slate-400" />
            </button>

            <div className={cn("flex flex-col gap-5 lg:flex", filtersOpen ? "flex" : "hidden")}>
              {/* Specialization panel */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Specialization
                </p>
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => { setSpecialization(""); setPage(1); }}
                    className={cn(
                      "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      !specialization ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    All Specializations
                  </button>
                  {SPECIALIZATIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setSpecialization(s); setPage(1); }}
                      className={cn(
                        "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        specialization === s ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear */}
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-500 hover:border-red-300 hover:text-red-500 transition-colors shadow-sm"
                >
                  <X className="h-4 w-4" />
                  Clear all filters
                </button>
              )}
            </div>
          </aside>

          {/* ── List ────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {isLoading
                  ? "Loading…"
                  : `${pagination.total} doctor${pagination.total !== 1 ? "s" : ""} found`}
                {specialization && (
                  <span className="ml-1 font-semibold text-slate-900">in {specialization}</span>
                )}
              </p>
              {/* Active filter chips */}
              <div className="flex flex-wrap gap-2">
                {specialization && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                    {specialization}
                    <button type="button" onClick={() => { setSpecialization(""); setPage(1); }} aria-label={`Remove ${specialization} filter`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {search && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                    &ldquo;{search}&rdquo;
                    <button type="button" onClick={() => handleSearch("")} aria-label="Remove search filter">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Cards / skeleton / empty */}
            {isLoading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : doctors.length === 0 ? (
              <EmptyState onClear={clearFilters} hasFilters={hasFilters} />
            ) : (
              <div className="flex flex-col gap-4">
                {doctors.map((doctor) => (
                  <DoctorListCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            )}

            {/* ── Pagination bar — always visible after load ───────────── */}
            {!isLoading && pagination.total > 0 && (
              <div className="mt-10 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">

                  {/* ← Previous */}
                  <button
                    type="button"
                    onClick={() => goToPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97]"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  {/* Centre — page numbers + "Page X of Y" */}
                  <div className="flex flex-col items-center gap-2">
                    {/* Page number pills */}
                    {pagination.totalPages > 1 && (
                      <nav className="flex items-center gap-1" aria-label="Page numbers">
                        {getPageNumbers(page, pagination.totalPages).map((p, i) =>
                          p === "..." ? (
                            <span
                              key={`ellipsis-${i}`}
                              className="flex h-8 w-8 items-center justify-center text-sm text-slate-400 select-none"
                              aria-hidden
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={p}
                              type="button"
                              onClick={() => goToPage(p)}
                              aria-current={p === page ? "page" : undefined}
                              aria-label={`Page ${p}`}
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold transition-all",
                                p === page
                                  ? "border-blue-600 bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.4)]"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
                              )}
                            >
                              {p}
                            </button>
                          )
                        )}
                      </nav>
                    )}

                    {/* "Page X of Y · Showing A–B of C" */}
                    <p className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-700">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      {" · "}
                      Showing{" "}
                      <span className="font-semibold text-slate-700">
                        {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, pagination.total)}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-700">{pagination.total}</span>{" "}
                      doctors
                    </p>
                  </div>

                  {/* Next → */}
                  <button
                    type="button"
                    onClick={() => goToPage(Math.min(pagination.totalPages, page + 1))}
                    disabled={page >= pagination.totalPages}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97]"
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
