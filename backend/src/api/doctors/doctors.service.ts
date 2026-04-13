import { prisma } from "../../config/database";
import { DoctorApprovalStatus } from "../../../prisma/generated/client/enums";
import { AppError, UnknownError } from "../../utils/errorHandler";
import type { ListDoctorsQuery } from "./doctors.validators";

const doctorListSelect = {
  id: true,
  firstName: true,
  lastName: true,
  specializations: true,
  qualification: true,
  experienceYears: true,
  bio: true,
  profileImageUrl: true,
  consultationFee: true,
  approvalStatus: true,
  createdAt: true,
  updatedAt: true,
} as const;

const doctorDetailSelect = {
  ...doctorListSelect,
} as const;

export const listApprovedDoctors = async (query: ListDoctorsQuery) => {
  try {
    const where: any = {
      approvalStatus: DoctorApprovalStatus.APPROVED,
    };

    if (query.specialization) {
      where.specializations = { has: query.specialization };
    }

    if (query.search) {
      const term = query.search;
      where.OR = [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
      ];
    }

    if (query.experienceMin !== undefined || query.experienceMax !== undefined) {
      where.experienceYears = {};
      if (query.experienceMin !== undefined) where.experienceYears.gte = query.experienceMin;
      if (query.experienceMax !== undefined) where.experienceYears.lte = query.experienceMax;
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const orderBy =
      query.sortBy === "experience"
        ? { experienceYears: query.order }
        : { createdAt: query.order };

    const [total, doctors] = await Promise.all([
      prisma.doctor.count({ where }),
      prisma.doctor.findMany({
        where,
        skip,
        take,
        orderBy,
        select: doctorListSelect,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      doctors,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

export const getApprovedDoctorById = async (doctorId: string) => {
  try {
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, approvalStatus: DoctorApprovalStatus.APPROVED },
      select: doctorDetailSelect,
    });
    if (!doctor) throw new AppError("Doctor not found", 404);
    return doctor;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

