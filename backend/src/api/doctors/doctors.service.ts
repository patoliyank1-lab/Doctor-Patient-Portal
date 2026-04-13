import { prisma } from "../../config/database";
import { DoctorApprovalStatus } from "../../../prisma/generated/client/enums";
import { AppError, UnknownError } from "../../utils/errorHandler";
import { Prisma } from "../../../prisma/generated/client/client";
import { Role } from "../../../prisma/generated/client/enums";
import type { CreateDoctorProfileInput, ListDoctorsQuery, PendingDoctorsQuery } from "./doctors.validators";

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

const selfDoctorSelect = {
  id: true,
  userId: true,
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

export const getDoctorProfileByUserId = async (userId: string) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      select: selfDoctorSelect,
    });
    if (!doctor) throw new AppError("Doctor profile not found", 404);
    return doctor;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

export const createDoctorProfileForUser = async (userId: string, input: CreateDoctorProfileInput) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) throw new AppError("Unauthorized", 401);
    if (user.role !== Role.DOCTOR) throw new AppError("Forbidden", 403);

    const existing = await prisma.doctor.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) throw new AppError("Doctor profile already exists", 409);

    const created = await prisma.doctor.create({
      data: {
        userId,
        firstName: input.firstName,
        lastName: input.lastName,
        specializations: input.specializations,
        qualification: input.qualification,
        experienceYears: input.experienceYears,
        bio: input.bio,
        profileImageUrl: input.profileImageUrl,
        consultationFee: input.consultationFee,
      },
      select: selfDoctorSelect,
    });

    return created;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new AppError("Doctor profile already exists", 409);
      }
    }
    throw new UnknownError(error);
  }
};

export const listPendingDoctors = async (query: PendingDoctorsQuery) => {
  try {
    const where: any = {
      approvalStatus: DoctorApprovalStatus.PENDING,
    };

    if (query.specialization) {
      where.specializations = { has: query.specialization };
    }

    if (query.search) {
      const term = query.search;
      where.OR = [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { user: { email: { contains: term, mode: "insensitive" } } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, doctors] = await Promise.all([
      prisma.doctor.count({ where }),
      prisma.doctor.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          ...doctorListSelect,
          rejectionReason: true,
          reviewedAt: true,
          reviewedByAdminId: true,
          user: { select: { email: true } },
        },
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

export const updateDoctorStatus = async (adminUserId: string, doctorId: string, input: { status: "approved" | "rejected" | "suspended"; reason?: string }) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, approvalStatus: true },
    });
    if (!doctor) throw new AppError("Doctor not found", 404);

    const current = doctor.approvalStatus;
    const target =
      input.status === "approved"
        ? DoctorApprovalStatus.APPROVED
        : input.status === "rejected"
          ? DoctorApprovalStatus.REJECTED
          : DoctorApprovalStatus.SUSPENDED;

    // Business rules:
    // - Only PENDING can be approved/rejected
    // - Only APPROVED can be suspended
    if ((target === DoctorApprovalStatus.APPROVED || target === DoctorApprovalStatus.REJECTED) && current !== DoctorApprovalStatus.PENDING) {
      throw new AppError("Only pending doctors can be approved or rejected", 400);
    }
    if (target === DoctorApprovalStatus.SUSPENDED && current !== DoctorApprovalStatus.APPROVED) {
      throw new AppError("Only approved doctors can be suspended", 400);
    }

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        approvalStatus: target,
        rejectionReason:
          target === DoctorApprovalStatus.REJECTED || target === DoctorApprovalStatus.SUSPENDED
            ? input.reason
            : null,
        reviewedByAdminId: adminUserId,
        reviewedAt: new Date(),
      },
      select: {
        id: true,
        userId: true,
        approvalStatus: true,
        rejectionReason: true,
        reviewedByAdminId: true,
        reviewedAt: true,
        updatedAt: true,
      },
    });

    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

