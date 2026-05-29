import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const patchSchema = z.object({
  type:            z.enum(["QUANTITY_DISCOUNT","FREE_SHIPPING","BUNDLE"]).optional(),
  labelFr:         z.string().min(1).max(200).optional(),
  labelAr:         z.string().max(200).nullable().optional(),
  minQuantity:     z.number().int().min(1).optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  freeShipping:    z.boolean().optional(),
  isActive:        z.boolean().optional(),
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
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 })

  const offer = await prisma.offer.update({ where: { id: params.id }, data: parsed.data })
  return NextResponse.json(offer)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  await prisma.offer.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
