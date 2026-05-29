import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// â”€â”€â”€ GET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisÃ©" }, { status: 401 })

  const sp     = req.nextUrl.searchParams
  const search = sp.get("search") ?? undefined
  const page   = Math.max(1, parseInt(sp.get("page") ?? "1"))
  const limit  = Math.min(100, parseInt(sp.get("limit") ?? "50"))

  const where = search
    ? {
        OR: [
          { name:  { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
        ],
      }
    : {}

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { lastOrderAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.customer.count({ where }),
  ])

  // Attach risk tag
  const rows = customers.map((c) => ({
    ...c,
    riskTag: riskTag(c),
  }))

  return NextResponse.json({ customers: rows, total, page, pages: Math.ceil(total / limit) })
}

function riskTag(c: {
  isBlacklisted: boolean
  totalOrders:   number
  tags:          string[]
}): "BLACKLISTED" | "VIP" | "RISKY" | "REGULAR" {
  if (c.isBlacklisted)           return "BLACKLISTED"
  if (c.tags.includes("RISKY"))  return "RISKY"
  if (c.totalOrders > 5)         return "VIP"
  return "REGULAR"
}

// â”€â”€â”€ PATCH â€” blacklist / unblacklist â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const patchSchema = z.object({
  phone:           z.string(),
  isBlacklisted:   z.boolean(),
  blacklistReason: z.string().max(500).optional().nullable(),
})

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisÃ©" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 })

  const { phone, isBlacklisted, blacklistReason } = parsed.data

  const customer = await prisma.customer.update({
    where: { phone },
    data:  {
      isBlacklisted,
      blacklistReason: isBlacklisted ? (blacklistReason ?? null) : null,
    },
  })

  return NextResponse.json({ ...customer, riskTag: riskTag(customer) })
}