"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface ApproveDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ApproveDoctorDialog({
  open,
  onOpenChange,
  doctorName,
  onConfirm,
  isLoading = false,
}: ApproveDoctorDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Approve Doctor Application"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText="Approving…"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve Doctor
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-4">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            Approving Dr. {doctorName}
          </p>
          <p className="text-xs text-emerald-700 mt-0.5">
            This doctor will be notified and can immediately start accepting appointments.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
