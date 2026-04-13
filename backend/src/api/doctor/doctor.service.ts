import { Prisma } from "../../../prisma/generated/client/client";
import { Role } from "../../../prisma/generated/client/enums";
import { prisma } from "../../config/database";
import { AppError, UnknownError } from "../../utils/errorHandler";
import type { CreateDoctorProfileInput } from "./doctor.validators";

export const createDoctorProfile = async (userId: string, input: CreateDoctorProfileInput) => {
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
      select: {
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
      },
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

