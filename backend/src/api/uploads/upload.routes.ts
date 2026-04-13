import express from "express";
import { authenticate } from "../../middlewares/authenticate";
import { deleteFile, getPresignedUrl } from "./upload.controller";

const router = express.Router();

// POST  /uploads/presigned-url  — Get a presigned S3 URL for direct upload
router.post("/presigned-url", authenticate, getPresignedUrl);

// DELETE /uploads/file          — Delete a file from S3 by key
router.delete("/file", authenticate, deleteFile);

export default router;
