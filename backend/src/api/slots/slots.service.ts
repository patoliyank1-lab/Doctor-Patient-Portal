import { Prisma } from "../../../prisma/generated/client/client";
import { prisma } from "../../config/database";
import { AppError, UnknownError } from "../../utils/errorHandler";
import type { DoctorSlotsQuery, MySlotsQuery, SlotInput } from "./slots.validators";

type SlotRow = {
  id: string;
  doctorId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const slotSelect = {
  id: true,
  doctorId: true,
  date: true,
  startTime: true,
  endTime: true,
  isBooked: true,
  createdAt: true,
  updatedAt: true,
} as const;

const publicSlotSelect = {
  id: true,
  date: true,
  startTime: true,
  endTime: true,
} as const;

const dateOnly = (yyyyMmDd: string) => new Date(yyyyMmDd); // JS treats YYYY-MM-DD as UTC midnight

// Prisma maps @db.Time to JS Date; we anchor to a constant base date.
const timeOnly = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00`);

const toMinutes = (hhmm: string) => {
  const [hRaw, mRaw] = hhmm.split(":");
  const h = Number(hRaw ?? NaN);
  const m = Number(mRaw ?? NaN);
  return h * 60 + m;
};

const overlaps = (a: { startMin: number; endMin: number }, b: { startMin: number; endMin: number }) =>
  a.startMin < b.endMin && a.endMin > b.startMin;

const dedupeKey = (s: SlotInput) => `${s.date}|${s.startTime}|${s.endTime}`;

const assertNoOverlapsWithinRequest = (slots: SlotInput[]) => {
  const byDate = new Map<string, SlotInput[]>();
  for (const s of slots) {
    byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]);
  }

  for (const [date, items] of byDate.entries()) {
    const sorted = [...items].sort((x, y) => toMinutes(x.startTime) - toMinutes(y.startTime));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (!prev || !cur) continue;
      const prevInt = { startMin: toMinutes(prev.startTime), endMin: toMinutes(prev.endTime) };
      const curInt = { startMin: toMinutes(cur.startTime), endMin: toMinutes(cur.endTime) };
      if (overlaps(prevInt, curInt)) {
        throw new AppError("Validation failed", 400, {
          errors: [`slots overlap in request for date ${date} (${prev.startTime}-${prev.endTime} overlaps ${cur.startTime}-${cur.endTime})`],
        });
      }
    }
  }
};

const findOverlapsWithExisting = async (doctorId: string, slot: SlotInput) => {
  const start = timeOnly(slot.startTime);
  const end = timeOnly(slot.endTime);
  const date = dateOnly(slot.date);

  return prisma.availabilitySlot.findMany({
    where: {
      doctorId,
      date,
      startTime: { lt: end },
      endTime: { gt: start },
    },
    select: slotSelect,
  });
};

const findDoctorIdByUserId = async (userId: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!doctor) throw new AppError("Doctor profile not found", 404);
  return doctor.id;
};

export const listAvailableSlotsForDoctor = async (
  doctorId: string,
  query: DoctorSlotsQuery,
): Promise<{
  slots: Array<{ id: string; date: Date; startTime: Date; endTime: Date }>;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> => {
  try {
    const doctorExists = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true },
    });
    if (!doctorExists) throw new AppError("Doctor not found", 404);

    const where: any = { doctorId, isBooked: false };
    if (query.date) where.date = dateOnly(query.date);
    if (query.startTime) where.startTime = { gte: timeOnly(query.startTime) };
    if (query.endTime) where.endTime = { lte: timeOnly(query.endTime) };

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, slots] = await Promise.all([
      prisma.availabilitySlot.count({ where }),
      prisma.availabilitySlot.findMany({
        where,
        skip,
        take,
        select: publicSlotSelect,
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return {
      slots: slots as Array<{ id: string; date: Date; startTime: Date; endTime: Date }>,
      pagination: { total, page: query.page, limit: query.limit, totalPages },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

export const listMySlots = async (
  userId: string,
  query: MySlotsQuery,
): Promise<{
  slots: SlotRow[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> => {
  try {
    const doctorId = await findDoctorIdByUserId(userId);

    // "cancelled" is not represented in current schema; return empty dataset.
    if (query.status === "cancelled") {
      return {
        slots: [],
        pagination: { total: 0, page: query.page, limit: query.limit, totalPages: 1 },
      };
    }

    const where: any = { doctorId };
    if (query.date) where.date = dateOnly(query.date);
    if (query.status === "available") where.isBooked = false;
    if (query.status === "booked") where.isBooked = true;

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, slots] = await Promise.all([
      prisma.availabilitySlot.count({ where }),
      prisma.availabilitySlot.findMany({
        where,
        skip,
        take,
        select: slotSelect,
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return {
      slots: slots as SlotRow[],
      pagination: { total, page: query.page, limit: query.limit, totalPages },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

export const createSlotForDoctor = async (userId: string, input: SlotInput): Promise<SlotRow> => {
  try {
    const doctorId = await findDoctorIdByUserId(userId);

    return await prisma.$transaction(async (tx) => {
      const start = timeOnly(input.startTime);
      const end = timeOnly(input.endTime);
      const date = dateOnly(input.date);

      const overlapping = await tx.availabilitySlot.findFirst({
        where: {
          doctorId,
          date,
          startTime: { lt: end },
          endTime: { gt: start },
        },
        select: { id: true },
      });
      if (overlapping) {
        throw new AppError("Slot overlaps with an existing slot", 409);
      }

      const created = await tx.availabilitySlot.create({
        data: {
          doctorId,
          date,
          startTime: start,
          endTime: end,
          isBooked: false, // "available"
        },
        select: slotSelect,
      });

      return created as SlotRow;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new AppError("Duplicate slot", 409);
      }
    }
    throw new UnknownError(error);
  }
};

export const bulkCreateSlotsForDoctor = async (
  userId: string,
  slots: SlotInput[],
): Promise<{ createdCount: number; slots: SlotRow[] }> => {
  try {
    const doctorId = await findDoctorIdByUserId(userId);

    // Ensure no duplicates in request
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const s of slots) {
      const k = dedupeKey(s);
      if (seen.has(k)) duplicates.push(k);
      seen.add(k);
    }
    if (duplicates.length) {
      throw new AppError("Validation failed", 400, {
        errors: [`Duplicate slots in request: ${[...new Set(duplicates)].join(", ")}`],
      });
    }

    // Ensure no overlaps within request
    assertNoOverlapsWithinRequest(slots);

    // Best practice: reject the whole request if any slot conflicts (avoid partial writes)
    return await prisma.$transaction(async (tx) => {
      // Fetch potentially conflicting existing slots for all involved dates
      const uniqueDates = [...new Set(slots.map((s) => s.date))].map(dateOnly);

      const existing = await tx.availabilitySlot.findMany({
        where: { doctorId, date: { in: uniqueDates } },
        select: slotSelect,
      });

      const existingByDate = new Map<string, { startMin: number; endMin: number }[]>();
      for (const e of existing) {
        const yyyyMmDd = e.date.toISOString().slice(0, 10);
        const startMin = e.startTime.getUTCHours() * 60 + e.startTime.getUTCMinutes();
        const endMin = e.endTime.getUTCHours() * 60 + e.endTime.getUTCMinutes();
        existingByDate.set(yyyyMmDd, [...(existingByDate.get(yyyyMmDd) ?? []), { startMin, endMin }]);
      }

      const conflicts: string[] = [];
      for (const s of slots) {
        const sInt = { startMin: toMinutes(s.startTime), endMin: toMinutes(s.endTime) };
        const list = existingByDate.get(s.date) ?? [];
        if (list.some((eInt) => overlaps(eInt, sInt))) {
          conflicts.push(`${s.date} ${s.startTime}-${s.endTime}`);
        }
      }
      if (conflicts.length) {
        throw new AppError("One or more slots overlap with existing slots", 409, {
          errors: conflicts.map((c) => `Overlapping slot: ${c}`),
        });
      }

      const data = slots.map((s) => ({
        doctorId,
        date: dateOnly(s.date),
        startTime: timeOnly(s.startTime),
        endTime: timeOnly(s.endTime),
        isBooked: false,
      }));

      const result = await tx.availabilitySlot.createMany({
        data,
        skipDuplicates: true,
      });

      // Fetch created rows back (createMany doesn't return rows)
      const created = await tx.availabilitySlot.findMany({
        where: {
          OR: slots.map((s) => ({
            doctorId,
            date: dateOnly(s.date),
            startTime: timeOnly(s.startTime),
          })),
        },
        select: slotSelect,
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      });

      return { createdCount: result.count, slots: created as SlotRow[] };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new AppError("Duplicate slot", 409);
      }
    }
    throw new UnknownError(error);
  }
};

export const updateSlotForDoctor = async (
  userId: string,
  slotId: string,
  input: SlotInput,
): Promise<SlotRow> => {
  try {
    const doctorId = await findDoctorIdByUserId(userId);

    return await prisma.$transaction(async (tx) => {
      const existing = await tx.availabilitySlot.findFirst({
        where: { id: slotId, doctorId },
        select: { id: true, isBooked: true },
      });
      if (!existing) throw new AppError("Slot not found", 404);
      if (existing.isBooked) throw new AppError("Booked slots cannot be updated", 409);

      const start = timeOnly(input.startTime);
      const end = timeOnly(input.endTime);
      const date = dateOnly(input.date);

      const overlapping = await tx.availabilitySlot.findFirst({
        where: {
          doctorId,
          date,
          id: { not: slotId },
          startTime: { lt: end },
          endTime: { gt: start },
        },
        select: { id: true },
      });
      if (overlapping) throw new AppError("Slot overlaps with an existing slot", 409);

      const updated = await tx.availabilitySlot.update({
        where: { id: slotId },
        data: { date, startTime: start, endTime: end },
        select: slotSelect,
      });

      return updated as SlotRow;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

export const deleteSlotForDoctor = async (userId: string, slotId: string): Promise<null> => {
  try {
    const doctorId = await findDoctorIdByUserId(userId);

    return await prisma.$transaction(async (tx) => {
      const existing = await tx.availabilitySlot.findFirst({
        where: { id: slotId, doctorId },
        select: { id: true, isBooked: true },
      });
      if (!existing) throw new AppError("Slot not found", 404);
      if (existing.isBooked) throw new AppError("Booked slots cannot be deleted", 409);

      await tx.availabilitySlot.delete({ where: { id: slotId } });
      return null;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

