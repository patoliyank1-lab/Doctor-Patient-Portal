"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface RejectDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorName: string;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export function RejectDoctorDialog({
  open,
  onOpenChange,
  doctorName,
  onConfirm,
  isLoading = false,
}: RejectDoctorDialogProps) {
  const [reason, setReason] = useState("");

  function handleConfirm() {
    onConfirm(reason.trim());
  }

  // Reset reason when dialog closes
  function handleOpenChange(v: boolean) {
    if (!v) setReason("");
    onOpenChange(v);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Reject Doctor Application"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            isLoading={isLoading}
            loadingText="Rejecting…"
          >
            Reject Application
          </Button>
        </>
      }
    >
      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4 mb-4">
        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-800">
            Rejecting Dr. {doctorName}
          </p>
          <p className="text-xs text-red-600 mt-0.5">
            This doctor will be notified and their application will be marked as rejected.
          </p>
        </div>
      </div>

      {/* Reason input */}
      <div>
        <label
          htmlFor="reject-reason"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          Rejection Reason{" "}
          <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="reject-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Incomplete documentation, invalid credentials…"
          maxLength={500}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 resize-none transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <p className="mt-1 text-right text-xs text-slate-400">
          {reason.length}/500
        </p>
      </div>
    </Dialog>
  );
}
