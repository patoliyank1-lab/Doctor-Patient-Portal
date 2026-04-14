"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cancelAppointment } from "@/lib/api/appointments";
import { ApiRequestError } from "@/lib/fetch-with-auth";

interface CancelAppointmentButtonProps {
  appointmentId: string;
}

export function CancelAppointmentButton({ appointmentId }: CancelAppointmentButtonProps) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");

  async function handleCancel() {
    setIsLoading(true);
    try {
      await cancelAppointment(appointmentId);
      toast.success("Appointment cancelled successfully.");
      setShowDialog(false);
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Failed to cancel appointment.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
        aria-label="Cancel appointment"
      >
        <X className="h-3.5 w-3.5" />
        Cancel
      </button>

      {/* Confirmation Dialog */}
      {showDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isLoading && setShowDialog(false)}
          />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>

            <h2 id="cancel-dialog-title" className="text-lg font-bold text-slate-900">
              Cancel Appointment?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              This action cannot be undone. The slot will be freed for other patients.
            </p>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Reason (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Why are you cancelling?"
                className="block w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all"
                disabled={isLoading}
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                disabled={isLoading}
                className="flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Keep It
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling…
                  </>
                ) : (
                  "Yes, Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
