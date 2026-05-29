import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSlug, ensureUniqueSlug } from "@/lib/slug"
import type { Prisma } from "@prisma/client"

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  titleFr:        z.string().min(1).max(200),
  titleAr:        z.string().max(200).optional().nullable(),
  slug:           z.string().max(60).optional().nullable(),
  descriptionFr:  z.string().max(5000).optional().nullable(),
  descriptionAr:  z.string().max(5000).optional().nullable(),
  price:          z.number().int().min(0),       // centimes
  costPrice:      z.number().int().min(0).default(0),
  comparePrice:   z.number().int().min(0).optional().nullable(),
  stock:          z.number().int().min(0).default(0),
  lowStockAlert:  z.number().int().min(0).default(10),
  status:         z.enum(["DRAFT","ACTIVE","PAUSED","ARCHIVED"]).default("DRAFT"),
  testingStatus:  z.enum(["TESTING","WINNER","SCALING","STOPPED"]).default("TESTING"),
  images:         z.array(z.string().url()).max(8).default([]),
  // Supplier fields → ProductResearch
  supplierUrl:    z.string().url().optional().nullable(),
  alibabaUrl:     z.string().url().optional().nullable(),
  url1688:        z.string().url().optional().nullable(),
  buyingPrice:    z.number().int().min(0).optional().nullable(),
})

const listQuerySchema = z.object({
  search:        z.string().optional(),
  status:        z.enum(["DRAFT","ACTIVE","PAUSED","ARCHIVED"]).optional(),
  testingStatus: z.enum(["TESTING","WINNER","SCALING","STOPPED"]).optional(),
  sort:          z.enum(["newest","stock_asc","price_asc"]).default("newest"),
  page:          z.coerce.number().int().min(1).default(1),
  pageSize:      z.coerce.number().int().min(1).max(100).default(20),
})

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const params = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = listQuerySchema.safeParse(params)
  if (!parsed.success) return NextResponse.json({ error: "Paramètres invalides" }, { status: 422 })

  const { search, status, testingStatus, sort, page, pageSize } = parsed.data

  const where: Prisma.ProductWhereInput = {}
  if (search) {
    where.OR = [
      { titleFr: { contains: search, mode: "insensitive" } },
      { slug:    { contains: search, mode: "insensitive" } },
    ]
  }
  if (status)        where.status        = status
  if (testingStatus) where.testingStatus = testingStatus

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "stock_asc" ? { stock: "asc" } :
    sort === "price_asc" ? { price: "asc" } :
    { createdAt: "desc" }

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      select: {
        id:            true,
        slug:          true,
        titleFr:       true,
        price:         true,
        costPrice:     true,
        comparePrice:  true,
        stock:         true,
        lowStockAlert: true,
        status:        true,
        testingStatus: true,
        images:        true,
        createdAt:     true,
        _count: {
          select: {
            orders: {
              where: { createdAt: { gte: monthStart } },
            },
          },
        },
      },
    }),
  ])

  return NextResponse.json({ products, total, page, pageSize })
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Données invalides" },
      { status: 422 },
    )
  }

  const data = parsed.data

  const baseSlug = data.slug
    ? generateSlug(data.slug)
    : generateSlug(data.titleFr)

  const slug = await ensureUniqueSlug(baseSlug, prisma)

  const hasSupplierData = data.supplierUrl || data.alibabaUrl || data.url1688 || data.buyingPrice

  const product = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        slug,
        titleFr:       data.titleFr,
        titleAr:       data.titleAr ?? null,
        descriptionFr: data.descriptionFr ?? null,
        descriptionAr: data.descriptionAr ?? null,
        price:         data.price,
        costPrice:     data.costPrice,
        comparePrice:  data.comparePrice ?? null,
        stock:         data.stock,
        lowStockAlert: data.lowStockAlert,
        status:        data.status,
        testingStatus: data.testingStatus,
        images:        data.images,
      },
    })

    if (hasSupplierData) {
      await tx.productResearch.create({
        data: {
          productId:   product.id,
          supplierUrl: data.supplierUrl ?? null,
          alibabaUrl:  data.alibabaUrl  ?? null,
          url1688:     data.url1688     ?? null,
          buyingPrice: data.buyingPrice ?? null,
        },
      })
    }

    return product
  })

  return NextResponse.json(product, { status: 201 })
}
