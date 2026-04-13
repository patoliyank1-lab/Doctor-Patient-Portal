import express from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { Role } from "../../../prisma/generated/client/enums";
import { createSlot, createSlotsBulk } from "./slots.controller";

const router = express.Router();

router.post("/", authenticate, authorize(Role.DOCTOR), createSlot);
router.post("/bulk", authenticate, authorize(Role.DOCTOR), createSlotsBulk);

export default router;

