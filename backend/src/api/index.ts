import express  from "express";
import authRoute from "./auth/auth.routes"
import doctorsRoute from "./doctors/doctors.routes"

const router = express.Router();

router.use("/auth", authRoute)
router.use("/doctors", doctorsRoute)

export default router;