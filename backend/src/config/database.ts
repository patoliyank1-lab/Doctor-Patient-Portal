import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { lodVariable } from "../utils/dotenv";
import { PrismaClient } from "@prisma/client/extension";

const connectionString = lodVariable('DATABASE_URL')

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };