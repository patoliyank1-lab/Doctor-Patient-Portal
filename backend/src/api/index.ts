import express  from "express";
import authRoute from "./auth/auth.routes"
import doctorsRoute from "./doctors/doctors.routes"
import patientsRoute from "./patients/patients.routes"
import slotsRoute from "./slots/slots.routes.ts"

const router = express.Router();

router.use("/auth", authRoute)
router.use("/doctors", doctorsRoute)
router.use("/patients", patientsRoute)
router.use("/slots", slotsRoute)

export default router;