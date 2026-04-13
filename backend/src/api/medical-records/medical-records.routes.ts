import express from "express";
import { Role } from "../../../prisma/generated/client/enums";
import { authenticate } from "../../middlewares/authenticate";
import { authorize, authorizeAny } from "../../middlewares/authorize";
import {
  createRecord,
  deleteRecord,
  getMyRecords,
  getPatientRecords,
  getRecord,
} from "./medical-records.controller";

const router = express.Router();

// POST  /medical-records              — Patient or Doctor uploads a record
router.post(
  "/",
  authenticate,
  authorizeAny(Role.PATIENT, Role.DOCTOR),
  createRecord,
);

// GET   /medical-records/my           — Patient views own records
router.get("/my", authenticate, authorize(Role.PATIENT), getMyRecords);

// GET   /medical-records/patient/:patientId — Doctor views a patient's records
router.get(
  "/patient/:patientId",
  authenticate,
  authorize(Role.DOCTOR),
  getPatientRecords,
);

// GET   /medical-records/:id          — Any authenticated user (RBAC inside service)
router.get(
  "/:id",
  authenticate,
  authorizeAny(Role.PATIENT, Role.DOCTOR, Role.ADMIN),
  getRecord,
);

// DELETE /medical-records/:id         — Patient soft-deletes own record
router.delete("/:id", authenticate, authorize(Role.PATIENT), deleteRecord);

export default router;
