"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  wrapperClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      id,
      showCount = false,
      maxLength,
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const errorId = error ? `${textareaId}-error` : undefined;
    const [charCount, setCharCount] = React.useState(
      String(props.value ?? props.defaultValue ?? "").length
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      props.onChange?.(e);
    };

    const textareaEl = (
      <div className="relative">
        <textarea
          id={textareaId}
          ref={ref}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={errorId}
          onChange={handleChange}
          className={cn(
            "flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2",
            "text-sm text-foreground placeholder:text-muted-foreground",
            "resize-y transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus:ring-destructive/30",
            className
          )}
          {...props}
        />
        {showCount && maxLength && (
          <span
            className={cn(
              "absolute bottom-2 right-3 text-xs tabular-nums",
              charCount >= maxLength
                ? "text-destructive"
                : "text-muted-foreground"
            )}
          >
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    );

    if (!label && !error && !hint) return textareaEl;

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <Label htmlFor={textareaId} required={props.required}>
            {label}
          </Label>
        )}
        {textareaEl}
        {hint && !error && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export { Textarea };
