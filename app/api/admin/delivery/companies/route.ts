import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisÃ©" }, { status: 401 })

  const companies = await prisma.deliveryCompany.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { orders: true } } },
  })

  return NextResponse.json(companies)
}