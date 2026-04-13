import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { Review } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Payloads
// ─────────────────────────────────────────────────────────────────────────────

export interface SubmitReviewPayload {
  appointmentId: string;
  rating: number;   // 1–5
  comment: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /reviews — Submit a review after a completed appointment (Patient only).
 * One review per appointment is allowed.
 */
export async function submitReview(
  payload: SubmitReviewPayload
): Promise<Review> {
  return fetchWithAuth<Review>("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** GET /reviews/doctor/:doctorId — Get all reviews for a doctor (public). */
export async function getDoctorReviews(doctorId: string): Promise<Review[]> {
  return fetchWithAuth<Review[]>(`/reviews/doctor/${doctorId}`);
}

/** GET /reviews/my — Get reviews submitted by the logged-in patient. */
export async function getMyReviews(): Promise<Review[]> {
  return fetchWithAuth<Review[]>("/reviews/my");
}

/** DELETE /reviews/:id — Delete a review (Patient or Admin). */
export async function deleteReview(id: string): Promise<void> {
  return fetchWithAuth<void>(`/reviews/${id}`, { method: "DELETE" });
}
