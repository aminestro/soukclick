import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  reason: z.string().min(1).max(500),
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
    return NextResponse.json({ error: "Raison requise" }, { status: 422 })
  }

  const order = await prisma.order.findUnique({
    where:  { id: params.id },
    select: { id: true, status: true, productId: true, quantity: true },
  })
  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  if (order.status === "ANNULE") return NextResponse.json({ error: "Déjà annulée" }, { status: 409 })

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: params.id },
      data: {
        status:             "ANNULE",
        confirmationStatus: "CANCELLED",
        cancelledAt:        new Date(),
        agentNotes:         parsed.data.reason,
      },
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId:   params.id,
        oldStatus: order.status,
        newStatus: "ANNULE",
        agentId:   session.user.id,
        note:      parsed.data.reason,
      },
    })

    // Restore stock
    await tx.product.update({
      where: { id: order.productId },
      data:  { stock: { increment: order.quantity } },
    })
  })

  return NextResponse.json({ success: true })
}
