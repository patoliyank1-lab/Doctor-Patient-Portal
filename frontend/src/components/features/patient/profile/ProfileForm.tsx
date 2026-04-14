"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import {
  User,
  Phone,
  MapPin,
  Droplets,
  Calendar,
  Camera,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  updateMyPatientProfile,
  updatePatientImage,
  type PatientProfilePayload,
} from "@/lib/api/patients";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { getPresignedUrl, uploadToS3 } from "@/lib/api/uploads";
import type { Patient } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function getInitials(first?: string, last?: string): string {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (!f && !l) return "?";
  return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
}

function formatDateForInput(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().split("T")[0] ?? "";
  } catch {
    return "";
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────────────────────────────────────

interface ProfileFormProps {
  patient: Patient & { firstName: string; lastName: string };
  email: string;
  isCreate?: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

export function ProfileForm({ patient, email, isCreate = false }: ProfileFormProps) {
  const [firstName, setFirstName] = useState(patient.firstName ?? "");
  const [lastName, setLastName] = useState(patient.lastName ?? "");
  const [phone, setPhone] = useState(patient.phone ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(
    formatDateForInput(patient.dateOfBirth)
  );
  const [gender, setGender] = useState<"male" | "female" | "other">(
    (patient.gender as "male" | "female" | "other") ?? "other"
  );
  const [address, setAddress] = useState(patient.address ?? "");
  const [bloodGroup, setBloodGroup] = useState(patient.bloodGroup ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    patient.profileImageUrl ?? patient.profileImage ?? null
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Avatar pick ─────────────────────────────────────────────────────────────
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    startTransition(async () => {
      try {
        // 1. Upload avatar if changed
        if (avatarFile) {
          const { uploadUrl, publicUrl } = await getPresignedUrl(
            avatarFile.name,
            avatarFile.type,
            avatarFile.size,
            "profile-images"
          );
          await uploadToS3(uploadUrl, avatarFile);
          await updatePatientImage(publicUrl);
        }

        // 2. Build profile payload
        const payload: Partial<PatientProfilePayload> = {
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          phone: phone.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
          gender,
          address: address.trim() || undefined,
          bloodGroup: bloodGroup.trim() || undefined,
        };

        if (isCreate) {
          await fetchWithAuth("/patients/me", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        } else {
          await updateMyPatientProfile(payload);
        }
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } catch (err: unknown) {
        setStatus("error");
        setErrorMsg(
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        );
      }
    });
  }

  const isBusy = status === "saving" || isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── Avatar Section ─────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative group">
          <div className="h-24 w-24 overflow-hidden rounded-2xl ring-4 ring-blue-100 shadow-lg">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Profile avatar"
                width={96}
                height={96}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-extrabold text-white">
                {getInitials(firstName, lastName)}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md ring-2 ring-white transition-all hover:bg-blue-700 hover:scale-110"
            aria-label="Change profile photo"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">
            {firstName || lastName
              ? `${firstName} ${lastName}`.trim()
              : "Your Name"}
          </p>
          <p className="text-sm text-slate-500">{email}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-1 text-xs font-medium text-blue-600 hover:underline"
          >
            Change photo
          </button>
        </div>
      </div>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="border-t border-slate-100" />

      {/* ── Personal Info Grid ─────────────────────────────────────────── */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
          <User className="h-4 w-4" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First Name" id="firstName" required>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className={inputCls}
            />
          </Field>
          <Field label="Last Name" id="lastName" required>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className={inputCls}
            />
          </Field>
          <Field label="Date of Birth" id="dateOfBirth">
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={`${inputCls} pl-10`}
              />
            </div>
          </Field>
          <Field label="Gender" id="gender">
            <select
              id="gender"
              value={gender}
              onChange={(e) =>
                setGender(e.target.value as "male" | "female" | "other")
              }
              className={inputCls}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other / Prefer not to say</option>
            </select>
          </Field>
        </div>
      </div>

      {/* ── Contact Info Grid ──────────────────────────────────────────── */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
          <Phone className="h-4 w-4" />
          Contact Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone Number" id="phone">
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className={`${inputCls} pl-10`}
              />
            </div>
          </Field>
          <Field label="Blood Group" id="bloodGroup">
            <div className="relative">
              <Droplets className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
              <select
                id="bloodGroup"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className={`${inputCls} pl-10`}
              >
                <option value="">Select blood group</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                  (bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  )
                )}
              </select>
            </div>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Home Address" id="address">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main Street, City, State - ZIP"
                  rows={3}
                  className={`${inputCls} resize-none pl-10 pt-3`}
                />
              </div>
            </Field>
          </div>
        </div>
      </div>

      {/* ── Status Feedback ────────────────────────────────────────────── */}
      {status === "success" && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Profile updated successfully!
        </div>
      )}
      {status === "error" && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* ── Submit ─────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          id="save-profile-btn"
          type="submit"
          disabled={isBusy}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isBusy ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Field wrapper
// ──────────────────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100";

function Field({
  label,
  id,
  required,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
