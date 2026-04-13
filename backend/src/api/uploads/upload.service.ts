import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getS3Bucket, getS3Client } from "../../config/s3";
import { AppError, UnknownError } from "../../utils/errorHandler";
import type { DeleteFileInput, PresignedUrlInput } from "./upload.validators";

// Presigned PUT URLs expire after 10 minutes
const PRESIGNED_URL_EXPIRES_IN = 600;

/**
 * Generate a presigned PUT URL so the client can upload directly to S3.
 *
 * Upload flow:
 *   1. Client  →  POST /api/v1/uploads/presigned-url
 *              ←  { uploadUrl, key, publicUrl, expiresIn }
 *   2. Client  →  PUT <uploadUrl>  (raw binary, no auth header)
 *   3. Client  →  POST /api/v1/medical-records  with { fileUrl: publicUrl, ... }
 *              OR PUT /api/v1/doctors/me/image   with { imageUrl: publicUrl }
 */
export const generatePresignedUrl = async (input: PresignedUrlInput) => {
  try {
    const ext = path.extname(input.fileName).toLowerCase(); // e.g. ".pdf"
    const uniqueName = `${randomUUID()}${ext}`;
    const key = `${input.folder}/${uniqueName}`;

    const command = new PutObjectCommand({
      Bucket: getS3Bucket(),
      Key: key,
      ContentType: input.fileType,
      ContentLength: input.fileSizeBytes,
    });

    const uploadUrl = await getSignedUrl(getS3Client(), command, {
      expiresIn: PRESIGNED_URL_EXPIRES_IN,
    });

    // Public URL of the uploaded object.
    // Assumes the bucket is public-read or configured with a public-read ACL.
    // For private buckets, generate a signed GET URL at read time instead.
    const region = process.env.AWS_REGION!;
    const publicUrl = `https://${getS3Bucket()}.s3.${region}.amazonaws.com/${key}`;

    return {
      uploadUrl,             // PUT here with raw file binary (expires in 10 min)
      key,                   // store in DB for deletion later
      publicUrl,             // use as fileUrl / profileImageUrl
      expiresIn: PRESIGNED_URL_EXPIRES_IN,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

/**
 * Permanently delete an S3 object by key.
 * Call this when a user removes a profile image or deletes a medical record.
 */
export const deleteFileFromS3 = async (input: DeleteFileInput) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: getS3Bucket(),
      Key: input.key,
    });

    await getS3Client().send(command);
    return { message: "File deleted from S3 successfully" };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};
