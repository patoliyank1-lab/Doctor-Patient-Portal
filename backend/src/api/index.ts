import express  from "express";
import authRoute from "./auth/auth.routes"
import doctorsRoute from "./doctors/doctors.routes"
import patientsRoute from "./patients/patients.routes"
import slotsRoute from "./slots/slots.routes.ts"
import appointmentsRoute from "./appointments/appointments.routes"
import medicalRecordsRoute from "./medical-records/medical-records.routes"
import uploadsRoute from "./uploads/upload.routes"
import notificationsRoute from "./notifications/notifications.routes"
import reviewsRoute from "./reviews/reviews.routes"
import adminRoute from "./admin/admin.routes"

const router = express.Router();

router.use("/auth", authRoute)
router.use("/doctors", doctorsRoute)
router.use("/patients", patientsRoute)
router.use("/slots", slotsRoute)
router.use("/appointments", appointmentsRoute)
router.use("/medical-records", medicalRecordsRoute)
router.use("/uploads", uploadsRoute)
router.use("/notifications", notificationsRoute)
router.use("/reviews", reviewsRoute)
router.use("/admin", adminRoute)

export default router;