import { S3Client } from "@aws-sdk/client-s3";
import { lodVariable } from "../utils/dotenv";

// ─── Lazy singletons ────────────────────────────────────────
// lodVariable() is called only when the first S3 operation is
// made, so the server starts fine even when AWS vars are still
// placeholder values in .env.

let _client: S3Client | null = null;
let _bucket: string | null = null;

export const getS3Client = (): S3Client => {
  if (!_client) {
    _client = new S3Client({
      region: lodVariable("AWS_REGION"),
      credentials: {
        accessKeyId: lodVariable("AWS_ACCESS_KEY_ID"),
        secretAccessKey: lodVariable("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }
  return _client;
};

export const getS3Bucket = (): string => {
  if (!_bucket) _bucket = lodVariable("AWS_S3_BUCKET_NAME");
  return _bucket;
};
