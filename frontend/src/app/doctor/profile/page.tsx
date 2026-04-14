"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import {
  Camera, Save, Loader2, CheckCircle2, AlertCircle,
  User, Stethoscope, IndianRupee, FileText, Clock,
} from "lucide-react";
import {
  getMyDoctorProfile, updateMyDoctorProfile, createMyDoctorProfile,
} from "@/lib/api/doctors";
import { getPresignedUrl, uploadToS3 } from "@/lib/api/uploads";
import { PageContainer } from "@/components/layout/PageContainer";
import { SPECIALIZATIONS } from "@/lib/constants";
import type { Doctor } from "@/types";

function getInitials(d: Doctor | null): string {
  if (!d) return "DR";
  return `${(d.firstName ?? "").charAt(0)}${(d.lastName ?? "").charAt(0)}`.toUpperCase() || "DR";
}

export default function DoctorProfilePage() {
  const [doctor, setDoctor]     = useState<Doctor | null>(null);
  const [isCreate, setIsCreate] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus]     = useState<"idle" | "success" | "error">("idle");
  const [errMsg, setErrMsg]     = useState("");

  // Avatar upload state
  const [avatarFile, setAvatarFile]   = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [form, setForm] = useState({
    firstName: "", lastName: "", specializations: [] as string[],
    qualification: "", experienceYears: "", bio: "", consultationFee: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const doc = await getMyDoctorProfile();
        setDoctor(doc);
        setForm({
          firstName: doc.firstName ?? "",
          lastName: doc.lastName ?? "",
          specializations: doc.specializations ?? [],
          qualification: doc.qualification ?? "",
          experienceYears: String(doc.experienceYears ?? ""),
          bio: doc.bio ?? "",
          consultationFee: String(doc.consultationFee ?? ""),
        });
      } catch {
        setIsCreate(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set(key: keyof typeof form, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function toggleSpec(spec: string) {
    setForm((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec],
    }));
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle"); setErrMsg("");

    startTransition(async () => {
      try {
        // 1. Upload avatar if changed
        let imageUrl: string | undefined;
        if (avatarFile) {
          setUploading(true);
          try {
            const { uploadUrl, publicUrl } = await getPresignedUrl(avatarFile.name, avatarFile.type, avatarFile.size, "profile-images");
            await uploadToS3(uploadUrl, avatarFile);
            imageUrl = publicUrl;
          } finally { setUploading(false); }
        }

        // 2. Save profile
        const payload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          specializations: form.specializations,
          qualification: form.qualification.trim(),
          experienceYears: Number(form.experienceYears) || 0,
          bio: form.bio.trim() || undefined,
          consultationFee: Number(form.consultationFee) || 0,
          ...(imageUrl ? { profileImageUrl: imageUrl } : {}),
        };

        const updated = isCreate
          ? await createMyDoctorProfile(payload as any)
          : await updateMyDoctorProfile(payload as any);

        setDoctor(updated);
        setIsCreate(false);
        setAvatarFile(null);
        setStatus("success");
      } catch (err: unknown) {
        setStatus("error");
        setErrMsg(err instanceof Error ? err.message : "Failed to save profile.");
      }
    });
  }

  const avatarUrl = avatarPreview ?? doctor?.profileImageUrl ?? doctor?.profileImage ?? null;

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="My Profile"
      subtitle={isCreate ? "Set up your doctor profile to appear in patient searches." : "Manage your professional information."}
    >
      {doctor?.approvalStatus && doctor.approvalStatus !== "approved" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">Approval Status: {doctor.approvalStatus}</p>
            <p className="text-sm text-amber-700">Profile edits may reset approval status and require admin review.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-2xl ring-4 ring-white shadow-lg">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Profile" width={96} height={96} className="h-full w-full object-cover" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-extrabold text-white">
                  {getInitials(doctor)}
                </div>
              )}
            </div>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-all">
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              {doctor ? `Dr. ${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim() : "New Profile"}
            </p>
            <p className="text-sm text-slate-500">{isCreate ? "Not yet submitted" : `Status: ${doctor?.approvalStatus ?? "—"}`}</p>
          </div>
        </div>

        {/* Personal info */}
        <Section icon={<User className="h-4 w-4" />} title="Personal Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First Name" required>
              <input id="first-name" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required placeholder="Rajesh"
                className="input-field" />
            </Field>
            <Field label="Last Name" required>
              <input id="last-name" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required placeholder="Kumar"
                className="input-field" />
            </Field>
          </div>
        </Section>

        {/* Professional */}
        <Section icon={<Stethoscope className="h-4 w-4" />} title="Professional Details">
          <Field label="Qualification" required>
            <input id="qualification" value={form.qualification} onChange={(e) => set("qualification", e.target.value)} required placeholder="MBBS, MD (Cardiology)"
              className="input-field" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Experience (years)">
              <input id="experience" type="number" min="0" max="60" value={form.experienceYears} onChange={(e) => set("experienceYears", e.target.value)} placeholder="12"
                className="input-field" />
            </Field>
            <Field label="Consultation Fee (₹)">
              <input id="fee" type="number" min="0" value={form.consultationFee} onChange={(e) => set("consultationFee", e.target.value)} placeholder="500"
                className="input-field" />
            </Field>
          </div>
          <Field label="Bio / About">
            <textarea id="bio" value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={3}
              placeholder="Write a brief professional bio visible to patients…"
              className="input-field resize-none" />
          </Field>
        </Section>

        {/* Specializations */}
        <Section icon={<Stethoscope className="h-4 w-4" />} title="Specializations">
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map((spec) => (
              <button key={spec} type="button" onClick={() => toggleSpec(spec)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                  form.specializations.includes(spec)
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                }`}>
                {spec}
              </button>
            ))}
          </div>
        </Section>

        {/* Feedback */}
        {status === "success" && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {isCreate ? "Profile created!" : "Profile updated successfully!"}
            {doctor?.approvalStatus === "pending" && " Changes will require admin re-approval."}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {errMsg}
          </div>
        )}

        <div className="flex justify-end">
          <button id="save-profile-btn" type="submit" disabled={isPending || uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition-all">
            {(isPending || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            {isCreate ? "Create Profile" : "Save Changes"}
          </button>
        </div>
      </form>
    </PageContainer>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="text-slate-400">{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
