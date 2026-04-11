import { config } from "dotenv";

config();

export const lodVariable = (variable: string) => {
  const load = process.env[variable];
  if(!load) throw new Error(`${variable} is not Loaded!!`);
  return load.toString();
};

