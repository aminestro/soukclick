import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const sp        = req.nextUrl.searchParams
  const productId = sp.get("productId") ?? undefined
  const type      = sp.get("type")      ?? undefined

  if (!productId) return NextResponse.json({ error: "productId requis" }, { status: 422 })

  const creatives = await prisma.creative.findMany({
    where: {
      productId,
      ...(type ? { type: type as Parameters<typeof prisma.creative.findMany>[0]["where"] extends { type?: infer T } ? T : never } : {}),
    },
    orderBy: [{ isWinner: "desc" }, { createdAt: "desc" }],
  })

  return NextResponse.json(creatives)
}

const createSchema = z.object({
  productId: z.string().cuid(),
  type:      z.enum(["IMAGE","VIDEO","UGC_SCRIPT","HOOK","AD_COPY"]),
  platform:  z.enum(["META","TIKTOK","GOOGLE","ALL"]).default("ALL"),
  title:     z.string().min(1).max(200),
  content:   z.string().max(10000).optional().nullable(),
  fileUrl:   z.string().url().optional().nullable(),
  isWinner:  z.boolean().default(false),
  notes:     z.string().max(500).optional().nullable(),
  tags:      z.array(z.string()).default([]),
})

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 })

  const creative = await prisma.creative.create({ data: parsed.data })
  return NextResponse.json(creative, { status: 201 })
}
