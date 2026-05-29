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

  const reviews = await prisma.review.findMany({
    where:   { productId },
    orderBy: { sortOrder: "asc" },
  })

  return NextResponse.json(reviews)
}

const createSchema = z.object({
  productId:  z.string().cuid(),
  authorName: z.string().min(1).max(100),
  authorCity: z.string().max(100).optional().nullable(),
  rating:     z.number().int().min(1).max(5).default(5),
  content:    z.string().min(1).max(2000),
  imageUrl:   z.string().url().optional().nullable(),
  isVerified: z.boolean().default(false),
  sortOrder:  z.number().int().min(0).default(0),
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

  // Auto sort_order: append at end
  if (parsed.data.sortOrder === 0) {
    const max = await prisma.review.aggregate({
      where:  { productId: parsed.data.productId },
      _max:   { sortOrder: true },
    })
    parsed.data.sortOrder = (max._max.sortOrder ?? 0) + 1
  }

  const review = await prisma.review.create({ data: parsed.data })
  return NextResponse.json(review, { status: 201 })
}