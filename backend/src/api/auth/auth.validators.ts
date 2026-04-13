import { z } from 'zod';
import { Role } from '../../../prisma/generated/client/enums';

// Define the schema for registration
export const registerSchema = z.object({
  // Email validation: valid email format
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(254, "Email is too long"),

  // Password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, "Password must be at most 72 characters")
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),


  // Role validation: Enforces specific roles
  role: z.enum(Role),
})
  .superRefine((val, ctx) => {
    if (val.role === "ADMIN") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["role"],
        message: "Invalid role",
      });
    }
  });

// Extract type from schema
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(254, "Email is too long"),
  password: z.string().min(1, "Password is required").max(72, "Password is too long"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, "Token is required").max(2048, "Token is too long"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(254, "Email is too long"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Token is required").max(2048, "Token is too long"),
  password: z.string().optional(),
  newPassword: z.string().optional(),
})
  .transform((val) => ({
    token: val.token,
    password: (val.newPassword ?? val.password ?? "").toString(),
  }))
  .pipe(
    z.object({
      token: z.string(),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password must be at most 72 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    }),
  );

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
