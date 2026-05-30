import { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProductStatus } from "@prisma/client"
import { PixelInit } from "@/components/store/PixelInit"
import { SectionRenderer } from "@/components/store/SectionRenderer"
import { OrderForm } from "@/components/store/OrderForm"
import type { LandingSection, CheckoutSection } from "@/types/landing"

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
}

async function getLandingData(slug: string) {
  const landingPage = await prisma.landingPage.findFirst({
    where: {
      slug,
      isActive: true,
      product: { status: ProductStatus.ACTIVE },
    },
    include: {
      product: {
        include: {
          offers:  { where: { isActive: true }, orderBy: { minQuantity: "asc" } },
          reviews: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
          upsellTriggers: {
            where:   { isActive: true },
            include: { upsellProduct: true },
            take:    1,
          },
        },
      },
    },
  })

  if (!landingPage) return null

  const cities = await prisma.city.findMany({
    where:   { isActive: true },
    orderBy: [{ wilayaCode: "asc" }, { nameFr: "asc" }],
  })

  return { landingPage, cities }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getLandingData(params.slug)
  if (!data) return { title: "Page introuvable" }
  const { landingPage, product } = { landingPage: data.landingPage, product: data.landingPage.product }
  return {
    title:       landingPage.metaTitle   ?? product.titleFr,
    description: landingPage.metaDesc    ?? product.descriptionFr ?? undefined,
    keywords:    landingPage.metaKeywords ?? undefined,
    openGraph: {
      title:       landingPage.metaTitle ?? product.titleFr,
      description: landingPage.metaDesc  ?? product.descriptionFr ?? undefined,
      images:      product.images[0] ? [{ url: product.images[0] }] : [],
      type:        "website",
    },
  }
}

export default async function LandingPage({ params }: PageProps) {
  const data = await getLandingData(params.slug)
  if (!data) notFound()

  const { landingPage, cities } = data
  const { product } = landingPage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const language = (((landingPage as any).language) ?? "fr") as "fr" | "darija" | "ar"

  const allSections = (landingPage.sections as unknown as LandingSection[])
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)

  // Split: hero first, checkout/OrderForm in the middle, rest below
  const heroSections     = allSections.filter((s) => s.type === "hero")
  const checkoutSection  = allSections.find((s): s is CheckoutSection => s.type === "checkout")
  const otherSections    = allSections.filter((s) => s.type !== "hero" && s.type !== "checkout")

  const upsell = product.upsellTriggers[0] ?? null

  const isRtl = language === "ar" || language === "darija"

  return (
    <>
      <PixelInit
        productId={product.id}
        productName={product.titleFr}
        price={product.price}
        slug={params.slug}
      />

      <main className="min-h-screen bg-white" dir={isRtl ? "rtl" : "ltr"} lang={isRtl ? "ar" : "fr"}>

        {/* 1. Hero section */}
        <SectionRenderer
          sections={heroSections}
          product={product}
          language={language}
        />

        {/* 2. Order form — immediately after hero */}
        <section id="order-form" className="bg-gray-50 py-8 px-4">
          <div className="mx-auto max-w-lg">
            <OrderForm
              product={{
                id:           product.id,
                titleFr:      product.titleFr,
                price:        product.price,
                comparePrice: product.comparePrice,
                images:       product.images,
              }}
              offers={product.offers}
              cities={cities}
              landingPageId={landingPage.id}
              language={language}
              checkoutConfig={checkoutSection?.data}
            />
          </div>
        </section>

        {/* 3. Remaining sections: features, benefits, video, reviews, faq, cta */}
        <SectionRenderer
          sections={otherSections}
          product={product}
          language={language}
        />

        {/* Upsell after everything */}
        {upsell && (
          <section className="bg-orange-50 py-8 px-4 border-t border-orange-100">
            <div className="mx-auto max-w-lg text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-600 mb-2">
                {language === "fr" ? "Offre spéciale pour vous" : "عرض خاص لك"}
              </p>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {upsell.upsellProduct.titleFr}
              </h3>
              {upsell.discountPercent > 0 && (
                <p className="text-orange-600 font-semibold mb-4">
                  -{upsell.discountPercent}%{" "}
                  {language === "fr" ? "avec votre commande" : "مع طلبك"}
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Sticky bottom bar — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-gray-500">
            {language === "fr" ? "Total estimé" : "المجموع"}
          </p>
          <p className="text-lg font-bold text-gray-900">
            {(product.price / 100).toFixed(0)} MAD
          </p>
        </div>
        <a
          href="#order-form"
          className="flex-1 rounded-xl bg-orange-500 py-3 px-4 text-center text-sm font-bold text-white active:bg-orange-600"
        >
          {language === "fr" ? "Commander" : "اطلب دابا"}
        </a>
      </div>

      {/* Bottom bar spacer on mobile */}
      <div className="h-20 md:hidden" />
    </>
  )
}
