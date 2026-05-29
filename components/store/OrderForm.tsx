"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { City, Offer } from "@prisma/client"
import { getStoredClickIds, firePixelEvent, fireTikTokEvent, fireGA4Event } from "@/lib/tracking"

// ─── Schema ───────────────────────────────────────────────────────────────────

const orderSchema = z.object({
  customer_name: z.string().min(2, "Nom requis (min. 2 caractères)"),
  phone: z
    .string()
    .regex(/^(06|07)\d{8}$/, "Numéro invalide — format: 06XXXXXXXX ou 07XXXXXXXX"),
  city_id:  z.string().min(1, "Veuillez choisir votre ville"),
  address:  z.string().min(5, "Adresse requise (min. 5 caractères)"),
  quantity: z.number().int().min(1).max(10),
})

type OrderFormValues = z.infer<typeof orderSchema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductSummary {
  id:           string
  titleFr:      string
  price:        number  // centimes
  comparePrice: number | null
  images:       string[]
}

interface OrderFormProps {
  product:      ProductSummary
  offers:       Offer[]
  cities:       City[]
  landingPageId: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMAD(centimes: number): string {
  return `${(centimes / 100).toFixed(0)} MAD`
}

function computeUnitPrice(basePrice: number, offers: Offer[], qty: number): number {
  // Find the best active offer for the given quantity
  const applicable = offers
    .filter((o) => o.isActive && o.minQuantity <= qty)
    .sort((a, b) => b.minQuantity - a.minQuantity)

  const best = applicable[0]
  if (!best || best.discountPercent === 0) return basePrice

  return Math.round(basePrice * (1 - best.discountPercent / 100))
}

function isFreeShipping(offers: Offer[], qty: number): boolean {
  return offers
    .filter((o) => o.isActive && o.minQuantity <= qty && o.freeShipping)
    .some(() => true)
}

// Group cities by wilaya for the <select> optgroup
function groupCities(cities: City[]): Record<string, City[]> {
  return cities.reduce<Record<string, City[]>>((acc, city) => {
    const key = `${city.wilayaCode} — ${city.wilaya}`
    if (!acc[key]) acc[key] = []
    acc[key].push(city)
    return acc
  }, {})
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrderForm({ product, offers, cities, landingPageId }: OrderFormProps) {
  const router   = useRouter()
  const [qty, setQty]         = useState(1)
  const [loading, setLoading] = useState(false)

  const grouped = useMemo(() => groupCities(cities), [cities])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { quantity: 1 },
  })

  const cityId     = watch("city_id")
  const selectedCity = cities.find((c) => c.id === cityId)

  const unitPrice    = computeUnitPrice(product.price, offers, qty)
  const freeShip     = isFreeShipping(offers, qty)
  const deliveryFee  = freeShip ? 0 : (selectedCity?.deliveryPrice ?? 2500)
  const total        = unitPrice * qty + deliveryFee

  function handleQtyChange(newQty: number) {
    if (newQty < 1 || newQty > 10) return
    setQty(newQty)

    // AddToCart pixel on quantity change (debounced via state)
    firePixelEvent("AddToCart", {
      contentIds:  [product.id],
      contentName: product.titleFr,
      value:       (unitPrice * newQty) / 100,
      currency:    "MAD",
      numItems:    newQty,
    })
  }

  async function onSubmit(values: OrderFormValues) {
    setLoading(true)

    // InitiateCheckout pixel
    firePixelEvent("InitiateCheckout", {
      contentIds:  [product.id],
      contentName: product.titleFr,
      value:       total / 100,
      currency:    "MAD",
      numItems:    qty,
    })
    fireTikTokEvent("InitiateCheckout", {
      value:    total / 100,
      currency: "MAD",
    })
    fireGA4Event("begin_checkout", {
      value:    total / 100,
      currency: "MAD",
    })

    const clickIds = getStoredClickIds()

    try {
      const res = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          quantity:       qty,
          product_id:     product.id,
          landing_page_id: landingPageId,
          ...clickIds,
        }),
      })

      const body = await res.json() as { orderId?: string; orderNumber?: string; error?: string }

      if (!res.ok) {
        toast.error(body.error ?? "Une erreur est survenue. Réessayez.")
        setLoading(false)
        return
      }

      // Lead pixel
      firePixelEvent("Lead", {
        contentIds:  [product.id],
        contentName: product.titleFr,
        value:       total / 100,
        currency:    "MAD",
      })

      router.push(`/merci/${body.orderId}`)
    } catch {
      toast.error("Erreur réseau. Vérifiez votre connexion et réessayez.")
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      {/* ── Offer / Quantity selector ──────────────────────────────────────── */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Choisissez votre quantité
        </label>
        <div className="space-y-2">
          {offers.length > 0 ? (
            offers
              .filter((o) => o.isActive)
              .map((offer) => {
                const offerUnit = computeUnitPrice(product.price, offers, offer.minQuantity)
                const active    = qty === offer.minQuantity
                return (
                  <button
                    key={offer.id}
                    type="button"
                    onClick={() => handleQtyChange(offer.minQuantity)}
                    className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition ${
                      active
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className="font-semibold text-gray-900 text-sm">
                      {offer.labelFr}
                    </span>
                    <span className={`text-sm font-bold ${active ? "text-orange-600" : "text-gray-600"}`}>
                      {offer.freeShipping && (
                        <span className="mr-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          Livraison gratuite
                        </span>
                      )}
                      {offer.discountPercent > 0
                        ? `${formatMAD(offerUnit)} / unité`
                        : formatMAD(offerUnit)}
                    </span>
                  </button>
                )
              })
          ) : (
            /* Simple +/- stepper when no offers defined */
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleQtyChange(qty - 1)}
                className="h-10 w-10 rounded-full border border-gray-300 text-lg font-bold text-gray-700 hover:bg-gray-100"
              >
                −
              </button>
              <span className="w-8 text-center text-lg font-semibold">{qty}</span>
              <button
                type="button"
                onClick={() => handleQtyChange(qty + 1)}
                className="h-10 w-10 rounded-full border border-gray-300 text-lg font-bold text-gray-700 hover:bg-gray-100"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Customer name ─────────────────────────────────────────────────── */}
      <div>
        <label htmlFor="customer_name" className="mb-1.5 block text-sm font-semibold text-gray-700">
          Nom complet <span className="text-red-500">*</span>
        </label>
        <input
          id="customer_name"
          type="text"
          autoComplete="name"
          placeholder="Ex: Fatima Zahra"
          {...register("customer_name")}
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-400 ${
            errors.customer_name ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
          }`}
        />
        {errors.customer_name && (
          <p className="mt-1 text-xs text-red-600">{errors.customer_name.message}</p>
        )}
      </div>

      {/* ── Phone ─────────────────────────────────────────────────────────── */}
      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-gray-700">
          Téléphone <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="06XXXXXXXX"
          maxLength={10}
          {...register("phone")}
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-400 ${
            errors.phone ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
          }`}
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {/* ── City ──────────────────────────────────────────────────────────── */}
      <div>
        <label htmlFor="city_id" className="mb-1.5 block text-sm font-semibold text-gray-700">
          Ville <span className="text-red-500">*</span>
        </label>
        <select
          id="city_id"
          {...register("city_id")}
          className={`w-full rounded-xl border px-4 py-3 text-sm bg-white outline-none transition focus:ring-2 focus:ring-orange-400 ${
            errors.city_id ? "border-red-400 bg-red-50" : "border-gray-300"
          }`}
        >
          <option value="">— Choisissez votre ville —</option>
          {Object.entries(grouped).map(([region, regionCities]) => (
            <optgroup key={region} label={region}>
              {regionCities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.nameFr}
                  {freeShip
                    ? " — Livraison gratuite"
                    : ` — ${formatMAD(city.deliveryPrice)} livraison`}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {errors.city_id && (
          <p className="mt-1 text-xs text-red-600">{errors.city_id.message}</p>
        )}
        {selectedCity && !freeShip && (
          <p className="mt-1 text-xs text-gray-500">
            Délai estimé : {selectedCity.deliveryDays} jour{selectedCity.deliveryDays > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* ── Address ───────────────────────────────────────────────────────── */}
      <div>
        <label htmlFor="address" className="mb-1.5 block text-sm font-semibold text-gray-700">
          Adresse complète <span className="text-red-500">*</span>
        </label>
        <textarea
          id="address"
          rows={2}
          placeholder="Ex: Rue Ibn Khaldoun, Appt 3, Quartier Maarif"
          {...register("address")}
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-400 resize-none ${
            errors.address ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
          }`}
        />
        {errors.address && (
          <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
        )}
      </div>

      {/* ── Order summary ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Sous-total ({qty} unité{qty > 1 ? "s" : ""})</span>
          <span>{formatMAD(unitPrice * qty)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Livraison</span>
          <span className={freeShip ? "text-green-600 font-semibold" : ""}>
            {freeShip ? "GRATUITE" : selectedCity ? formatMAD(deliveryFee) : "—"}
          </span>
        </div>
        {unitPrice < product.price && (
          <div className="flex justify-between text-green-600">
            <span>Économie</span>
            <span>-{formatMAD((product.price - unitPrice) * qty)}</span>
          </div>
        )}
        <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-gray-900 text-base">
          <span>Total</span>
          <span>{selectedCity ? formatMAD(total) : `${formatMAD(unitPrice * qty)} + livraison`}</span>
        </div>
      </div>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center rounded-xl bg-orange-500 py-4 text-center text-lg font-bold text-white shadow-lg transition hover:bg-orange-600 active:bg-orange-700 disabled:opacity-70"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Envoi en cours...
          </span>
        ) : (
          "Commander Maintenant — Paiement à la Livraison"
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        En commandant, vous acceptez d'être contacté par téléphone pour confirmer votre commande.
      </p>

      {/* ── WhatsApp floating button ──────────────────────────────────────── */}
      <a
        href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""}?text=${encodeURIComponent("Bonjour, je voudrais commander " + product.titleFr)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Commander via WhatsApp"
        className="fixed bottom-20 left-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-xl hover:bg-green-600 active:bg-green-700 md:bottom-6"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </form>
  )
}
