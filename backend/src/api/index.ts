import express  from "express";
import authRoute from "./auth/auth.routes"
import doctorsRoute from "./doctors/doctors.routes"
import patientsRoute from "./patients/patients.routes"
import slotsRoute from "./slots/slots.routes.ts"
import appointmentsRoute from "./appointments/appointments.routes"

const router = express.Router();

router.use("/auth", authRoute)
router.use("/doctors", doctorsRoute)
router.use("/patients", patientsRoute)
router.use("/slots", slotsRoute)
router.use("/appointments", appointmentsRoute)

export default router;