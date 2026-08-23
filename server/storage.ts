// Object storage via Cloudflare R2 (S3-compatible).
// Uploads go straight to R2 via the S3 SDK; downloads are served through a
// short-lived presigned GET URL so the bucket itself stays private.

import { randomUUID } from "crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

const SIGNED_URL_EXPIRY_SECONDS = 3600;

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (!ENV.r2AccountId || !ENV.r2AccessKeyId || !ENV.r2SecretAccessKey) {
    throw new Error(
      "Storage config missing: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY",
    );
  }
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: ENV.s3EndpointOverride || `https://${ENV.r2AccountId}.r2.cloudflarestorage.com`,
      // R2 buckets are region-agnostic; forcePathStyle is required for
      // S3-compatible endpoints that aren't *.s3.amazonaws.com (R2, MinIO, etc).
      forcePathStyle: true,
      credentials: {
        accessKeyId: ENV.r2AccessKeyId,
        secretAccessKey: ENV.r2SecretAccessKey,
      },
    });
  }
  return cachedClient;
}

function getBucketName(): string {
  if (!ENV.r2BucketName) {
    throw new Error("Storage config missing: set R2_BUCKET_NAME");
  }
  return ENV.r2BucketName;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const client = getClient();
  const bucket = getBucketName();
  const key = appendHashSuffix(normalizeKey(relKey));

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    }),
  );

  return { key, url: `/storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const client = getClient();
  const bucket = getBucketName();
  const key = normalizeKey(relKey);

  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: SIGNED_URL_EXPIRY_SECONDS,
  });
}

export async function storageDelete(relKey: string): Promise<void> {
  const client = getClient();
  const bucket = getBucketName();
  const key = normalizeKey(relKey);

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
