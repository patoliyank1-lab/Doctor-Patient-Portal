import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

// ─── Fonts ────────────────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "MediConnect — Doctor Patient Portal",
    template: "%s | MediConnect",
  },
  description:
    "MediConnect is a modern healthcare portal connecting patients with doctors. Book appointments, manage medical records, and access care — all in one place.",
  keywords: [
    "healthcare",
    "doctor",
    "patient",
    "appointment booking",
    "medical records",
    "telemedicine",
  ],
  authors: [{ name: "MediConnect" }],
  creator: "MediConnect",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    siteName: "MediConnect",
    title: "MediConnect — Doctor Patient Portal",
    description:
      "Book appointments, manage medical records, and connect with qualified doctors.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>

        {/* ── Global Toast Notifications (Sonner) ── */}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            classNames: {
              toast:
                "font-sans text-sm shadow-card-hover border border-border",
              title: "font-medium text-foreground",
              description: "text-muted-foreground",
              success: "border-green-200 bg-green-50 text-green-900",
              error:   "border-red-200 bg-red-50 text-red-900",
              info:    "border-blue-200 bg-blue-50 text-blue-900",
            },
          }}
        />
      </body>
    </html>
  );
}
