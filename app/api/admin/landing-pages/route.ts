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
      subheadline:        "Livraison rapide partout au Maroc — Paiement à la livraison",
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
        { icon: "⚡", title: "Rapide",    description: "Résultats visibles dès la première utilisation." },
        { icon: "✅", title: "Fiable",    description: "Testé et approuvé par des milliers de clients." },
        { icon: "🚚", title: "Livraison", description: "Partout au Maroc en 24-72h." },
      ],
    },
  }
}

function makeFeatures(order: number): LandingSection {
  return {
    type: "features", enabled: true, order,
    data: {
      title: "Caractéristiques",
      items: [
        { image_url: null, title: "Qualité premium",   description: "Fabriqué avec les meilleurs matériaux." },
        { image_url: null, title: "Facile à utiliser", description: "Aucune installation requise." },
      ],
    },
  }
}

function makeVideo(order: number): LandingSection {
  return {
    type: "video", enabled: true, order,
    data: { url: "", thumbnail_url: null, caption: "Regardez comment ça marche" },
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
      title: "Questions fréquentes",
      items: [
        { question: "Comment passer une commande ?",        answer: "Remplissez le formulaire et notre équipe vous contacte sous 24h." },
        { question: "Quels sont les délais de livraison ?", answer: "1 à 5 jours selon votre ville." },
        { question: "Comment fonctionne le paiement ?",     answer: "Vous payez uniquement à la réception de votre commande." },
      ],
    },
  }
}

function makeCTA(order: number): LandingSection {
  return {
    type: "cta", enabled: true, order,
    data: {
      headline:     "Commandez maintenant — Stock limité !",
      cta_text:     "Je Commande",
      cta_color:    "#f97316",
      urgency_text: "Offre limitée — livraison gratuite aujourd'hui seulement",
    },
  }
}

function makeBeforeAfter(order: number): LandingSection {
  return {
    type: "before_after", enabled: true, order,
    data: { before_image: "", after_image: "", caption: "Résultats avant / après" },
  }
}

function makeCheckout(order: number): LandingSection {
  return {
    type: "checkout", enabled: true, order,
    data: {
      title:               "👇 أدخل معلوماتك للطلب",
      subtitle:            null,
      cta_text:            "أطلب الآن",
      cta_color:           "#f97316",
      show_product_images: true,
      show_summary:        true,
      trust_items:         ["🔒 الدفع عند الاستلام", "🚚 توصيل في 24-72 ساعة", "✅ ضمان استرداد المال"],
    },
  }
}

const TEMPLATE_SECTIONS: Record<string, LandingSection[]> = {
  PROBLEM_SOLUTION: [
    makeHero(), makeCheckout(2), makeBenefits(3), makeVideo(4), makeReviews(5), makeFAQ(6), makeCTA(7),
  ],
  GADGET_DEMO: [
    makeHero(), makeCheckout(2), makeFeatures(3), makeVideo(4), makeBenefits(5), makeReviews(6), makeFAQ(7), makeCTA(8),
  ],
  BEFORE_AFTER: [
    makeHero(), makeCheckout(2), makeBeforeAfter(3), makeBenefits(4), makeReviews(5), makeFAQ(6), makeCTA(7),
  ],
  BUNDLE: [
    makeHero(), makeCheckout(2), makeFeatures(3), makeBenefits(4), makeReviews(5), makeFAQ(6), makeCTA(7),
  ],
  VIRAL: [
    makeHero(), makeCheckout(2), makeVideo(3), makeBenefits(4), makeReviews(5), makeFAQ(6), makeCTA(7),
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
  language:  z.enum(["fr", "darija", "ar"]).default("fr"),
  slug:      z.string().min(1).max(80).optional(),
  metaTitle: z.string().max(160).optional().nullable(),
  metaDesc:  z.string().max(320).optional().nullable(),
  sections:  z.array(z.record(z.unknown())).optional(), // AI-generated sections override
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

  const { productId, template, language, slug: rawSlug, metaTitle, metaDesc, sections: aiSections } = parsed.data

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

  // Use AI-generated sections if provided, otherwise fall back to template defaults
  const sections = aiSections ?? (TEMPLATE_SECTIONS[template] ?? TEMPLATE_SECTIONS["GADGET_DEMO"]!)

  const lp = await prisma.landingPage.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      productId,
      slug:      candidateSlug,
      template,
      language,
      sections:  sections as object[],
      isActive:  false,
      metaTitle: metaTitle ?? product.titleFr,
      metaDesc:  metaDesc  ?? null,
    } as any,
  })

  return NextResponse.json(lp, { status: 201 })
}
