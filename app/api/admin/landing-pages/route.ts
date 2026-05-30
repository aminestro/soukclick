import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/slug"
import type { LandingSection } from "@/types/landing"

export const dynamic = 'force-dynamic'

// ─── Default sections per template ───────────────────────────────────────────

function makeHero(): LandingSection {
  return {
    type: "hero", enabled: true, order: 1,
    data: {
      headline:           "Le produit qui change tout",
      subheadline:        "Livraison rapide partout au Maroc - Paiement a la livraison",
      image_url:          null,
      video_url:          null,
      cta_text:           "Commander Maintenant",
      cta_color:          "#f97316",
      show_price:         true,
      show_compare_price: true,
      badges:             ["cod", "livraison_gratuite", "garantie"],
    },
  }
}

function makeBenefits(order: number): LandingSection {
  return {
    type: "benefits", enabled: true, order,
    data: {
      title: "Pourquoi choisir ce produit ?",
      items: [
        { icon: "⚡", title: "Rapide",    description: "Resultats visibles des la premiere utilisation." },
        { icon: "✅", title: "Fiable",    description: "Teste et approuve par des milliers de clients." },
        { icon: "🚚", title: "Livraison", description: "Partout au Maroc en 24-72h." },
      ],
    },
  }
}

function makeFeatures(order: number): LandingSection {
  return {
    type: "features", enabled: true, order,
    data: {
      title: "Caracteristiques",
      items: [
        { image_url: null, title: "Qualite premium",   description: "Fabrique avec les meilleurs materiaux." },
        { image_url: null, title: "Facile a utiliser", description: "Aucune installation requise." },
      ],
    },
  }
}

function makeVideo(order: number): LandingSection {
  return {
    type: "video", enabled: true, order,
    data: { url: "", thumbnail_url: null, caption: "Regardez comment ca marche" },
  }
}

function makeReviews(order: number): LandingSection {
  return {
    type: "reviews", enabled: true, order,
    data: { title: "Ce que disent nos clients", review_ids: [] },
  }
}

function makeFAQ(order: number): LandingSection {
  return {
    type: "faq", enabled: true, order,
    data: {
      title: "Questions frequentes",
      items: [
        { question: "Comment passer une commande ?",       answer: "Remplissez le formulaire et notre equipe vous contacte sous 24h." },
        { question: "Quels sont les delais de livraison ?", answer: "1 a 5 jours selon votre ville." },
        { question: "Comment fonctionne le paiement ?",    answer: "Vous payez uniquement a la reception de votre commande." },
      ],
    },
  }
}

function makeCTA(order: number): LandingSection {
  return {
    type: "cta", enabled: true, order,
    data: {
      headline:     "Commandez maintenant - Stock limite !",
      cta_text:     "Je Commande",
      cta_color:    "#f97316",
      urgency_text: "Offre limitee - livraison gratuite aujourd'hui seulement",
    },
  }
}

function makeBeforeAfter(order: number): LandingSection {
  return {
    type: "before_after", enabled: true, order,
    data: { before_image: "", after_image: "", caption: "Resultats avant / apres" },
  }
}

const TEMPLATE_SECTIONS: Record<string, LandingSection[]> = {
  PROBLEM_SOLUTION: [
    makeHero(), makeBenefits(2), makeVideo(3), makeReviews(4), makeFAQ(5), makeCTA(6),
  ],
  GADGET_DEMO: [
    makeHero(), makeFeatures(2), makeVideo(3), makeBenefits(4), makeReviews(5), makeFAQ(6), makeCTA(7),
  ],
  BEFORE_AFTER: [
    makeHero(), makeBeforeAfter(2), makeBenefits(3), makeReviews(4), makeFAQ(5), makeCTA(6),
  ],
  BUNDLE: [
    makeHero(), makeFeatures(2), makeBenefits(3), makeReviews(4), makeFAQ(5), makeCTA(6),
  ],
  VIRAL: [
    makeHero(), makeVideo(2), makeBenefits(3), makeReviews(4), makeFAQ(5), makeCTA(6),
  ],
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

  const sp        = req.nextUrl.searchParams
  const productId = sp.get("productId") ?? undefined
  const status    = sp.get("status") ?? undefined

  const monthStart = new Date()
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

  const pages = await prisma.landingPage.findMany({
    where: {
      ...(productId ? { productId } : {}),
      ...(status === "active" ? { isActive: true  } : {}),
      ...(status === "draft"  ? { isActive: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, titleFr: true, images: true } },
      _count:  {
        select: {
          orders: { where: { createdAt: { gte: monthStart } } },
        },
      },
    },
  })

  const stats = await Promise.all(
    pages.map(async (lp) => {
      const [total, confirmed] = await Promise.all([
        prisma.order.count({ where: { landingPageId: lp.id } }),
        prisma.order.count({ where: { landingPageId: lp.id, status: "CONFIRME" } }),
      ])
      return {
        id:             lp.id,
        totalOrders:    total,
        confirmedOrders:confirmed,
        conversionPct:  total > 0 ? Math.round((confirmed / total) * 100) : 0,
      }
    }),
  )

  const statsMap = new Map(stats.map((s) => [s.id, s]))

  return NextResponse.json(
    pages.map((lp) => ({
      ...lp,
      stats: statsMap.get(lp.id) ?? { totalOrders: 0, confirmedOrders: 0, conversionPct: 0 },
    })),
  )
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

const createSchema = z.object({
  productId: z.string().cuid("Produit invalide"),
  template:  z.enum(["PROBLEM_SOLUTION", "GADGET_DEMO", "BEFORE_AFTER", "BUNDLE", "VIRAL"]),
  slug:      z.string().min(1).max(80).optional(),
  metaTitle: z.string().max(160).optional().nullable(),
  metaDesc:  z.string().max(320).optional().nullable(),
})

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 })
  }

  const { productId, template, slug: rawSlug, metaTitle, metaDesc } = parsed.data

  const product = await prisma.product.findUnique({
    where:  { id: productId },
    select: { slug: true, titleFr: true },
  })
  if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })

  const baseSlug = rawSlug ? generateSlug(rawSlug) : product.slug
  let candidateSlug = baseSlug
  let suffix = 2
  while (true) {
    const exists = await prisma.landingPage.findUnique({
      where: { slug: candidateSlug }, select: { id: true },
    })
    if (!exists) break
    candidateSlug = `${baseSlug}-${suffix++}`
  }

  const sections = TEMPLATE_SECTIONS[template] ?? TEMPLATE_SECTIONS["GADGET_DEMO"]!

  const lp = await prisma.landingPage.create({
    data: {
      productId,
      slug:      candidateSlug,
      template,
      sections:  sections as object[],
      isActive:  false,
      metaTitle: metaTitle ?? product.titleFr,
      metaDesc:  metaDesc  ?? null,
    },
  })

  return NextResponse.json(lp, { status: 201 })
}
