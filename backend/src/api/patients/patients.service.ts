import { prisma } from "../../config/database";
import { AppError, UnknownError } from "../../utils/errorHandler";
import type {
  CreatePatientProfileInput,
  ListPatientsQuery,
  UpdateMyPatientImageInput,
  UpdateMyPatientProfileInput,
} from "./patients.validators";
import { Role } from "../../../prisma/generated/client/enums";

const patientListSelect = {
  id: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  gender: true,
  phone: true,
  address: true,
  bloodGroup: true,
  profileImageUrl: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { email: true } },
} as const;

const patientDetailSelect = {
  ...patientListSelect,
} as const;

const selfPatientSelect = {
  id: true,
  userId: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  gender: true,
  phone: true,
  address: true,
  bloodGroup: true,
  profileImageUrl: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { email: true } },
} as const;

export const listPatients = async (query: ListPatientsQuery) => {
  try {
    const where: any = {
      user: { isActive: true, deletedAt: null },
    };

    if (query.gender) {
      where.gender = query.gender;
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

    const [total, patients] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: patientListSelect,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      patients,
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

export const getPatientProfileByUserId = async (userId: string) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: selfPatientSelect,
    });
    if (!patient) throw new AppError("Patient profile not found", 404);
    return patient;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

export const createPatientProfileForUser = async (userId: string, input: CreatePatientProfileInput) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true, deletedAt: true },
    });
    if (!user || !user.isActive || user.deletedAt) throw new AppError("Unauthorized", 401);
    if (user.role !== Role.PATIENT) throw new AppError("Forbidden", 403);

    const existing = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) throw new AppError("Patient profile already exists", 409);

    const created = await prisma.patient.create({
      data: {
        userId,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        phone: input.phone,
        address: input.address,
        bloodGroup: input.bloodGroup,
        profileImageUrl: input.profileImageUrl,
      },
      select: selfPatientSelect,
    });

    return created;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

export const updateMyPatientProfile = async (userId: string, input: UpdateMyPatientProfileInput) => {
  try {
    const existing = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!existing) throw new AppError("Patient profile not found", 404);

    const updated = await prisma.patient.update({
      where: { userId },
      data: {
        ...input,
      },
      select: selfPatientSelect,
    });

    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

export const updateMyPatientImage = async (userId: string, input: UpdateMyPatientImageInput) => {
  try {
    const existing = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!existing) throw new AppError("Patient profile not found", 404);

    const updated = await prisma.patient.update({
      where: { userId },
      data: { profileImageUrl: input.profileImageUrl },
      select: selfPatientSelect,
    });

    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

export const deactivateMyPatientAccount = async (userId: string) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!patient) throw new AppError("Patient profile not found", 404);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, deletedAt: true },
    });
    if (!user) throw new AppError("Unauthorized", 401);
    if (!user.isActive || user.deletedAt) throw new AppError("Account already deactivated", 400);

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false, deletedAt: new Date() },
    });

    return null;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

export const getPatientById = async (opts: {
  requester: { userId: string; role: Role; doctorId?: string };
  patientId: string;
}) => {
  try {
    const { requester, patientId } = opts;

    if (requester.role === Role.DOCTOR) {
      const doctorId =
        requester.doctorId ??
        (
          await prisma.doctor.findUnique({
            where: { userId: requester.userId },
            select: { id: true },
          })
        )?.id;

      if (!doctorId) throw new AppError("Forbidden", 403);

      const isAssigned = await prisma.appointment.findFirst({
        where: {
          doctorId,
          patientId,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!isAssigned) throw new AppError("Forbidden", 403);
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        user: { isActive: true, deletedAt: null },
      },
      select: patientDetailSelect,
    });

    if (!patient) throw new AppError("Patient not found", 404);
    return patient;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

