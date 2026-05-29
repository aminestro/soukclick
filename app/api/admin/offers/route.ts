import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisÃ©" }, { status: 401 })

  const productId = req.nextUrl.searchParams.get("productId") ?? undefined
  if (!productId) return NextResponse.json({ error: "productId requis" }, { status: 422 })

  const offers = await prisma.offer.findMany({
    where:   { productId },
    orderBy: { minQuantity: "asc" },
  })

  return NextResponse.json(offers)
}

const createSchema = z.object({
  productId:       z.string().cuid(),
  type:            z.enum(["QUANTITY_DISCOUNT","FREE_SHIPPING","BUNDLE"]),
  labelFr:         z.string().min(1).max(200),
  labelAr:         z.string().max(200).optional().nullable(),
  minQuantity:     z.number().int().min(1).default(1),
  discountPercent: z.number().int().min(0).max(100).default(0),
  freeShipping:    z.boolean().default(false),
  isActive:        z.boolean().default(true),
})

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisÃ©" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 })

  const offer = await prisma.offer.create({ data: parsed.data })
  return NextResponse.json(offer, { status: 201 })
}