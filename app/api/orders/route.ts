import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { sendAdminAlert } from "@/lib/whatsapp"
import { randomUUID } from "crypto"

// ─── Rate limiting (in-memory, no Redis) ──────────────────────────────────────

const ipHits = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now        = Date.now()
  const max        = parseInt(process.env.RATE_LIMIT_MAX    ?? "10", 10)
  const windowMs   = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10)

  const entry = ipHits.get(ip)
  if (!entry || entry.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + windowMs })
    return false
  }
  entry.count++
  return entry.count > max
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

const orderBodySchema = z.object({
  customer_name:   z.string().min(2).max(100),
  phone: z
    .string()
    .regex(/^(06|07)\d{8}$/, "Format téléphone invalide"),
  city_id:         z.string().cuid("Ville invalide"),
  address:         z.string().min(5).max(500),
  quantity:        z.number().int().min(1).max(10),
  product_id:      z.string().cuid("Produit invalide"),
  landing_page_id: z.string().cuid().optional().nullable(),

  // UTM + click IDs — all optional
  utm_source:   z.string().max(200).optional().nullable(),
  utm_medium:   z.string().max(200).optional().nullable(),
  utm_campaign: z.string().max(200).optional().nullable(),
  utm_content:  z.string().max(200).optional().nullable(),
  utm_term:     z.string().max(200).optional().nullable(),
  fbclid:       z.string().max(500).optional().nullable(),
  ttclid:       z.string().max(500).optional().nullable(),
  gclid:        z.string().max(500).optional().nullable(),
})

// ─── Order number generator ───────────────────────────────────────────────────

async function generateOrderNumber(): Promise<string> {
  const digits = Math.floor(100000 + Math.random() * 900000).toString()
  const num    = `MAR-${digits}`

  // Collision check (extremely rare but safe)
  const exists = await prisma.order.findUnique({ where: { orderNumber: num } })
  return exists ? generateOrderNumber() : num
}

// ─── Risk score ───────────────────────────────────────────────────────────────

function computeRiskScore(opts: {
  isDuplicate:   boolean
  isBlacklisted: boolean
  isRemoteCity:  boolean
  quantity:      number
}): number {
  let score = 0
  if (opts.isDuplicate)   score += 30
  if (opts.isBlacklisted) score += 40
  if (opts.isRemoteCity)  score += 20
  if (opts.quantity > 3)  score += 10
  return Math.min(score, 100)
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Veuillez réessayer dans quelques minutes." },
      { status: 429 },
    )
  }

  // Parse + validate body
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 })
  }

  const parsed = orderBodySchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]
    return NextResponse.json(
      { error: firstError?.message ?? "Données invalides." },
      { status: 422 },
    )
  }

  const data = parsed.data

  // Load product + city in parallel
  const [product, city] = await Promise.all([
    prisma.product.findUnique({
      where: { id: data.product_id },
      select: { id: true, titleFr: true, price: true, status: true, stock: true },
    }),
    prisma.city.findUnique({
      where: { id: data.city_id },
      select: { id: true, nameFr: true, wilaya: true, deliveryPrice: true, isRemote: true, isActive: true },
    }),
  ])

  if (!product || product.status !== "ACTIVE") {
    return NextResponse.json({ error: "Ce produit n'est plus disponible." }, { status: 404 })
  }
  if (!city || !city.isActive) {
    return NextResponse.json({ error: "Ville invalide ou indisponible." }, { status: 422 })
  }
  if (product.stock < data.quantity) {
    return NextResponse.json(
      { error: "Stock insuffisant. Réduisez la quantité." },
      { status: 422 },
    )
  }

  // ── Blacklist check ────────────────────────────────────────────────────────
  const existingCustomer = await prisma.customer.findUnique({
    where:  { phone: data.phone },
    select: { isBlacklisted: true, blacklistReason: true },
  })
  const isBlacklisted = existingCustomer?.isBlacklisted ?? false

  // ── Duplicate check (same phone, last 30 days) ────────────────────────────
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentOrder = await prisma.order.findFirst({
    where: {
      phone:     data.phone,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { id: true },
  })
  const isDuplicate = !!recentOrder

  // ── Load active offers to compute unit price ───────────────────────────────
  const offers = await prisma.offer.findMany({
    where:   { productId: data.product_id, isActive: true },
    orderBy: { minQuantity: "desc" },
  })

  let unitPrice = product.price
  let deliveryPrice = city.deliveryPrice

  for (const offer of offers) {
    if (offer.minQuantity <= data.quantity) {
      if (offer.discountPercent > 0) {
        unitPrice = Math.round(product.price * (1 - offer.discountPercent / 100))
      }
      if (offer.freeShipping) {
        deliveryPrice = 0
      }
      break
    }
  }

  const subtotal = unitPrice * data.quantity
  const total    = subtotal + deliveryPrice

  const riskScore  = computeRiskScore({
    isDuplicate,
    isBlacklisted,
    isRemoteCity: city.isRemote,
    quantity:     data.quantity,
  })

  const orderNumber  = await generateOrderNumber()
  const pixelEventId = randomUUID()

  const userAgent = req.headers.get("user-agent") ?? undefined

  // ── Prisma transaction ────────────────────────────────────────────────────
  const { order } = await prisma.$transaction(async (tx) => {
    // Create order
    const order = await tx.order.create({
      data: {
        orderNumber,
        productId:       data.product_id,
        landingPageId:   data.landing_page_id ?? null,
        cityId:          data.city_id,
        customerName:    data.customer_name,
        phone:           data.phone,
        wilaya:          city.wilaya,
        address:         data.address,
        quantity:        data.quantity,
        unitPrice,
        deliveryPrice,
        total,
        status:          "NOUVEAU",
        isDuplicate,
        isBlacklisted,
        riskScore,
        utmSource:       data.utm_source  ?? null,
        utmMedium:       data.utm_medium  ?? null,
        utmCampaign:     data.utm_campaign ?? null,
        utmContent:      data.utm_content ?? null,
        utmTerm:         data.utm_term    ?? null,
        fbclid:          data.fbclid      ?? null,
        ttclid:          data.ttclid      ?? null,
        gclid:           data.gclid       ?? null,
        ipAddress:       ip,
        userAgent,
        pixelEventId,
      },
    })

    // Upsert customer
    await tx.customer.upsert({
      where:  { phone: data.phone },
      create: {
        phone:        data.phone,
        name:         data.customer_name,
        totalOrders:  1,
        totalRevenue: total,
        lastOrderAt:  new Date(),
      },
      update: {
        name:            data.customer_name,
        totalOrders:     { increment: 1 },
        totalRevenue:    { increment: total },
        lastOrderAt:     new Date(),
      },
    })

    // Decrement stock
    await tx.product.update({
      where: { id: data.product_id },
      data:  { stock: { decrement: data.quantity } },
    })

    // Notification: NEW_ORDER
    await tx.notification.create({
      data: {
        type:      "NEW_ORDER",
        title:     "Nouvelle commande",
        message:   `${data.customer_name} — ${(total / 100).toFixed(0)} MAD — ${city.nameFr}`,
        productId: data.product_id,
        orderId:   order.id,
      },
    })

    // Notification: DUPLICATE_ORDER
    if (isDuplicate) {
      await tx.notification.create({
        data: {
          type:      "DUPLICATE_ORDER",
          title:     "Commande en doublon",
          message:   `${data.phone} a déjà commandé dans les 30 derniers jours`,
          productId: data.product_id,
          orderId:   order.id,
        },
      })
    }

    // Notification: BLACKLIST_ORDER
    if (isBlacklisted) {
      await tx.notification.create({
        data: {
          type:      "BLACKLIST_ORDER",
          title:     "Commande client blacklisté",
          message:   `${data.phone} — ${existingCustomer?.blacklistReason ?? "Aucune raison"}`,
          productId: data.product_id,
          orderId:   order.id,
        },
      })
    }

    return { order }
  })

  // ── WhatsApp admin alert (non-blocking, outside transaction) ─────────────
  sendAdminAlert({
    orderNumber,
    customerName: data.customer_name,
    phone:        data.phone,
    total,
    city:         city.nameFr,
    isBlacklist:  isBlacklisted,
    isDuplicate,
  }).catch(() => {
    // Already logged inside sendAdminAlert
  })

  return NextResponse.json(
    { orderId: order.id, orderNumber, pixelEventId },
    { status: 201 },
  )
}
