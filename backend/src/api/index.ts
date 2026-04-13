import express  from "express";
import authRoute from "./auth/auth.routes"
import doctorRoute from "./doctor/doctor.routes"

const router = express.Router();

router.use("/auth", authRoute)
router.use("/doctor", doctorRoute)

export default router;