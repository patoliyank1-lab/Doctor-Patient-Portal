import express from "express";
import { Role } from "../../../prisma/generated/client/enums";
import { authenticate } from "../../middlewares/authenticate";
import { authorize, authorizeAny } from "../../middlewares/authorize";
import {
  cancelAppointment,
  createAppointment,
  getAppointmentById,
  getMyAppointments,
  rescheduleAppointment,
  updateAppointmentStatus,
  addDoctorNotes,
} from "./appointments.controller";

const router = express.Router();

router.post("/", authenticate, authorize(Role.PATIENT), createAppointment);
router.get("/my", authenticate, authorizeAny(Role.PATIENT, Role.DOCTOR), getMyAppointments);
router.get("/:id", authenticate, authorizeAny(Role.PATIENT, Role.DOCTOR, Role.ADMIN), getAppointmentById);
router.put("/:id/status", authenticate, authorize(Role.DOCTOR), updateAppointmentStatus);
router.put("/:id/notes", authenticate, authorize(Role.DOCTOR), addDoctorNotes);
router.put("/:id/cancel", authenticate, authorize(Role.PATIENT), cancelAppointment);
router.put("/:id/reschedule", authenticate, authorize(Role.PATIENT), rescheduleAppointment);

export default router;

