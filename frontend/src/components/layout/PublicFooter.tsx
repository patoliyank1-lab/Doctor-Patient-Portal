import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import Image from "next/image";
import logo from "@/../assets/logo.webp";

/**
 * PublicFooter — shared footer for all public pages: /, /about, /doctors.
 * Rendered by (public)/layout.tsx so it appears on every public route.
 */
export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Brand */}
          <Link
            href={ROUTES.HOME}
            className="flex items-center font-bold text-foreground"
            aria-label="MediConnect home"
          >
            <div className="size-10 overflow-hidden flex justify-center items-center">
              {/* <Stethoscope className="h-4 w-4 text-white" aria-hidden /> */}
              <Image src={logo} alt="Logo" height={80} width={80}  />
            </div>
            MediConnect
          </Link>

          {/* Links */}
          <nav
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
            aria-label="Footer navigation"
          >
            <Link
              href={ROUTES.DOCTORS}
              className="hover:text-foreground transition-colors"
            >
              Find Doctors
            </Link>
            <Link
              href={ROUTES.ABOUT}
              className="hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              href={ROUTES.LOGIN}
              className="hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href={ROUTES.REGISTER}
              className="hover:text-foreground transition-colors"
            >
              Register
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MediConnect
          </p>
        </div>
      </div>
    </footer>
  );
}
