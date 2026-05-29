import Image from "next/image"
import type { HeroData } from "@/types/landing"

interface HeroProps {
  data: HeroData
  product: {
    titleFr:      string
    price:        number  // centimes
    comparePrice: number | null
    images:       string[]
  }
}

const BADGE_LABELS: Record<string, { icon: string; label: string }> = {
  cod:               { icon: "🚚", label: "Paiement à la livraison" },
  livraison_gratuite:{ icon: "🎁", label: "Livraison gratuite" },
  garantie:          { icon: "✅", label: "Satisfait ou remboursé" },
  retour:            { icon: "↩️", label: "Retour facile" },
}

export function Hero({ data, product }: HeroProps) {
  const priceMAD   = (product.price / 100).toFixed(0)
  const compareMAD = product.comparePrice
    ? (product.comparePrice / 100).toFixed(0)
    : null
  const discount = compareMAD
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : null

  const heroImage = data.image_url ?? product.images[0] ?? null

  return (
    <section className="relative bg-white">
      {/* Hero image / video */}
      <div className="relative w-full aspect-square max-h-[480px] overflow-hidden bg-gray-100 md:aspect-video md:max-h-[560px]">
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
          <div className="flex h-full w-full items-center justify-center bg-gray-200">
            <span className="text-gray-400">Image du produit</span>
          </div>
        )}

        {/* Discount badge */}
        {discount && (
          <div className="absolute top-3 right-3 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white shadow">
            -{discount}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-6 md:mx-auto md:max-w-2xl md:py-10">
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
              const b = BADGE_LABELS[badge]
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

        {/* CTA button */}
        <a
          href="#order-form"
          style={{ backgroundColor: data.cta_color }}
          className="mt-6 flex w-full items-center justify-center rounded-xl py-4 text-center text-lg font-bold text-white shadow-lg active:opacity-90 md:max-w-xs"
        >
          {data.cta_text}
        </a>

        {/* COD reassurance */}
        <p className="mt-3 text-center text-xs text-gray-500 md:text-left">
          🔒 Paiement uniquement à la réception — 100% sécurisé
        </p>
      </div>
    </section>
  )
}
