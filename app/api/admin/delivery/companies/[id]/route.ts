import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const patchSchema = z.object({
  isActive:    z.boolean().optional(),
  trackingUrl: z.string().url().nullable().optional(),
  name:        z.string().min(1).max(100).optional(),
  exportFormat:z.enum(["EXCEL","CSV"]).optional(),
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

  const company = await prisma.deliveryCompany.update({
    where: { id: params.id },
    data:  parsed.data,
  })

  return NextResponse.json(company)
}
