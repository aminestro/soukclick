import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

const querySchema = z.object({
  search:    z.string().optional(),
  status:    z.enum(["NOUVEAU","CONFIRME","PREPARE","EXPEDIE","LIVRE","ANNULE","RETOURNE"]).optional(),
  cityId:    z.string().optional(),
  risk:      z.enum(["low","medium","high"]).optional(),
  dateFrom:  z.string().optional(),
  dateTo:    z.string().optional(),
  page:      z.coerce.number().int().min(1).default(1),
  pageSize:  z.coerce.number().int().min(1).max(100).default(25),
  export:    z.enum(["csv"]).optional(),
})

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const params  = Object.fromEntries(req.nextUrl.searchParams)
  const parsed  = querySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 422 })
  }

  const { search, status, cityId, risk, dateFrom, dateTo, page, pageSize, export: exportCsv } = parsed.data

  const where: Prisma.OrderWhereInput = {}

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { phone:       { contains: search } },
      { customerName:{ contains: search, mode: "insensitive" } },
    ]
  }
  if (status)  where.status = status
  if (cityId)  where.cityId = cityId
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo   ? { lte: new Date(dateTo + "T23:59:59Z") } : {}),
    }
  }
  if (risk === "low")    { where.riskScore = { lte: 40 } }
  if (risk === "medium") { where.riskScore = { gt: 40, lte: 70 } }
  if (risk === "high")   { where.riskScore = { gt: 70 } }

  // CSV export — return all matching rows (no pagination)
  if (exportCsv === "csv") {
    const all = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { titleFr: true } },
        city:    { select: { nameFr: true, wilaya: true } },
      },
    })

    const header = [
      "Numéro","Date","Client","Téléphone","Produit","Qté","Total (MAD)",
      "Ville","Wilaya","Statut","Score risque","Doublon","Blacklist",
      "UTM Source","UTM Campaign","FBCLID",
    ].join(",")

    const rows = all.map((o) =>
      [
        o.orderNumber,
        new Date(o.createdAt).toLocaleString("fr-MA"),
        `"${o.customerName}"`,
        o.phone,
        `"${o.product.titleFr}"`,
        o.quantity,
        (o.total / 100).toFixed(2),
        o.city.nameFr,
        o.city.wilaya,
        o.status,
        o.riskScore,
        o.isDuplicate  ? "OUI" : "NON",
        o.isBlacklisted ? "OUI" : "NON",
        o.utmSource   ?? "",
        o.utmCampaign ?? "",
        o.fbclid      ?? "",
      ].join(",")
    )

    const csv = [header, ...rows].join("\n")
    return new NextResponse(csv, {
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="commandes-${Date.now()}.csv"`,
      },
    })
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: {
        product: { select: { titleFr: true } },
        city:    { select: { nameFr: true, wilaya: true } },
      },
    }),
  ])

  return NextResponse.json({ orders, total, page, pageSize })
}
