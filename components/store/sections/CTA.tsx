import type { CtaData } from "@/types/landing"

interface CTAProps {
  data: CtaData
}

export function CTA({ data }: CTAProps) {
  return (
    <section className="bg-gray-900 py-12 px-4">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-2xl font-extrabold text-white md:text-3xl leading-tight">
          {data.headline}
        </h2>

        {data.urgency_text && (
          <p className="mt-3 text-sm font-medium text-orange-400 md:text-base">
            {data.urgency_text}
          </p>
        )}

        <a
          href="#order-form"
          style={{ backgroundColor: data.cta_color }}
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl py-4 text-center text-lg font-bold text-white shadow-xl active:opacity-90 md:max-w-xs"
        >
          {data.cta_text}
        </a>

        <p className="mt-3 text-xs text-gray-400">
          🔒 Paiement à la livraison — Livraison partout au Maroc
        </p>
      </div>
    </section>
  )
}
