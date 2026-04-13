import { StarRating } from "./StarRating";
import { Avatar } from "@/components/ui/avatar";
import { formatDateShort } from "@/lib/utils";
import type { Review } from "@/types";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        {/* Patient avatar */}
        <Avatar
          name={review.patient?.user?.name}
          src={review.patient?.profileImage}
          size="sm"
          className="shrink-0 mt-0.5"
        />

        <div className="flex-1 min-w-0">
          {/* Name + date */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {review.patient?.user?.name ?? "Patient"}
            </p>
            <time
              dateTime={review.createdAt}
              className="shrink-0 text-xs text-muted-foreground"
            >
              {formatDateShort(review.createdAt)}
            </time>
          </div>

          {/* Stars */}
          <StarRating value={review.rating} readOnly size="sm" className="mt-1" />

          {/* Comment */}
          {review.comment && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
