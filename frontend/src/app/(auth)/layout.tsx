// Pass-through. Real auth layout lives at src/app/auth/layout.tsx
export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
