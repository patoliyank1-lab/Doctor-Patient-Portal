import express from "express";
import { Role } from "../../../prisma/generated/client/enums";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import {
  activateUser,
  approveDoctor,
  deactivateUser,
  getAllAppointments,
  getAppointmentAnalytics,
  getAuditLogs,
  getDashboard,
  getDoctorAnalytics,
  getPatientAnalytics,
  listDoctors,
  listUsers,
  listPatients,
  rejectDoctor,
  updateAppointmentStatus,
} from "./admin.controller";

const router = express.Router();

// Core
router.get("/dashboard",                   authenticate, authorize(Role.ADMIN), getDashboard);
router.get("/users",                       authenticate, authorize(Role.ADMIN), listUsers);
router.put("/users/:id/deactivate",        authenticate, authorize(Role.ADMIN), deactivateUser);
router.put("/users/:id/activate",          authenticate, authorize(Role.ADMIN), activateUser);
router.get("/audit-logs",                  authenticate, authorize(Role.ADMIN), getAuditLogs);
router.get("/appointments",                authenticate, authorize(Role.ADMIN), getAllAppointments);
router.patch("/appointments/:id/status",   authenticate, authorize(Role.ADMIN), updateAppointmentStatus);

// Patients
router.get("/patients",                    authenticate, authorize(Role.ADMIN), listPatients);

// Doctor management
router.get("/doctors",                     authenticate, authorize(Role.ADMIN), listDoctors);
router.put("/doctors/:id/approve",         authenticate, authorize(Role.ADMIN), approveDoctor);
router.put("/doctors/:id/reject",          authenticate, authorize(Role.ADMIN), rejectDoctor);

// Analytics
router.get("/analytics/patients",          authenticate, authorize(Role.ADMIN), getPatientAnalytics);
router.get("/analytics/doctors",           authenticate, authorize(Role.ADMIN), getDoctorAnalytics);
router.get("/analytics/appointments",      authenticate, authorize(Role.ADMIN), getAppointmentAnalytics);

export default router;
