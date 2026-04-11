import "dotenv/config";
import { lodVariable } from "../utils/dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/client/client";

const connectionString = lodVariable("DATABASE_URL")

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };