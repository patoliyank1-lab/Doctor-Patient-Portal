import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;         // 0–5
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
  className,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role={readOnly ? undefined : "radiogroup"}
      aria-label={readOnly ? `Rating: ${value} out of 5` : "Select rating"}
    >
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          role={readOnly ? undefined : "radio"}
          aria-checked={readOnly ? undefined : star === value}
          aria-label={readOnly ? undefined : `${star} star${star !== 1 ? "s" : ""}`}
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(star)}
          className={cn(
            "transition-transform duration-100",
            !readOnly && "hover:scale-110 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
            readOnly && "cursor-default pointer-events-none"
          )}
          tabIndex={readOnly ? -1 : 0}
        >
          <Star
            className={cn(
              sizeMap[size],
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-gray-300"
            )}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
