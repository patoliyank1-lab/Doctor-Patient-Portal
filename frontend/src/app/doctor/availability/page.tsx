"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar, Plus, Trash2, Loader2, Clock,
  CheckCircle2, AlertCircle, Layers, RefreshCw,
  Pencil, X, ChevronLeft, ChevronRight,
  ToggleLeft, ToggleRight, Info,
} from "lucide-react";
import {
  getMySlots, createSlot, createBulkSlots, deleteSlot, updateSlot,
  type CreateSlotPayload,
} from "@/lib/api/slots";
import { PageContainer } from "@/components/layout/PageContainer";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Slot } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────

// Use LOCAL date for today — toISOString() returns UTC which can be yesterday at
// midnight IST (UTC+5:30 offset). Format manually from local date components.
const _now = new Date();
const TODAY_ISO = [
  _now.getFullYear(),
  String(_now.getMonth() + 1).padStart(2, "0"),
  String(_now.getDate()).padStart(2, "0"),
].join("-") as string;


const DURATIONS = [
  { label: "15 min",  value: 15 },
  { label: "30 min",  value: 30 },
  { label: "45 min",  value: 45 },
  { label: "60 min",  value: 60 },
];

/** Parse "HH:mm" or full ISO time string → total minutes from midnight */
function toMinutes(t: string): number {
  // Prisma @db.Time → "1970-01-01T09:00:00.000Z" on the wire
  if (t.includes("T") || t.includes("Z")) {
    const d = new Date(t);
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  }
  // Plain "HH:mm" or "HH:mm:ss"
  const parts = t.split(":");
  return Number(parts[0] ?? 0) * 60 + Number(parts[1] ?? 0);
}

/** Format any time representation to "HH:MM AM/PM" */
function fmtTime(t: string): string {
  try {
    const mins = toMinutes(t);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return t; }
}

/** Parse any date representation → "YYYY-MM-DD" in LOCAL timezone.
 * Must NOT use split("T")[0] — Prisma @db.Date returns UTC midnight
 * (e.g. "2026-04-13T18:30:00.000Z" = 2026-04-14 in IST). Using local
 * getFullYear/Month/Date gives the correct local calendar date.
 */
function toDateIso(raw: string): string {
  const d = new Date(raw);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}


/** Format "YYYY-MM-DD" → "Mon, 15 Jun" (parsed as LOCAL midnight to avoid day-shift) */
function fmtDate(iso: string): string {
  try {
    // Append T00:00 (no Z) so the string is parsed as local midnight,
    // preventing a 1-day-back shift in UTC+ timezones like IST.
    const d = new Date(`${iso}T00:00`);
    return d.toLocaleDateString("en-IN", {
      weekday: "short", day: "numeric", month: "short",
    });
  } catch { return iso; }
}

/** Convert a Date → "YYYY-MM-DD" using LOCAL timezone (not UTC).
 * `toISOString().split("T")[0]` uses UTC and can return yesterday's date
 * in UTC+ timezones like IST (+05:30) before 05:30 AM local time.
 */
function localIso(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Add `mins` minutes to "HH:mm" and return "HH:mm" */
function addMinutes(hhmm: string, mins: number): string {
  const [hRaw, mRaw] = hhmm.split(":");
  const total = Number(hRaw) * 60 + Number(mRaw) + mins;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Expand a date range + days-of-week into individual slot descriptors */
function expandBulkSlots(
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  daysOfWeek: number[],
  durationMins: number,
): CreateSlotPayload[] {
  const slots: CreateSlotPayload[] = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end    = new Date(`${endDate}T00:00:00`);

  while (cursor <= end) {
    if (daysOfWeek.includes(cursor.getDay())) {
      // Use local date components to avoid UTC midnight shift in IST
      const dateIso = localIso(cursor);

      // Generate slots within the time window based on duration
      let slotStart = startTime;
      while (true) {
        const slotEnd = addMinutes(slotStart, durationMins);
        // Stop if slotEnd exceeds endTime
        if (toMinutes(slotEnd) > toMinutes(endTime)) break;
        slots.push({ date: dateIso, startTime: slotStart, endTime: slotEnd });
        slotStart = slotEnd;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return slots;
}

// ─────────────────────────────────────────────────────────────────────────────
// Slot status badge
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ isBooked }: { isBooked: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border",
        isBooked
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200"
      )}
    >
      <span className={cn("mr-1 h-1.5 w-1.5 rounded-full", isBooked ? "bg-rose-400" : "bg-emerald-400")} />
      {isBooked ? "Booked" : "Available"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton loader
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="h-14 animate-pulse rounded-xl border border-slate-100 bg-slate-50" />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Slot Modal
// ─────────────────────────────────────────────────────────────────────────────

interface EditModalProps {
  slot: Slot;
  onClose: () => void;
  onSaved: (updated: Slot) => void;
}

function EditSlotModal({ slot, onClose, onSaved }: EditModalProps) {
  const origDate = toDateIso(slot.date);
  const [date, setDate]         = useState(origDate);
  const [start, setStart]       = useState(formatTimeForInput(slot.startTime));
  const [end, setEnd]           = useState(formatTimeForInput(slot.endTime));
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  function formatTimeForInput(t: string): string {
    const mins = toMinutes(t);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (end <= start) { setError("End time must be after start time."); return; }
    setSaving(true); setError("");
    try {
      const updated = await updateSlot(slot.id, { date, startTime: start, endTime: end });
      onSaved(updated);
      toast.success("Slot updated.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update slot.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Edit Slot</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="edit-date" className="text-xs font-semibold text-slate-600">Date</label>
            <input
              id="edit-date"
              type="date"
              required
              value={date}
              min={TODAY_ISO}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="edit-start" className="text-xs font-semibold text-slate-600">Start</label>
              <input id="edit-start" type="time" required value={start} onChange={(e) => setStart(e.target.value)} className="input-field" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-end" className="text-xs font-semibold text-slate-600">End</label>
              <input id="edit-end" type="time" required value={end} onChange={(e) => setEnd(e.target.value)} className="input-field" />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DoctorAvailabilityPage() {
  // ── Core state ──────────────────────────────────────────────────────────────
  const [slots, setSlots]           = useState<Slot[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 30, totalPages: 1 });
  const [loading, setLoading]       = useState(true);

  // View mode: "calendar" (filter by date) or "list" (all slots paginated)
  const [viewMode, setViewMode]     = useState<"calendar" | "list">("calendar");

  // Calendar view — selected date
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_ISO);
  const [calPage, setCalPage]           = useState(0); // 0 = today's 7 days, 1 = next 7, etc.

  // Edit modal
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Panel visibility ─────────────────────────────────────────────────────────
  const [panel, setPanel] = useState<"none" | "single" | "bulk">("none");

  // ── Single slot form ─────────────────────────────────────────────────────────
  const [sDate, setSDate]       = useState(TODAY_ISO);
  const [sStart, setSStart]     = useState("09:00");
  const [sDuration, setSDuration] = useState(30);
  const [sLoading, setSLoading] = useState(false);
  const [sError, setSError]     = useState("");

  const sEnd = useMemo(() => addMinutes(sStart, sDuration), [sStart, sDuration]);

  // ── Bulk slot form ───────────────────────────────────────────────────────────
  const [bDateFrom, setBDateFrom]     = useState(TODAY_ISO);
  const [bDateTo, setBDateTo]         = useState(TODAY_ISO);
  const [bTimeStart, setBTimeStart]   = useState("09:00");
  const [bTimeEnd, setBTimeEnd]       = useState("17:00");
  const [bDays, setBDays]             = useState<number[]>([1, 2, 3, 4, 5]);
  const [bDuration, setBDuration]     = useState(30);
  const [bLoading, setBLoading]       = useState(false);
  const [bError, setBError]           = useState("");
  const [bPreviewCount, setBPreviewCount] = useState(0);

  // Preview count for bulk
  useEffect(() => {
    if (panel !== "bulk") return;
    try {
      const preview = expandBulkSlots(bDateFrom, bDateTo, bTimeStart, bTimeEnd, bDays, bDuration);
      setBPreviewCount(preview.length);
    } catch { setBPreviewCount(0); }
  }, [panel, bDateFrom, bDateTo, bTimeStart, bTimeEnd, bDays, bDuration]);

  // ── Data fetch ───────────────────────────────────────────────────────────────
  const fetchSlots = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params: Parameters<typeof getMySlots>[0] = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (viewMode === "calendar") params.date = selectedDate;

      const res = await getMySlots(params);
      // Normalise the data — backend returns slots with ISO datetime strings
      const normalised = (res.slots ?? []).map((s) => ({
        ...s,
        date: toDateIso(s.date),
        // Keep startTime/endTime as-is; fmtTime handles both formats
      }));
      setSlots(normalised);
      setPagination((p) => ({ ...p, ...res.pagination }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load slots.");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedDate, pagination.page, pagination.limit]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  // ── Single slot create ───────────────────────────────────────────────────────
  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSLoading(true); setSError("");
    try {
      const created = await createSlot({ date: sDate, startTime: sStart, endTime: sEnd });
      toast.success(`Slot created: ${fmtTime(sStart)} – ${fmtTime(sEnd)} on ${fmtDate(sDate)}`);
      setPanel("none");

      // Refresh the view; if calendar mode and date matches, show it immediately
      if (viewMode === "calendar" && sDate === selectedDate) {
        const normalised = { ...created, date: toDateIso(created.date) };
        setSlots((prev) => [...prev, normalised].sort((a, b) =>
          toMinutes(a.startTime) - toMinutes(b.startTime)
        ));
      } else {
        // Navigate to that date
        setSelectedDate(sDate);
        setViewMode("calendar");
      }
    } catch (err: unknown) {
      setSError(err instanceof Error ? err.message : "Failed to create slot.");
    } finally {
      setSLoading(false);
    }
  }

  // ── Bulk slot create ─────────────────────────────────────────────────────────
  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBLoading(true); setBError("");

    if (bDays.length === 0) {
      setBError("Select at least one day of the week.");
      setBLoading(false);
      return;
    }
    if (bDateTo < bDateFrom) {
      setBError("End date must be on or after start date.");
      setBLoading(false);
      return;
    }
    if (toMinutes(bTimeEnd) <= toMinutes(bTimeStart)) {
      setBError("Daily end time must be after start time.");
      setBLoading(false);
      return;
    }

    const slotsToCreate = expandBulkSlots(bDateFrom, bDateTo, bTimeStart, bTimeEnd, bDays, bDuration);
    if (slotsToCreate.length === 0) {
      setBError("No slots generated. Check your date range and selected days.");
      setBLoading(false);
      return;
    }
    if (slotsToCreate.length > 200) {
      setBError(`Too many slots (${slotsToCreate.length}). Reduce the date range or increase duration.`);
      setBLoading(false);
      return;
    }

    try {
      const result = await createBulkSlots({ slots: slotsToCreate });
      const count = result.createdCount ?? slotsToCreate.length;
      toast.success(`${count} slot${count !== 1 ? "s" : ""} created successfully!`);
      setPanel("none");
      fetchSlots(true);
    } catch (err: unknown) {
      setBError(err instanceof Error ? err.message : "Failed to create slots.");
    } finally {
      setBLoading(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!window.confirm("Delete this slot? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteSlot(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
      setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
      toast.success("Slot deleted.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete slot.");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Edit save ────────────────────────────────────────────────────────────────
  function handleEditSaved(updated: Slot) {
    const normalised = { ...updated, date: toDateIso(updated.date) };
    setSlots((prev) => prev.map((s) => s.id === updated.id ? normalised : s));
    setEditingSlot(null);
  }

  // ── Calendar date range ──────────────────────────────────────────────────────
  const calendarDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + calPage * 7 + i);
      return localIso(d);

    });
  }, [calPage]);

  // Group slots by date for list view
  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const arr = map.get(s.date) ?? [];
      arr.push(s);
      map.set(s.date, arr);
    }
    return map;
  }, [slots]);

  // Calendar view: only slots for selected date
  const dateSlots = useMemo(
    () => slots.filter((s) => s.date === selectedDate),
    [slots, selectedDate]
  );

  const available = dateSlots.filter((s) => !(s as any).isBooked);
  const booked    = dateSlots.filter((s) => (s as any).isBooked);

  return (
    <>
      {/* Edit modal */}
      {editingSlot && (
        <EditSlotModal
          slot={editingSlot}
          onClose={() => setEditingSlot(null)}
          onSaved={handleEditSaved}
        />
      )}

      <PageContainer
        title="Availability"
        subtitle="Manage your consultation slots and weekly schedule."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="refresh-slots-btn"
              onClick={() => fetchSlots(false)}
              disabled={loading}
              aria-label="Refresh slots"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
            <button
              type="button"
              id="bulk-create-btn"
              onClick={() => setPanel((p) => p === "bulk" ? "none" : "bulk")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold shadow-sm transition-all",
                panel === "bulk"
                  ? "border-emerald-500 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              <Layers className="h-4 w-4" /> Bulk Create
            </button>
            <button
              type="button"
              id="add-slot-btn"
              onClick={() => { setPanel((p) => p === "single" ? "none" : "single"); setSDate(selectedDate); }}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all",
                panel === "single"
                  ? "bg-blue-700 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              <Plus className="h-4 w-4" /> Add Slot
            </button>
          </div>
        }
      >
        <div className="space-y-5">

          {/* ── Single slot panel ──────────────────────────────────────────── */}
          {panel === "single" && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Plus className="h-4 w-4 text-blue-600" /> Add a Single Slot
                </h2>
                <button type="button" onClick={() => setPanel("none")} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSingleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Date */}
                  <div className="space-y-1.5">
                    <label htmlFor="s-date" className="text-xs font-semibold text-slate-600">Date</label>
                    <input
                      id="s-date"
                      type="date"
                      required
                      value={sDate}
                      min={TODAY_ISO}
                      onChange={(e) => setSDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  {/* Start time */}
                  <div className="space-y-1.5">
                    <label htmlFor="s-start" className="text-xs font-semibold text-slate-600">Start Time</label>
                    <input
                      id="s-start"
                      type="time"
                      required
                      value={sStart}
                      onChange={(e) => setSStart(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  {/* Duration */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Duration</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {DURATIONS.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => setSDuration(d.value)}
                          className={cn(
                            "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all",
                            sDuration === d.value
                              ? "border-blue-500 bg-blue-600 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* End time (computed) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">End Time (auto)</label>
                    <div className="flex h-[42px] items-center rounded-xl border border-blue-200 bg-white px-3 text-sm font-medium text-slate-700">
                      {fmtTime(sEnd)}
                    </div>
                  </div>
                </div>

                {sError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {sError}
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setPanel("none")}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" id="single-slot-submit" disabled={sLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                    {sLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create Slot
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Bulk slot panel ────────────────────────────────────────────── */}
          {panel === "bulk" && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Layers className="h-4 w-4 text-emerald-600" /> Bulk Create Slots
                </h2>
                <button type="button" onClick={() => setPanel("none")} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleBulkSubmit} className="space-y-4">
                {/* Date range */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="b-from" className="text-xs font-semibold text-slate-600">From Date</label>
                    <input id="b-from" type="date" required value={bDateFrom} min={TODAY_ISO}
                      onChange={(e) => setBDateFrom(e.target.value)}
                      className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="b-to" className="text-xs font-semibold text-slate-600">To Date</label>
                    <input id="b-to" type="date" required value={bDateTo} min={bDateFrom}
                      onChange={(e) => setBDateTo(e.target.value)}
                      className="input-field" />
                  </div>
                </div>

                {/* Time range */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="b-time-start" className="text-xs font-semibold text-slate-600">Daily Start</label>
                    <input id="b-time-start" type="time" required value={bTimeStart}
                      onChange={(e) => setBTimeStart(e.target.value)}
                      className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="b-time-end" className="text-xs font-semibold text-slate-600">Daily End</label>
                    <input id="b-time-end" type="time" required value={bTimeEnd}
                      onChange={(e) => setBTimeEnd(e.target.value)}
                      className="input-field" />
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Slot Duration</label>
                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map((d) => (
                      <button key={d.value} type="button" onClick={() => setBDuration(d.value)}
                        className={cn(
                          "rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all",
                          bDuration === d.value
                            ? "border-emerald-500 bg-emerald-600 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                        )}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Days of week */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Days of Week</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button key={day.value} type="button"
                        aria-pressed={bDays.includes(day.value)}
                        onClick={() => setBDays((prev) =>
                          prev.includes(day.value)
                            ? prev.filter((d) => d !== day.value)
                            : [...prev, day.value]
                        )}
                        className={cn(
                          "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                          bDays.includes(day.value)
                            ? "border-emerald-500 bg-emerald-600 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                        )}>
                        {(day.label as string).slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview pill */}
                {bPreviewCount > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-100 px-4 py-2.5 text-sm text-emerald-800">
                    <Info className="h-4 w-4 shrink-0" />
                    This will create <strong>{bPreviewCount}</strong> slot{bPreviewCount !== 1 ? "s" : ""} across the selected range.
                  </div>
                )}

                {bError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {bError}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setPanel("none")}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" id="bulk-slot-submit" disabled={bLoading || bPreviewCount === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                    {bLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create {bPreviewCount > 0 ? `${bPreviewCount} Slots` : "Slots"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── View mode toggle ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
              <button
                id="view-calendar-btn"
                type="button"
                onClick={() => { setViewMode("calendar"); }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
                  viewMode === "calendar" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Calendar className="h-3.5 w-3.5" /> Calendar
              </button>
              <button
                id="view-list-btn"
                type="button"
                onClick={() => { setViewMode("list"); }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
                  viewMode === "list" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Layers className="h-3.5 w-3.5" /> All Slots
              </button>
            </div>

            {viewMode === "list" && pagination.total > 0 && (
              <p className="text-xs text-slate-500">{pagination.total} total slot{pagination.total !== 1 ? "s" : ""}</p>
            )}
          </div>

          {/* ── CALENDAR VIEW ─────────────────────────────────────────────── */}
          {viewMode === "calendar" && (
            <>
              {/* Week navigator */}
              <div className="flex items-center gap-2">
                <button type="button" disabled={calPage <= 0} onClick={() => setCalPage((p) => p - 1)}
                  aria-label="Previous week"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1">
                  {calendarDates.map((iso) => {
                    const d = new Date(`${iso}T00:00:00`);
                    const isSelected = iso === selectedDate;
                    const isToday    = iso === TODAY_ISO;
                    const hasSlots   = slots.some((s) => s.date === iso);
                    return (
                      <button key={iso} type="button"
                        id={`cal-date-${iso}`}
                        onClick={() => setSelectedDate(iso)}
                        aria-label={`Select date ${fmtDate(iso)}`}
                        aria-pressed={isSelected}
                        className={cn(
                          "flex shrink-0 flex-col items-center rounded-xl border px-3 py-2.5 text-sm transition-all",
                          isSelected
                            ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                        )}>
                        <span className="text-[10px] font-semibold uppercase tracking-wide">
                          {isToday ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" })}
                        </span>
                        <span className="text-xl font-extrabold leading-tight">{d.getDate()}</span>
                        <span className={cn("text-[10px]", isSelected ? "text-blue-100" : "text-slate-400")}>
                          {d.toLocaleDateString("en-IN", { month: "short" })}
                        </span>
                        {hasSlots && !isSelected && (
                          <span className="mt-0.5 h-1 w-1 rounded-full bg-blue-400" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => setCalPage((p) => p + 1)}
                  aria-label="Next week"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Selected date header */}
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-slate-800">
                  <Calendar className="h-4 w-4 text-blue-500" aria-hidden="true" />
                  {fmtDate(selectedDate)}
                  {selectedDate === TODAY_ISO && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Today</span>
                  )}
                </h2>
                <span className="text-xs text-slate-400">
                  {dateSlots.length === 0 ? "No slots" : `${available.length} available · ${booked.length} booked`}
                </span>
              </div>

              {/* Slot grid */}
              {loading ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : dateSlots.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                    <Clock className="h-7 w-7 text-slate-300" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">No slots for {fmtDate(selectedDate)}</p>
                    <p className="mt-0.5 text-sm text-slate-400">Add a single slot or use Bulk Create.</p>
                  </div>
                  <button type="button"
                    onClick={() => { setPanel("single"); setSDate(selectedDate); }}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100">
                    + Add Slot
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {[
                    { label: "Available", items: available, accent: "emerald" },
                    { label: "Booked",    items: booked,    accent: "rose" },
                  ].map(({ label, items, accent }) =>
                    items.length > 0 ? (
                      <div key={label}>
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                          {label} ({items.length})
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                          {items.map((slot) => (
                            <SlotCard
                              key={slot.id}
                              slot={slot}
                              accent={accent as "emerald" | "rose"}
                              deletingId={deletingId}
                              onDelete={handleDelete}
                              onEdit={() => setEditingSlot(slot)}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </>
          )}

          {/* ── LIST VIEW ─────────────────────────────────────────────────── */}
          {viewMode === "list" && (
            <>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-xl border border-slate-100 bg-slate-50" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                  <Clock className="h-10 w-10 text-slate-300" />
                  <div>
                    <p className="font-semibold text-slate-700">No slots found</p>
                    <p className="mt-0.5 text-sm text-slate-400">Create slots using Add Slot or Bulk Create.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {/* Table header */}
                  <div className="hidden grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 sm:grid">
                    <span>Date</span>
                    <span>Start</span>
                    <span>End</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>

                  {/* Group by date */}
                  {Array.from(slotsByDate.entries()).map(([date, daySlots]) => (
                    <div key={date}>
                      {/* Date group header */}
                      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-2">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-500" aria-hidden="true" />
                        <span className="text-xs font-semibold text-slate-600">
                          {fmtDate(date)}
                          {date === TODAY_ISO && (
                            <span className="ml-2 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">Today</span>
                          )}
                        </span>
                        <span className="ml-auto text-[10px] text-slate-400">{daySlots.length} slot{daySlots.length !== 1 ? "s" : ""}</span>
                      </div>
                      {/* Slot rows */}
                      {daySlots.map((slot) => {
                        const isBooked = !!(slot as any).isBooked;
                        return (
                          <div key={slot.id}
                            className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-50 px-5 py-3 last:border-0 sm:grid-cols-[1fr_1fr_1fr_auto_auto]"
                          >
                            {/* Mobile: combined */}
                            <div className="sm:hidden">
                              <p className="text-sm font-semibold text-slate-800">
                                {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}
                              </p>
                              <StatusBadge isBooked={isBooked} />
                            </div>
                            {/* Desktop cells */}
                            <span className="hidden text-sm text-slate-800 sm:block">{fmtDate(slot.date)}</span>
                            <span className="hidden text-sm text-slate-700 sm:block">{fmtTime(slot.startTime)}</span>
                            <span className="hidden text-sm text-slate-700 sm:block">{fmtTime(slot.endTime)}</span>
                            <span className="hidden sm:block"><StatusBadge isBooked={isBooked} /></span>
                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              {!isBooked && (
                                <button type="button"
                                  id={`edit-slot-${slot.id}`}
                                  onClick={() => setEditingSlot(slot)}
                                  aria-label="Edit slot"
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {!isBooked && (
                                <button type="button"
                                  id={`delete-slot-${slot.id}`}
                                  disabled={deletingId === slot.id}
                                  onClick={() => handleDelete(slot.id)}
                                  aria-label="Delete slot"
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-colors">
                                  {deletingId === slot.id
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <Trash2 className="h-3.5 w-3.5" />}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3">
                  <p className="text-xs text-slate-500">
                    Page {pagination.page} of {pagination.totalPages} · {pagination.total} slots
                  </p>
                  <div className="flex items-center gap-2">
                    <button type="button"
                      id="prev-page"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 disabled:opacity-40">
                      ‹
                    </button>
                    <button type="button"
                      id="next-page"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 disabled:opacity-40">
                      ›
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SlotCard — reusable card for calendar view
// ─────────────────────────────────────────────────────────────────────────────

interface SlotCardProps {
  slot: Slot;
  accent: "emerald" | "rose";
  deletingId: string | null;
  onDelete: (id: string) => void;
  onEdit: () => void;
}

function SlotCard({ slot, accent, deletingId, onDelete, onEdit }: SlotCardProps) {
  const isBooked = !!(slot as any).isBooked;
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border p-3 transition-all",
        accent === "emerald"
          ? "border-emerald-100 bg-emerald-50 hover:border-emerald-200 hover:shadow-sm"
          : "border-rose-100 bg-rose-50"
      )}
    >
      {/* Time */}
      <p className="text-sm font-semibold text-slate-800">
        {fmtTime(slot.startTime)}
      </p>
      <p className="text-xs text-slate-500">
        – {fmtTime(slot.endTime)}
      </p>

      {/* Status dot */}
      <div className="mt-2.5">
        <StatusBadge isBooked={isBooked} />
      </div>

      {/* Actions (visible on hover) */}
      {!isBooked && (
        <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={onEdit}
            id={`cal-edit-${slot.id}`}
            aria-label="Edit slot"
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm hover:text-blue-600">
            <Pencil className="h-3 w-3" />
          </button>
          <button type="button" disabled={deletingId === slot.id} onClick={() => onDelete(slot.id)}
            id={`cal-delete-${slot.id}`}
            aria-label="Delete slot"
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm hover:text-red-500 disabled:opacity-50">
            {deletingId === slot.id
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Trash2 className="h-3 w-3" />}
          </button>
        </div>
      )}
    </div>
  );
}
