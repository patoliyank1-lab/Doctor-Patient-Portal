"use client";

import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { KeyRound, AlertCircle } from "lucide-react";

import { resetPasswordSchema, type ResetPasswordData } from "@/lib/validators";
import { resetPassword } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/fetch-with-auth";

// ─────────────────────────────────────────────────────────────────────────────

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token ?? "" },
  });

  const inputCls =
    "flex h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-200/50 backdrop-blur-sm transition-colors focus:border-white/50 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20";

  // No token in URL
  if (!token) {
    return (
      <div className="space-y-5 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-400/20">
            <AlertCircle className="h-8 w-8 text-red-300" aria-hidden="true" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Invalid reset link</h1>
          <p className="mt-2 text-sm text-blue-100/80">
            This link is missing the reset token. Please request a new one.
          </p>
        </div>
        <Link
          href="/auth/forgot-password"
          className="block rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
        >
          Request new link
        </Link>
      </div>
    );
  }

  async function onSubmit(data: ResetPasswordData) {
    try {
      await resetPassword(data.token, data.password);
      toast.success("Password updated! Redirecting to sign in…");
      router.push("/auth/login");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Hidden token */}
      <input type="hidden" {...register("token")} />

      {/* Header */}
      <div className="mb-2 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <KeyRound className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-white">Create new password</h1>
        <p className="mt-1 text-sm text-blue-100/80">
          Must be at least 8 characters with 1 uppercase and 1 number
        </p>
      </div>

      {/* New password */}
      <div>
        <label
          htmlFor="rp-password"
          className="mb-1.5 block text-sm font-medium text-blue-100"
        >
          New password
        </label>
        <input
          id="rp-password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          {...register("password")}
          className={inputCls}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-300" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label
          htmlFor="rp-confirm"
          className="mb-1.5 block text-sm font-medium text-blue-100"
        >
          Confirm new password
        </label>
        <input
          id="rp-confirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          {...register("confirmPassword")}
          className={inputCls}
          aria-invalid={!!errors.confirmPassword}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-300" role="alert">
            {errors.confirmPassword.message}
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
            Updating…
          </>
        ) : (
          "Reset Password"
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
