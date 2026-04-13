import express  from "express";
import authRoute from "./auth/auth.routes"
import doctorRoute from "./doctor/doctor.routes"
import doctorsRoute from "./doctors/doctors.routes"

const router = express.Router();

router.use("/auth", authRoute)
router.use("/doctor", doctorRoute)
router.use("/doctors", doctorsRoute)

export default router;