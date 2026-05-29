import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const lp = await prisma.landingPage.findUnique({
    where:   { id: params.id },
    include: {
      product: {
        select: {
          id:      true,
          titleFr: true,
          images:  true,
          price:   true,
          comparePrice: true,
          reviews: {
            where:   { isActive: true },
            orderBy: { sortOrder: "asc" },
            select:  { id: true, authorName: true, authorCity: true, rating: true },
          },
        },
      },
    },
  })

  if (!lp) return NextResponse.json({ error: "Landing page introuvable" }, { status: 404 })

  return NextResponse.json(lp)
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

const patchSchema = z.object({
  sections:    z.array(z.unknown()).optional(),
  isActive:    z.boolean().optional(),
  metaTitle:   z.string().max(160).nullable().optional(),
  metaDesc:    z.string().max(320).nullable().optional(),
  metaKeywords:z.string().max(200).nullable().optional(),
  slug:        z.string().max(80).optional(),
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

  const existing = await prisma.landingPage.findUnique({
    where:  { id: params.id },
    select: { id: true, productId: true },
  })
  if (!existing) return NextResponse.json({ error: "Landing page introuvable" }, { status: 404 })

  const { isActive, sections, ...rest } = parsed.data

  const updated = await prisma.$transaction(async (tx) => {
    // If activating this page → deactivate all other pages for same product
    if (isActive === true) {
      await tx.landingPage.updateMany({
        where: { productId: existing.productId, id: { not: params.id } },
        data:  { isActive: false },
      })
    }

    return tx.landingPage.update({
      where: { id: params.id },
      data:  {
        ...rest,
        ...(isActive  !== undefined ? { isActive }          : {}),
        ...(sections  !== undefined ? { sections: sections as object[] } : {}),
      },
    })
  })

  return NextResponse.json(updated)
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  // Hard-delete (landing pages have no archived state — they're lightweight)
  await prisma.landingPage.delete({ where: { id: params.id } })

  return NextResponse.json({ ok: true })
}
