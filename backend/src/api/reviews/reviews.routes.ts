import express from "express";
import { Role } from "../../../prisma/generated/client/enums";
import { authenticate } from "../../middlewares/authenticate";
import { authorize, authorizeAny } from "../../middlewares/authorize";
import {
  createReview,
  deleteReview,
  getDoctorReviews,
  getMyReviews,
} from "./reviews.controller";

const router = express.Router();

// Specific string routes before parameterised ones
router.get("/my", authenticate, authorize(Role.PATIENT), getMyReviews);

// POST /reviews
router.post("/", authenticate, authorize(Role.PATIENT), createReview);

// GET /reviews/doctor/:doctorId  — any authenticated user
router.get(
  "/doctor/:doctorId",
  authenticate,
  authorizeAny(Role.PATIENT, Role.DOCTOR, Role.ADMIN),
  getDoctorReviews,
);

// DELETE /reviews/:id  — Patient or Admin
router.delete(
  "/:id",
  authenticate,
  authorizeAny(Role.PATIENT, Role.ADMIN),
  deleteReview,
);

export default router;
