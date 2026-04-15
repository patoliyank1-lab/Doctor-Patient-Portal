import { ZodError } from "zod";
import { formattedResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import * as uploadService from "./upload.service";
import { deleteFileSchema, presignedUrlSchema } from "./upload.validators";

/**
 * @description Generate a presigned S3 PUT URL for direct client-side upload.
 * @route POST /api/v1/uploads/presigned-url
 * @access Auth
 */
export const getPresignedUrl = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const input = presignedUrlSchema.parse(req.body);
    const result = await uploadService.generatePresignedUrl(input);
    console.log(`[DEBUG]: ${result}`)
    formattedResponse(res, 200, result, "Presigned URL generated successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, {
        errors: error.issues.map((i) => i.message),
      });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @description Delete a file from S3 by its object key.
 * @route DELETE /api/v1/uploads/file
 * @access Auth
 */
export const deleteFile = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const input = deleteFileSchema.parse(req.body);
    const result = await uploadService.deleteFileFromS3(input);
    formattedResponse(res, 200, result, "File deleted successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, {
        errors: error.issues.map((i) => i.message),
      });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});
