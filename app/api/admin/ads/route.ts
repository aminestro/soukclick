import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export const dynamic = 'force-dynamic'

// â”€â”€â”€ GET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisÃ©" }, { status: 401 })

  const sp        = req.nextUrl.searchParams
  const productId = sp.get("productId") ?? undefined
  const platform  = sp.get("platform")  ?? undefined
  const startDate = sp.get("startDate") ?? undefined
  const endDate   = sp.get("endDate")   ?? undefined

  const where: Prisma.AdsDailyReportWhereInput = {}
  if (productId) where.productId = productId
  if (platform && platform !== "ALL") {
    where.platform = platform as Prisma.AdsDailyReportWhereInput["platform"]
  }
  if (startDate || endDate) {
    where.date = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate   ? { lte: new Date(endDate)   } : {}),
    }
  }

  const [reports, totals] = await Promise.all([
    prisma.adsDailyReport.findMany({
      where,
      orderBy: { date: "asc" },
      include: { product: { select: { titleFr: true } } },
    }),
    prisma.adsDailyReport.aggregate({
      where,
      _sum: { spend: true, impressions: true, clicks: true, orders: true, revenue: true },
    }),
  ])

  return NextResponse.json({ reports, totals: totals._sum })
}

// â”€â”€â”€ POST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const createSchema = z.object({
  productId:   z.string().cuid(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  platform:    z.enum(["META","TIKTOK","GOOGLE","ALL"]).default("META"),
  spend:       z.number().int().min(0).default(0),
  impressions: z.number().int().min(0).default(0),
  clicks:      z.number().int().min(0).default(0),
  orders:      z.number().int().min(0).default(0),
  revenue:     z.number().int().min(0).default(0),
  notes:       z.string().max(500).optional().nullable(),
})

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisÃ©" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 })
  }

  const { date, ...rest } = parsed.data

  const report = await prisma.adsDailyReport.upsert({
    where: {
      productId_date_platform: {
        productId: rest.productId,
        date:      new Date(date),
        platform:  rest.platform,
      },
    },
    update: { ...rest, date: new Date(date) },
    create: { ...rest, date: new Date(date) },
  })

  return NextResponse.json(report, { status: 201 })
}