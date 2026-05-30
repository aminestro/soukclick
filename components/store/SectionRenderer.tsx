import type { LandingSection } from "@/types/landing"
import type { Offer, Review } from "@prisma/client"
import { Hero }        from "@/components/store/sections/Hero"
import { Benefits }    from "@/components/store/sections/Benefits"
import { Features }    from "@/components/store/sections/Features"
import { Video }       from "@/components/store/sections/Video"
import { Reviews }     from "@/components/store/sections/Reviews"
import { FAQ }         from "@/components/store/sections/FAQ"
import { BeforeAfter } from "@/components/store/sections/BeforeAfter"
import { CTA }         from "@/components/store/sections/CTA"

interface SectionRendererProps {
  sections: LandingSection[]
  product: {
    titleFr:      string
    price:        number
    comparePrice: number | null
    images:       string[]
    reviews:      Review[]
    offers:       Offer[]
  }
  // "fr" (default) | "darija" | "ar" — controls dir/lang on the wrapper
  language?: string
}

export function SectionRenderer({ sections, product, language = "fr" }: SectionRendererProps) {
  const isRtl    = language === "ar" || language === "darija"
  const langAttr = isRtl ? "ar" : "fr"

  const orderedEnabled = [...sections]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)

  return (
    <div dir={isRtl ? "rtl" : "ltr"} lang={langAttr}>
      {orderedEnabled.map((section, idx) => {
        switch (section.type) {
          case "hero":
            return (
              <Hero
                key={idx}
                data={section.data}
                product={{
                  titleFr:      product.titleFr,
                  price:        product.price,
                  comparePrice: product.comparePrice,
                  images:       product.images,
                }}
              />
            )

          case "benefits":
            return <Benefits key={idx} data={section.data} />

          case "features":
            return <Features key={idx} data={section.data} />

          case "video":
            return <Video key={idx} data={section.data} />

          case "reviews":
            return (
              <Reviews
                key={idx}
                data={section.data}
                reviews={
                  section.data.review_ids.length > 0
                    ? product.reviews.filter((r) =>
                        section.data.review_ids.includes(r.id),
                      )
                    : product.reviews
                }
              />
            )

          case "faq":
            return <FAQ key={idx} data={section.data} />

          case "before_after":
            return <BeforeAfter key={idx} data={section.data} />

          case "cta":
            return <CTA key={idx} data={section.data} />

          default:
            return null
        }
      })}
    </div>
  )
}
