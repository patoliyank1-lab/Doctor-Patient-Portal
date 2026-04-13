import { redirect } from "next/navigation";
export default function ForgotRedirect() { redirect("/auth/forgot-password"); }
