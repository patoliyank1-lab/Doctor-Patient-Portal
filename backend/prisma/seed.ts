/**
 * MediConnect — Database Seed Script
 *
 * Usage:
 *   cd backend
 *   bun run prisma/seed.ts
 *
 * What it does:
 *   1. Cleans ALL tables (in FK-safe order)
 *   2. Creates 3 users: admin, doctor, patient
 *   3. Creates matching Doctor & Patient profile records
 *
 * Credentials after seeding:
 *   Admin   →  admin@mediconnect.dev   /  Admin@1234
 *   Doctor  →  doctor@mediconnect.dev  /  Doctor@1234
 *   Patient →  patient@mediconnect.dev /  Patient@1234
 */

import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client/client.js";
import { Role, Gender, DoctorApprovalStatus } from "./generated/client/enums.js";


const connectionString = 'postgresql://postgres:Password123@localhost:5432/mediconnect';
if (!connectionString) {
  console.error("❌ DATABASE_URL is not set in .env");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BCRYPT_ROUNDS = 12;

// ─────────────────────────────────────────────────────────────────────────────
// Credentials (change passwords here if you want different ones)
// ─────────────────────────────────────────────────────────────────────────────

const SEED_USERS = {
  admin: {
    email: "admin@mediconnect.dev",
    password: "Admin@1234",
    role: Role.ADMIN,
  },
  doctor: {
    email: "doctor@mediconnect.dev",
    password: "Doctor@1234",
    role: Role.DOCTOR,
  },
  patient: {
    email: "patient@mediconnect.dev",
    password: "Patient@1234",
    role: Role.PATIENT,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Clean — delete in FK-safe order (children before parents)
// ─────────────────────────────────────────────────────────────────────────────

async function cleanDatabase() {
  console.log("🗑️  Cleaning database...");

  // Delete leaf tables first, then join tables, then parent tables
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.review.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ All tables cleared\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  // ── Admin ─────────────────────────────────────────────────────────────────
  console.log("👤 Creating Admin user...");
  const adminHash = await bcrypt.hash(SEED_USERS.admin.password, BCRYPT_ROUNDS);
  const adminUser = await prisma.user.create({
    data: {
      email: SEED_USERS.admin.email,
      passwordHash: adminHash,
      role: SEED_USERS.admin.role,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`   ✅ Admin created  — id: ${adminUser.id}`);

  // ── Doctor ────────────────────────────────────────────────────────────────
  console.log("🩺 Creating Doctor user + profile...");
  const doctorHash = await bcrypt.hash(SEED_USERS.doctor.password, BCRYPT_ROUNDS);
  const doctorUser = await prisma.user.create({
    data: {
      email: SEED_USERS.doctor.email,
      passwordHash: doctorHash,
      role: SEED_USERS.doctor.role,
      isActive: true,
      emailVerified: true,
    },
  });

  const doctorProfile = await prisma.doctor.create({
    data: {
      userId: doctorUser.id,
      firstName: "Rajesh",
      lastName: "Kumar",
      specializations: ["Cardiology", "General Medicine"],
      qualification: "MBBS, MD (Cardiology)",
      experienceYears: 12,
      bio: "Dr. Rajesh Kumar is a seasoned cardiologist with over 12 years of experience in treating complex cardiovascular conditions. He has worked at leading hospitals across India and is passionate about preventive cardiac care.",
      consultationFee: "500.00",
      approvalStatus: DoctorApprovalStatus.APPROVED,
    },
  });
  console.log(`   ✅ Doctor created  — userId: ${doctorUser.id}, doctorId: ${doctorProfile.id}`);

  // ── Patient ───────────────────────────────────────────────────────────────
  console.log("🏥 Creating Patient user + profile...");
  const patientHash = await bcrypt.hash(SEED_USERS.patient.password, BCRYPT_ROUNDS);
  const patientUser = await prisma.user.create({
    data: {
      email: SEED_USERS.patient.email,
      passwordHash: patientHash,
      role: SEED_USERS.patient.role,
      isActive: true,
      emailVerified: true,
    },
  });

  const patientProfile = await prisma.patient.create({
    data: {
      userId: patientUser.id,
      firstName: "Ananya",
      lastName: "Patel",
      gender: Gender.FEMALE,
      phone: "9876543210",
      dateOfBirth: new Date("1995-06-15"),
      bloodGroup: "B+",
      address: "Mumbai, Maharashtra",
    },
  });
  console.log(`   ✅ Patient created — userId: ${patientUser.id}, patientId: ${patientProfile.id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   MediConnect — Database Seed");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await cleanDatabase();
  await seed();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 Seeding complete! Login credentials:\n");
  console.log("  Role     Email                         Password");
  console.log("  ────     ─────                         ────────");
  console.log("  Admin    admin@mediconnect.dev          Admin@1234");
  console.log("  Doctor   doctor@mediconnect.dev         Doctor@1234");
  console.log("  Patient  patient@mediconnect.dev        Patient@1234");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
