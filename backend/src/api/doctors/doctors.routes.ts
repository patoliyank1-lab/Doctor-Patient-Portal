import express from "express";
import { getDoctorById, listDoctors } from "./doctors.controller";

const router = express.Router();

router.get("/", listDoctors);
router.get("/:id", getDoctorById);

export default router;

