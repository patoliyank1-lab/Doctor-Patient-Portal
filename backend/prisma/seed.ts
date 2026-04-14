/**
 * MediConnect — Database Seed Script
 *
 * Usage:
 *   cd backend
 *   bun run prisma/seed.ts
 *
 * What it seeds:
 *   1. Cleans ALL tables (in FK-safe order)
 *   2. Creates 3 auth users: admin, doctor, patient
 *   3. Creates 5 Doctor profiles (1 existing + 4 extra) — all APPROVED
 *   4. Creates 1 Patient profile (Ananya Patel)
 *   5. Creates ~12 AvailabilitySlots per doctor across past & future dates
 *   6. Creates 12 Appointments (COMPLETED, APPROVED, PENDING, CANCELLED)
 *   7. Creates Reviews for COMPLETED appointments
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
  AppointmentStatus,
} from "./generated/client/enums.js";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:Password123@localhost:5432/mediconnect";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BCRYPT_ROUNDS = 12;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns a Date set to today ± offsetDays at midnight UTC */
function dayOffset(offsetDays: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}

/** Returns a Date with only time components (for @db.Time fields) */
function time(hour: number, minute = 0): Date {
  const d = new Date(0); // epoch — date part is ignored by @db.Time
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

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

  // ── 2. Doctors ──────────────────────────────────────────────────────────────
  console.log("\n🩺 Creating Doctor users + profiles...");

  const doctorsData = [
    // Primary seeded doctor (matches login credential)
    {
      email: "doctor@mediconnect.dev",
      password: "Doctor@1234",
      firstName: "Rajesh",
      lastName: "Kumar",
      specializations: ["Cardiology", "General Medicine"],
      qualification: "MBBS, MD (Cardiology)",
      experienceYears: 12,
      bio: "Dr. Rajesh Kumar is a seasoned cardiologist with over 12 years of experience treating complex cardiovascular conditions. He is passionate about preventive cardiac care and has worked at leading hospitals across India.",
      consultationFee: "500.00",
      gender: Gender.MALE,
    },
    // Extra doctors for rich data
    {
      email: "dr.priya@mediconnect.dev",
      password: "Doctor@1234",
      firstName: "Priya",
      lastName: "Sharma",
      specializations: ["Dermatology", "Cosmetology"],
      qualification: "MBBS, MD (Dermatology)",
      experienceYears: 8,
      bio: "Dr. Priya Sharma is a renowned dermatologist with 8 years of experience in skin disorders, laser treatments, and aesthetic medicine. She runs a dedicated skin clinic in Pune.",
      consultationFee: "600.00",
      gender: Gender.FEMALE,
    },
    {
      email: "dr.arjun@mediconnect.dev",
      password: "Doctor@1234",
      firstName: "Arjun",
      lastName: "Mehta",
      specializations: ["Neurology", "Psychiatry"],
      qualification: "MBBS, DM (Neurology)",
      experienceYears: 15,
      bio: "Dr. Arjun Mehta is a leading neurologist with 15 years of expertise in epilepsy, stroke management, and cognitive disorders. He is also a certified psychiatrist and advocates for holistic mental health.",
      consultationFee: "800.00",
      gender: Gender.MALE,
    },
    {
      email: "dr.sunita@mediconnect.dev",
      password: "Doctor@1234",
      firstName: "Sunita",
      lastName: "Verma",
      specializations: ["Gynaecology", "Obstetrics"],
      qualification: "MBBS, MS (Obstetrics & Gynaecology)",
      experienceYears: 10,
      bio: "Dr. Sunita Verma is an experienced gynaecologist and obstetrician with a decade of practice in maternal health, high-risk pregnancies, and minimally invasive gynaecological surgeries.",
      consultationFee: "700.00",
      gender: Gender.FEMALE,
    },
    {
      email: "dr.vikram@mediconnect.dev",
      password: "Doctor@1234",
      firstName: "Vikram",
      lastName: "Patel",
      specializations: ["Orthopaedics", "Sports Medicine"],
      qualification: "MBBS, MS (Orthopaedics)",
      experienceYears: 9,
      bio: "Dr. Vikram Patel is an orthopaedic surgeon specialising in joint replacements, sports injuries, and spine disorders. He is the team doctor for several state-level sports teams.",
      consultationFee: "750.00",
      gender: Gender.MALE,
    },
  ];

  const createdDoctors: { userId: string; doctorId: string; email: string }[] = [];

  for (const d of doctorsData) {
    const user = await prisma.user.create({
      data: {
        email: d.email,
        passwordHash: await bcrypt.hash(d.password, BCRYPT_ROUNDS),
        role: Role.DOCTOR,
        isActive: true,
        emailVerified: true,
      },
    });
    const profile = await prisma.doctor.create({
      data: {
        userId: user.id,
        firstName: d.firstName,
        lastName: d.lastName,
        specializations: d.specializations,
        qualification: d.qualification,
        experienceYears: d.experienceYears,
        bio: d.bio,
        consultationFee: d.consultationFee,
        approvalStatus: DoctorApprovalStatus.APPROVED,
        reviewedByAdminId: adminUser.id,
        reviewedAt: new Date(),
      },
    });
    createdDoctors.push({ userId: user.id, doctorId: profile.id, email: d.email });
    console.log(`   ✅ Dr. ${d.firstName} ${d.lastName} (${d.email})`);
  }

  // ── 3. Patient ─────────────────────────────────────────────────────────────
  console.log("\n🏥 Creating Patient user + profile...");
  const patientUser = await prisma.user.create({
    data: {
      email: "patient@mediconnect.dev",
      passwordHash: await bcrypt.hash("Patient@1234", BCRYPT_ROUNDS),
      role: Role.PATIENT,
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
  console.log(`   ✅ Patient Ananya Patel — userId: ${patientUser.id}`);

  // ── 4. Availability Slots ─────────────────────────────────────────────────
  console.log("\n📅 Creating availability slots...");

  // Slot time pairs [startHour, endHour]
  const slotTimes: [number, number][] = [
    [9, 10], [10, 11], [11, 12],
    [14, 15], [15, 16], [16, 17],
  ];

  // Day offsets: past slots (-14 to -1) and future slots (+1 to +14)
  const pastDays = [-14, -12, -10, -8, -6, -4, -3, -2, -1];
  const futureDays = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18];

  // We'll track specific slots to use for appointments
  // slot: { id, doctorId, date, startHour, isBooked }
  interface SlotRef {
    slotId: string;
    doctorId: string;
    doctorIdx: number;
    dayOffset: number;
    hour: number;
  }

  const createdSlots: SlotRef[] = [];

  for (let di = 0; di < createdDoctors.length; di++) {
    const { doctorId } = createdDoctors[di];
    let slotsCreated = 0;

    for (const offset of [...pastDays, ...futureDays]) {
      for (const [startHour, endHour] of slotTimes) {
        const slotDate = dayOffset(offset);
        try {
          const slot = await prisma.availabilitySlot.create({
            data: {
              doctorId,
              date: slotDate,
              startTime: time(startHour),
              endTime: time(endHour),
              isBooked: false,
            },
          });
          createdSlots.push({
            slotId: slot.id,
            doctorId,
            doctorIdx: di,
            dayOffset: offset,
            hour: startHour,
          });
          slotsCreated++;
        } catch {
          // Skip duplicate (doctorId, date, startTime) constraint violations
        }
      }
    }
    console.log(
      `   ✅ Dr. ${doctorsData[di].firstName} ${doctorsData[di].lastName} — ${slotsCreated} slots`
    );
  }

  // ── 5. Appointments & Reviews ─────────────────────────────────────────────
  console.log("\n📋 Creating appointments...");

  /**
   * Pick a slot: find a created slot matching the criteria,
   * mark it as booked, and return its id.
   */
  function pickSlot(doctorIdx: number, dayOff: number, preferHour?: number): SlotRef | null {
    const candidates = createdSlots.filter(
      (s) =>
        s.doctorIdx === doctorIdx &&
        s.dayOffset === dayOff &&
        (preferHour === undefined || s.hour === preferHour)
    );
    if (candidates.length === 0) return null;
    const candidate = candidates[0];
    // Remove from available pool so it isn't picked twice
    const idx = createdSlots.indexOf(candidate);
    if (idx > -1) createdSlots.splice(idx, 1);
    return candidate;
  }

  // Appointment definitions
  // [ doctorIdx, dayOffset, hour, status, reason, doctorNotes, rating, reviewComment ]
  type AppDef = {
    doctorIdx: number;
    dayOff: number;
    hour: number;
    status: AppointmentStatus;
    reason: string;
    doctorNotes?: string;
    rating?: number;
    reviewComment?: string;
  };

  const appointmentDefs: AppDef[] = [
    // ── COMPLETED (past) — will get reviews
    {
      doctorIdx: 0, dayOff: -14, hour: 9, status: AppointmentStatus.COMPLETED,
      reason: "Chest pain and shortness of breath during walking",
      doctorNotes: "ECG normal. Recommended lifestyle changes and prescribed statins. Follow-up in 4 weeks.",
      rating: 5, reviewComment: "Dr. Kumar was very thorough and explained everything clearly. Highly recommend!",
    },
    {
      doctorIdx: 0, dayOff: -10, hour: 10, status: AppointmentStatus.COMPLETED,
      reason: "Routine cardiac checkup and blood pressure review",
      doctorNotes: "BP controlled at 128/82. Medication continued. Advised regular light exercise.",
      rating: 4, reviewComment: "Great doctor, very patient and knowledgeable. Clinic wait was a bit long.",
    },
    {
      doctorIdx: 1, dayOff: -8, hour: 14, status: AppointmentStatus.COMPLETED,
      reason: "Skin rash on arms and neck — possible allergic reaction",
      doctorNotes: "Contact dermatitis. Prescribed topical corticosteroid and antihistamine for 7 days.",
      rating: 5, reviewComment: "Dr. Sharma diagnosed my problem quickly. Very professional and friendly.",
    },
    {
      doctorIdx: 2, dayOff: -6, hour: 9, status: AppointmentStatus.COMPLETED,
      reason: "Persistent headache and occasional dizziness for 2 weeks",
      doctorNotes: "MRI ordered. No red flags. Tension-type headache likely. Prescribed amitriptyline low-dose.",
      rating: 4, reviewComment: "Very detailed consultation. Felt heard and reassured.",
    },
    {
      doctorIdx: 3, dayOff: -4, hour: 14, status: AppointmentStatus.COMPLETED,
      reason: "Monthly prenatal visit — 28 weeks pregnant",
      doctorNotes: "Baby growth on track. Recommended iron supplement. Next scan at 32 weeks.",
      rating: 5, reviewComment: "Dr. Verma is incredibly caring and makes every visit stress-free.",
    },
    {
      doctorIdx: 4, dayOff: -3, hour: 11, status: AppointmentStatus.COMPLETED,
      reason: "Knee pain after morning runs — worsening over 3 weeks",
      doctorNotes: "Runner's knee (patellofemoral pain). Physio referral made. Advised rest for 2 weeks.",
      rating: 5, reviewComment: "Got diagnosed properly after two wrong diagnoses elsewhere. Thank you Dr. Patel!",
    },

    // ── APPROVED (past — missed, should have been completed; or future)
    {
      doctorIdx: 0, dayOff: -2, hour: 11, status: AppointmentStatus.APPROVED,
      reason: "Follow-up for cholesterol management",
    },
    {
      doctorIdx: 1, dayOff: -1, hour: 14, status: AppointmentStatus.APPROVED,
      reason: "Acne treatment consultation",
    },

    // ── PENDING (future)
    {
      doctorIdx: 0, dayOff: 3, hour: 9, status: AppointmentStatus.PENDING,
      reason: "Annual heart health checkup",
    },
    {
      doctorIdx: 2, dayOff: 5, hour: 10, status: AppointmentStatus.PENDING,
      reason: "Migraine frequency has increased — need review",
    },
    {
      doctorIdx: 3, dayOff: 7, hour: 14, status: AppointmentStatus.PENDING,
      reason: "Gynaecology annual checkup",
    },

    // ── CANCELLED
    {
      doctorIdx: 4, dayOff: -12, hour: 9, status: AppointmentStatus.CANCELLED,
      reason: "Ankle sprain from football",
    },
  ];

  let appointmentsCreated = 0;
  let reviewsCreated = 0;

  for (const def of appointmentDefs) {
    const slot = pickSlot(def.doctorIdx, def.dayOff, def.hour);
    if (!slot) {
      console.warn(
        `   ⚠️  No slot found for doctorIdx=${def.doctorIdx} dayOff=${def.dayOff} hour=${def.hour} — skipping`
      );
      continue;
    }

    const scheduledAt = dayOffset(def.dayOff);
    scheduledAt.setUTCHours(def.hour, 0, 0, 0);

    // Mark slot as booked
    await prisma.availabilitySlot.update({
      where: { id: slot.slotId },
      data: { isBooked: true },
    });

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patientProfile.id,
        doctorId: slot.doctorId,
        slotId: slot.slotId,
        status: def.status,
        reason: def.reason,
        doctorNotes: def.doctorNotes ?? null,
        scheduledAt,
      },
    });
    appointmentsCreated++;

    // Create review for COMPLETED appointments that have rating
    if (def.status === AppointmentStatus.COMPLETED && def.rating) {
      await prisma.review.create({
        data: {
          patientId: patientProfile.id,
          doctorId: slot.doctorId,
          appointmentId: appointment.id,
          rating: def.rating,
          comment: def.reviewComment ?? null,
        },
      });
      reviewsCreated++;
    }
  }

  console.log(`   ✅ ${appointmentsCreated} appointments created`);
  console.log(`   ✅ ${reviewsCreated} reviews created`);

  // ── 6. Notifications ───────────────────────────────────────────────────────
  console.log("\n🔔 Creating sample notifications...");

  await prisma.notification.createMany({
    data: [
      {
        userId: patientUser.id,
        title: "Appointment Confirmed",
        message: "Your appointment with Dr. Rajesh Kumar on " + dayOffset(3).toDateString() + " at 9:00 AM has been confirmed.",
        type: "APPOINTMENT",
        isRead: false,
      },
      {
        userId: patientUser.id,
        title: "Appointment Reminder",
        message: "Reminder: You have an appointment with Dr. Arjun Mehta in 2 days.",
        type: "APPOINTMENT",
        isRead: false,
      },
      {
        userId: patientUser.id,
        title: "Welcome to MediConnect!",
        message: "Your account is verified. Book your first appointment today.",
        type: "SYSTEM",
        isRead: true,
      },
      {
        userId: createdDoctors[0].userId,
        title: "New Appointment Request",
        message: "Ananya Patel has requested an appointment for Annual heart health checkup.",
        type: "APPOINTMENT",
        isRead: false,
      },
      {
        userId: createdDoctors[0].userId,
        title: "Profile Approved",
        message: "Your doctor profile has been approved by the admin. You are now visible to patients.",
        type: "SYSTEM",
        isRead: true,
      },
    ],
  });
  console.log("   ✅ 5 notifications created");
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
  console.log("  Doctor   dr.priya@mediconnect.dev        Doctor@1234");
  console.log("  Doctor   dr.arjun@mediconnect.dev        Doctor@1234");
  console.log("  Doctor   dr.sunita@mediconnect.dev       Doctor@1234");
  console.log("  Doctor   dr.vikram@mediconnect.dev       Doctor@1234");
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
