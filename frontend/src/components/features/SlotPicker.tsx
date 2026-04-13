"use client";

import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Slot } from "@/types";

interface SlotPickerProps {
  slots: Slot[];
  selectedSlotId?: string;
  onSelect: (slotId: string) => void;
  isLoading?: boolean;
}

export function SlotPicker({
  slots,
  selectedSlotId,
  onSelect,
  isLoading,
}: SlotPickerProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-10 animate-pulse-soft rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  const available = slots.filter((s) => s.status === "available");

  if (available.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No available slots for this date.
      </p>
    );
  }

  return (
    <div
      className="grid grid-cols-3 gap-2 sm:grid-cols-4"
      role="listbox"
      aria-label="Available appointment slots"
    >
      {available.map((slot) => {
        const isSelected = slot.id === selectedSlotId;
        return (
          <button
            key={slot.id}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(slot.id)}
            className={cn(
              "rounded-lg border px-2 py-2.5 text-sm font-medium",
              "transition-all duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "border-primary bg-primary text-primary-foreground shadow"
                : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            {formatTime(slot.startTime)}
          </button>
        );
      })}
    </div>
  );
}
