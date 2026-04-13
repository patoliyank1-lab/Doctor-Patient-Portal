import express from "express";
import { getDoctorById, listDoctors, listPendingDoctors, updateDoctorStatus } from "./doctors.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { Role } from "../../../prisma/generated/client/enums";

const router = express.Router();

// Admin routes
router.get("/pending", authenticate, authorize(Role.ADMIN), listPendingDoctors);
router.put("/:id/status", authenticate, authorize(Role.ADMIN), updateDoctorStatus);

// Public routes
router.get("/", listDoctors);
router.get("/:id", getDoctorById);

export default router;

