/**
 * Validates that all required environment variables are set.
 * Call this once at startup — it throws immediately if any are missing,
 * making misconfigured deployments fail fast rather than at runtime.
 */
export const validateEnv = (): void => {
  const required: Record<string, string> = {
    // Database
    DATABASE_URL: "PostgreSQL connection string",
    // Auth
    JWT_SECRET: "JWT signing secret",
    // Frontend (used for email redirect links)
    FRONTEND_URL: "Frontend base URL (e.g. http://localhost:3000)",
  };

  // Email and S3 vars are optional in development
  const productionOnly: Record<string, string> = {
    GMAIL_USER: "Gmail address for sending emails",
    GMAIL_APP_PASSWORD: "Gmail app password",
    AWS_REGION: "AWS region for S3",
    AWS_ACCESS_KEY_ID: "AWS access key",
    AWS_SECRET_ACCESS_KEY: "AWS secret key",
    AWS_S3_BUCKET_NAME: "S3 bucket name",
  };

  const missing: string[] = [];

  for (const [key, description] of Object.entries(required)) {
    if (!process.env[key]) {
      missing.push(`  ✗ ${key} — ${description}`);
    }
  }

  if (process.env.NODE_ENV === "production") {
    for (const [key, description] of Object.entries(productionOnly)) {
      if (!process.env[key]) {
        missing.push(`  ✗ ${key} — ${description}`);
      }
    }
  }

  if (missing.length > 0) {
    const lines = [
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "  Missing required environment variables:",
      ...missing,
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    ].join("\n");
    console.error(lines);
    process.exit(1);
  }
};
