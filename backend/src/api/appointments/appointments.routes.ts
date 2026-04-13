import express from "express";
import { Role } from "../../../prisma/generated/client/enums";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { createAppointment, getMyAppointments } from "./appointments.controller";

const router = express.Router();

router.post("/", authenticate, authorize(Role.PATIENT), createAppointment);
router.get("/my", authenticate, authorize(Role.PATIENT), getMyAppointments);

export default router;

