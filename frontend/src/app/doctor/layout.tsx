import type { Metadata } from "next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export const metadata: Metadata = {
  title: {
    default: "Doctor Dashboard | MediConnect",
    template: "%s | MediConnect",
  },
};

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="doctor">{children}</DashboardLayout>;
}
