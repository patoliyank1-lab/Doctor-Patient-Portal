import express  from "express";
import { registerUser } from "./auth.controller";

const router = express.Router();

router.post("/register", registerUser)


export default router;