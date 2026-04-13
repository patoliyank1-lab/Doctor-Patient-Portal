import express from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { authorizeAny } from "../../middlewares/authorize";
import { Role } from "../../../prisma/generated/client/enums";
import {
  createMyPatientProfile,
  deactivateMyPatientAccount,
  getMyPatientProfile,
  updateMyPatientImage,
  updateMyPatientProfile,
  getPatientById,
  listPatients,
} from "./patients.controller";

const router = express.Router();

// Patient self-profile
router.get("/me", authenticate, authorize(Role.PATIENT), getMyPatientProfile);
router.post("/me", authenticate, authorize(Role.PATIENT), createMyPatientProfile);
router.put("/me", authenticate, authorize(Role.PATIENT), updateMyPatientProfile);
router.put("/me/image", authenticate, authorize(Role.PATIENT), updateMyPatientImage);
router.put("/me/deactivate", authenticate, authorize(Role.PATIENT), deactivateMyPatientAccount);

// Admin-only
router.get("/", authenticate, authorize(Role.ADMIN), listPatients);

// Admin or Doctor
router.get("/:id", authenticate, authorizeAny(Role.ADMIN, Role.DOCTOR), getPatientById);

export default router;

