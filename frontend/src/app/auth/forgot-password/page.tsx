"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle, Mail, ArrowRight, Loader2, KeyRound } from "lucide-react";

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

  // ── Success state ────────────────────────────────────────────────────────
  if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50">
            <CheckCircle className="h-8 w-8 text-green-500" aria-hidden="true" />
          </div>
        </div>

        {/* Copy */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Check your inbox
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            We&apos;ve sent a password reset link to
          </p>
          <p className="mt-1 font-semibold text-slate-800 break-all">{sentTo}</p>
        </div>

        <p className="text-xs text-slate-400">
          Didn&apos;t receive it? Check your spam folder or{" "}
          <button
            type="button"
            onClick={() => setEmailSent(false)}
            className="font-medium text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline transition-colors"
          >
            try again
          </button>
          .
        </p>

        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  // ── Form state ───────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Heading ──────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          <KeyRound className="h-3.5 w-3.5" />
          Password Reset
        </div>
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-slate-900">
          Forgot password?
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          No worries — enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Email field */}
        <div className="group">
          <label
            htmlFor="fp-email"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Email address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Mail
                className={`transition-colors ${
                  errors.email
                    ? "text-red-400"
                    : "text-slate-400 group-focus-within:text-blue-500"
                }`}
                size={17}
              />
            </div>
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
              className={`
                block h-11 w-full rounded-xl border pl-10 pr-4 text-sm text-slate-900
                placeholder:text-slate-400 outline-none transition-all duration-200
                ${
                  errors.email
                    ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                }
              `}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500" role="alert">
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          id="fp-submit"
          type="submit"
          disabled={isSubmitting}
          className="
            relative flex h-11 w-full items-center justify-center gap-2.5 overflow-hidden
            rounded-xl bg-blue-600 px-6
            text-sm font-semibold text-white
            shadow-[0_4px_14px_rgba(37,99,235,0.4)]
            transition-all duration-200
            hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)]
            active:scale-[0.98]
            disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none
          "
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" size={18} />
              <span>Sending…</span>
            </>
          ) : (
            <>
              <span>Send Reset Link</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium text-slate-400">OR</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* ── Back to login ─────────────────────────────────────────────────── */}
      <p className="text-center text-sm text-slate-500">
        Remember your password?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
