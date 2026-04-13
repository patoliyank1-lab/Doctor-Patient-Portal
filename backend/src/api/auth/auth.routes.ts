import express  from "express";
import { forgotPassword, loginUser, logoutUser, me, registerUser, resetPassword, verifyEmail } from "./auth.controller";
import { authenticate } from "../../middlewares/authenticate";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, me);


export default router;