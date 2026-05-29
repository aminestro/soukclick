import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  spend:       z.number().int().min(0).optional(),
  impressions: z.number().int().min(0).optional(),
  clicks:      z.number().int().min(0).optional(),
  orders:      z.number().int().min(0).optional(),
  revenue:     z.number().int().min(0).optional(),
  notes:       z.string().max(500).nullable().optional(),
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

  const report = await prisma.adsDailyReport.update({
    where: { id: params.id },
    data:  parsed.data,
  })

  return NextResponse.json(report)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  await prisma.adsDailyReport.delete({ where: { id: params.id } })

  return NextResponse.json({ ok: true })
}
