import express from "express";
import {
  createMyDoctorProfile,
  deactivateMyDoctorAccount,
  getDoctorById,
  getMyDoctorProfile,
  listDoctors,
  listPendingDoctors,
  updateDoctorStatus,
  updateMyDoctorImage,
  updateMyDoctorProfile,
} from "./doctors.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { Role } from "../../../prisma/generated/client/enums";

const router = express.Router();

// Admin routes
router.get("/pending", authenticate, authorize(Role.ADMIN), listPendingDoctors);
router.put("/:id/status", authenticate, authorize(Role.ADMIN), updateDoctorStatus);

// Doctor self-profile routes
router.get("/me", authenticate, authorize(Role.DOCTOR), getMyDoctorProfile);
router.post("/me", authenticate, authorize(Role.DOCTOR), createMyDoctorProfile);
router.put("/me", authenticate, authorize(Role.DOCTOR), updateMyDoctorProfile);
router.put("/me/image", authenticate, authorize(Role.DOCTOR), updateMyDoctorImage);
router.put("/me/deactivate", authenticate, authorize(Role.DOCTOR), deactivateMyDoctorAccount);

// Public routes
router.get("/", listDoctors);
router.get("/:id", getDoctorById);

export default router;

