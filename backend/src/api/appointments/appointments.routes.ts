import express from "express";
import { Role } from "../../../prisma/generated/client/enums";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import {
  cancelAppointment,
  createAppointment,
  getMyAppointments,
  rescheduleAppointment,
} from "./appointments.controller";

const router = express.Router();

router.post("/", authenticate, authorize(Role.PATIENT), createAppointment);
router.get("/my", authenticate, authorize(Role.PATIENT), getMyAppointments);
router.put("/:id/cancel", authenticate, authorize(Role.PATIENT), cancelAppointment);
router.put("/:id/reschedule", authenticate, authorize(Role.PATIENT), rescheduleAppointment);

export default router;

