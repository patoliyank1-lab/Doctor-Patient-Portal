import { PageContainer } from "@/components/layout/PageContainer";
import { getMe } from "@/lib/api/auth";
import { getMyPatientProfile } from "@/lib/api/patients";
import { ProfileForm } from "@/components/features/patient/profile/ProfileForm";
import { ProfileInfoCard } from "@/components/features/patient/profile/ProfileInfoCard";
import { Shield, UserCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile | MediConnect",
  robots: { index: false, follow: false },
};

export const revalidate = 0; // always fresh for profile page

export default async function PatientProfilePage() {
  // ── Fetch in parallel ────────────────────────────────────────────────────────
  const [userResult, patientResult] = await Promise.allSettled([
    getMe(),
    getMyPatientProfile(),
  ]);

  const user = userResult.status === "fulfilled" ? userResult.value : null;
  const patient = patientResult.status === "fulfilled" ? patientResult.value : null;

  return (
    <PageContainer
      title="My Profile"
      subtitle="Manage your personal information and account settings."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">

        {/* ── Left Rail: Read-only info card ───────────────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <ProfileInfoCard patient={patient} user={user} />

          {/* Account security card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <Shield className="h-4 w-4 text-amber-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Account Security</h2>
            </div>
            <div className="space-y-3">
              <InfoRow label="Email" value={user?.email ?? "—"} />
              <InfoRow label="Role" value="Patient" />
              <InfoRow
                label="Email Verified"
                value={user?.isEmailVerified ? "✓ Verified" : "Not verified"}
                valueClass={user?.isEmailVerified ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}
              />
              <InfoRow
                label="Account Status"
                value={user?.isActive ? "Active" : "Inactive"}
                valueClass={user?.isActive ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}
              />
              <InfoRow
                label="Member Since"
                value={
                  user?.createdAt
                    ? new Intl.DateTimeFormat("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(user.createdAt))
                    : "—"
                }
              />
            </div>
          </div>
        </div>

        {/* ── Right: Edit form ─────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <UserCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Edit Profile</h2>
                <p className="text-xs text-slate-500">Update your personal details below.</p>
              </div>
            </div>

            {patient ? (
              <ProfileForm
                patient={patient as any}
                email={user?.email ?? ""}
              />
            ) : (
              /* No profile yet — guide user to create one */
              <>
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  <UserCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Your profile isn&apos;t set up yet. Fill in your details below to get started.
                  </span>
                </div>
                <ProfileForm
                  patient={{ firstName: "", lastName: "" } as any}
                  email={user?.email ?? ""}
                  isCreate
                />
              </>
            )}
          </div>
        </div>

      </div>
    </PageContainer>
  );
}

// ── Helper component ──────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  valueClass = "text-slate-700",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
