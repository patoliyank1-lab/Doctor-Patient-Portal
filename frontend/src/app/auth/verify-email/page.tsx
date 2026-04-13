"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { verifyEmail } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/fetch-with-auth";

// ─────────────────────────────────────────────────────────────────────────────

type State = "loading" | "success" | "error" | "no-token";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [state, setState] = useState<State>(token ? "loading" : "no-token");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function verify() {
      try {
        await verifyEmail(token!);
        if (!cancelled) {
          setState("success");
          toast.success("Email verified successfully!");
          setTimeout(() => router.push("/auth/login"), 2500);
        }
      } catch (err) {
        if (!cancelled) {
          setState("error");
          if (err instanceof ApiRequestError) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage("An unexpected error occurred.");
          }
        }
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [token, router]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <Loader2
              className="h-8 w-8 animate-spin text-white"
              aria-hidden="true"
            />
          </div>
        </div>
        <h1 className="text-xl font-bold text-white">Verifying your email…</h1>
        <p className="text-sm text-blue-100/80">This will just take a moment.</p>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-400/20">
            <CheckCircle
              className="h-8 w-8 text-green-300"
              aria-hidden="true"
            />
          </div>
        </div>
        <h1 className="text-xl font-bold text-white">Email verified!</h1>
        <p className="text-sm text-blue-100/80">
          Redirecting you to sign in…
        </p>
        <div className="mx-auto h-1 w-24 overflow-hidden rounded-full bg-white/20">
          <div className="h-full animate-[width_2.5s_linear] bg-white" />
        </div>
      </div>
    );
  }

  // ── Missing token ──────────────────────────────────────────────────────────
  if (state === "no-token") {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20">
            <XCircle className="h-8 w-8 text-amber-300" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-white">No verification token</h1>
        <p className="text-sm text-blue-100/80">
          Please use the link from your verification email.
        </p>
        <Link
          href="/auth/login"
          className="block rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-400/20">
          <XCircle className="h-8 w-8 text-red-300" aria-hidden="true" />
        </div>
      </div>
      <h1 className="text-xl font-bold text-white">Verification failed</h1>
      <p className="text-sm text-blue-100/80">
        {errorMessage || "This link may have expired or already been used."}
      </p>
      <div className="space-y-2">
        <Link
          href="/auth/login"
          className="block rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
        >
          Go to sign in
        </Link>
        <p className="text-xs text-blue-200/60">
          Need a new verification email?{" "}
          <Link
            href="/auth/login"
            className="text-blue-200 underline hover:text-white"
          >
            Sign in to resend
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
