// src/types/express/index.d.ts

// This allows us to extend the Express namespace
declare namespace Express {
  // Extend the Request interface
  export interface Request {
    /**
     * Optional user object that can be attached by authentication middleware.
     */
    user?: {
      // User identity
      userId: string;
      email: string;
      role: Role;

      // Doctor-specific (only present when role === "doctor")
      doctorId?: string;
      isApproved?: boolean;

      // Patient-specific (only present when role === "patient")
      patientId?: string;
    };
    log: winston.Logger;
    /**
     * A request-specific context variable.
     */
    context?: import("../context").Context; // Example of a more complex type
  }
}

// Make sure your tsconfig.json includes this file via the "typeRoots" option if necessary
// "typeRoots": ["./src/types", "./node_modules/@types"]
