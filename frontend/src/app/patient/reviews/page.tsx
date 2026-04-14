"use client";

import { useState, useEffect } from "react";
import { Star, Trash2, Loader2, MessageSquare } from "lucide-react";
import { getMyReviews, deleteReview } from "@/lib/api/reviews";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Review } from "@/types";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1,2,3,4,5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
  } catch { return iso; }
}

function getDoctorName(rev: Review): string {
  const d = rev.doctor;
  if (!d) return "Doctor";
  if (d.firstName || d.lastName) return `Dr. ${d.firstName ?? ""} ${d.lastName ?? ""}`.trim();
  return "Doctor";
}


export default function MyReviewsPage() {
  const [reviews, setReviews]       = useState<Review[]>([]);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyReviews();
        setReviews(Array.isArray(res) ? res : []);
      } catch {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    setDeletingId(id);
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete review.");
    } finally {
      setDeletingId(null);
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <PageContainer
      title="My Reviews"
      subtitle="Reviews you've submitted after completed appointments."
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <MessageSquare className="h-7 w-7 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-800">No reviews yet</p>
          <p className="text-sm text-slate-500">
            After a completed appointment, you can leave a review for the doctor.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary banner */}
          <div className="flex items-center gap-4 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{avgRating}</p>
              <p className="text-xs text-slate-500">Your average rating across {reviews.length} review{reviews.length > 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Review cards */}
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-semibold text-slate-900">{getDoctorName(rev)}</p>
                      <StarRow rating={rev.rating} />
                    </div>
                    {(rev.doctor as any)?.specializations?.[0] && (
                      <p className="mt-0.5 text-xs text-slate-500">{(rev.doctor as any).specializations[0]}</p>
                    )}
                    {rev.comment && (
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">{rev.comment}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">{formatDate(rev.createdAt)}</p>
                  </div>

                  <button
                    type="button"
                    title="Delete review"
                    disabled={deletingId === rev.id}
                    onClick={() => handleDelete(rev.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-all"
                  >
                    {deletingId === rev.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
