import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { deleteFromR2 } from "@/lib/r2"

const bodySchema = z.object({
  url: z.string().url(),
})

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: "URL invalide" }, { status: 422 })
  }

  const { url } = parsed.data
  const publicBase = process.env.R2_PUBLIC_URL ?? ""

  if (!url.startsWith(publicBase)) {
    return NextResponse.json({ error: "URL non autorisée" }, { status: 403 })
  }

  try {
    await deleteFromR2(url)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[R2 delete]", err)
    return NextResponse.json({ error: "Suppression échouée" }, { status: 500 })
  }
}
