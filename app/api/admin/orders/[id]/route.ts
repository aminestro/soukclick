import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { OrderStatus } from "@prisma/client"

export const dynamic = 'force-dynamic'

// ─── GET /api/admin/orders/[id] ───────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const order = await prisma.order.findUnique({
    where:   { id: params.id },
    include: {
      product:        { select: { id: true, titleFr: true, images: true, price: true } },
      city:           { select: { nameFr: true, wilaya: true, deliveryDays: true } },
      deliveryCompany:{ select: { id: true, name: true } },
      statusHistory:  { orderBy: { createdAt: "asc" }, include: { agent: { select: { name: true } } } },
    },
  })

  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

  return NextResponse.json(order)
}

// ─── PATCH /api/admin/orders/[id] ─────────────────────────────────────────────

const patchSchema = z.object({
  status:           z.enum(["NOUVEAU","CONFIRME","PREPARE","EXPEDIE","LIVRE","ANNULE","RETOURNE"]).optional(),
  confirmationStatus: z.enum(["PENDING","CONFIRMED","CANCELLED","NO_ANSWER","CALLBACK"]).optional(),
  agentNotes:       z.string().max(2000).optional(),
  trackingNumber:   z.string().max(100).optional(),
  deliveryCompanyId:z.string().cuid().optional(),
  note:             z.string().max(500).optional(), // for status history
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

  const { status, confirmationStatus, agentNotes, trackingNumber, deliveryCompanyId, note } = parsed.data

  const existing = await prisma.order.findUnique({
    where:  { id: params.id },
    select: { status: true, total: true, phone: true },
  })
  if (!existing) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

  const statusChanged = status && status !== existing.status

  const updated = await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = {}
    if (status)            updateData["status"]            = status
    if (confirmationStatus)updateData["confirmationStatus"]= confirmationStatus
    if (agentNotes !== undefined) updateData["agentNotes"] = agentNotes
    if (trackingNumber !== undefined) updateData["trackingNumber"] = trackingNumber
    if (deliveryCompanyId) updateData["deliveryCompanyId"] = deliveryCompanyId

    // Timestamps
    if (status === "CONFIRME") updateData["confirmedAt"]  = new Date()
    if (status === "EXPEDIE")  updateData["shippedAt"]    = new Date()
    if (status === "LIVRE")    updateData["deliveredAt"]  = new Date()
    if (status === "ANNULE")   updateData["cancelledAt"]  = new Date()
    if (status === "RETOURNE") updateData["returnedAt"]   = new Date()
    if (status === "CONFIRME") {
      updateData["confirmedById"]  = session.user.id
      updateData["confirmationStatus"] = "CONFIRMED"
    }

    const order = await tx.order.update({
      where: { id: params.id },
      data:  updateData,
    })

    // Status history
    if (statusChanged) {
      await tx.orderStatusHistory.create({
        data: {
          orderId:   params.id,
          oldStatus: existing.status as OrderStatus,
          newStatus: status,
          agentId:   session.user.id,
          note:      note ?? null,
        },
      })
    }

    // On LIVRE: update customer totals
    if (status === "LIVRE") {
      await tx.customer.updateMany({
        where: { phone: existing.phone },
        data:  {
          totalProfit:  { increment: existing.total },
          lastOrderAt:  new Date(),
        },
      })
    }

    return order
  })

  // Purchase CAPI would fire here (server-side) on CONFIRME — Phase 3
  // if (statusChanged && status === "CONFIRME") { await firePurchaseCAPI(updated) }

  return NextResponse.json(updated)
}
