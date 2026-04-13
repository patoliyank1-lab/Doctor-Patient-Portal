"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
  error?: string;
  id?: string;
}

export function Checkbox({
  className,
  label,
  error,
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  const box = (
    <CheckboxPrimitive.Root
      id={checkboxId}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded border border-input bg-background",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
        error && "border-destructive",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="h-3 w-3" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label && !error) return box;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {box}
        {label && (
          <label
            htmlFor={checkboxId}
            className={cn(
              "text-sm font-medium leading-none",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              "cursor-pointer select-none"
            )}
          >
            {label}
          </label>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
