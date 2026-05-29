import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const source = await prisma.landingPage.findUnique({ where: { id: params.id } })
  if (!source) return NextResponse.json({ error: "Landing page introuvable" }, { status: 404 })

  const baseSlug = `${source.slug}-copie`
  let candidateSlug = baseSlug
  let suffix = 2

  while (true) {
    const exists = await prisma.landingPage.findUnique({
      where: { slug: candidateSlug }, select: { id: true },
    })
    if (!exists) break
    candidateSlug = `${baseSlug}-${suffix++}`
  }

  const copy = await prisma.landingPage.create({
    data: {
      productId:    source.productId,
      slug:         candidateSlug,
      template:     source.template,
      sections:     source.sections as object[],
      isActive:     false,
      metaTitle:    source.metaTitle ? `${source.metaTitle} (Copie)` : null,
      metaDesc:     source.metaDesc,
      metaKeywords: source.metaKeywords,
    },
  })

  return NextResponse.json({ id: copy.id, slug: copy.slug }, { status: 201 })
}
