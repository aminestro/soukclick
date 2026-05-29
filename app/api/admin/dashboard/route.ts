import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAdminSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisÃ©" }, { status: 401 })
  }

  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 86_400_000)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const sevenDaysAgo = new Date(today.getTime() - 6 * 86_400_000)

  // â”€â”€ Run all queries in parallel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const [
    todayOrders,
    todayConfirmed,
    todayRevenueAgg,
    todayCancelled,
    pendingCount,
    lowStockCount,
    last7Raw,
    recentOrders,
    topProductsRaw,
  ] = await Promise.all([
    // Today totals
    prisma.order.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.order.count({
      where: { status: "CONFIRME", createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.order.aggregate({
      where:   { status: "CONFIRME", createdAt: { gte: today, lt: tomorrow } },
      _sum:    { total: true },
    }),
    prisma.order.count({
      where: { status: "ANNULE", createdAt: { gte: today, lt: tomorrow } },
    }),

    // Pending confirmation
    prisma.order.count({
      where: { confirmationStatus: "PENDING", status: "NOUVEAU" },
    }),

    // Low stock
    prisma.product.count({
      where: {
        status:   { not: "ARCHIVED" },
        stock:    { gt: 0 },
        // stock < low_stock_alert â€” raw comparison needed
      },
    }),

    // Last 7 days â€” raw groupBy by date
    prisma.$queryRaw<Array<{ day: Date; orders: bigint; revenue: bigint }>>`
      SELECT
        DATE_TRUNC('day', created_at) AS day,
        COUNT(*) AS orders,
        COALESCE(SUM(CASE WHEN status = 'CONFIRME' THEN total ELSE 0 END), 0) AS revenue
      FROM orders
      WHERE created_at >= ${sevenDaysAgo}
      GROUP BY day
      ORDER BY day ASC
    `,

    // Recent 10 orders
    prisma.order.findMany({
      take:    10,
      orderBy: { createdAt: "desc" },
      select:  {
        id:           true,
        orderNumber:  true,
        customerName: true,
        phone:        true,
        total:        true,
        status:       true,
        createdAt:    true,
        city:         { select: { nameFr: true } },
        product:      { select: { titleFr: true } },
      },
    }),

    // Top products this month
    prisma.$queryRaw<Array<{ product_id: string; title_fr: string; orders: bigint; revenue: bigint }>>`
      SELECT
        p.id   AS product_id,
        p.title_fr,
        COUNT(o.id) AS orders,
        COALESCE(SUM(CASE WHEN o.status = 'CONFIRME' THEN o.total ELSE 0 END), 0) AS revenue
      FROM orders o
      JOIN products p ON p.id = o.product_id
      WHERE o.created_at >= ${monthStart}
      GROUP BY p.id, p.title_fr
      ORDER BY orders DESC
      LIMIT 5
    `,
  ])

  // Low stock via raw (stock < low_stock_alert is a column comparison)
  const lowStockActual = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) AS count FROM products
    WHERE status != 'ARCHIVED' AND stock < low_stock_alert AND stock >= 0
  `

  // Build last-7-days array (fill missing days)
  const last7Map = new Map<string, { orders: number; revenue: number }>()
  for (const row of last7Raw) {
    const key = new Date(row.day).toISOString().slice(0, 10)
    last7Map.set(key, {
      orders:  Number(row.orders),
      revenue: Number(row.revenue),
    })
  }
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d    = new Date(sevenDaysAgo.getTime() + i * 86_400_000)
    const key  = d.toISOString().slice(0, 10)
    const data = last7Map.get(key) ?? { orders: 0, revenue: 0 }
    return { date: key, ...data }
  })

  return NextResponse.json({
    today: {
      orders:     todayOrders,
      confirmed:  todayConfirmed,
      revenue:    todayRevenueAgg._sum.total ?? 0,
      cancelled:  todayCancelled,
      pending:    pendingCount,
      lowStock:   Number((lowStockActual[0] as { count: bigint }).count),
      confirmedPct: todayOrders > 0
        ? Math.round((todayConfirmed / todayOrders) * 100)
        : 0,
      cancelledPct: todayOrders > 0
        ? Math.round((todayCancelled / todayOrders) * 100)
        : 0,
    },
    last7Days,
    recentOrders,
    topProducts: topProductsRaw.map((r) => ({
      productId: r.product_id,
      titleFr:   r.title_fr,
      orders:    Number(r.orders),
      revenue:   Number(r.revenue),
    })),
  })
}