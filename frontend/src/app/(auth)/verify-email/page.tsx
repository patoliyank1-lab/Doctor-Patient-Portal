import { redirect } from "next/navigation";
export default function VerifyRedirect() { redirect("/auth/verify-email"); }
