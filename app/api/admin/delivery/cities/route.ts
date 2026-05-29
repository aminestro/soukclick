import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisÃ©" }, { status: 401 })

  const sp       = req.nextUrl.searchParams
  const wilaya   = sp.get("wilaya")   ?? undefined
  const isActive = sp.get("isActive") ?? undefined

  const cities = await prisma.city.findMany({
    where: {
      ...(wilaya   ? { wilaya }                                   : {}),
      ...(isActive ? { isActive: isActive === "true" }           : {}),
    },
    orderBy: [{ wilayaCode: "asc" }, { nameFr: "asc" }],
  })

  return NextResponse.json(cities)
}

const bulkSchema = z.object({
  ids:           z.array(z.string().cuid()).min(1),
  deliveryPrice: z.number().int().min(0),
})

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisÃ©" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = bulkSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 })

  const { ids, deliveryPrice } = parsed.data

  await prisma.city.updateMany({
    where: { id: { in: ids } },
    data:  { deliveryPrice },
  })

  return NextResponse.json({ updated: ids.length })
}