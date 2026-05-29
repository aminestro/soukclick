import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const patchSchema = z.object({
  isVerified: z.boolean().optional(),
  isActive:   z.boolean().optional(),
  sortOrder:  z.number().int().min(0).optional(),
  content:    z.string().min(1).max(2000).optional(),
  rating:     z.number().int().min(1).max(5).optional(),
  authorName: z.string().min(1).max(100).optional(),
  authorCity: z.string().max(100).nullable().optional(),
  imageUrl:   z.string().url().nullable().optional(),
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

  const review = await prisma.review.update({
    where: { id: params.id },
    data:  parsed.data,
  })

  return NextResponse.json(review)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  await prisma.review.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
