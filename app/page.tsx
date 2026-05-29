import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PixelProvider } from "@/components/store/PixelProvider"
import { ProductCard } from "@/components/store/ProductCard"
import { fromCentimes } from "@/lib/format"
import { ShieldCheck, Truck, RefreshCw, Phone } from "lucide-react"

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "SoukClick — Produits tendance livrés partout au Maroc",
  description:
    "Découvrez nos produits tendance avec livraison rapide partout au Maroc. Paiement à la livraison disponible.",
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getActiveProducts() {
  return prisma.product.findMany({
    where:   { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: {
      id:           true,
      slug:         true,
      titleFr:      true,
      price:        true,
      comparePrice: true,
      images:       true,
      _count:       { select: { orders: true } },
      landingPages: {
        where:   { isActive: true },
        select:  { slug: true },
        take:    1,
        orderBy: { createdAt: "desc" },
      },
    },
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const products = await getActiveProducts()

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "+212600000000"

  return (
    <>
      <PixelProvider
        metaPixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID}
        tiktokPixelId={process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID}
        ga4Id={process.env.NEXT_PUBLIC_GA4_ID}
        gtmId={process.env.NEXT_PUBLIC_GTM_ID}
      />

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 font-extrabold text-sm text-white shadow-sm">
                SC
              </div>
              <div>
                <p className="font-extrabold text-gray-900 leading-none text-base">SoukClick</p>
                <p className="text-[10px] text-gray-400 leading-none mt-0.5">Livraison partout au Maroc</p>
              </div>
            </Link>

            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-green-500 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-green-600 transition"
            >
              <Phone className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </div>
        </header>

        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 py-12 text-white md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              🚚 Livraison rapide partout au Maroc
            </div>
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              Produits tendance<br />
              <span className="text-orange-100">livrés chez vous</span>
            </h1>
            <p className="mt-4 text-base text-orange-100 md:text-lg">
              Paiement à la livraison · Retour facile · Support 7j/7
            </p>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {[
                { icon: ShieldCheck, text: "Paiement à la livraison" },
                { icon: Truck,       text: "Livraison 24-72h"        },
                { icon: RefreshCw,   text: "Retour garanti"          },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-sm text-orange-100">
                  <Icon className="h-4 w-4 text-white" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Products ───────────────────────────────────────────── */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-6">
          {products.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-2xl mb-2">🛍️</p>
              <p className="text-gray-500">Bientôt disponible — revenez nous voir !</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-gray-900">
                  Nos produits
                </h2>
                <span className="text-sm text-gray-400">{products.length} produit{products.length > 1 ? "s" : ""}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
                {products.map((product) => {
                  // Link to the active landing page slug, fallback to product slug
                  const href = product.landingPages[0]?.slug
                    ? `/${product.landingPages[0].slug}`
                    : `/${product.slug}`

                  return (
                    <ProductCard
                      key={product.id}
                      href={href}
                      title={product.titleFr}
                      price={product.price}
                      comparePrice={product.comparePrice}
                      image={product.images[0] ?? null}
                      orders={product._count.orders}
                    />
                  )
                })}
              </div>
            </>
          )}
        </main>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer className="border-t border-gray-100 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
              {/* Brand */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 font-extrabold text-xs text-white">
                  SC
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">SoukClick</p>
                  <p className="text-xs text-gray-400">Livraison partout au Maroc</p>
                </div>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-green-500" />Paiement à la livraison</span>
                <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-orange-500" />Livraison rapide</span>
              </div>

              {/* WhatsApp CTA */}
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-600 transition shadow-sm"
              >
                <Phone className="h-4 w-4" />
                Contactez-nous
              </a>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
              © {new Date().getFullYear()} SoukClick — Tous droits réservés
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
