import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendCAPIEvent } from "@/lib/meta-capi"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const order = await prisma.order.findUnique({
    where:  { id: params.id },
    select: {
      id:            true,
      status:        true,
      confirmationStatus: true,
      orderNumber:   true,
      phone:         true,
      total:         true,
      pixelEventId:  true,
      fbclid:        true,
      ipAddress:     true,
      userAgent:     true,
      productId:     true,
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  }
  if (order.confirmationStatus === "CONFIRMED") {
    return NextResponse.json({ error: "Déjà confirmée" }, { status: 409 })
  }

  const now = new Date()

  // ── Transaction ───────────────────────────────────────────────────────────
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: params.id },
      data: {
        status:              "CONFIRME",
        confirmationStatus:  "CONFIRMED",
        confirmedAt:         now,
        confirmedById:       session.user.id,
      },
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId:   params.id,
        oldStatus: order.status,
        newStatus: "CONFIRME",
        agentId:   session.user.id,
        note:      "Confirmé par call center",
      },
    })

    // Upsert customer — increment totals
    await tx.customer.upsert({
      where:  { phone: order.phone },
      create: {
        phone:        order.phone,
        name:         "Client",
        totalOrders:  1,
        totalRevenue: order.total,
        lastOrderAt:  now,
      },
      update: {
        totalOrders:  { increment: 1 },
        totalRevenue: { increment: order.total },
        lastOrderAt:  now,
      },
    })
  })

  // ── Meta CAPI Purchase (non-blocking, outside transaction) ─────────────
  sendCAPIEvent({
    eventName:        "Purchase",
    eventId:          order.pixelEventId ?? `purchase_${order.id}`,
    value:            order.total / 100,
    currency:         "MAD",
    phone:            order.phone,
    fbclid:           order.fbclid,
    userAgent:        order.userAgent,
    clientIpAddress:  order.ipAddress,
  }).catch(() => {/* already logged inside */})

  // ── Find next pending order for auto-select ────────────────────────────
  const nextOrder = await prisma.order.findFirst({
    where: {
      confirmationStatus: { in: ["PENDING", "NO_ANSWER", "CALLBACK"] },
      status:             { in: ["NOUVEAU", "CONFIRME"] },
      id:                 { not: params.id },
    },
    orderBy: { createdAt: "asc" },
    select:  { id: true },
  })

  return NextResponse.json({ success: true, nextOrderId: nextOrder?.id ?? null })
}
