import type { Role } from "@prisma/client";

export interface JWTPayload {
  // User identity
  userId: string;
  email: string;
  role: Role;

  // Doctor-specific (only present when role === "doctor")
  doctorId?: string;
  isApproved?: boolean;

  // Patient-specific (only present when role === "patient")
  patientId?: string;
}
