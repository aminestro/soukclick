import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSlug, ensureUniqueSlug } from "@/lib/slug"

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const product = await prisma.product.findUnique({
    where:   { id: params.id },
    include: {
      landingPages: {
        orderBy: { createdAt: "desc" },
        select: {
          id:       true,
          slug:     true,
          template: true,
          isActive: true,
          _count:   { select: { orders: true } },
        },
      },
      offers: {
        orderBy: { minQuantity: "asc" },
      },
      reviews: {
        orderBy: { sortOrder: "asc" },
      },
      research: true,
    },
  })

  if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })

  return NextResponse.json(product)
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

const patchSchema = z.object({
  titleFr:        z.string().min(1).max(200).optional(),
  titleAr:        z.string().max(200).nullable().optional(),
  slug:           z.string().max(60).optional(),
  descriptionFr:  z.string().max(5000).nullable().optional(),
  descriptionAr:  z.string().max(5000).nullable().optional(),
  price:          z.number().int().min(0).optional(),
  costPrice:      z.number().int().min(0).optional(),
  comparePrice:   z.number().int().min(0).nullable().optional(),
  stock:          z.number().int().min(0).optional(),
  lowStockAlert:  z.number().int().min(0).optional(),
  status:         z.enum(["DRAFT","ACTIVE","PAUSED","ARCHIVED"]).optional(),
  testingStatus:  z.enum(["TESTING","WINNER","SCALING","STOPPED"]).optional(),
  images:         z.array(z.string().url()).max(8).optional(),
  // Research fields
  supplierUrl:    z.string().url().nullable().optional(),
  alibabaUrl:     z.string().url().nullable().optional(),
  url1688:        z.string().url().nullable().optional(),
  buyingPrice:    z.number().int().min(0).nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 })
  }

  const existing = await prisma.product.findUnique({
    where:  { id: params.id },
    select: { id: true, slug: true },
  })
  if (!existing) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })

  const data = parsed.data

  // Slug uniqueness check if slug changed
  let finalSlug: string | undefined
  if (data.slug !== undefined) {
    const base = generateSlug(data.slug)
    finalSlug  = await ensureUniqueSlug(base, prisma, params.id)
  }

  const {
    supplierUrl, alibabaUrl, url1688, buyingPrice,
    slug: _slug, // extracted to handle separately
    ...productFields
  } = data

  const hasResearchFields = supplierUrl !== undefined || alibabaUrl !== undefined ||
    url1688 !== undefined || buyingPrice !== undefined

  const product = await prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id: params.id },
      data:  {
        ...productFields,
        ...(finalSlug ? { slug: finalSlug } : {}),
      },
    })

    if (hasResearchFields) {
      await tx.productResearch.upsert({
        where:  { productId: params.id },
        create: {
          productId:   params.id,
          supplierUrl: supplierUrl ?? null,
          alibabaUrl:  alibabaUrl  ?? null,
          url1688:     url1688     ?? null,
          buyingPrice: buyingPrice ?? null,
        },
        update: {
          ...(supplierUrl !== undefined ? { supplierUrl } : {}),
          ...(alibabaUrl  !== undefined ? { alibabaUrl  } : {}),
          ...(url1688     !== undefined ? { url1688     } : {}),
          ...(buyingPrice !== undefined ? { buyingPrice } : {}),
        },
      })
    }

    return product
  })

  return NextResponse.json(product)
}

// ─── DELETE (soft archive) ────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  await prisma.product.update({
    where: { id: params.id },
    data:  { status: "ARCHIVED" },
  })

  return NextResponse.json({ ok: true })
}
