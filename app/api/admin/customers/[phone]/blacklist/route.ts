import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const bodySchema = z.object({
  reason: z.string().min(3).max(500),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { phone: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: "Raison invalide" }, { status: 422 })
  }

  await prisma.customer.upsert({
    where:  { phone: params.phone },
    update: { isBlacklisted: true, blacklistReason: parsed.data.reason },
    create: {
      phone:           params.phone,
      name:            "Inconnu",
      isBlacklisted:   true,
      blacklistReason: parsed.data.reason,
    },
  })

  // Flag all open orders from this phone
  await prisma.order.updateMany({
    where: { phone: params.phone, status: { in: ["NOUVEAU", "CONFIRME"] } },
    data:  { isBlacklisted: true },
  })

  await prisma.notification.create({
    data: {
      type:    "BLACKLIST_ORDER",
      title:   "Client blacklisté",
      message: `${params.phone} — ${parsed.data.reason}`,
    },
  })

  return NextResponse.json({ ok: true })
}
