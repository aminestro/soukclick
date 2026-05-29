import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisÃ©" }, { status: 401 })

  const today      = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow   = new Date(today.getTime() + 86_400_000)
  const thirtyAgo  = new Date(Date.now() - 30 * 86_400_000)

  // â”€â”€ Pending orders + stats in parallel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [
    orders,
    confirmedToday,
    cancelledToday,
    noAnswerCount,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        confirmationStatus: { in: ["PENDING", "NO_ANSWER", "CALLBACK"] },
        status:             { in: ["NOUVEAU", "CONFIRME"] },
      },
      orderBy: { createdAt: "asc" },
      include: {
        product: { select: { id: true, titleFr: true, images: true } },
        city:    { select: { id: true, nameFr: true, wilaya: true, isRemote: true } },
        landingPage: { select: { slug: true } },
      },
    }),
    prisma.order.count({
      where: { confirmationStatus: "CONFIRMED", confirmedAt: { gte: today, lt: tomorrow } },
    }),
    prisma.order.count({
      where: { status: "ANNULE", updatedAt: { gte: today, lt: tomorrow } },
    }),
    prisma.order.count({
      where: { confirmationStatus: "NO_ANSWER" },
    }),
  ])

  // â”€â”€ Enrich each order with duplicate + customer history â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const phones = [...new Set(orders.map((o) => o.phone))]

  // Count of orders per phone in last 30 days (all orders, not just pending)
  const duplicateCounts = await prisma.$queryRaw<Array<{ phone: string; count: bigint }>>`
    SELECT phone, COUNT(*) AS count
    FROM orders
    WHERE phone = ANY(${phones}::text[])
      AND created_at >= ${thirtyAgo}
    GROUP BY phone
  `
  const dupeMap = new Map(duplicateCounts.map((r) => [r.phone, Number(r.count)]))

  // Most recent previous order per phone (excluding the current pending ones)
  const pendingIds = orders.map((o) => o.id)
  const lastOrders = await prisma.$queryRaw<Array<{
    phone:        string
    order_number: string
    created_at:   Date
    title_fr:     string
  }>>`
    SELECT DISTINCT ON (o.phone)
      o.phone,
      o.order_number,
      o.created_at,
      p.title_fr
    FROM orders o
    JOIN products p ON p.id = o.product_id
    WHERE o.phone = ANY(${phones}::text[])
      AND o.id != ALL(${pendingIds}::text[])
    ORDER BY o.phone, o.created_at DESC
  `
  const lastOrderMap = new Map(lastOrders.map((r) => [r.phone, r]))

  const enriched = orders.map((o) => ({
    ...o,
    duplicateCount: dupeMap.get(o.phone) ?? 1,
    lastOrder:      lastOrderMap.get(o.phone) ?? null,
  }))

  return NextResponse.json({
    orders: enriched,
    stats: {
      confirmedToday,
      cancelledToday,
      pendingCount: orders.filter((o) => o.confirmationStatus === "PENDING").length,
      noAnswerCount,
    },
  })
}