import express from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { Role } from "../../../prisma/generated/client/enums";
import { createDoctorProfile } from "./doctor.controller";

const router = express.Router();

router.post("/profile", authenticate, authorize(Role.DOCTOR), createDoctorProfile);

export default router;

