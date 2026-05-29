import { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { MerciPixelFire } from "@/components/store/MerciPixelFire"
import { buildWhatsAppLink } from "@/lib/whatsapp"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Merci pour votre commande !",
  robots: { index: false },
}

interface PageProps {
  params: { orderId: string }
}

async function getOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: {
        select: {
          id:       true,
          titleFr:  true,
          images:   true,
          price:    true,
          upsellTriggers: {
            where:   { isActive: true },
            include: { upsellProduct: { select: { id: true, titleFr: true, price: true, images: true, slug: true } } },
            take:    1,
          },
        },
      },
      city: { select: { nameFr: true, deliveryDays: true } },
    },
  })
}

export default async function MerciPage({ params }: PageProps) {
  const order = await getOrder(params.orderId)
  if (!order) notFound()

  const waLink = buildWhatsAppLink(
    process.env.WHATSAPP_ADMIN_PHONE ?? "",
    order.orderNumber,
    order.product.titleFr,
  )

  const upsell = order.product.upsellTriggers[0] ?? null

  return (
    <>
      <MerciPixelFire
        productId={order.product.id}
        productName={order.product.titleFr}
        total={order.total}
        pixelEventId={order.pixelEventId ?? undefined}
      />

      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-lg space-y-6">

          {/* ── Success banner ──────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-green-500 px-6 py-8 text-center text-white shadow-lg">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold">
              Merci {order.customerName.split(" ")[0]} !
            </h1>
            <p className="mt-2 text-green-100 text-sm">
              Votre commande a bien été reçue
            </p>
            <p className="mt-1 text-lg font-bold">
              {order.orderNumber}
            </p>
          </div>

          {/* ── What happens next ───────────────────────────────────────────── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">
              📞 Ce qui se passe maintenant
            </h2>
            <ol className="space-y-3">
              {[
                { step: "1", text: "Notre équipe va vous appeler dans les 24h pour confirmer votre commande." },
                { step: "2", text: `Dès confirmation, votre colis sera expédié vers ${order.city.nameFr}.` },
                { step: "3", text: `Livraison estimée en ${order.city.deliveryDays} jour${order.city.deliveryDays > 1 ? "s" : ""}.` },
                { step: "4", text: "Vous payez uniquement à la réception — 0 risque !" },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                    {item.step}
                  </span>
                  <span className="text-sm text-gray-600">{item.text}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* ── Order summary ───────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Récapitulatif</h2>
            <div className="flex gap-4">
              {order.product.images[0] && (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={order.product.images[0]}
                    alt={order.product.titleFr}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 space-y-1 text-sm">
                <p className="font-semibold text-gray-900">{order.product.titleFr}</p>
                <p className="text-gray-500">Qté : {order.quantity}</p>
                <p className="text-gray-500">Ville : {order.city.nameFr}</p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span>{((order.unitPrice * order.quantity) / 100).toFixed(0)} MAD</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span>
                  {order.deliveryPrice === 0
                    ? <span className="text-green-600 font-semibold">GRATUITE</span>
                    : `${(order.deliveryPrice / 100).toFixed(0)} MAD`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-2">
                <span>Total à payer</span>
                <span>{(order.total / 100).toFixed(0)} MAD</span>
              </div>
              <p className="text-xs text-gray-400 text-right">Paiement à la livraison</p>
            </div>
          </div>

          {/* ── WhatsApp CTA ─────────────────────────────────────────────────── */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 text-center font-bold text-white shadow-md hover:bg-green-600 active:bg-green-700"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Contacter via WhatsApp
          </a>

          {/* ── Upsell ───────────────────────────────────────────────────────── */}
          {upsell && (
            <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">
                Offre exclusive — clients VIP
              </p>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {upsell.upsellProduct.titleFr}
              </h3>
              {upsell.upsellProduct.images[0] && (
                <div className="relative mx-auto my-3 h-36 w-36 overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={upsell.upsellProduct.images[0]}
                    alt={upsell.upsellProduct.titleFr}
                    fill
                    sizes="144px"
                    className="object-cover"
                  />
                </div>
              )}
              {upsell.discountPercent > 0 && (
                <p className="text-2xl font-extrabold text-orange-600">
                  -{upsell.discountPercent}% supplémentaire
                </p>
              )}
              <a
                href={`/${upsell.upsellProduct.slug}`}
                className="mt-3 inline-block rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600 active:bg-orange-700"
              >
                Découvrir l'offre
              </a>
            </div>
          )}

          {/* ── Footer note ──────────────────────────────────────────────────── */}
          <p className="text-center text-xs text-gray-400 pb-6">
            Numéro de commande : <strong>{order.orderNumber}</strong>
            <br />Gardez ce numéro pour toute communication avec notre équipe.
          </p>
        </div>
      </main>
    </>
  )
}
