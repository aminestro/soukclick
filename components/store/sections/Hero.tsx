import Image from "next/image"
import type { HeroData } from "@/types/landing"
import type { Offer } from "@prisma/client"

interface HeroProps {
  data: HeroData
  product: {
    titleFr:      string
    price:        number
    comparePrice: number | null
    images:       string[]
  }
  offers?:   Offer[]
  language?: string
}

// Language-aware badge labels
const BADGE_LABELS: Record<string, Record<string, { icon: string; label: string }>> = {
  fr: {
    cod:                { icon: "🚚", label: "Paiement à la livraison" },
    livraison_gratuite: { icon: "🎁", label: "Livraison gratuite"     },
    garantie:           { icon: "✅", label: "Satisfait ou remboursé" },
    retour:             { icon: "↩️", label: "Retour facile"          },
  },
  darija: {
    cod:                { icon: "🚚", label: "الدفع عند الاستلام" },
    livraison_gratuite: { icon: "🎁", label: "التوصيل مجاني"      },
    garantie:           { icon: "✅", label: "مضمون أو مردود"     },
    retour:             { icon: "↩️", label: "إرجاع سهل"          },
  },
  ar: {
    cod:                { icon: "🚚", label: "الدفع عند الاستلام" },
    livraison_gratuite: { icon: "🎁", label: "توصيل مجاني"        },
    garantie:           { icon: "✅", label: "راضٍ أو مستردّ"      },
    retour:             { icon: "↩️", label: "إرجاع سهل"          },
  },
}

export function Hero({ data, product, offers = [], language = "fr" }: HeroProps) {
  const lang        = (language in BADGE_LABELS) ? language : "fr"
  const badgeMap    = BADGE_LABELS[lang]!
  const priceMAD    = (product.price / 100).toFixed(0)
  const compareMAD  = product.comparePrice ? (product.comparePrice / 100).toFixed(0) : null
  const discount    = compareMAD
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : null

  const heroImage      = data.image_url ?? product.images[0] ?? null
  const activeOffers   = offers.filter((o) => o.isActive).sort((a, b) => a.minQuantity - b.minQuantity)

  return (
    <section className="bg-white">

      {/* ── Pricing tiers ── shown above image when offers exist */}
      {activeOffers.length > 0 && (
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
          <div className="mx-auto max-w-2xl">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {activeOffers.map((offer, idx) => {
                const unitPrice  = offer.discountPercent > 0
                  ? Math.round(product.price * (1 - offer.discountPercent / 100))
                  : product.price
                const totalPrice = unitPrice * offer.minQuantity
                const isBest     = idx === Math.min(1, activeOffers.length - 1) && activeOffers.length > 1

                return (
                  <a
                    key={offer.id}
                    href="#order-form"
                    className={`relative shrink-0 rounded-xl border-2 px-3 py-2.5 text-center transition-shadow hover:shadow-md ${
                      isBest
                        ? "border-orange-400 bg-white shadow-sm shadow-orange-100"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {isBest && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-extrabold text-white">
                        ⭐ {lang === "fr" ? "Le plus choisi" : "الأكثر اختياراً"}
                      </span>
                    )}
                    <p className="text-xs font-bold text-gray-500">x{offer.minQuantity}</p>
                    <p className="text-base font-extrabold text-orange-600 tabular-nums">
                      {(totalPrice / 100).toFixed(0)} MAD
                    </p>
                    {offer.discountPercent > 0 && (
                      <p className="text-[10px] font-bold text-red-500">-{offer.discountPercent}%</p>
                    )}
                    {offer.freeShipping && (
                      <p className="text-[10px] font-semibold text-green-600">
                        {lang === "fr" ? "Livraison offerte" : "توصيل مجاني"}
                      </p>
                    )}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Product image / video ── full width */}
      <div className="relative w-full overflow-hidden bg-gray-100" style={{ aspectRatio: "1/1", maxHeight: 480 }}>
        {data.video_url ? (
          <video
            src={data.video_url}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : heroImage ? (
          <Image
            src={heroImage}
            alt={product.titleFr}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 80vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-4xl text-gray-300">
            📦
          </div>
        )}

        {/* Discount badge overlay */}
        {discount && (
          <div className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white shadow">
            -{discount}%
          </div>
        )}
      </div>

      {/* ── Content ── headline, price, badges, CTA */}
      <div className="px-4 py-6 md:mx-auto md:max-w-2xl md:py-8">

        {/* Headline */}
        <h1 className="text-2xl font-extrabold leading-tight text-gray-900 md:text-4xl">
          {data.headline}
        </h1>
        {data.subheadline && (
          <p className="mt-2 text-base text-gray-600 md:text-lg">
            {data.subheadline}
          </p>
        )}

        {/* Price */}
        {data.show_price && (
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-gray-900 md:text-4xl">
              {priceMAD} MAD
            </span>
            {data.show_compare_price && compareMAD && (
              <span className="text-lg text-gray-400 line-through">
                {compareMAD} MAD
              </span>
            )}
          </div>
        )}

        {/* Trust badges */}
        {data.badges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.badges.map((badge) => {
              const b = badgeMap[badge]
              if (!b) return null
              return (
                <span
                  key={badge}
                  className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                >
                  {b.icon} {b.label}
                </span>
              )
            })}
          </div>
        )}

        {/* CTA */}
        <a
          href="#order-form"
          style={{ backgroundColor: data.cta_color }}
          className="mt-6 flex w-full items-center justify-center rounded-xl py-4 text-center text-lg font-bold text-white shadow-lg active:opacity-90 md:max-w-xs"
        >
          {data.cta_text}
        </a>
      </div>
    </section>
  )
}
