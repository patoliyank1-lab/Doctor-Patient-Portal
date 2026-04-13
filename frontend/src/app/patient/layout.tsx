import type { Metadata } from "next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export const metadata: Metadata = {
  title: {
    default: "Patient Dashboard | MediConnect",
    template: "%s | MediConnect",
  },
};

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="patient">{children}</DashboardLayout>;
}
