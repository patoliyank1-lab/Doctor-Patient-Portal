"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  User, Stethoscope, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft,
  Check, Loader2, Upload, X, Camera, ShieldCheck, BadgeCheck,
} from "lucide-react";

import { login, register as registerUser } from "@/lib/api/auth";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { getPresignedUrl, uploadToS3 } from "@/lib/api/uploads";
import { ApiRequestError } from "@/lib/fetch-with-auth";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLE_DASHBOARD, SPECIALIZATIONS } from "@/lib/constants";
import type { AuthUser } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Role = "patient" | "doctor";

interface FormState {
  // Step 1
  role: Role | null;
  // Step 2 — account
  email: string;
  // Step 3 — profile (Patient)
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "";
  phone: string;
  bloodGroup: string;
  address: string;
  // Step 3 — profile (Doctor)
  specializations: string[];
  qualification: string;
  experienceYears: string;
  consultationFee: string;
  bio: string;
  // Step 4 — password
  password: string;
  confirmPassword: string;
  // Step 5 — image
  imageFile: File | null;
  imagePreview: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-blue-500", "bg-green-500"];
  return { score, label: labels[score] ?? "", color: colors[score] ?? "" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI components
// ─────────────────────────────────────────────────────────────────────────────

function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" /></svg>
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (err?: boolean) =>
  `block h-11 w-full rounded-xl border px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 ${
    err
      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-slate-200 bg-slate-50 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
  }`;

const selectCls = (err?: boolean) =>
  `block h-11 w-full rounded-xl border px-3.5 text-sm text-slate-900 outline-none transition-all duration-200 bg-slate-50 ${
    err
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
  }`;

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────

const STEP_LABELS = ["Role", "Account", "Profile", "Password", "Photo"];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>Step {current} of {total}</span>
        <span>{STEP_LABELS[current - 1]}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < current ? "bg-blue-600" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Role Selection
// ─────────────────────────────────────────────────────────────────────────────

function Step1Role({
  value, onChange, onNext,
}: { value: Role | null; onChange: (r: Role) => void; onNext: () => void }) {
  return (
    <div>
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          <BadgeCheck className="h-3.5 w-3.5" />
          Create Account
        </div>
        <h1 className="text-[1.9rem] font-bold tracking-tight text-slate-900">Who are you?</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Choose your role to set up the right experience.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {([
          {
            role: "patient" as Role,
            icon: User,
            label: "Patient",
            desc: "Book and manage appointments, access medical records",
          },
          {
            role: "doctor" as Role,
            icon: Stethoscope,
            label: "Doctor",
            desc: "Manage your schedule, patients, and practice",
          },
        ]).map(({ role, icon: Icon, label, desc }) => (
          <button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            className={`relative flex flex-col items-start gap-2 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
              value === role
                ? "border-blue-600 bg-blue-50 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
            aria-pressed={value === role}
          >
            {value === role && (
              <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                <Check className="h-3 w-3 text-white" />
              </span>
            )}
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${value === role ? "bg-blue-600" : "bg-slate-100"}`}>
              <Icon className={`h-5 w-5 ${value === role ? "text-white" : "text-slate-500"}`} />
            </div>
            <p className={`text-sm font-bold ${value === role ? "text-blue-700" : "text-slate-900"}`}>{label}</p>
            <p className="text-xs leading-relaxed text-slate-500">{desc}</p>
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!value}
        onClick={onNext}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue <ArrowRight size={17} />
      </button>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Account (email)
// ─────────────────────────────────────────────────────────────────────────────

function Step2Account({
  email, onChange, onNext, onBack, role,
}: {
  email: string; onChange: (v: string) => void;
  onNext: () => void; onBack: () => void; role: Role;
}) {
  const [error, setError] = useState("");

  function validate() {
    if (!email.trim()) { setError("Email is required"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address"); return false; }
    setError("");
    return true;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Account details</h2>
        <p className="mt-1 text-sm text-slate-500">
          You&apos;re registering as a <span className="font-semibold capitalize text-blue-600">{role}</span>.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <Field label="Email address" error={error}>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Mail className="h-4 w-4 text-slate-400" size={16} />
            </div>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { onChange(e.target.value); setError(""); }}
              className={inputCls(!!error) + " pl-10"}
            />
          </div>
        </Field>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          onClick={() => validate() && onNext()}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition-all"
        >
          Continue <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Profile details (Patient)
// ─────────────────────────────────────────────────────────────────────────────

function Step3Patient({
  form, onChange, onNext, onBack,
}: { form: FormState; onChange: (k: keyof FormState, v: string) => void; onNext: () => void; onBack: () => void }) {
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Enter a valid 10-digit Indian phone number";
    if (!form.gender) e.gender = "Please select your gender";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Patient details</h2>
        <p className="mt-1 text-sm text-slate-500">Tell us about yourself so doctors can help you better.</p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={errors.firstName}>
            <input id="reg-fname" type="text" placeholder="Aarav" value={form.firstName}
              onChange={(e) => { onChange("firstName", e.target.value); setErrors(p => ({...p, firstName: ""})); }}
              className={inputCls(!!errors.firstName)} />
          </Field>
          <Field label="Last name" error={errors.lastName}>
            <input id="reg-lname" type="text" placeholder="Shah" value={form.lastName}
              onChange={(e) => { onChange("lastName", e.target.value); setErrors(p => ({...p, lastName: ""})); }}
              className={inputCls(!!errors.lastName)} />
          </Field>
        </div>

        <Field label="Phone number" error={errors.phone}>
          <input id="reg-phone" type="tel" placeholder="9876543210" value={form.phone}
            onChange={(e) => { onChange("phone", e.target.value); setErrors(p => ({...p, phone: ""})); }}
            className={inputCls(!!errors.phone)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date of birth">
            <input id="reg-dob" type="date" value={form.dateOfBirth}
              onChange={(e) => onChange("dateOfBirth", e.target.value)}
              className={selectCls()} max={new Date().toISOString().split("T")[0]} />
          </Field>
          <Field label="Gender" error={errors.gender}>
            <select id="reg-gender" value={form.gender}
              onChange={(e) => { onChange("gender", e.target.value); setErrors(p => ({...p, gender: ""})); }}
              className={selectCls(!!errors.gender)}>
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Blood group (optional)">
            <select id="reg-blood" value={form.bloodGroup} onChange={(e) => onChange("bloodGroup", e.target.value)} className={selectCls()}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </Field>
          <Field label="Address (optional)">
            <input id="reg-address" type="text" placeholder="Mumbai, MH" value={form.address}
              onChange={(e) => onChange("address", e.target.value)} className={inputCls()} />
          </Field>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <button type="button" onClick={() => validate() && onNext()}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition-all">
          Continue <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Profile details (Doctor)
// ─────────────────────────────────────────────────────────────────────────────

function Step3Doctor({
  form, onChange, onChangeSpecializations, onNext, onBack,
}: {
  form: FormState;
  onChange: (k: keyof FormState, v: string) => void;
  onChangeSpecializations: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function toggleSpec(s: string) {
    const current = form.specializations;
    onChangeSpecializations(
      current.includes(s) ? current.filter((x) => x !== s) : [...current, s]
    );
    setErrors((p) => ({ ...p, specializations: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (form.specializations.length === 0) e.specializations = "Select at least one specialization";
    if (!form.qualification.trim()) e.qualification = "Qualification is required";
    if (!form.experienceYears || isNaN(Number(form.experienceYears))) e.experienceYears = "Enter valid years";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Doctor profile</h2>
        <p className="mt-1 text-sm text-slate-500">Your professional details shown to patients.</p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={errors.firstName}>
            <input id="dr-fname" type="text" placeholder="Rajesh" value={form.firstName}
              onChange={(e) => { onChange("firstName", e.target.value); setErrors(p => ({...p, firstName: ""})); }}
              className={inputCls(!!errors.firstName)} />
          </Field>
          <Field label="Last name" error={errors.lastName}>
            <input id="dr-lname" type="text" placeholder="Kumar" value={form.lastName}
              onChange={(e) => { onChange("lastName", e.target.value); setErrors(p => ({...p, lastName: ""})); }}
              className={inputCls(!!errors.lastName)} />
          </Field>
        </div>

        <Field label="Specializations" error={errors.specializations}>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map((s) => (
              <button key={s} type="button" onClick={() => toggleSpec(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                  form.specializations.includes(s)
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Qualification" error={errors.qualification}>
            <input id="dr-qual" type="text" placeholder="MBBS, MD" value={form.qualification}
              onChange={(e) => { onChange("qualification", e.target.value); setErrors(p => ({...p, qualification: ""})); }}
              className={inputCls(!!errors.qualification)} />
          </Field>
          <Field label="Experience (years)" error={errors.experienceYears}>
            <input id="dr-exp" type="number" min="0" max="80" placeholder="5" value={form.experienceYears}
              onChange={(e) => { onChange("experienceYears", e.target.value); setErrors(p => ({...p, experienceYears: ""})); }}
              className={inputCls(!!errors.experienceYears)} />
          </Field>
        </div>

        <Field label="Consultation fee (₹, optional)">
          <input id="dr-fee" type="number" min="0" placeholder="500" value={form.consultationFee}
            onChange={(e) => onChange("consultationFee", e.target.value)} className={inputCls()} />
        </Field>

        <Field label="Bio (optional)">
          <textarea id="dr-bio" rows={3} placeholder="Brief professional introduction..." value={form.bio}
            onChange={(e) => onChange("bio", e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none transition-all" />
        </Field>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <button type="button" onClick={() => validate() && onNext()}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition-all">
          Continue <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Password
// ─────────────────────────────────────────────────────────────────────────────

function Step4Password({
  password, confirm, onChange, onNext, onBack,
}: {
  password: string; confirm: string;
  onChange: (k: "password" | "confirmPassword", v: string) => void;
  onNext: () => void; onBack: () => void;
}) {
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [errors, setErrors] = useState<{ pw?: string; cf?: string }>({});

  const strength = passwordStrength(password);

  function validate() {
    const e: { pw?: string; cf?: string } = {};
    if (!password) e.pw = "Password is required";
    else if (password.length < 8) e.pw = "At least 8 characters";
    else if (!/[A-Z]/.test(password)) e.pw = "Need at least 1 uppercase letter";
    else if (!/[0-9]/.test(password)) e.pw = "Need at least 1 number";
    else if (!/[^A-Za-z0-9]/.test(password)) e.pw = "Need at least 1 special character";
    if (!confirm) e.cf = "Please confirm your password";
    else if (password !== confirm) e.cf = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Create password</h2>
        <p className="mt-1 text-sm text-slate-500">At least 8 characters with uppercase, number, and symbol.</p>
      </div>

      <div className="space-y-4 mb-6">
        <Field label="Password" error={errors.pw}>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input id="reg-password" type={showPw ? "text" : "password"} autoComplete="new-password"
              placeholder="••••••••" value={password}
              onChange={(e) => { onChange("password", e.target.value); setErrors(p => ({...p, pw: ""})); }}
              className={inputCls(!!errors.pw) + " pl-10 pr-11"} />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Strength meter */}
          {password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : "bg-slate-200"}`} />
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">{strength.label}</p>
            </div>
          )}
        </Field>

        <Field label="Confirm password" error={errors.cf}>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input id="reg-confirm" type={showCf ? "text" : "password"} autoComplete="new-password"
              placeholder="••••••••" value={confirm}
              onChange={(e) => { onChange("confirmPassword", e.target.value); setErrors(p => ({...p, cf: ""})); }}
              className={inputCls(!!errors.cf) + " pl-10 pr-11"} />
            <button type="button" onClick={() => setShowCf(v => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600">
              {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        {/* Requirement checklist */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
          {[
            { test: password.length >= 8, label: "At least 8 characters" },
            { test: /[A-Z]/.test(password), label: "One uppercase letter" },
            { test: /[0-9]/.test(password), label: "One number" },
            { test: /[^A-Za-z0-9]/.test(password), label: "One special character" },
          ].map(({ test, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <div className={`flex h-4 w-4 items-center justify-center rounded-full ${test ? "bg-green-500" : "bg-slate-300"}`}>
                {test && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
              <span className={test ? "text-slate-700" : "text-slate-400"}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <button type="button" onClick={() => validate() && onNext()}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition-all">
          Continue <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5 — Profile image
// ─────────────────────────────────────────────────────────────────────────────

function Step5Image({
  file, preview, onChange, onSubmit, onBack, isSubmitting, role,
}: {
  file: File | null; preview: string | null;
  onChange: (f: File, p: string) => void;
  onSubmit: () => void; onBack: () => void;
  isSubmitting: boolean; role: Role;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    const url = URL.createObjectURL(f);
    onChange(f, url);
  }, [onChange]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Profile photo</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add a photo so {role === "doctor" ? "patients" : "doctors"} can recognise you. You can skip this.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="mb-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
      >
        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="h-28 w-28 rounded-full object-cover ring-4 ring-blue-100" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null as any, null as any); }}
              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
              <Camera className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Click or drag & drop</p>
              <p className="mt-0.5 text-xs text-slate-400">JPG, PNG or WebP · Max 5 MB</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
              <Upload size={13} /> Choose photo
            </div>
          </div>
        )}
        <input
          ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} disabled={isSubmitting}
          className="flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
          <ArrowLeft size={16} /> Back
        </button>
        <button type="button" onClick={onSubmit} disabled={isSubmitting}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
          {isSubmitting ? (
            <><Loader2 size={17} className="animate-spin" /> Creating account…</>
          ) : (
            <><ShieldCheck size={17} /> Create Account</>
          )}
        </button>
      </div>
      {!file && (
        <p className="mt-3 text-center text-xs text-slate-400">
          You can also{" "}
          <button type="button" onClick={onSubmit} disabled={isSubmitting} className="font-semibold text-blue-600 hover:text-blue-700">
            skip and add later
          </button>
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page — orchestrates all steps
// ─────────────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    role: null,
    email: "",
    firstName: "", lastName: "",
    dateOfBirth: "", gender: "", phone: "", bloodGroup: "", address: "",
    specializations: [], qualification: "", experienceYears: "", consultationFee: "", bio: "",
    password: "", confirmPassword: "",
    imageFile: null, imagePreview: null,
  });

  const set = (k: keyof FormState, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  // ── Final submit ──────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!form.role || !form.email) return;
    setIsSubmitting(true);
    try {
      // 1) Register (creates User row with email, password, role)
      await registerUser({
        email: form.email,
        password: form.password,
        // Backend expects Prisma Role enum: "PATIENT" | "DOCTOR" (uppercase)
        role: form.role.toUpperCase() as "PATIENT" | "DOCTOR",
        // Legacy fields passed but ignored by current backend validator
        name: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone,
        dateOfBirth: form.dateOfBirth || new Date().toISOString().split("T")[0],
        gender: form.gender.toLowerCase() as "male" | "female" | "other" || "other",
      });

      // 2) Auto-login to get auth cookies
      const loginRes = await login({ email: form.email, password: form.password });
      const authUser: AuthUser = loginRes.data;
      setUser(authUser);

      // 3) Create role-specific profile
      if (form.role === "patient") {
        const body: Record<string, unknown> = {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          gender: form.gender || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          bloodGroup: form.bloodGroup || undefined,
          address: form.address || undefined,
        };
        await fetchWithAuth("/patients/me", { method: "POST", body: JSON.stringify(body) });
      } else {
        const body: Record<string, unknown> = {
          firstName: form.firstName,
          lastName: form.lastName,
          specializations: form.specializations,
          qualification: form.qualification,
          experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
          consultationFee: form.consultationFee || undefined,
          bio: form.bio || undefined,
        };
        await fetchWithAuth("/doctors/me", { method: "POST", body: JSON.stringify(body) });
      }

      // 4) Upload profile image (optional)
      if (form.imageFile) {
        const file = form.imageFile;
        try {
          // Step A: get a presigned S3 PUT URL from the backend
          const presigned = await getPresignedUrl(
            file.name,
            file.type,
            file.size,
            "profile-images"
          );

          // Step B: PUT the raw file bytes directly to S3 (no auth header needed)
          await uploadToS3(presigned.uploadUrl, file);

          // Step C: save the public S3 URL into the profile
          const imageEndpoint = form.role === "patient" ? "/patients/me/image" : "/doctors/me/image";
          await fetchWithAuth(imageEndpoint, {
            method: "PUT",
            body: JSON.stringify({ profileImageUrl: presigned.publicUrl }),
          });
        } catch (imgErr) {
          // Image upload is non-fatal — user can set their photo later.
          // Log the real error so it's visible in dev tools.
          console.error("[register] profile image upload failed:", imgErr);
          toast.warning("Profile created, but image upload failed. You can add it from your profile settings.");
        }
      }

      toast.success("Account created successfully! Welcome to MediConnect 🎉");
      const roleLower = authUser.role.toLowerCase();
      router.push(ROLE_DASHBOARD[roleLower] ?? "/");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.message);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Determine total steps (always 5)
  const totalSteps = 5;

  return (
    <div className="w-full">
      <StepIndicator current={step} total={totalSteps} />

      {step === 1 && (
        <Step1Role
          value={form.role}
          onChange={(r) => setForm((p) => ({ ...p, role: r }))}
          onNext={next}
        />
      )}

      {step === 2 && (
        <Step2Account
          role={form.role!}
          email={form.email}
          onChange={(v) => set("email", v)}
          onNext={next}
          onBack={back}
        />
      )}

      {step === 3 && form.role === "patient" && (
        <Step3Patient form={form} onChange={set} onNext={next} onBack={back} />
      )}

      {step === 3 && form.role === "doctor" && (
        <Step3Doctor
          form={form} onChange={set}
          onChangeSpecializations={(v) => setForm((p) => ({ ...p, specializations: v }))}
          onNext={next} onBack={back}
        />
      )}

      {step === 4 && (
        <Step4Password
          password={form.password} confirm={form.confirmPassword}
          onChange={(k, v) => set(k, v)}
          onNext={next} onBack={back}
        />
      )}

      {step === 5 && (
        <Step5Image
          file={form.imageFile} preview={form.imagePreview}
          onChange={(f, p) => setForm((prev) => ({ ...prev, imageFile: f, imagePreview: p }))}
          onSubmit={handleSubmit} onBack={back}
          isSubmitting={isSubmitting} role={form.role!}
        />
      )}
    </div>
  );
}
