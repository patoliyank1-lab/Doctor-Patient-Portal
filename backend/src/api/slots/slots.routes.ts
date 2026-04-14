import express from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize, authorizeAny } from "../../middlewares/authorize";
import { Role } from "../../../prisma/generated/client/enums";
import {
  createSlot,
  createSlotsBulk,
  deleteSlot,
  getDoctorAvailableSlots,
  getMySlots,
  updateSlot,
} from "./slots.controller";

const router = express.Router();

router.get("/my", authenticate, authorize(Role.DOCTOR), getMySlots);
router.post("/", authenticate, authorize(Role.DOCTOR), createSlot);
router.post("/bulk", authenticate, authorize(Role.DOCTOR), createSlotsBulk);
router.put("/:id", authenticate, authorize(Role.DOCTOR), updateSlot);
router.delete("/:id", authenticate, authorize(Role.DOCTOR), deleteSlot);

// GET /slots/doctor/:doctorId — public, no auth required
router.get("/doctor/:doctorId", getDoctorAvailableSlots);

export default router;

