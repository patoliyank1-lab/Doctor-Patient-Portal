"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Suspense } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

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
      const authUser = await login(data);
      setUser(authUser);
      toast.success(`Welcome back, ${authUser.email}!`);
      const roleLower = authUser.role.toLowerCase();
      const redirect =
        searchParams.get("redirect") ?? ROLE_DASHBOARD[roleLower];
      router.push(redirect ?? "/");
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
    <div>
      {/* ── Heading ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure Login
        </div>
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-slate-900">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Sign in to your MediConnect account to continue
        </p>
      </div>

      {/* ── Form ─────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5"
      >
        {/* Email */}
        <div className="group">
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Email address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Mail
                className={`h-4.5 w-4.5 transition-colors ${
                  errors.email ? "text-red-400" : "text-slate-400 group-focus-within:text-blue-500"
                }`}
                size={17}
              />
            </div>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
              className={`
                block h-11 w-full rounded-xl border pl-10 pr-4 text-sm text-slate-900
                placeholder:text-slate-400 outline-none
                transition-all duration-200
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
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="group">
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Lock
                className={`transition-colors ${
                  errors.password ? "text-red-400" : "text-slate-400 group-focus-within:text-blue-500"
                }`}
                size={17}
              />
            </div>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register("password")}
              className={`
                block h-11 w-full rounded-xl border pl-10 pr-11 text-sm text-slate-900
                placeholder:text-slate-400 outline-none
                transition-all duration-200
                ${
                  errors.password
                    ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                }
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500" role="alert">
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          id="login-submit"
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
              <Loader2 className="h-4.5 w-4.5 animate-spin" size={18} />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      {/* ── Divider ───────────────────────────────────────────────────── */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium text-slate-400">OR</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* ── Register link ─────────────────────────────────────────────── */}
      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Create account
        </Link>
      </p>

      {/* ── Trust badges ──────────────────────────────────────────────── */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <TrustBadge icon="🔒" label="256-bit SSL" />
        <span className="text-slate-200">|</span>
        <TrustBadge icon="🏥" label="HIPAA Compliant" />
        <span className="text-slate-200">|</span>
        <TrustBadge icon="✅" label="ISO 27001" />
      </div>
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400">
      <span role="img" aria-hidden>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
