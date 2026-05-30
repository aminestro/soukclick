import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSlug, ensureUniqueSlug } from "@/lib/slug"
import { deleteFromR2 } from "@/lib/r2"

export const dynamic = 'force-dynamic'

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
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
        offers:   { orderBy: { minQuantity: "asc" } },
        reviews:  { orderBy: { sortOrder: "asc" } },
        research: true,
      },
    })

    if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
    return NextResponse.json(product)
  } catch (err) {
    console.error("[products/GET]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

// Coerce empty strings to null for optional URL fields
const optionalUrl = z
  .string()
  .url("URL invalide")
  .or(z.literal(""))
  .nullable()
  .optional()
  .transform((v) => (v === "" ? null : v))

const patchSchema = z.object({
  titleFr:       z.string().min(1).max(200).optional(),
  titleAr:       z.string().max(200).nullable().optional(),
  slug:          z.string().max(60).optional(),
  descriptionFr: z.string().max(5000).nullable().optional(),
  descriptionAr: z.string().max(5000).nullable().optional(),
  price:         z.number().int().min(0).optional(),
  costPrice:     z.number().int().min(0).optional(),
  comparePrice:  z.number().int().min(0).nullable().optional(),
  stock:         z.number().int().min(0).optional(),
  lowStockAlert: z.number().int().min(0).optional(),
  status:        z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
  testingStatus: z.enum(["TESTING", "WINNER", "SCALING", "STOPPED"]).optional(),
  // Accept any string URLs (relaxed — CDN URLs validated at upload time)
  images:        z.array(z.string()).max(8).optional(),
  // Research — empty strings coerced to null
  supplierUrl:   optionalUrl,
  alibabaUrl:    optionalUrl,
  url1688:       optionalUrl,
  buyingPrice:   z.number().int().min(0).nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getAdminSession()
    if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    let raw: unknown
    try { raw = await req.json() } catch {
      return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
    }

    const parsed = patchSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Données invalides" },
        { status: 422 },
      )
    }

    const existing = await prisma.product.findUnique({
      where:  { id: params.id },
      select: { id: true, slug: true },
    })
    if (!existing) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })

    const data = parsed.data

    let finalSlug: string | undefined
    if (data.slug !== undefined) {
      const base = generateSlug(data.slug)
      finalSlug  = await ensureUniqueSlug(base, prisma, params.id)
    }

    const {
      supplierUrl, alibabaUrl, url1688, buyingPrice,
      slug: _slug,
      ...productFields
    } = data

    const hasResearch = supplierUrl !== undefined || alibabaUrl !== undefined ||
      url1688 !== undefined || buyingPrice !== undefined

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: params.id },
        data:  {
          ...productFields,
          ...(finalSlug ? { slug: finalSlug } : {}),
        },
      })

      if (hasResearch) {
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

      return updated
    })

    return NextResponse.json(product)
  } catch (err) {
    console.error("[products/PATCH]", err)
    return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 })
  }
}

// ─── DELETE (hard delete) ─────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getAdminSession()
    if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const product = await prisma.product.findUnique({
      where:  { id: params.id },
      select: {
        id:     true,
        images: true,
        orders: {
          where: {
            status: { in: ["NOUVEAU", "CONFIRME", "PREPARE", "EXPEDIE"] },
          },
          select: { id: true },
          take:   1,
        },
      },
    })
    if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })

    // Block deletion if active orders exist
    if (product.orders.length > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer : ce produit a des commandes actives. Archivez-le plutôt." },
        { status: 409 },
      )
    }

    // Delete R2 images (best-effort — don't fail the whole delete if one image is missing)
    for (const url of product.images) {
      try {
        await deleteFromR2(url)
      } catch {
        // Image may already be gone or belong to a different bucket — log and continue
        console.warn("[products/DELETE] Could not delete image from R2:", url)
      }
    }

    // Delete product — Prisma cascade handles landing_pages, orders, reviews, offers, etc.
    await prisma.product.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[products/DELETE]", err)
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
