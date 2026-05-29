import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteFromR2 } from "@/lib/r2"

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  isWinner: z.boolean().optional(),
  content:  z.string().max(10000).nullable().optional(),
  title:    z.string().min(1).max(200).optional(),
  notes:    z.string().max(500).nullable().optional(),
  tags:     z.array(z.string()).optional(),
  platform: z.enum(["META","TIKTOK","GOOGLE","ALL"]).optional(),
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

  const creative = await prisma.creative.update({ where: { id: params.id }, data: parsed.data })
  return NextResponse.json(creative)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const creative = await prisma.creative.findUnique({ where: { id: params.id } })
  if (!creative) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  // Delete file from R2 if exists
  if (creative.fileUrl) {
    try { await deleteFromR2(creative.fileUrl) } catch { /* ignore if already deleted */ }
  }

  await prisma.creative.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
