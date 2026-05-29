import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { fromCentimes } from "@/lib/format"

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const companyId = req.nextUrl.searchParams.get("companyId") ?? undefined

  const orders = await prisma.order.findMany({
    where: {
      status: "CONFIRME",
      ...(companyId ? { deliveryCompanyId: companyId } : {}),
    },
    include: {
      product: { select: { titleFr: true } },
      city:    { select: { nameFr: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const headers = [
    "N° Commande","Client","Téléphone","Adresse","Ville","Wilaya",
    "Produit","Quantité","Total (MAD)",
  ]

  const rows = orders.map((o) => [
    o.orderNumber,
    o.customerName,
    o.phone,
    `"${o.address.replace(/"/g, '""')}"`,
    o.city.nameFr,
    o.wilaya,
    o.product.titleFr,
    o.quantity,
    fromCentimes(o.total).toFixed(2),
  ].join(","))

  const csv  = [headers.join(","), ...rows].join("\n")
  const slug = companyId ? companyId.slice(0, 8) : "all"
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${slug}-${date}.csv"`,
    },
  })
}
