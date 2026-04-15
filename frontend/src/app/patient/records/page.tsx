"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText,
  Upload,
  Trash2,
  Loader2,
  FolderOpen,
  Download,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  File,
  ImageIcon,
  FlaskConical,
  ScanLine,
} from "lucide-react";
import { getMyRecords, uploadMedicalRecord, deleteRecord } from "@/lib/api/medical-records";
import { getPresignedUrl, uploadToS3 } from "@/lib/api/uploads";
import { PageContainer } from "@/components/layout/PageContainer";
import type { MedicalRecord } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  prescription: { label: "Prescription",  icon: <FileText     className="h-4 w-4" />, color: "bg-blue-50 text-blue-700 border-blue-100" },
  lab_report:   { label: "Lab Report",    icon: <FlaskConical className="h-4 w-4" />, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  imaging:      { label: "Imaging",       icon: <ScanLine     className="h-4 w-4" />, color: "bg-purple-50 text-purple-700 border-purple-100" },
  other:        { label: "Other",         icon: <File         className="h-4 w-4" />, color: "bg-slate-50 text-slate-600 border-slate-200" },
};

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

function isImage(mimeType?: string): boolean {
  return Boolean(mimeType?.startsWith("image/"));
}

const FILTER_TYPES = [
  { value: "", label: "All Types" },
  { value: "prescription", label: "Prescriptions" },
  { value: "lab_report",   label: "Lab Reports" },
  { value: "imaging",      label: "Imaging" },
  { value: "other",        label: "Other" },
];

const PAGE_SIZE = 12;

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function MedicalRecordsPage() {
  const [records, setRecords]         = useState<MedicalRecord[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [typeFilter, setTypeFilter]   = useState("");
  const [loading, setLoading]         = useState(true);
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  // Upload state
  const [uploading, setUploading]     = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType]   = useState<"prescription" | "lab_report" | "imaging" | "other">("prescription");
  const [uploadFile, setUploadFile]   = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyRecords({ page, limit: PAGE_SIZE, type: typeFilter || undefined });
      setRecords((res.data ?? []) as MedicalRecord[]);
      setTotal(res.total ?? 0);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // ── Upload handler ──────────────────────────────────────────────────────────
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) return;
    setUploading(true);
    setUploadStatus("idle");
    setUploadError("");
    try {
      // 1. Get presigned URL
      const temp = await getPresignedUrl(
        uploadFile.name,
        uploadFile.type,
        uploadFile.size,
        "medical-records"
      );

      console.log(`[DEBUG] :  ${JSON.stringify(temp)}`)
      // 2. Upload to S3
      await uploadToS3(temp.uploadUrl, uploadFile);
      // 3. Save metadata
      await uploadMedicalRecord({
        title: uploadTitle.trim(),
        type: uploadType,
        fileUrl: temp.publicUrl,
        fileSize: uploadFile.size,
        mimeType: uploadFile.type,
      });
      setUploadStatus("success");
      setUploadTitle("");
      setUploadFile(null);
      setShowUploadForm(false);
      fetchRecords();
    } catch (err: unknown) {
      setUploadStatus("error");
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => t - 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageContainer
      title="Medical Records"
      subtitle="Store and manage your prescriptions, lab reports, and imaging files."
      action={
        <button
          type="button"
          id="upload-record-btn"
          onClick={() => { setShowUploadForm((v) => !v); setUploadStatus("idle"); }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
        >
          <Upload className="h-4 w-4" />
          Upload Record
        </button>
      }
    >
      <div className="space-y-6">

        {/* ── Upload form panel ────────────────────────────────────────── */}
        {showUploadForm && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Upload className="h-4 w-4 text-blue-600" />
                Upload a new record
              </h2>
              <button type="button" onClick={() => setShowUploadForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Title */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="upload-title" className="text-xs font-semibold text-slate-600">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="upload-title"
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Blood test results – April 2026"
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label htmlFor="upload-type" className="text-xs font-semibold text-slate-600">Record Type</label>
                  <select
                    id="upload-type"
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as typeof uploadType)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="prescription">Prescription</option>
                    <option value="lab_report">Lab Report</option>
                    <option value="imaging">Imaging</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* File picker */}
                <div className="space-y-1.5">
                  <label htmlFor="upload-file" className="text-xs font-semibold text-slate-600">
                    File <span className="text-red-500">*</span>
                  </label>
                  <div
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-blue-300 bg-white px-3 py-2.5 text-sm text-slate-500 hover:border-blue-500 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadFile
                      ? <><File className="h-4 w-4 text-blue-500 shrink-0" /><span className="truncate text-slate-700">{uploadFile.name}</span></>
                      : <><Upload className="h-4 w-4 shrink-0" /><span>Click to select file (PDF, image, max 10 MB)</span></>}
                  </div>
                  <input
                    ref={fileInputRef}
                    id="upload-file"
                    type="file"
                    className="hidden"
                    accept="application/pdf,image/*"
                    required
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              {/* Feedback */}
              {uploadStatus === "error" && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {uploadError}
                </div>
              )}
              {uploadStatus === "success" && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Record uploaded successfully!
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowUploadForm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={uploading || !uploadFile || !uploadTitle.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition-all">
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Type filter ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 shrink-0 text-slate-400" />
          {FILTER_TYPES.map((f) => (
            <button key={f.value} type="button"
              onClick={() => { setTypeFilter(f.value); setPage(1); }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                typeFilter === f.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Records count ────────────────────────────────────────────── */}
        {!loading && total > 0 && (
          <p className="text-sm text-slate-500">{total} record{total > 1 ? "s" : ""} found</p>
        )}

        {/* ── Loading ──────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
          </div>
        )}

        {/* ── Empty ────────────────────────────────────────────────────── */}
        {!loading && records.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <FolderOpen className="h-7 w-7 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-800">No records found</p>
            <p className="text-sm text-slate-500">
              {typeFilter ? "Try a different type filter." : "Upload your first medical record above."}
            </p>
          </div>
        )}

        {/* ── Records grid ─────────────────────────────────────────────── */}
        {!loading && records.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {records.map((rec) => {
              const cfg = TYPE_CONFIG[rec.type] ?? TYPE_CONFIG.other!;
              return (
                <div key={rec.id} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                  {/* Icon + badge */}
                  <div className="mb-3 flex items-start justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <button
                      type="button"
                      title="Delete record"
                      disabled={deletingId === rec.id}
                      onClick={() => handleDelete(rec.id)}
                      className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-all"
                    >
                      {deletingId === rec.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <h3 className="font-semibold text-slate-900 line-clamp-2">{rec.title}</h3>
                  {rec.description && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{rec.description}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>{formatDate(rec.createdAt)}</span>
                    {rec.fileSize && <span>{formatBytes(rec.fileSize)}</span>}
                  </div>

                  {/* View / Download */}
                  <a
                    href={rec.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
                  >
                    {isImage(rec.mimeType)
                      ? <><ImageIcon className="h-4 w-4" /> View Image</>
                      : <><Download className="h-4 w-4" /> Download</>}
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 disabled:opacity-40 transition-all">
              ‹
            </button>
            <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 disabled:opacity-40 transition-all">
              ›
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
