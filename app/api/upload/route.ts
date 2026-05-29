import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"
import { uploadToR2, buildKey } from "@/lib/r2"
import sharp from "sharp"
import { randomUUID } from "crypto"

export const dynamic = 'force-dynamic'

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"])
const MAX_IMAGE_BYTES      = 10 * 1024 * 1024   // 10 MB
const MAX_VIDEO_BYTES      = 100 * 1024 * 1024  // 100 MB
const MAX_IMAGE_WIDTH      = 1200

const VALID_FOLDERS = new Set(["products", "creatives", "reviews"])

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisÃ©" }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 })
  }

  const file   = formData.get("file")
  const folder = (formData.get("folder") as string | null) ?? "products"

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 422 })
  }

  if (!VALID_FOLDERS.has(folder)) {
    return NextResponse.json({ error: "Dossier invalide" }, { status: 422 })
  }

  const mimeType  = file.type
  const isImage   = ALLOWED_IMAGE_TYPES.has(mimeType)
  const isVideo   = ALLOWED_VIDEO_TYPES.has(mimeType)

  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "Type de fichier non supportÃ©. AcceptÃ© : JPEG, PNG, WebP, MP4." },
      { status: 422 },
    )
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size > maxBytes) {
    const limit = isVideo ? "100 MB" : "10 MB"
    return NextResponse.json({ error: `Fichier trop volumineux (max ${limit})` }, { status: 422 })
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer())

  let finalBuffer:  Buffer
  let contentType:  string
  let extension:    string

  if (isImage) {
    // Convert to WebP + resize if > MAX_IMAGE_WIDTH
    const sharpPipeline = sharp(rawBuffer).rotate() // auto-rotate from EXIF

    const meta = await sharpPipeline.metadata()
    if ((meta.width ?? 0) > MAX_IMAGE_WIDTH) {
      sharpPipeline.resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
    }

    finalBuffer = await sharpPipeline
      .webp({ quality: 85, effort: 4 })
      .toBuffer()

    contentType = "image/webp"
    extension   = "webp"
  } else {
    // Video â€” pass through unchanged
    finalBuffer = rawBuffer
    contentType = mimeType
    extension   = mimeType === "video/webm" ? "webm" : "mp4"
  }

  const key = buildKey(
    folder as "products" | "creatives" | "reviews",
    `${randomUUID()}.${extension}`,
  )

  const url = await uploadToR2(finalBuffer, key, contentType)

  return NextResponse.json({ url, key }, { status: 201 })
}