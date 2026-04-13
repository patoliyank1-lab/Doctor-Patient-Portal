import express from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { authorizeAny } from "../../middlewares/authorize";
import { Role } from "../../../prisma/generated/client/enums";
import { getPatientById, listPatients } from "./patients.controller";

const router = express.Router();

// Admin-only
router.get("/", authenticate, authorize(Role.ADMIN), listPatients);

// Admin or Doctor
router.get("/:id", authenticate, authorizeAny(Role.ADMIN, Role.DOCTOR), getPatientById);

export default router;

