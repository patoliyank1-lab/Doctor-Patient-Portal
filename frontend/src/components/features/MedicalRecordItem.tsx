"use client";

import {
  FileText,
  Image,
  FlaskConical,
  File,
  Download,
  Trash2,
} from "lucide-react";
import { cn, formatDate, formatFileSize, toLabel } from "@/lib/utils";
import type { MedicalRecord } from "@/types";

interface MedicalRecordItemProps {
  record: MedicalRecord;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

const typeIconMap: Record<string, React.ElementType> = {
  prescription: FileText,
  lab_report:   FlaskConical,
  imaging:      Image,
  other:        File,
};

const typeBgMap: Record<string, string> = {
  prescription: "bg-blue-50 text-blue-600",
  lab_report:   "bg-green-50 text-green-600",
  imaging:      "bg-purple-50 text-purple-600",
  other:        "bg-gray-50 text-gray-500",
};

export function MedicalRecordItem({
  record,
  onDelete,
  canDelete = true,
}: MedicalRecordItemProps) {
  const Icon = typeIconMap[record.type] ?? File;
  const iconBg = typeBgMap[record.type] ?? "bg-gray-50 text-gray-500";

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-card-hover transition-shadow">
      {/* File type icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          iconBg
        )}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {record.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{toLabel(record.type)}</span>
          <span>·</span>
          <span>{formatFileSize(record.fileSize)}</span>
          <span>·</span>
          <span>{formatDate(record.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Download */}
        <a
          href={record.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          className={cn(
            "rounded-md p-2 text-muted-foreground transition-colors",
            "hover:text-primary hover:bg-primary/10",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label={`Download ${record.title}`}
        >
          <Download className="h-4 w-4" />
        </a>

        {/* Delete */}
        {canDelete && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(record.id)}
            className={cn(
              "rounded-md p-2 text-muted-foreground transition-colors",
              "opacity-0 group-hover:opacity-100",
              "hover:text-destructive hover:bg-destructive/10",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100"
            )}
            aria-label={`Delete ${record.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
