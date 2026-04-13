import { prisma } from "../../config/database";
import { AppError, UnknownError } from "../../utils/errorHandler";
import type { ListPatientsQuery } from "./patients.validators";
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

