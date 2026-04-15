/**
 * test.ts — End-to-end test for S3 pre-signed URL upload flow
 *
 * Steps:
 *   1. Call POST /api/v1/uploads/presigned-url (with auth cookie)
 *   2. PUT the image file directly to S3 using the presigned URL
 *   3. Log results at each step
 *
 * Run: npx tsx test.ts
 */

import fs from "node:fs";
import path from "node:path";

// ── Config ───────────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:4000/api/v1";
const ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTcwNjhmZS0xODI4LTRjMmItOTBhYi01ZWExZDc3Y2I4MzkiLCJlbWFpbCI6ImFkbWluQG1lZGljb25uZWN0LmRldiIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3NjI0OTg2NSwiZXhwIjoxNzc2MjUwNzY1fQ.cZP-JRBgIrHtLGS2zc84ZSQwtCVdehdt0yg35B-HTp8";

const IMAGE_PATH = path.resolve(
  "/home/picpu-11/Doctor–Patient Portal/Patoliya Wallpaper.jpg"
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function separator(title: string) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}\n`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 0. Read the image file
  separator("STEP 0 — Read image file");
  if (!fs.existsSync(IMAGE_PATH)) {
    console.error(`❌ File not found: ${IMAGE_PATH}`);
    process.exit(1);
  }
  const fileBuffer = fs.readFileSync(IMAGE_PATH);
  const fileSize = fileBuffer.byteLength;
  const fileName = path.basename(IMAGE_PATH);
  const fileType = "image/jpeg"; // JPEG file

  console.log(`📁 File: ${fileName}`);
  console.log(`📏 Size: ${(fileSize / 1024).toFixed(1)} KB (${fileSize} bytes)`);
  console.log(`🏷️  MIME: ${fileType}`);

  // 1. Get presigned URL from backend
  separator("STEP 1 — POST /uploads/presigned-url");

  const presignedRes = await fetch(`${API_BASE}/uploads/presigned-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `accessToken=${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      fileName,
      fileType,
      fileSizeBytes: fileSize,
      folder: "medical-records",
    }),
  });

  console.log(`📡 Status: ${presignedRes.status} ${presignedRes.statusText}`);

  if (!presignedRes.ok) {
    const errorBody = await presignedRes.text();
    console.error(`❌ Failed to get presigned URL!`);
    console.error(`   Response: ${errorBody}`);
    process.exit(1);
  }

  const presignedJson = await presignedRes.json();
  console.log(`✅ Response:`, JSON.stringify(presignedJson, null, 2));

  // Extract the data (handles both envelope and direct shapes)
  const data = presignedJson.data ?? presignedJson;
  const { uploadUrl, publicUrl, key } = data;

  console.log(`\n📋 Upload URL: ${uploadUrl?.slice(0, 100)}...`);
  console.log(`🌐 Public URL: ${publicUrl}`);
  console.log(`🔑 S3 Key:     ${key}`);

  if (!uploadUrl) {
    console.error(`❌ No uploadUrl in response!`);
    process.exit(1);
  }

  // 2. Upload file to S3 using presigned URL
  separator("STEP 2 — PUT file to S3 (presigned URL)");

  console.log(`📤 Uploading ${fileName} (${(fileSize / 1024).toFixed(1)} KB) to S3...`);
  console.log(`   Content-Type: ${fileType}`);
  console.log(`   Method: PUT`);
  console.log(`   ⚠️  NO auth headers — the presigned URL IS the authentication`);

  const s3Res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": fileType,
    },
    body: fileBuffer,
  });

  console.log(`\n📡 S3 Status: ${s3Res.status} ${s3Res.statusText}`);

  if (!s3Res.ok) {
    const s3ErrorBody = await s3Res.text();
    console.error(`❌ S3 upload FAILED!`);
    console.error(`   Response: ${s3ErrorBody}`);
    process.exit(1);
  }

  // 3. Done!
  separator("✅ SUCCESS — Upload Complete!");

  console.log(`🎉 File uploaded successfully to S3!`);
  console.log(`\n📎 Public URL (use this to access the file):`);
  console.log(`   ${publicUrl}`);
  console.log(`\n🔑 S3 Key (use this to delete the file later):`);
  console.log(`   ${key}`);
  console.log(`\n🧪 Test it: open the Public URL in your browser to see the image.`);
}

main().catch((err) => {
  console.error(`\n💥 Unexpected error:`, err);
  process.exit(1);
});
