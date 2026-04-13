import express from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { Role } from "../../../prisma/generated/client/enums";
import { createSlot, createSlotsBulk, getMySlots, updateSlot } from "./slots.controller";

const router = express.Router();

router.get("/my", authenticate, authorize(Role.DOCTOR), getMySlots);
router.post("/", authenticate, authorize(Role.DOCTOR), createSlot);
router.post("/bulk", authenticate, authorize(Role.DOCTOR), createSlotsBulk);
router.put("/:id", authenticate, authorize(Role.DOCTOR), updateSlot);

export default router;

