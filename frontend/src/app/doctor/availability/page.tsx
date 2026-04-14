"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar, Plus, Trash2, Loader2, Clock,
  CheckCircle2, AlertCircle, Layers, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  getMySlots, createSlot, createBulkSlots, deleteSlot,
} from "@/lib/api/slots";
import { PageContainer } from "@/components/layout/PageContainer";
import { DAYS_OF_WEEK } from "@/lib/constants";
import type { Slot } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(t: string): string {
  try {
    const [h, m] = t.split(":");
    const d = new Date(); d.setHours(Number(h), Number(m));
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return t; }
}

function getNext14Days(): Date[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d;
  });
}

const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DoctorAvailabilityPage() {
  const [slots, setSlots]           = useState<Slot[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0] ?? ""
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Single slot form
  const [showSingle, setShowSingle] = useState(false);
  const [sDate, setSDate]           = useState(selectedDate);
  const [sStart, setSStart]         = useState("09:00");
  const [sEnd, setSEnd]             = useState("09:30");
  const [sLoading, setSLoading]     = useState(false);
  const [sError, setSError]         = useState("");

  // Bulk slot form
  const [showBulk, setShowBulk]     = useState(false);
  const [bStart, setBStart]         = useState(new Date().toISOString().split("T")[0] ?? "");
  const [bEnd, setBEnd]             = useState("");
  const [bTimeStart, setBTimeStart] = useState("09:00");
  const [bTimeEnd, setBTimeEnd]     = useState("17:00");
  const [bDays, setBDays]           = useState<number[]>([1,2,3,4,5]);
  const [bLoading, setBLoading]     = useState(false);
  const [bError, setBError]         = useState("");
  const [bSuccess, setBSuccess]     = useState("");

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMySlots({ date: selectedDate });
      // Normalise: backend may return { slots: [] } or plain []
      const arr = Array.isArray(res) ? res : (res as any).slots ?? [];
      setSlots(arr);
    } catch { setSlots([]); }
    finally { setLoading(false); }
  }, [selectedDate]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  async function handleSingle(e: React.FormEvent) {
    e.preventDefault();
    setSLoading(true); setSError("");
    if (sEnd <= sStart) { setSError("End time must be after start time."); setSLoading(false); return; }
    try {
      await createSlot({ date: sDate, startTime: sStart, endTime: sEnd });
      setShowSingle(false); setSStart("09:00"); setSEnd("09:30");
      if (sDate === selectedDate) fetchSlots();
    } catch (err: unknown) { setSError(err instanceof Error ? err.message : "Failed to create slot."); }
    finally { setSLoading(false); }
  }

  async function handleBulk(e: React.FormEvent) {
    e.preventDefault();
    setBLoading(true); setBError(""); setBSuccess("");
    if (!bEnd || bEnd < bStart) { setBError("End date must be on or after start date."); setBLoading(false); return; }
    if (bDays.length === 0) { setBError("Select at least one day of the week."); setBLoading(false); return; }
    try {
      const created = await createBulkSlots({
        startDate: bStart,
        endDate: bEnd,
        startTime: bTimeStart,
        endTime: bTimeEnd,
        daysOfWeek: bDays,
      });
      const count = Array.isArray(created) ? created.length : (created as any).count ?? "multiple";
      setBSuccess(`✅ Created ${count} slot(s) successfully!`);
      setShowBulk(false);
      fetchSlots();
    } catch (err: unknown) { setBError(err instanceof Error ? err.message : "Failed to create slots."); }
    finally { setBLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this slot?")) return;
    setDeletingId(id);
    try {
      await deleteSlot(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed to delete."); }
    finally { setDeletingId(null); }
  }

  const next14 = getNext14Days();
  const available = slots.filter((s) => !s.status || s.status === "available");
  const booked    = slots.filter((s) => s.status === "booked");

  return (
    <PageContainer
      title="Availability"
      subtitle="Manage your consultation slots and weekly schedule."
      action={
        <div className="flex gap-2">
          <button type="button" onClick={() => { setShowBulk(true); setShowSingle(false); }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
            <Layers className="h-4 w-4" /> Bulk Create
          </button>
          <button type="button" onClick={() => { setShowSingle(true); setShowBulk(false); setSDate(selectedDate); }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all">
            <Plus className="h-4 w-4" /> Add Slot
          </button>
        </div>
      }
    >
      <div className="space-y-5">

        {/* ── Single slot form ─────────────────────────────────────────── */}
        {showSingle && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Plus className="h-4 w-4 text-blue-600" /> Add a Single Slot
            </h2>
            <form onSubmit={handleSingle} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Date</label>
                <input type="date" required value={sDate} min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSDate(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Start Time</label>
                <input type="time" required value={sStart} onChange={(e) => setSStart(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">End Time</label>
                <input type="time" required value={sEnd} onChange={(e) => setSEnd(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              {sError && (
                <div className="sm:col-span-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {sError}
                </div>
              )}
              <div className="sm:col-span-3 flex justify-end gap-3">
                <button type="button" onClick={() => setShowSingle(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={sLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {sLoading && <Loader2 className="h-4 w-4 animate-spin" />} Create Slot
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Bulk slot form ───────────────────────────────────────────── */}
        {showBulk && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Layers className="h-4 w-4 text-emerald-600" /> Bulk Create Slots
            </h2>
            <form onSubmit={handleBulk} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { label: "From Date", value: bStart, set: setBStart },
                  { label: "To Date",   value: bEnd,   set: setBEnd   },
                ].map(({ label, value, set }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">{label}</label>
                    <input type="date" required value={value} min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => set(e.target.value)}
                      className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                  </div>
                ))}
                {[
                  { label: "Daily Start", value: bTimeStart, set: setBTimeStart },
                  { label: "Daily End",   value: bTimeEnd,   set: setBTimeEnd   },
                ].map(({ label, value, set }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">{label}</label>
                    <input type="time" required value={value} onChange={(e) => set(e.target.value)}
                      className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                  </div>
                ))}
              </div>
              {/* Day selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Days of Week</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button key={day.value} type="button"
                      onClick={() => setBDays((prev) => prev.includes(day.value) ? prev.filter(d => d !== day.value) : [...prev, day.value])}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                        bDays.includes(day.value)
                          ? "border-emerald-500 bg-emerald-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                      }`}>
                      {day.label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              {bError && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{bError}</div>}
              {bSuccess && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-100 px-3 py-2.5 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />{bSuccess}</div>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowBulk(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={bLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                  {bLoading && <Loader2 className="h-4 w-4 animate-spin" />} Create Slots
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Date picker ──────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-1 min-w-max">
            {next14.map((date) => {
              const iso = date.toISOString().split("T")[0] ?? "";
              const selected = iso === selectedDate;
              const isToday  = iso === new Date().toISOString().split("T")[0];
              return (
                <button key={iso} type="button" onClick={() => setSelectedDate(iso)}
                  className={`flex shrink-0 flex-col items-center rounded-xl border px-4 py-2.5 text-sm transition-all ${
                    selected
                      ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                  }`}>
                  <span className="text-xs font-medium">{isToday ? "Today" : DAY_LABELS[date.getDay()]}</span>
                  <span className={`text-xl font-extrabold leading-tight ${selected ? "" : "text-slate-800"}`}>{date.getDate()}</span>
                  <span className="text-xs">{date.toLocaleDateString("en-IN", { month: "short" })}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Slots for selected date ──────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
        ) : slots.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Clock className="h-10 w-10 text-slate-300" />
            <p className="font-medium text-slate-600">No slots for this date</p>
            <button type="button" onClick={() => { setShowSingle(true); setShowBulk(false); setSDate(selectedDate); }}
              className="text-sm text-blue-600 hover:underline">+ Add a slot</button>
          </div>
        ) : (
          <div className="space-y-3">
            {[{ label: `Available (${available.length})`, items: available, color: "border-emerald-100 bg-emerald-50", dot: "bg-emerald-400" },
              { label: `Booked (${booked.length})`,    items: booked,    color: "border-blue-100 bg-blue-50",    dot: "bg-blue-400" }
            ].map(({ label, items, color, dot }) =>
              items.length > 0 ? (
                <div key={label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((slot) => (
                      <div key={slot.id} className={`group flex items-center justify-between rounded-xl border px-3 py-2.5 ${color}`}>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                          <span className="text-sm font-medium text-slate-800">
                            {formatTime(slot.startTime)}
                          </span>
                        </div>
                        {slot.status !== "booked" && (
                          <button type="button" disabled={deletingId === slot.id}
                            onClick={() => handleDelete(slot.id)}
                            className="ml-2 opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-all">
                            {deletingId === slot.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
