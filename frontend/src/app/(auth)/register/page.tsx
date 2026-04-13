"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { User, Stethoscope } from "lucide-react";

import { registerFormSchema, type RegisterFormData } from "@/lib/validators";
import { register as registerUser } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/fetch-with-auth";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor" | "">(
    ""
  );

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { role: undefined },
  });

  function selectRole(role: "patient" | "doctor") {
    setSelectedRole(role);
    setValue("role", role, { shouldValidate: true });
  }

  async function onSubmit(data: RegisterFormData) {
    try {
      await registerUser(data);
      toast.success("Account created! Please check your email to verify.");
      router.push("/auth/login");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.field) {
          setError(err.field as keyof RegisterFormData, {
            message: err.message,
          });
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  }

  // Glassmorphism input style
  const inputCls =
    "flex h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-200/50 backdrop-blur-sm transition-colors focus:border-white/50 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20";
  const errorCls = "mt-1 text-xs text-red-300";
  const labelCls = "mb-1.5 block text-sm font-medium text-blue-100";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Header */}
      <div className="mb-2 text-center">
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="mt-1 text-sm text-blue-100/80">
          Join MediConnect today — it&apos;s free
        </p>
      </div>

      {/* Role selector */}
      <div>
        <p className={labelCls}>I am a…</p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { role: "patient" as const, label: "Patient", Icon: User },
              { role: "doctor" as const, label: "Doctor", Icon: Stethoscope },
            ] as const
          ).map(({ role, label, Icon }) => (
            <button
              key={role}
              type="button"
              onClick={() => selectRole(role)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all",
                selectedRole === role
                  ? "border-white bg-white/20 text-white shadow"
                  : "border-white/20 bg-white/5 text-blue-100 hover:bg-white/10"
              )}
              aria-pressed={selectedRole === role}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
        {errors.role && (
          <p className={errorCls} role="alert">
            {errors.role.message}
          </p>
        )}
      </div>

      {/* Name */}
      <div>
        <label htmlFor="reg-name" className={labelCls}>
          Full name
        </label>
        <input
          id="reg-name"
          type="text"
          autoComplete="name"
          placeholder="John Doe"
          {...register("name")}
          className={inputCls}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className={errorCls} role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="reg-email" className={labelCls}>
          Email address
        </label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
          className={inputCls}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className={errorCls} role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Phone + DOB row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="reg-phone" className={labelCls}>
            Phone
          </label>
          <input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            placeholder="9876543210"
            {...register("phone")}
            className={inputCls}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className={errorCls} role="alert">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reg-dob" className={labelCls}>
            Date of birth
          </label>
          <input
            id="reg-dob"
            type="date"
            {...register("dateOfBirth")}
            className={cn(inputCls, "text-blue-100")}
            aria-invalid={!!errors.dateOfBirth}
          />
          {errors.dateOfBirth && (
            <p className={errorCls} role="alert">
              {errors.dateOfBirth.message}
            </p>
          )}
        </div>
      </div>

      {/* Gender */}
      <div>
        <label htmlFor="reg-gender" className={labelCls}>
          Gender
        </label>
        <select
          id="reg-gender"
          {...register("gender")}
          className={cn(inputCls, "text-blue-100")}
          aria-invalid={!!errors.gender}
        >
          <option value="" disabled className="text-gray-800">
            Select gender
          </option>
          {GENDER_OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="text-gray-800"
            >
              {opt.label}
            </option>
          ))}
        </select>
        {errors.gender && (
          <p className={errorCls} role="alert">
            {errors.gender.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="reg-password" className={labelCls}>
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          placeholder="Min 8 chars, 1 uppercase, 1 number"
          {...register("password")}
          className={inputCls}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className={errorCls} role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label htmlFor="reg-confirm" className={labelCls}>
          Confirm password
        </label>
        <input
          id="reg-confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          {...register("confirmPassword")}
          className={inputCls}
          aria-invalid={!!errors.confirmPassword}
        />
        {errors.confirmPassword && (
          <p className={errorCls} role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 font-semibold text-blue-700 shadow transition-all hover:bg-blue-50 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none mt-2"
      >
        {isSubmitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" />
            Creating account…
          </>
        ) : (
          "Create Account"
        )}
      </button>

      {/* Login link */}
      <p className="text-center text-sm text-blue-200/80">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-white underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
