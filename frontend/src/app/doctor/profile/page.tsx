"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Camera, Save, Loader2, CheckCircle2, AlertCircle,
  User, Stethoscope, Pencil, X, Phone, Mail,
  IndianRupee, Award, Clock, FileText, ShieldAlert,
  RefreshCw,
} from "lucide-react";
import {
  getMyDoctorProfile, updateMyDoctorProfile, createMyDoctorProfile, updateDoctorImage,
  type CreateDoctorProfilePayload,
} from "@/lib/api/doctors";
import { getPresignedUrl, uploadToS3 } from "@/lib/api/uploads";
import { PageContainer } from "@/components/layout/PageContainer";
import { SPECIALIZATIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Doctor } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_IMAGE_MB = 5;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const APPROVAL_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING: { color: "border-amber-200 bg-amber-50 text-amber-800", label: "Pending Approval" },
  APPROVED: { color: "border-emerald-200 bg-emerald-50 text-emerald-800", label: "Approved" },
  REJECTED: { color: "border-red-200 bg-red-50 text-red-800", label: "Rejected" },
  SUSPENDED: { color: "border-slate-200 bg-slate-50 text-slate-700", label: "Suspended" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(d: Doctor | null): string {
  if (!d) return "DR";
  return `${(d.firstName ?? "").charAt(0)}${(d.lastName ?? "").charAt(0)}`.toUpperCase() || "DR";
}

function getFullName(d: Doctor | null): string {
  if (!d) return "New Profile";
  return `Dr. ${d.firstName ?? ""} ${d.lastName ?? ""}`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Form state shape
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileForm {
  firstName: string;
  lastName: string;
  specializations: string[];
  qualification: string;
  experienceYears: string;
  bio: string;
  consultationFee: string;
}

function defaultForm(doc?: Doctor | null): ProfileForm {
  return {
    firstName: doc?.firstName ?? "",
    lastName: doc?.lastName ?? "",
    specializations: doc?.specializations ?? [],
    qualification: doc?.qualification ?? "",
    experienceYears: String(doc?.experienceYears ?? ""),
    bio: doc?.bio ?? "",
    consultationFee: String(doc?.consultationFee ?? ""),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline validation
// ─────────────────────────────────────────────────────────────────────────────

interface FormErrors {
  firstName?: string;
  lastName?: string;
  specializations?: string;
  qualification?: string;
  experienceYears?: string;
  consultationFee?: string;
}

function validate(form: ProfileForm): FormErrors {
  const errs: FormErrors = {};
  if (!form.firstName.trim()) errs.firstName = "First name is required.";
  if (!form.lastName.trim()) errs.lastName = "Last name is required.";
  if (form.specializations.length === 0) errs.specializations = "Select at least one specialization.";
  if (!form.qualification.trim()) errs.qualification = "Qualification is required.";
  if (form.experienceYears !== "") {
    const n = Number(form.experienceYears);
    if (isNaN(n) || n < 0 || n > 80) errs.experienceYears = "Enter a valid number (0–80).";
  }
  if (form.consultationFee !== "") {
    const n = Number(form.consultationFee);
    if (isNaN(n) || n < 0) errs.consultationFee = "Enter a valid fee.";
  }
  return errs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export default function DoctorProfilePage() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isCreate, setIsCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState<ProfileForm>(defaultForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ProfileForm, boolean>>>({});

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Fetch profile on mount ──────────────────────────────────────────────────
  const fetchProfile = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setFetchError("");
    try {
      const doc = await getMyDoctorProfile();
      setDoctor(doc);
      setForm(defaultForm(doc));
      setIsCreate(false);
    } catch {
      // 404 = profile not yet created
      setIsCreate(true);
      setEditing(true); // Start in edit mode for new profiles
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Form helpers ────────────────────────────────────────────────────────────

  function setField<K extends keyof ProfileForm>(key: K, val: ProfileForm[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setTouched((prev) => ({ ...prev, [key]: true }));
    // Live-validate touched field
    const updated = { ...form, [key]: val };
    const errs = validate(updated);
    setErrors((prev) => ({ ...prev, [key]: (errs as any)[key] }));
  }

  function toggleSpecialization(spec: string) {
    const next = form.specializations.includes(spec)
      ? form.specializations.filter((s) => s !== spec)
      : [...form.specializations, spec];
    setField("specializations", next);
  }

  function handleCancel() {
    if (!doctor && !isCreate) return;
    setForm(defaultForm(doctor));
    setErrors({});
    setTouched({});
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditing(false);
  }

  // ── Avatar file selection ───────────────────────────────────────────────────

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`Image must be smaller than ${MAX_IMAGE_MB} MB.`);
      return;
    }

    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  // ── Save handler ────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Mark all fields as touched so errors show
    setTouched({
      firstName: true, lastName: true, specializations: true,
      qualification: true, experienceYears: true, consultationFee: true,
    });

    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Please fix the highlighted errors before saving.");
      return;
    }

    setSaving(true);

    try {
      // ── Step 1: Upload avatar if changed ─────────────────────────────────
      let imageUrl: string | undefined;
      if (avatarFile) {
        setUploadingImg(true);
        try {
          const { uploadUrl, publicUrl } = await getPresignedUrl(
            avatarFile.name,
            avatarFile.type,
            avatarFile.size,
            "profile-images"
          );
          await uploadToS3(uploadUrl, avatarFile);
          imageUrl = publicUrl;

          // Update image separately via the dedicated endpoint
          const imgUpdated = await updateDoctorImage(imageUrl);
          setDoctor(imgUpdated);
          toast.success("Profile photo updated.");
        } catch (err: unknown) {
          // Image upload failure should not block the rest of the save
          toast.error(err instanceof Error ? err.message : "Image upload failed — other changes will still save.");
        } finally {
          setUploadingImg(false);
        }
      }

      // ── Step 2: Build payload (only send changed / non-empty fields) ───────
      const payload: CreateDoctorProfilePayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        specializations: form.specializations,
        qualification: form.qualification.trim() || undefined!,
        experienceYears: form.experienceYears !== "" ? Number(form.experienceYears) : undefined,
        bio: form.bio.trim() || undefined,
        consultationFee: form.consultationFee !== "" ? Number(form.consultationFee) : undefined,
        // Only pass imageUrl in the main payload if the dedicated image endpoint wasn't used
        ...(imageUrl && isCreate ? { profileImageUrl: imageUrl } : {}),
      };

      const updated = isCreate
        ? await createMyDoctorProfile(payload)
        : await updateMyDoctorProfile(payload);

      setDoctor(updated);
      setForm(defaultForm(updated));
      setIsCreate(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setEditing(false);
      toast.success(isCreate ? "Profile created successfully!" : "Profile updated successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save profile.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const avatarUrl = avatarPreview ?? doctor?.profileImageUrl ?? doctor?.profileImage ?? null;
  const approvalKey = (doctor?.approvalStatus ?? "PENDING").toUpperCase();
  const approvalCfg = APPROVAL_CONFIG[approvalKey] ?? APPROVAL_CONFIG.PENDING!;
  const isApproved = approvalKey === "APPROVED";

  // ── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PageContainer title="My Profile">
        <div className="space-y-5">
          {[128, 200, 280, 200].map((h, i) => (
            <div key={i} className={`h-${h} animate-pulse rounded-2xl border border-slate-100 bg-slate-50`}
              style={{ height: h }} />
          ))}
        </div>
      </PageContainer>
    );
  }

  // ── Fetch error state ───────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <PageContainer title="My Profile">
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <ShieldAlert className="h-12 w-12 text-red-300" />
          <p className="font-semibold text-slate-700">Failed to load profile</p>
          <p className="text-sm text-slate-500">{fetchError}</p>
          <button onClick={() => fetchProfile()} className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Retry
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="My Profile"
      subtitle={isCreate
        ? "Set up your doctor profile to start accepting appointments."
        : "Manage your professional information visible to patients."}
      action={
        !editing && !isCreate ? (
          <button
            id="edit-profile-btn"
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
          >
            <Pencil className="h-4 w-4" /> Edit Profile
          </button>
        ) : null
      }
    >
      <div className="space-y-5">

        {/* ── Approval status banner ─────────────────────────────────────── */}
        {doctor && !isCreate && (
          <div
            className={cn("flex items-start gap-3 rounded-2xl border px-5 py-4", approvalCfg.color)}
            role="status"
            aria-label={`Account status: ${approvalCfg.label}`}
          >
            {isApproved
              ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />}
            <div>
              <p className="font-semibold">Account Status: {approvalCfg.label}</p>
              {!isApproved && (
                <p className="mt-0.5 text-sm opacity-80">
                  {approvalKey === "PENDING" && "Your profile is under admin review. You cannot accept appointments yet."}
                  {approvalKey === "REJECTED" && (doctor as any).rejectionReason
                    ? `Reason: ${(doctor as any).rejectionReason}` : ""}
                  {approvalKey === "SUSPENDED" && "Your account has been suspended. Contact support."}
                </p>
              )}
            </div>
            {!isApproved && (
              <button
                type="button"
                onClick={() => fetchProfile(true)}
                aria-label="Refresh status"
                className="ml-auto shrink-0 text-current opacity-60 hover:opacity-100"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* ── New profile setup notice ───────────────────────────────────── */}
        {isCreate && (
          <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-blue-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
            <div>
              <p className="font-semibold">Profile not yet created</p>
              <p className="mt-0.5 text-sm text-blue-700">
                Complete your profile to appear in patient searches and start accepting appointments.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* ── Profile header card ─────────────────────────────────────── */}
          <div className="flex items-start gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-24 w-24 overflow-hidden rounded-2xl ring-4 ring-white shadow-md">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={`Profile photo of ${getFullName(doctor)}`}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-extrabold text-white"
                    aria-label="Profile initials"
                  >
                    {getInitials(doctor)}
                  </div>
                )}
              </div>

              {editing && (
                <>
                  <button
                    type="button"
                    id="change-photo-btn"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingImg}
                    aria-label="Change profile photo"
                    className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all disabled:opacity-60"
                  >
                    {uploadingImg
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Camera className="h-4 w-4" />}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(",")}
                    className="hidden"
                    aria-hidden="true"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>

            {/* Name + meta */}
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-slate-900">{getFullName(doctor)}</h2>
              {doctor?.specializations?.length ? (
                <p className="mt-0.5 text-sm text-slate-500">
                  {doctor.specializations.join(" · ")}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
                {(doctor as any)?.user?.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {(doctor as any).user.email}
                  </span>
                )}
                {doctor?.experienceYears != null && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {doctor.experienceYears} yr{doctor.experienceYears !== 1 ? "s" : ""} experience
                  </span>
                )}
                {doctor?.consultationFee != null && (
                  <span className="flex items-center gap-1.5">
                    <IndianRupee className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    ₹{doctor.consultationFee} / consultation
                  </span>
                )}
              </div>

              {editing && (
                <p className="mt-2 text-xs text-slate-400">
                  Click the camera icon to change your photo (JPG/PNG/WebP, max {MAX_IMAGE_MB} MB)
                </p>
              )}
            </div>
          </div>

          {/* ── Personal Information ────────────────────────────────────── */}
          <ProfileSection icon={<User className="h-4 w-4" />} title="Personal Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="First Name"
                required
                error={touched.firstName ? errors.firstName : undefined}
              >
                <input
                  id="first-name"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  disabled={!editing}
                  required
                  placeholder="Rajesh"
                  aria-describedby={errors.firstName ? "first-name-error" : undefined}
                  className={cn("input-field", !editing && "cursor-default")}
                />
              </Field>
              <Field
                label="Last Name"
                required
                error={touched.lastName ? errors.lastName : undefined}
              >
                <input
                  id="last-name"
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  disabled={!editing}
                  required
                  placeholder="Kumar"
                  aria-describedby={errors.lastName ? "last-name-error" : undefined}
                  className={cn("input-field", !editing && "cursor-default")}
                />
              </Field>
            </div>
          </ProfileSection>

          {/* ── Professional Details ────────────────────────────────────── */}
          <ProfileSection icon={<Stethoscope className="h-4 w-4" />} title="Professional Details">
            <Field
              label="Qualification / Degree"
              required
              hint="e.g. MBBS, MD (Cardiology), MS (Orthopaedics)"
              error={touched.qualification ? errors.qualification : undefined}
            >
              <input
                id="qualification"
                type="text"
                value={form.qualification}
                onChange={(e) => setField("qualification", e.target.value)}
                disabled={!editing}
                required
                placeholder="MBBS, MD (Cardiology)"
                className={cn("input-field", !editing && "cursor-default")}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Experience (years)"
                error={touched.experienceYears ? errors.experienceYears : undefined}
              >
                <input
                  id="experience-years"
                  type="number"
                  min="0"
                  max="80"
                  value={form.experienceYears}
                  onChange={(e) => setField("experienceYears", e.target.value)}
                  disabled={!editing}
                  placeholder="12"
                  className={cn("input-field", !editing && "cursor-default")}
                />
              </Field>
              <Field
                label="Consultation Fee (₹)"
                error={touched.consultationFee ? errors.consultationFee : undefined}
              >
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" aria-hidden="true">₹</span>
                  <input
                    id="consultation-fee"
                    type="number"
                    min="0"
                    value={form.consultationFee}
                    onChange={(e) => setField("consultationFee", e.target.value)}
                    disabled={!editing}
                    placeholder="500"
                    className={cn("input-field pl-7", !editing && "cursor-default")}
                  />
                </div>
              </Field>
            </div>

            <Field label="Bio / About">
              <textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setField("bio", e.target.value)}
                disabled={!editing}
                rows={4}
                maxLength={2000}
                placeholder="Write a brief professional bio visible to patients…"
                className={cn("input-field resize-none leading-relaxed", !editing && "cursor-default")}
              />
              {editing && (
                <p className="mt-1 text-right text-[11px] text-slate-400">{form.bio.length}/2000</p>
              )}
            </Field>
          </ProfileSection>

          {/* ── Specializations ─────────────────────────────────────────── */}
          <ProfileSection icon={<Award className="h-4 w-4" />} title="Specializations">
            {touched.specializations && errors.specializations && (
              <p className="text-xs font-medium text-red-600" role="alert">
                {errors.specializations}
              </p>
            )}
            <fieldset className="min-w-0">
              <legend className="sr-only">Select specializations</legend>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map((spec) => {
                  const selected = form.specializations.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      disabled={!editing}
                      onClick={() => toggleSpecialization(spec)}
                      aria-pressed={selected}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                        selected
                          ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600",
                        editing
                          ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50"
                          : "cursor-default opacity-80"
                      )}
                    >
                      {spec}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </ProfileSection>

          {/* ── Form actions ─────────────────────────────────────────────── */}
          {editing && (
            <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-end">
              {/* Cancel — only available when editing an existing profile */}
              {!isCreate && (
                <button
                  id="cancel-edit-btn"
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-all"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              )}
              <button
                id="save-profile-btn"
                type="submit"
                disabled={saving || uploadingImg}
                aria-label={isCreate ? "Create profile" : "Save profile changes"}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition-all"
              >
                {(saving || uploadingImg)
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Save className="h-4 w-4" />}
                {isCreate ? "Create Profile" : "Save Changes"}
              </button>
            </div>
          )}
        </form>

        {/* ── View-mode profile summary (when not editing) ─────────────── */}
        {!editing && doctor && !isCreate && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileText className="h-4 w-4 text-slate-400" />
              Profile Summary
            </h3>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {[
                { label: "Full Name", value: getFullName(doctor) },
                { label: "Qualification", value: doctor.qualification ?? "—" },
                { label: "Experience", value: doctor.experienceYears != null ? `${doctor.experienceYears} years` : "—" },
                { label: "Consult Fee", value: doctor.consultationFee != null ? `₹${doctor.consultationFee}` : "—" },
                { label: "Specializations", value: doctor.specializations?.join(", ") || "—", span: true },
                { label: "Bio", value: doctor.bio ?? "—", span: true, pre: true },
              ].map(({ label, value, span, pre }) => (
                <div key={label} className={span ? "sm:col-span-2" : ""}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
                  <dd className={cn("mt-1 text-sm text-slate-800", pre && "whitespace-pre-line")}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ProfileSection({
  icon, title, children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <legend className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="text-slate-400">{icon}</span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label, required, hint, error, children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-red-600" role="alert">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
