import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  callback_at: z.string().datetime({ message: "Date ISO invalide" }),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 })
  }

  const order = await prisma.order.findUnique({
    where:  { id: params.id },
    select: { id: true, status: true },
  })
  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

  const callbackAt = new Date(parsed.data.callback_at)

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: params.id },
      data: {
        confirmationStatus: "CALLBACK",
        callbackAt,
      },
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId:   params.id,
        oldStatus: order.status,
        newStatus: order.status,
        agentId:   session.user.id,
        note:      `Rappel planifié: ${callbackAt.toLocaleString("fr-MA")}`,
      },
    })
  })

  return NextResponse.json({ success: true })
}
