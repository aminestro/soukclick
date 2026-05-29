import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  productId: z.string().cuid().optional(),
  startDate: z.string().optional(),
  endDate:   z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisÃ©" }, { status: 401 })

  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
  if (!parsed.success) return NextResponse.json({ error: "ParamÃ¨tres invalides" }, { status: 422 })

  const { productId, startDate, endDate } = parsed.data

  // â”€â”€ Date range â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const now   = new Date()
  const start = startDate ? new Date(startDate + "T00:00:00Z") : new Date(now.getFullYear(), now.getMonth(), 1)
  const end   = endDate   ? new Date(endDate   + "T23:59:59Z") : now

  const dateFilter = { gte: start, lte: end }

  const productWhere = productId ? { productId } : {}

  // â”€â”€ Parallel queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [
    livreCounts,
    confirmedCount,
    adSpendAgg,
    products,
  ] = await Promise.all([
    // LIVRE orders â€” revenue + delivery cost
    prisma.order.aggregate({
      where: { ...productWhere, status: "LIVRE", createdAt: dateFilter },
      _sum:  { total: true, deliveryPrice: true, quantity: true },
      _count:{ id: true },
    }),

    // Confirmed orders (for CPA)
    prisma.order.count({
      where: { ...productWhere, status: { in: ["CONFIRME", "LIVRE"] }, createdAt: dateFilter },
    }),

    // Ad spend from AdsDailyReport
    prisma.adsDailyReport.aggregate({
      where: { ...productWhere, date: dateFilter },
      _sum:  { spend: true, impressions: true, clicks: true, orders: true, revenue: true },
    }),

    // Products for cost lookup
    prisma.product.findMany({
      where:  productId ? { id: productId } : {},
      select: { id: true, costPrice: true },
    }),
  ])

  // â”€â”€ Per-product cost lookup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const costMap = new Map(products.map((p) => [p.id, p.costPrice]))

  // Product cost from LIVRE orders (need order-level data)
  const livreOrders = await prisma.order.findMany({
    where:  { ...productWhere, status: "LIVRE", createdAt: dateFilter },
    select: { productId: true, quantity: true },
  })

  const totalCost = livreOrders.reduce((sum, o) => {
    const cost = costMap.get(o.productId) ?? 0
    return sum + cost * o.quantity
  }, 0)

  // â”€â”€ Totals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const revenue      = livreCounts._sum.total         ?? 0
  const deliveryCost = livreCounts._sum.deliveryPrice  ?? 0
  const adSpend      = adSpendAgg._sum.spend           ?? 0
  const grossProfit  = revenue - totalCost - deliveryCost
  const netProfit    = grossProfit - adSpend
  const marginPct    = revenue > 0 ? (netProfit / revenue) * 100 : 0
  const roas         = adSpend > 0 ? revenue / adSpend : null
  const cpa          = confirmedCount > 0 ? adSpend / confirmedCount : null

  // Break-even CPA: avg (price - cost - delivery) per order
  const deliveredCount = livreCounts._count.id
  const breakEvenCpa   = deliveredCount > 0
    ? (revenue - totalCost - deliveryCost) / deliveredCount
    : null

  // â”€â”€ Daily breakdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  type DayRow = {
    day: Date
    revenue: bigint
    delivery: bigint
    qty: bigint
    orderCount: bigint
  }

  const dailyOrders = await prisma.$queryRaw<DayRow[]>`
    SELECT
      DATE_TRUNC('day', created_at) AS day,
      COALESCE(SUM(total), 0)          AS revenue,
      COALESCE(SUM(delivery_price), 0) AS delivery,
      COALESCE(SUM(quantity), 0)        AS qty,
      COUNT(*)                          AS "orderCount"
    FROM orders
    WHERE status = 'LIVRE'
      AND created_at >= ${start}
      AND created_at <= ${end}
      ${productId ? prisma.$queryRaw`AND product_id = ${productId}` : prisma.$queryRaw``}
    GROUP BY day
    ORDER BY day ASC
  `

  // Rebuild using individual query if the conditional raw doesn't work (safety)
  const dailyOrdersSafe = await prisma.$queryRawUnsafe<DayRow[]>(
    productId
      ? `SELECT DATE_TRUNC('day', created_at) AS day,
           COALESCE(SUM(total),0) AS revenue,
           COALESCE(SUM(delivery_price),0) AS delivery,
           COALESCE(SUM(quantity),0) AS qty,
           COUNT(*) AS "orderCount"
         FROM orders
         WHERE status='LIVRE' AND created_at>=$1 AND created_at<=$2 AND product_id=$3
         GROUP BY day ORDER BY day ASC`
      : `SELECT DATE_TRUNC('day', created_at) AS day,
           COALESCE(SUM(total),0) AS revenue,
           COALESCE(SUM(delivery_price),0) AS delivery,
           COALESCE(SUM(quantity),0) AS qty,
           COUNT(*) AS "orderCount"
         FROM orders
         WHERE status='LIVRE' AND created_at>=$1 AND created_at<=$2
         GROUP BY day ORDER BY day ASC`,
    ...(productId ? [start, end, productId] : [start, end]),
  )

  type AdRow = { day: Date; spend: bigint; impressions: bigint; clicks: bigint }

  const dailyAds = await prisma.$queryRawUnsafe<AdRow[]>(
    productId
      ? `SELECT date AS day, COALESCE(SUM(spend),0) AS spend,
           COALESCE(SUM(impressions),0) AS impressions,
           COALESCE(SUM(clicks),0) AS clicks
         FROM ads_daily_reports
         WHERE date>=$1 AND date<=$2 AND product_id=$3
         GROUP BY date ORDER BY date ASC`
      : `SELECT date AS day, COALESCE(SUM(spend),0) AS spend,
           COALESCE(SUM(impressions),0) AS impressions,
           COALESCE(SUM(clicks),0) AS clicks
         FROM ads_daily_reports
         WHERE date>=$1 AND date<=$2
         GROUP BY date ORDER BY date ASC`,
    ...(productId ? [start, end, productId] : [start, end]),
  )

  // Build day-keyed maps
  const orderMap = new Map(
    dailyOrdersSafe.map((r) => [new Date(r.day).toISOString().slice(0, 10), r])
  )
  const adMap = new Map(
    dailyAds.map((r) => [new Date(r.day).toISOString().slice(0, 10), r])
  )

  // Generate full date range
  const days: string[] = []
  const cur = new Date(start)
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }

  const daily = days.map((date) => {
    const o  = orderMap.get(date)
    const a  = adMap.get(date)
    const rev = Number(o?.revenue ?? 0)
    const del = Number(o?.delivery ?? 0)
    const sp  = Number(a?.spend   ?? 0)
    const gp  = rev - del - sp
    return {
      date,
      revenue:      rev,
      deliveryCost: del,
      adSpend:      sp,
      grossProfit:  gp,
      orders:       Number(o?.orderCount ?? 0),
      impressions:  Number(a?.impressions ?? 0),
      clicks:       Number(a?.clicks     ?? 0),
      roas:         sp > 0 ? rev / sp : null,
    }
  })

  return NextResponse.json({
    totals: {
      revenue,
      cost:         totalCost,
      deliveryCost,
      adSpend,
      grossProfit,
      netProfit,
      marginPct,
      roas,
      cpa,
      breakEvenCpa,
      confirmedCount,
      deliveredCount,
      impressions:  Number(adSpendAgg._sum.impressions ?? 0),
      clicks:       Number(adSpendAgg._sum.clicks      ?? 0),
    },
    daily,
    period: { startDate: start.toISOString(), endDate: end.toISOString() },
  })
}