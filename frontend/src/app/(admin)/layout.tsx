import type { Metadata } from "next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard | MediConnect",
    template: "%s | MediConnect",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="admin">{children}</DashboardLayout>;
}
