import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"

// ─── Client ───────────────────────────────────────────────────────────────────

export const r2Client = new S3Client({
  region:   "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET     = () => process.env.R2_BUCKET_NAME!
const PUBLIC_URL = () => process.env.R2_PUBLIC_URL!

// ─── Upload single file ───────────────────────────────────────────────────────

export async function uploadToR2(
  buffer:      Buffer,
  key:         string,
  contentType: string,
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket:      BUCKET(),
      Key:         key,
      Body:        buffer,
      ContentType: contentType,
    }),
  )
  return `${PUBLIC_URL()}/${key}`
}

// ─── Delete by public URL ─────────────────────────────────────────────────────

export async function deleteFromR2(url: string): Promise<void> {
  const base = PUBLIC_URL()
  if (!url.startsWith(base)) {
    throw new Error(`URL does not belong to configured R2 bucket: ${url}`)
  }
  const key = url.slice(base.length + 1) // strip trailing slash + key
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET(),
      Key:    key,
    }),
  )
}

// ─── Batch upload ─────────────────────────────────────────────────────────────

export async function uploadMultiple(
  files: Array<{ buffer: Buffer; key: string; contentType: string }>,
): Promise<string[]> {
  return Promise.all(
    files.map(({ buffer, key, contentType }) => uploadToR2(buffer, key, contentType)),
  )
}

// ─── Key builder ─────────────────────────────────────────────────────────────

export function buildKey(
  folder:    "products" | "creatives" | "reviews",
  filename:  string,
): string {
  return `${folder}/${Date.now()}-${filename}`
}
