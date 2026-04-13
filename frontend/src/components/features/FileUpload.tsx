"use client";

import { useRef, useState } from "react";
import { Upload, X, File as FileIcon } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File | null) => void;
  error?: string;
  id?: string;
  disabled?: boolean;
}

export function FileUpload({
  accept = "application/pdf,image/jpeg,image/png,image/webp",
  maxSizeMB = 10,
  onFileSelect,
  error,
  id = "file-upload",
  disabled,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const maxBytes = maxSizeMB * 1024 * 1024;

  function handleFile(file: File | null) {
    setLocalError(null);
    if (!file) {
      setSelected(null);
      onFileSelect(null);
      return;
    }
    if (file.size > maxBytes) {
      setLocalError(`File must be under ${maxSizeMB} MB.`);
      return;
    }
    setSelected(file);
    onFileSelect(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0] ?? null;
    handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0] ?? null);
  }

  function removeFile() {
    setSelected(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayError = error ?? localError;

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <FileIcon className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{selected.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(selected.size)}</p>
        </div>
        <button
          type="button"
          onClick={removeFile}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); !disabled && setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8",
          "transition-colors duration-150 cursor-pointer",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          displayError && "border-destructive",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Upload className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Drop file here or{" "}
            <span className="text-primary underline-offset-2 hover:underline">
              browse
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, JPEG, PNG, WebP · Max {maxSizeMB} MB
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="sr-only"
        aria-hidden="true"
        disabled={disabled}
      />

      {displayError && (
        <p className="text-xs text-destructive" role="alert">{displayError}</p>
      )}
    </div>
  );
}
