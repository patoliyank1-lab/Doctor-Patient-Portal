/**
 * MediConnect — Database Seed Script
 *
 * Usage:
 *   cd backend
 *   bun run prisma/seed.ts
 *
 * What it seeds:
 *   1. Cleans ALL tables (in FK-safe order)
 *   2. Creates 3 clean users: Admin, Doctor, Patient
 *
 * Credentials after seeding:
 *   Admin   → admin@mediconnect.dev   /  Admin@1234
 *   Doctor  → doctor@mediconnect.dev  /  Doctor@1234
 *   Patient → patient@mediconnect.dev /  Patient@1234
 */

import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client/client.js";
import {
  Role,
  Gender,
  DoctorApprovalStatus,
} from "./generated/client/enums.js";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:Password123@localhost:5432/mediconnect";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BCRYPT_ROUNDS = 12;

// ─────────────────────────────────────────────────────────────────────────────
// Clean — delete in FK-safe order
// ─────────────────────────────────────────────────────────────────────────────

async function cleanDatabase() {
  console.log("🗑️  Cleaning database...");
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
  // ── 1. Admin ───────────────────────────────────────────────────────────────
  console.log("👤 Creating Admin user...");
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@mediconnect.dev",
      passwordHash: await bcrypt.hash("Admin@1234", BCRYPT_ROUNDS),
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`   ✅ Admin — id: ${adminUser.id}`);

  // ── 2. Doctor ──────────────────────────────────────────────────────────────
  console.log("\n🩺 Creating Doctor user + profile...");
  const doctorUser = await prisma.user.create({
    data: {
      email: "doctor@mediconnect.dev",
      passwordHash: await bcrypt.hash("Doctor@1234", BCRYPT_ROUNDS),
      role: Role.DOCTOR,
      isActive: true,
      emailVerified: true,
    },
  });
  await prisma.doctor.create({
    data: {
      userId: doctorUser.id,
      firstName: "Doctor",
      lastName: "Test",
      specializations: ["Cardiology", "General Medicine"],
      qualification: "MBBS, MD (Cardiology)",
      experienceYears: 12,
      bio: "Dr. Rajesh Kumar is a seasoned cardiologist with over 12 years of experience treating complex cardiovascular conditions. He is passionate about preventive cardiac care and has worked at leading hospitals across India.",
      consultationFee: "500.00",
      approvalStatus: DoctorApprovalStatus.APPROVED,
      reviewedByAdminId: adminUser.id,
      reviewedAt: new Date(),
    },
  });
  console.log(`   ✅ Dr. Rajesh Kumar (doctor@mediconnect.dev)`);

  // ── 3. Patient ─────────────────────────────────────────────────────────────
  console.log("\n🏥 Creating Patient user + profile...");
  await prisma.user.create({
    data: {
      email: "patient@mediconnect.dev",
      passwordHash: await bcrypt.hash("Patient@1234", BCRYPT_ROUNDS),
      role: Role.PATIENT,
      isActive: true,
      emailVerified: true,
    },
  }).then(async (patientUser) => {
    await prisma.patient.create({
      data: {
        userId: patientUser.id,
        firstName: "Patient",
        lastName: "Test",
        gender: Gender.FEMALE,
        phone: "9876543210",
        dateOfBirth: new Date("1995-06-15"),
        bloodGroup: "B+",
        address: "Mumbai, Maharashtra",
      },
    });
  });
  console.log(`   ✅ Patient Ananya Patel (patient@mediconnect.dev)`);
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
  console.log("🎉 Seeding complete!\n");
  console.log("  Role     Email                          Password");
  console.log("  ──────   ──────────────────────────     ────────────");
  console.log("  Admin    admin@mediconnect.dev           Admin@1234");
  console.log("  Doctor   doctor@mediconnect.dev          Doctor@1234");
  console.log("  Patient  patient@mediconnect.dev         Patient@1234");
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
