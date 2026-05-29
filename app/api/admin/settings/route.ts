import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisÃ©" }, { status: 401 })

  const rows = await prisma.setting.findMany()
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return NextResponse.json(settings)
}

const bodySchema = z.record(z.string(), z.string())

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisÃ©" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: "Format invalide" }, { status: 422 })

  await Promise.all(
    Object.entries(parsed.data).map(([key, value]) =>
      prisma.setting.upsert({
        where:  { key },
        update: { value },
        create: { key, value },
      })
    )
  )

  const rows = await prisma.setting.findMany()
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.key, r.value])))
}