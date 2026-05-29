import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const sp         = req.nextUrl.searchParams
  const unreadOnly = sp.get("unreadOnly") === "true"
  const type       = sp.get("type") ?? undefined
  const page       = Math.max(1, parseInt(sp.get("page") ?? "1", 10))
  const limit      = parseInt(sp.get("limit") ?? "30", 10)

  const where: Prisma.NotificationWhereInput = {}
  if (unreadOnly) where.isRead = false
  if (type)       where.type   = type as Prisma.NotificationWhereInput["type"]

  // Unread count always returned (fast query)
  const unreadCount = await prisma.notification.count({ where: { isRead: false } })

  // If limit=0 just return the count
  if (limit === 0) {
    return NextResponse.json({ unreadCount, notifications: [], total: 0 })
  }

  const [total, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
  ])

  return NextResponse.json({ notifications, total, unreadCount, page })
}

// ─── PATCH — mark as read ─────────────────────────────────────────────────────

const patchSchema = z.object({
  ids:    z.array(z.string()).optional(), // specific IDs to mark read
  markAll:z.boolean().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 422 })

  const { ids, markAll } = parsed.data

  if (markAll) {
    await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } })
  } else if (ids && ids.length > 0) {
    await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { isRead: true } })
  }

  return NextResponse.json({ ok: true })
}
