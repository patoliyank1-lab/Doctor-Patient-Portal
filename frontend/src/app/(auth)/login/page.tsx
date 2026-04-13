"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Suspense } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginFormSchema, type LoginFormData } from "@/lib/validators";
import { login } from "@/lib/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLE_DASHBOARD } from "@/lib/constants";
import { ApiRequestError } from "@/lib/fetch-with-auth";

// ─────────────────────────────────────────────────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
  });

  async function onSubmit(data: LoginFormData) {
    try {
      const res = await login(data);
      setUser(res.user);
      toast.success(`Welcome back, ${res.user.name}!`);
      const redirect =
        searchParams.get("redirect") ?? ROLE_DASHBOARD[res.user.role];
      router.push(redirect);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.field) {
          setError(err.field as keyof LoginFormData, {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-blue-100/80">
          Sign in to your MediConnect account
        </p>
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="login-email"
          className="mb-1.5 block text-sm font-medium text-blue-100"
        >
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register("email")}
          className="flex h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-200/50 backdrop-blur-sm transition-colors focus:border-white/50 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-300" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="text-sm font-medium text-blue-100"
          >
            Password
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-xs text-blue-200 hover:text-white transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          {...register("password")}
          className="flex h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-200/50 backdrop-blur-sm transition-colors focus:border-white/50 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-300" role="alert">
            {errors.password.message}
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
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </button>

      {/* Register link */}
      <p className="text-center text-sm text-blue-200/80">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="font-medium text-white underline-offset-2 hover:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
