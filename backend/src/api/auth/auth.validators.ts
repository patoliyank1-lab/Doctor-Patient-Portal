import { z } from 'zod';
import { Role } from '../../../prisma/generated/client/enums';

// Define the schema for registration
export const registerSchema = z.object({
  // Email validation: valid email format
  email: z.string().email('Invalid email address'),

  // Password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),


  // Role validation: Enforces specific roles
  role: z.enum(Role),
})

// Extract type from schema
export type RegisterInput = z.infer<typeof registerSchema>;
