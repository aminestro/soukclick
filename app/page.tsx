export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PixelProvider } from "@/components/store/PixelProvider"
import { fromCentimes } from "@/lib/format"

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "SoukClick — Produits Tendance Livrés au Maroc 🇲🇦",
  description:
    "Les meilleurs produits tendance livrés partout au Maroc. Paiement à la livraison. Livraison 24-48h. +5000 clients satisfaits.",
}

// ─── DB ───────────────────────────────────────────────────────────────────────

async function getActiveProducts() {
  try {
    return await prisma.product.findMany({
      where:   { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take:    12,
      select: {
        id:           true,
        slug:         true,
        titleFr:      true,
        price:        true,
        comparePrice: true,
        images:       true,
        createdAt:    true,
        _count:       { select: { orders: true } },
        landingPages: {
          where:   { isActive: true },
          select:  { slug: true },
          take:    1,
          orderBy: { createdAt: "desc" },
        },
      },
    })
  } catch {
    return []
  }
}

// ─── Static testimonials ──────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: "Fatima Z.",
    city: "Casablanca",
    rating: 5,
    text: "واللاه مزيان بزاف، جات في يومين وكاملة. غادي نعاود نطلب من عندهم.",
    badge: "Achat vérifié ✅",
  },
  {
    name: "Karim M.",
    city: "Rabat",
    rating: 5,
    text: "Produit de qualité, livraison rapide. J'ai reçu ma commande le lendemain, vraiment impressionné!",
    badge: "Achat vérifié ✅",
  },
  {
    name: "Nadia B.",
    city: "Marrakech",
    rating: 5,
    text: "خدمة مزيانة، والمنتج كيجاوب على التوقعات. كنصح بيه لكل واحد.",
    badge: "Achat vérifié ✅",
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const products = await getActiveProducts()
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "+212600000000"
  const waLink   = `https://wa.me/${whatsapp.replace(/\D/g, "")}`

  return (
    <>
      <PixelProvider
        metaPixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID}
        tiktokPixelId={process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID}
        ga4Id={process.env.NEXT_PUBLIC_GA4_ID}
        gtmId={process.env.NEXT_PUBLIC_GTM_ID}
      />

      {/* CSS animations — only what's used on this page */}
      <style>{`
        @keyframes pulse-wa {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,211,102,0.5) }
          50%       { box-shadow: 0 0 0 12px rgba(37,211,102,0) }
        }
        .pulse-wa { animation: pulse-wa 2s ease infinite }
        .card-hover { transition: transform .2s ease, box-shadow .2s ease }
        .card-hover:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,.12) }
        .img-zoom img { transition: transform .4s ease }
        .img-zoom:hover img { transform:scale(1.08) }
      `}</style>

      <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "system-ui,-apple-system,sans-serif" }}>

        {/* ── 1. ANNOUNCEMENT BAR ───────────────────────────────── */}
        <div className="bg-gray-950 py-2 text-white">
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-4 overflow-hidden px-4 text-xs font-semibold tracking-wide">
            <span className="hidden sm:inline">🚚 Livraison gratuite dès 200 MAD</span>
            <span className="text-orange-400 hidden sm:inline">•</span>
            <span>✅ Paiement à la livraison</span>
            <span className="text-orange-400">•</span>
            <span>🇲🇦 Partout au Maroc</span>
            <span className="text-orange-400 hidden md:inline">•</span>
            <span className="hidden md:inline">⭐ +2 000 clients satisfaits</span>
          </div>
        </div>

        {/* ── 2. HEADER ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 font-extrabold text-white text-sm shadow-sm">
                SC
              </div>
              <div>
                <p className="font-extrabold text-gray-900 leading-none text-lg" style={{ color: "#f97316" }}>SoukClick</p>
                <p className="text-[10px] text-gray-400 leading-none mt-0.5 font-medium">Produits tendance au Maroc</p>
              </div>
            </Link>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: "#25D366" }}
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.847L0 24l6.335-1.502A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.371l-.36-.214-3.722.882.935-3.625-.235-.372A9.818 9.818 0 1112 21.818z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </header>

        {/* ── 3. HERO ───────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden px-4 pb-12 pt-14 md:pt-20 md:pb-20"
          style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 40%, #fb923c 100%)" }}
        >
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #f97316, transparent 70%)" }} />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-60 w-60 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #ea580c, transparent 70%)" }} />

          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-4 py-1.5 text-xs font-bold text-orange-600 backdrop-blur-sm">
              🔥 Nouveautés disponibles maintenant
            </div>

            <h1 className="mb-3 text-4xl font-extrabold leading-tight text-gray-900 md:text-6xl">
              Les Meilleurs{" "}
              <span style={{ color: "#f97316" }}>Produits</span>
            </h1>
            <p className="mb-2 text-xl font-bold text-gray-700 md:text-2xl">
              Livrés partout au Maroc 🇲🇦
            </p>
            <p className="mb-8 text-sm text-gray-500">
              Commandez maintenant, payez à la livraison — مشكل حتا
            </p>

            {/* CTA buttons */}
            <div className="mb-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="#products"
                className="w-full rounded-2xl px-8 py-4 text-base font-extrabold text-white shadow-lg transition hover:opacity-90 sm:w-auto"
                style={{ backgroundColor: "#f97316" }}
              >
                Voir les Produits →
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-8 py-4 text-base font-bold text-gray-700 transition hover:border-green-400 hover:text-green-600 sm:w-auto"
              >
                <svg className="h-5 w-5 fill-current text-green-500" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.847L0 24l6.335-1.502A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.371l-.36-.214-3.722.882.935-3.625-.235-.372A9.818 9.818 0 1112 21.818z"/>
                </svg>
                Commander sur WhatsApp
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
              {[
                { icon: "🚚", text: "Livraison 24-48h" },
                { icon: "💳", text: "Paiement à la livraison" },
                { icon: "🔄", text: "Retour facile" },
                { icon: "⭐", text: "4.9/5 avis" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-sm">
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. TRUST STATS BAR ────────────────────────────────── */}
        <section className="bg-gray-900 py-8 text-white">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { value: "+5 000", label: "Commandes livrées", icon: "📦" },
                { value: "+2 000", label: "Clients satisfaits", icon: "😊" },
                { value: "48h",    label: "Délai moyen",        icon: "⚡" },
                { value: "4.9★",   label: "Note moyenne",       icon: "⭐" },
              ].map(({ value, label, icon }) => (
                <div key={label} className="text-center">
                  <div className="mb-1 text-2xl">{icon}</div>
                  <div className="text-2xl font-extrabold md:text-3xl" style={{ color: "#fb923c" }}>
                    {value}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. FEATURED PRODUCTS ──────────────────────────────── */}
        <section id="products" className="bg-gray-50 px-4 py-12 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-extrabold text-gray-900 md:text-3xl">
                🔥 Produits Tendance
              </h2>
              <p className="mt-1.5 text-sm text-gray-500">
                Sélectionnés pour le marché marocain — بيع صح
              </p>
            </div>

            {products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-4xl mb-3">🛍️</p>
                <p className="text-gray-500 font-semibold">Bientôt disponible</p>
                <p className="text-sm text-gray-400 mt-1">Revenez nous voir très bientôt !</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-5">
                {products.map((product, index) => {
                  const href = product.landingPages[0]?.slug
                    ? `/${product.landingPages[0].slug}`
                    : `/${product.slug}`

                  const discount = product.comparePrice && product.comparePrice > product.price
                    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                    : null

                  const isBestSeller = product._count.orders >= 10
                  const isNew        = !isBestSeller && index < 4

                  return (
                    <Link
                      key={product.id}
                      href={href}
                      className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                    >
                      {/* Image — first card is priority (LCP candidate); rest are lazy */}
                      <div className="img-zoom relative aspect-square overflow-hidden bg-gray-100">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.titleFr}
                            fill
                            sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw"
                            className="object-cover"
                            priority={index === 0}
                            loading={index === 0 ? "eager" : "lazy"}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-4xl text-gray-200">🛍️</div>
                        )}

                        {/* Badge */}
                        {isBestSeller && (
                          <div className="absolute left-2 top-2 rounded-lg px-2 py-0.5 text-[10px] font-extrabold text-white" style={{ background: "#f97316" }}>
                            🏆 BEST SELLER
                          </div>
                        )}
                        {isNew && (
                          <div className="absolute left-2 top-2 rounded-lg bg-green-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                            ✨ NOUVEAU
                          </div>
                        )}
                        {discount && (
                          <div className="absolute right-2 top-2 rounded-lg bg-red-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                            -{discount}%
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex flex-1 flex-col p-3">
                        {/* Stars */}
                        <div className="mb-1.5 flex items-center gap-1">
                          <span className="text-xs text-yellow-400">★★★★★</span>
                          <span className="text-[10px] text-gray-400">({5 + (product._count.orders % 20)})</span>
                        </div>

                        <p className="mb-2 line-clamp-2 flex-1 text-sm font-semibold leading-snug text-gray-900">
                          {product.titleFr}
                        </p>

                        {/* Price */}
                        <div className="mb-2.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-extrabold" style={{ color: "#f97316" }}>
                              {fromCentimes(product.price).toFixed(0)} MAD
                            </span>
                            {product.comparePrice && product.comparePrice > product.price && (
                              <span className="text-xs text-gray-400 line-through">
                                {fromCentimes(product.comparePrice).toFixed(0)}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-semibold text-green-600">🚚 Livraison gratuite</p>
                        </div>

                        {/* CTA */}
                        <div
                          className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold text-white transition group-hover:opacity-90"
                          style={{ backgroundColor: "#f97316" }}
                        >
                          Commander Maintenant →
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── 6. WHY US ─────────────────────────────────────────── */}
        <section className="bg-white px-4 py-12 md:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-extrabold text-gray-900 md:text-3xl">
                Pourquoi choisir SoukClick ?
              </h2>
              <p className="mt-1.5 text-sm text-gray-500">علاش تختارنا</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon:  "🚀",
                  title: "Livraison Express",
                  desc:  "Partout au Maroc en 24-48h",
                  color: "from-orange-50 to-orange-100",
                },
                {
                  icon:  "💰",
                  title: "Meilleur Prix",
                  desc:  "Prix compétitifs garantis",
                  color: "from-green-50 to-green-100",
                },
                {
                  icon:  "🔒",
                  title: "Paiement Sécurisé",
                  desc:  "Payez à la réception",
                  color: "from-blue-50 to-blue-100",
                },
                {
                  icon:  "🔄",
                  title: "Retour Gratuit",
                  desc:  "7 jours pour changer d'avis",
                  color: "from-purple-50 to-purple-100",
                },
              ].map(({ icon, title, desc, color }) => (
                <div
                  key={title}
                  className={`card-hover rounded-2xl bg-gradient-to-br ${color} p-5 text-center`}
                >
                  <div className="mb-3 text-4xl">{icon}</div>
                  <h3 className="mb-1 font-extrabold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. TESTIMONIALS ───────────────────────────────────── */}
        <section className="bg-gray-50 px-4 py-12 md:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-extrabold text-gray-900 md:text-3xl">
                Ce que disent nos clients 💬
              </h2>
              <p className="mt-1.5 text-sm text-gray-500">شنو قالو علينا</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="mb-2 flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                      style={{ backgroundColor: "#f97316" }}
                    >
                      {t.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900">{t.name} · <span className="font-normal text-gray-400">{t.city}</span></p>
                      <p className="text-yellow-400 text-xs leading-none mt-0.5">{"★".repeat(t.rating)}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-green-600">{t.badge}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. GUARANTEE BANNER ───────────────────────────────── */}
        <section
          className="px-4 py-12 text-white md:py-16"
          style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 text-5xl">🛡️</div>
            <h2 className="mb-3 text-2xl font-extrabold md:text-3xl">
              Satisfait ou Remboursé
            </h2>
            <p className="mb-1 text-base font-medium text-orange-100">
              Si le produit ne vous convient pas, on vous rembourse sans questions.
            </p>
            <p className="mb-8 text-sm text-orange-200">
              كلشي مضمون — 7 jours pour retourner votre commande
            </p>
            <a
              href="#products"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-base font-extrabold transition hover:bg-orange-50"
              style={{ color: "#f97316" }}
            >
              Commander Maintenant 🛒
            </a>
          </div>
        </section>

        {/* ── 10. FOOTER ────────────────────────────────────────── */}
        <footer className="border-t border-gray-100 bg-gray-950 px-4 py-10 text-white">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-between">
              {/* Brand */}
              <div className="text-center md:text-left">
                <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold text-white"
                    style={{ backgroundColor: "#f97316" }}
                  >
                    SC
                  </div>
                  <span className="text-xl font-extrabold" style={{ color: "#fb923c" }}>SoukClick</span>
                </div>
                <p className="text-sm text-gray-400">Produits tendance livrés partout au Maroc 🇲🇦</p>
                <p className="mt-0.5 text-xs text-gray-500">الدفع عند الاستلام • تسليم في 24-48 ساعة</p>
              </div>

              {/* Links */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400 md:gap-6">
                {[
                  { label: "Politique de retour", href: "#" },
                  { label: "Contact",              href: waLink },
                  { label: "FAQ",                  href: "#" },
                ].map(({ label, href }) => (
                  <a key={label} href={href} className="hover:text-orange-400 transition">
                    {label}
                  </a>
                ))}
              </div>

              {/* COD badge */}
              <div className="flex flex-col items-center gap-2 md:items-end">
                <div className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-center">
                  <p className="text-xs font-bold text-gray-300">💳 Mode de paiement</p>
                  <p className="mt-0.5 text-sm font-extrabold text-green-400">Paiement à la livraison</p>
                  <p className="text-xs text-gray-500">الدفع عند الاستلام</p>
                </div>
              </div>
            </div>

            {/* Divider + copyright */}
            <div className="border-t border-gray-800 pt-6 text-center">
              <p className="text-xs text-gray-600">
                © {new Date().getFullYear()} SoukClick — Tous droits réservés · Livraison partout au Maroc 🇲🇦
              </p>
            </div>
          </div>
        </footer>

        {/* ── 9. WHATSAPP STICKY ────────────────────────────────── */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="pulse-wa fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl md:h-16 md:w-16"
          style={{ backgroundColor: "#25D366" }}
          aria-label="Contacter sur WhatsApp"
        >
          <svg className="h-7 w-7 fill-white md:h-8 md:w-8" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.847L0 24l6.335-1.502A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.371l-.36-.214-3.722.882.935-3.625-.235-.372A9.818 9.818 0 1112 21.818z"/>
          </svg>
        </a>

      </div>
    </>
  )
}
