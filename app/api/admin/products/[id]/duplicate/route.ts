import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ensureUniqueSlug } from "@/lib/slug"

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const source = await prisma.product.findUnique({
    where:   { id: params.id },
    include: {
      offers:   { where: { isActive: true } },
      research: true,
    },
  })

  if (!source) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })

  const baseSlug = `${source.slug}-copie`
  const newSlug  = await ensureUniqueSlug(baseSlug, prisma)

  const newProduct = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        slug:          newSlug,
        titleFr:       `${source.titleFr} (Copie)`,
        titleAr:       source.titleAr,
        descriptionFr: source.descriptionFr,
        descriptionAr: source.descriptionAr,
        price:         source.price,
        costPrice:     source.costPrice,
        comparePrice:  source.comparePrice,
        stock:         0,           // reset stock
        lowStockAlert: source.lowStockAlert,
        status:        "DRAFT",     // always start as draft
        testingStatus: "TESTING",
        images:        source.images, // same URLs — no re-upload needed
      },
    })

    // Duplicate active offers
    if (source.offers.length > 0) {
      await tx.offer.createMany({
        data: source.offers.map((o) => ({
          productId:       product.id,
          type:            o.type,
          labelFr:         o.labelFr,
          labelAr:         o.labelAr,
          minQuantity:     o.minQuantity,
          discountPercent: o.discountPercent,
          freeShipping:    o.freeShipping,
          isActive:        o.isActive,
        })),
      })
    }

    // Duplicate research record
    if (source.research) {
      await tx.productResearch.create({
        data: {
          productId:       product.id,
          supplierUrl:     source.research.supplierUrl,
          alibabaUrl:      source.research.alibabaUrl,
          url1688:         source.research.url1688,
          buyingPrice:     source.research.buyingPrice,
          shippingCost:    source.research.shippingCost,
          competitorUrls:  source.research.competitorUrls,
          competitorPrices:source.research.competitorPrices,
          testingNotes:    source.research.testingNotes,
          breakEvenCpa:    source.research.breakEvenCpa,
        },
      })
    }

    return product
  })

  return NextResponse.json({ id: newProduct.id, slug: newProduct.slug }, { status: 201 })
}
