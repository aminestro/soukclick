import Image from "next/image"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { fromCentimes } from "@/lib/format"

interface ProductCardProps {
  href:         string
  title:        string
  price:        number   // centimes
  comparePrice: number | null
  image:        string | null
  orders?:      number
}

export function ProductCard({
  href,
  title,
  price,
  comparePrice,
  image,
  orders,
}: ProductCardProps) {
  const discount =
    comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : null

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-orange-200 transition-all overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <ShoppingBag className="h-12 w-12" />
          </div>
        )}

        {/* Discount badge */}
        {discount && (
          <div className="absolute top-2 left-2 rounded-lg bg-red-500 px-2 py-0.5 text-xs font-extrabold text-white shadow-sm">
            -{discount}%
          </div>
        )}

        {/* Orders badge */}
        {orders && orders > 10 && (
          <div className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
            🔥 {orders > 999 ? `${Math.floor(orders / 1000)}k` : orders}+ vendus
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 group-hover:text-orange-600 transition-colors">
          {title}
        </p>

        <div className="mt-auto flex items-end justify-between gap-1">
          <div>
            <p className="text-base font-extrabold text-orange-500 tabular-nums">
              {fromCentimes(price).toFixed(0)} MAD
            </p>
            {comparePrice && comparePrice > price && (
              <p className="text-xs text-gray-400 line-through tabular-nums">
                {fromCentimes(comparePrice).toFixed(0)} MAD
              </p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2 text-xs font-bold text-white group-hover:bg-orange-600 transition-colors">
          <ShoppingBag className="h-3.5 w-3.5" />
          Commander
        </div>
      </div>
    </Link>
  )
}
