"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle, Mail } from "lucide-react";

import { forgotPasswordSchema, type ForgotPasswordData } from "@/lib/validators";
import { forgotPassword } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/fetch-with-auth";

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordData) {
    try {
      await forgotPassword(data.email);
      setSentTo(data.email);
      setEmailSent(true);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  }

  const inputCls =
    "flex h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-200/50 backdrop-blur-sm transition-colors focus:border-white/50 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20";

  // ── Success state ──────────────────────────────────────────────────────────
  if (emailSent) {
    return (
      <div className="space-y-5 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-400/20">
            <CheckCircle className="h-8 w-8 text-green-300" aria-hidden="true" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="mt-2 text-sm text-blue-100/80">
            We&apos;ve sent a password reset link to
          </p>
          <p className="mt-0.5 font-medium text-white">{sentTo}</p>
        </div>
        <p className="text-xs text-blue-200/60">
          Didn&apos;t receive it? Check your spam folder or{" "}
          <button
            type="button"
            onClick={() => setEmailSent(false)}
            className="text-blue-200 hover:text-white underline"
          >
            try again
          </button>
          .
        </p>
        <Link
          href="/auth/login"
          className="block text-sm font-medium text-white underline-offset-2 hover:underline"
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Header */}
      <div className="mb-2 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <Mail className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-white">Reset your password</h1>
        <p className="mt-1 text-sm text-blue-100/80">
          Enter your email and we&apos;ll send a reset link
        </p>
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="fp-email"
          className="mb-1.5 block text-sm font-medium text-blue-100"
        >
          Email address
        </label>
        <input
          id="fp-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
          className={inputCls}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-300" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 font-semibold text-blue-700 shadow transition-all hover:bg-blue-50 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
      >
        {isSubmitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" />
            Sending…
          </>
        ) : (
          "Send Reset Link"
        )}
      </button>

      {/* Back link */}
      <p className="text-center text-sm text-blue-200/80">
        Remember your password?{" "}
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
