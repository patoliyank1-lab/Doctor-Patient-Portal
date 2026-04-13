import { config } from "dotenv";
import path from "node:path";
import fs from "node:fs";

const envPathsTried: string[] = [];

const loadEnv = () => {
  // Try CWD first (expected: backend/.env)
  const cwdEnv = path.resolve(process.cwd(), ".env");
  envPathsTried.push(cwdEnv);
  if (fs.existsSync(cwdEnv)) {
    config({ path: cwdEnv });
    return;
  }

  // Fallback for monorepos: repo-root .env when running from backend/
  const parentEnv = path.resolve(process.cwd(), "..", ".env");
  envPathsTried.push(parentEnv);
  if (fs.existsSync(parentEnv)) {
    config({ path: parentEnv });
    return;
  }

  // Last resort: default dotenv behavior (no explicit path)
  config();
};

loadEnv();

export const lodVariable = (variable: string) => {
  const load = process.env[variable];
  if (!load) {
    throw new Error(
      `${variable} is not loaded. Add it to your .env (tried: ${envPathsTried.join(
        ", ",
      )})`,
    );
  }
  return load.toString();
};

