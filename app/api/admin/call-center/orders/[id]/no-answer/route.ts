import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const order = await prisma.order.findUnique({
    where:  { id: params.id },
    select: { id: true, status: true, confirmationAttempts: true },
  })
  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

  const attempts = order.confirmationAttempts + 1

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: params.id },
      data: {
        confirmationStatus:   "NO_ANSWER",
        confirmationAttempts: attempts,
      },
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId:   params.id,
        oldStatus: order.status,
        newStatus: order.status,   // status unchanged — only confirmation status changes
        agentId:   session.user.id,
        note:      `Pas de réponse — tentative ${attempts}`,
      },
    })
  })

  return NextResponse.json({ success: true, attempts })
}
