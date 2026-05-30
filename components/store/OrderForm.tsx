"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { City, Offer } from "@prisma/client"
import type { CheckoutData } from "@/types/landing"
import { getStoredClickIds, firePixelEvent, fireTikTokEvent, fireGA4Event } from "@/lib/tracking"

// ─── Schema ───────────────────────────────────────────────────────────────────

const orderSchema = z.object({
  customer_name: z.string().min(3),
  phone:         z.string().regex(/^(05|06|07)\d{8}$/),
  city_id:       z.string().min(1),
  address:       z.string().min(5),
  quantity:      z.number().int().min(1).max(10),
})

type OrderFormValues = z.infer<typeof orderSchema>

// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
  fr: {
    title:           "👇 Entrez vos informations",
    chooseOffer:     "Choisissez votre offre",
    fullName:        "Nom",
    phone:           "Téléphone",
    city:            "Ville",
    address:         "Adresse",
    namePlaceholder: "Mohamed Alami",
    addrPlaceholder: "Quartier, rue…",
    cityPlaceholder: "Choisissez votre ville…",
    citySearch:      "Rechercher…",
    cityNotFound:    "Aucune ville",
    cta:             "Commander Maintenant",
    summary:         "🛒 Résumé commande",
    productLine:     "Produit",
    delivery:        "Livraison",
    freeDelivery:    "Gratuite 🎁",
    total:           "Total",
    sending:         "Envoi…",
    sent:            "Commande envoyée !",
    distant:         "DISTANT",
    days:            "j",
    deliveryEst:     "Livraison estimée :",
    remoteZone:      "Zone distante",
    mostChosen:      "🔥 Le plus choisi",
    economy:         "ÉCONOMIE",
    savings:         "Vous économisez",
    stickyBtn:       "Commander →",
    stickyTotal:     "Total",
    freeShipping:    "🎁 Livraison offerte",
    plusDelivery:    "+ livraison",
    whatsapp:        "Bonjour, je voudrais commander",
    legal:           "En commandant vous acceptez d'être contacté pour confirmer.",
  },
  darija: {
    title:           "👇 أدخل معلوماتك للطلب",
    chooseOffer:     "اختار العرض ديالك",
    fullName:        "الاسم",
    phone:           "الهاتف",
    city:            "المدينة",
    address:         "العنوان",
    namePlaceholder: "محمد علمي",
    addrPlaceholder: "الحي، الزنقة…",
    cityPlaceholder: "اختار المدينة…",
    citySearch:      "قلب على مدينة…",
    cityNotFound:    "ما لقيناش",
    cta:             "أطلب الآن",
    summary:         "🛒 ملخص الطلب",
    productLine:     "المنتج",
    delivery:        "التوصيل",
    freeDelivery:    "مجاني 🎁",
    total:           "المجموع",
    sending:         "كيتصفط…",
    sent:            "تصفط الطلب!",
    distant:         "بعيد",
    days:            "أيام",
    deliveryEst:     "التوصيل المتوقع:",
    remoteZone:      "منطقة بعيدة",
    mostChosen:      "🔥 الأكثر طلباً",
    economy:         "توفير",
    savings:         "كنوفر",
    stickyBtn:       "اطلب دابا",
    stickyTotal:     "المجموع",
    freeShipping:    "🎁 التوصيل مجاني",
    plusDelivery:    "+ التوصيل",
    whatsapp:        "السلام، بغيت نطلب",
    legal:           "بالطلب قبلتي باش نتواصلو معك.",
  },
  ar: {
    title:           "👇 أدخل بياناتك لإتمام الطلب",
    chooseOffer:     "اختر العرض المناسب",
    fullName:        "الاسم",
    phone:           "الهاتف",
    city:            "المدينة",
    address:         "العنوان",
    namePlaceholder: "محمد العلمي",
    addrPlaceholder: "الحي، الشارع…",
    cityPlaceholder: "اختر مدينتك…",
    citySearch:      "ابحث عن مدينة…",
    cityNotFound:    "لم يتم العثور",
    cta:             "اطلب الآن",
    summary:         "🛒 ملخص الطلب",
    productLine:     "المنتج",
    delivery:        "التوصيل",
    freeDelivery:    "مجاني 🎁",
    total:           "المجموع الكلي",
    sending:         "جارٍ الإرسال…",
    sent:            "تم الطلب!",
    distant:         "بعيد",
    days:            "أيام",
    deliveryEst:     "موعد التسليم:",
    remoteZone:      "منطقة نائية",
    mostChosen:      "🔥 الأكثر طلباً",
    economy:         "توفير",
    savings:         "توفرت",
    stickyBtn:       "اطلب الآن",
    stickyTotal:     "المجموع",
    freeShipping:    "🎁 توصيل مجاني",
    plusDelivery:    "+ التوصيل",
    whatsapp:        "السلام، أرغب في طلب",
    legal:           "بالطلب تقبل التواصل معك لتأكيده.",
  },
} as const

type Lang = keyof typeof T

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductSummary {
  id:           string
  titleFr:      string
  price:        number
  comparePrice: number | null
  images:       string[]
}

export interface OrderFormProps {
  product:        ProductSummary
  offers:         Offer[]
  cities:         City[]
  landingPageId:  string
  language?:      string
  checkoutConfig?: CheckoutData
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMAD(c: number) { return `${(c / 100).toFixed(0)} درهم` }

function computeUnitPrice(base: number, offers: Offer[], qty: number): number {
  const best = offers
    .filter((o) => o.isActive && o.minQuantity <= qty)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0]
  if (!best || best.discountPercent === 0) return base
  return Math.round(base * (1 - best.discountPercent / 100))
}

function isFreeShipping(offers: Offer[], qty: number) {
  return offers.some((o) => o.isActive && o.minQuantity <= qty && o.freeShipping)
}

function discountPct(base: number, unit: number) {
  if (unit >= base) return 0
  return Math.round(((base - unit) / base) * 100)
}

// ─── City dropdown ────────────────────────────────────────────────────────────

function CityDropdown({
  cities, value, onChange, freeShip, error, t,
}: {
  cities:   City[]
  value:    string
  onChange: (id: string) => void
  freeShip: boolean
  error?:   string
  t:        typeof T[Lang]
}) {
  const [search, setSearch] = useState("")
  const [open,   setOpen]   = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inp = useRef<HTMLInputElement>(null)

  const selected = cities.find((c) => c.id === value)
  const filtered = useMemo(() => {
    if (!search.trim()) return cities
    const q = search.toLowerCase()
    return cities.filter((c) => c.nameFr.toLowerCase().includes(q) || c.wilaya.toLowerCase().includes(q))
  }, [search, cities])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch("") }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(true); setTimeout(() => inp.current?.focus(), 10) }}
        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-right text-sm transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
          error ? "border-red-400 bg-red-50" : open ? "border-orange-400 ring-2 ring-orange-100" : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <span className="text-base">🏙️</span>
        <span className={`flex-1 truncate ${selected ? "text-gray-900 font-medium" : "text-gray-400"}`}>
          {selected ? selected.nameFr : t.cityPlaceholder}
        </span>
        {selected && (
          <span className={`shrink-0 text-xs font-bold ${freeShip ? "text-green-600" : "text-orange-500"}`}>
            {freeShip ? t.freeDelivery : formatMAD(selected.deliveryPrice)}
          </span>
        )}
        <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
          <div className="border-b border-gray-100 p-2">
            <input ref={inp} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t.citySearch}
              className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-orange-300"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-5 text-center text-sm text-gray-400">{t.cityNotFound}</p>
            ) : filtered.map((city) => (
              <button key={city.id} type="button" onClick={() => { onChange(city.id); setOpen(false); setSearch("") }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-orange-50 ${city.id === value ? "bg-orange-50 font-semibold text-orange-600" : "text-gray-800"}`}
              >
                <span className="flex items-center gap-1.5">
                  {city.nameFr}
                  {city.isRemote && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">{t.distant}</span>}
                </span>
                <span className={`text-xs font-semibold ${freeShip ? "text-green-600" : "text-orange-500"}`}>
                  {freeShip ? t.freeDelivery : formatMAD(city.deliveryPrice)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && !open && (
        <p className="mt-1 text-[11px] text-gray-400">
          🕐 {t.deliveryEst} {selected.deliveryDays} {t.days}
          {selected.isRemote && <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">{t.remoteZone}</span>}
        </p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OrderForm({ product, offers, cities, landingPageId, language = "fr", checkoutConfig }: OrderFormProps) {
  const router = useRouter()
  const lang   = (language in T ? language : "fr") as Lang
  const t      = T[lang]
  const isRtl  = lang !== "fr"

  // Config from checkout section (or defaults)
  const title      = checkoutConfig?.title      ?? t.title
  const ctaText    = checkoutConfig?.cta_text   ?? t.cta
  const ctaColor   = checkoutConfig?.cta_color  ?? "#f97316"
  const showImages = checkoutConfig?.show_product_images ?? true
  const showSum    = checkoutConfig?.show_summary        ?? true
  const trustItems = checkoutConfig?.trust_items         ?? []

  const [qty,           setQty]           = useState(() => {
    const first = offers.filter((o) => o.isActive).sort((a, b) => a.minQuantity - b.minQuantity)[0]
    return first?.minQuantity ?? 1
  })
  const [loading,       setLoading]       = useState(false)
  const [submitted,     setSubmitted]     = useState(false)
  const [phoneDisplay,  setPhoneDisplay]  = useState("")
  const [shaking,       setShaking]       = useState(false)
  const [stickyVisible, setStickyVisible] = useState(false)
  const [summaryOpen,   setSummaryOpen]   = useState(false)

  const submitBtnRef = useRef<HTMLButtonElement>(null)
  const formRef      = useRef<HTMLFormElement>(null)

  const activeOffers = useMemo(
    () => offers.filter((o) => o.isActive).sort((a, b) => a.minQuantity - b.minQuantity),
    [offers],
  )

  useEffect(() => {
    if (!submitBtnRef.current) return
    const obs = new IntersectionObserver(([e]) => setStickyVisible(!e?.isIntersecting), { threshold: 0.5 })
    obs.observe(submitBtnRef.current)
    return () => obs.disconnect()
  }, [])

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<OrderFormValues>({
    resolver:      zodResolver(orderSchema),
    defaultValues: { quantity: qty },
  })

  const cityId       = watch("city_id")
  const selectedCity = cities.find((c) => c.id === cityId)
  const unitPrice    = computeUnitPrice(product.price, offers, qty)
  const freeShip     = isFreeShipping(offers, qty)
  const deliveryFee  = freeShip ? 0 : (selectedCity?.deliveryPrice ?? 0)
  const total        = unitPrice * qty + deliveryFee
  const savings      = (product.price - unitPrice) * qty

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw  = e.target.value.replace(/\D/g, "").slice(0, 10)
    const fmt  = raw
      .replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")
      .replace(/(\d{2})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4")
      .replace(/(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3")
      .replace(/(\d{2})(\d{2})$/, "$1 $2")
    setPhoneDisplay(fmt)
    setValue("phone", raw, { shouldValidate: raw.length === 10 })
  }

  function handleQtyChange(newQty: number) {
    if (newQty < 1 || newQty > 10) return
    setQty(newQty)
    setValue("quantity", newQty)
    firePixelEvent("AddToCart", { contentIds: [product.id], contentName: product.titleFr, value: (computeUnitPrice(product.price, offers, newQty) * newQty) / 100, currency: "MAD", numItems: newQty })
  }

  async function onSubmit(values: OrderFormValues) {
    setLoading(true)
    firePixelEvent("InitiateCheckout", { contentIds: [product.id], contentName: product.titleFr, value: total / 100, currency: "MAD", numItems: qty })
    fireTikTokEvent("InitiateCheckout", { value: total / 100, currency: "MAD" })
    fireGA4Event("begin_checkout",      { value: total / 100, currency: "MAD" })
    const clickIds = getStoredClickIds()
    try {
      const res  = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...values, quantity: qty, product_id: product.id, landing_page_id: landingPageId, ...clickIds }),
      })
      const body = await res.json() as { orderId?: string; error?: string }
      if (!res.ok) { toast.error(body.error ?? "Erreur"); setLoading(false); return }
      firePixelEvent("Lead", { contentIds: [product.id], contentName: product.titleFr, value: total / 100, currency: "MAD" })
      setSubmitted(true)
      setTimeout(() => router.push(`/merci/${body.orderId}`), 600)
    } catch {
      toast.error("Erreur réseau")
      setLoading(false)
    }
  }

  const inputCls = (hasErr: boolean) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-300 ${
      hasErr ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300 focus:border-orange-400"
    }`

  return (
    <>
      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-5px)}30%{transform:translateX(5px)}45%{transform:translateX(-3px)}60%{transform:translateX(3px)}75%,90%{transform:translateX(-1px)}}
        .form-shake{animation:shake .4s ease}
        @keyframes pulse-cta{0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,.4)}60%{box-shadow:0 0 0 12px rgba(249,115,22,0)}}
        .pulse-cta{animation:pulse-cta 2.2s ease infinite}
      `}</style>

      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit, () => { setShaking(true); setTimeout(() => setShaking(false), 500) })}
        className={`space-y-4 ${shaking ? "form-shake" : ""}`}
        dir={isRtl ? "rtl" : "ltr"}
        noValidate
      >
        {/* ── Title ───────────────────────────────────────────────────────── */}
        <h2 className="text-center text-xl font-extrabold text-gray-900">
          {title}
        </h2>
        {checkoutConfig?.subtitle && (
          <p className="text-center text-sm text-gray-500 -mt-2">{checkoutConfig.subtitle}</p>
        )}

        {/* ── Offer cards ─────────────────────────────────────────────────── */}
        {activeOffers.length > 0 && (
          <div className="space-y-2.5">
            {activeOffers.map((offer, idx) => {
              const offerUnit  = computeUnitPrice(product.price, offers, offer.minQuantity)
              const pct        = discountPct(product.price, offerUnit)
              const active     = qty === offer.minQuantity
              const isBest     = idx === Math.min(1, activeOffers.length - 1) && activeOffers.length > 1

              return (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => handleQtyChange(offer.minQuantity)}
                  className={`relative w-full rounded-2xl border-2 p-3 text-right transition-all ${
                    active
                      ? "border-orange-400 bg-orange-50 shadow-md shadow-orange-100"
                      : "border-gray-200 bg-white hover:border-orange-200"
                  }`}
                >
                  {isBest && (
                    <span className={`absolute -top-2.5 ${isRtl ? "right-4" : "left-4"} rounded-full bg-orange-500 px-3 py-0.5 text-[10px] font-extrabold text-white shadow-sm`}>
                      {t.mostChosen}
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    {/* Product thumbnail */}
                    {showImages && product.images[0] && (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                        <Image
                          src={product.images[0]}
                          alt={product.titleFr}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Offer info */}
                    <div className="flex flex-1 items-center justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-gray-900">
                          {offer.labelFr}
                        </span>
                        {pct > 0 && (
                          <span className="inline-flex w-fit rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                            خصم {pct}%
                          </span>
                        )}
                        {offer.freeShipping && (
                          <span className="inline-flex w-fit items-center gap-0.5 text-[11px] font-semibold text-green-600">
                            {t.freeShipping}
                          </span>
                        )}
                      </div>

                      {/* Prices */}
                      <div className="flex flex-col items-end gap-0.5">
                        {pct > 0 && (
                          <span className="text-xs text-gray-400 line-through tabular-nums">
                            {formatMAD(product.price * offer.minQuantity)}
                          </span>
                        )}
                        <span className={`text-lg font-extrabold tabular-nums ${active ? "text-orange-600" : "text-gray-800"}`}>
                          {formatMAD(offerUnit * offer.minQuantity)}
                        </span>
                      </div>
                    </div>

                    {/* Radio indicator */}
                    <div className={`shrink-0 h-5 w-5 rounded-full border-2 transition-all ${
                      active ? "border-orange-500 bg-orange-500" : "border-gray-300 bg-white"
                    } flex items-center justify-center`}>
                      {active && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* ── Form fields — 2-column grid ──────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Name */}
          <div>
            <input
              type="text"
              autoComplete="name"
              placeholder={`👤 ${t.fullName}`}
              {...register("customer_name")}
              className={inputCls(!!errors.customer_name)}
            />
          </div>

          {/* Phone */}
          <div>
            <div className={`flex overflow-hidden rounded-xl border transition focus-within:ring-2 focus-within:ring-orange-300 ${errors.phone ? "border-red-400" : "border-gray-200"}`}>
              <div className="flex shrink-0 items-center gap-1 border-r border-gray-200 bg-gray-50 px-2.5 text-xs font-semibold text-gray-500">
                📱 +212
              </div>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="06 XX XX XX"
                value={phoneDisplay}
                onChange={handlePhoneChange}
                className={`flex-1 px-2.5 py-3 text-sm outline-none ${errors.phone ? "bg-red-50" : "bg-white"}`}
              />
            </div>
          </div>

          {/* City */}
          <div>
            <CityDropdown
              cities={cities}
              value={cityId ?? ""}
              freeShip={freeShip}
              error={errors.city_id?.message}
              t={t}
              onChange={(id) => setValue("city_id", id, { shouldValidate: true })}
            />
          </div>

          {/* Address */}
          <div>
            <input
              type="text"
              autoComplete="street-address"
              placeholder={`📍 ${t.address}`}
              {...register("address")}
              className={inputCls(!!errors.address)}
            />
          </div>
        </div>

        {/* Validation errors */}
        {(errors.customer_name || errors.phone || errors.city_id || errors.address) && (
          <p className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            ⚠ {errors.customer_name?.message || errors.phone?.message || errors.city_id?.message || errors.address?.message}
          </p>
        )}

        {/* ── CTA Button ──────────────────────────────────────────────────── */}
        <button
          ref={submitBtnRef}
          type="submit"
          disabled={loading || submitted}
          style={{ backgroundColor: submitted ? "#22c55e" : ctaColor }}
          className={`relative flex w-full items-center justify-center rounded-2xl py-4 text-center text-xl font-extrabold text-white shadow-xl transition-all disabled:opacity-80 ${
            !loading && !submitted ? "pulse-cta" : ""
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2.5">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {t.sending}
            </span>
          ) : submitted ? (
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t.sent}
            </span>
          ) : (
            ctaText
          )}
        </button>

        {/* ── Order summary (collapsible) ──────────────────────────────────── */}
        {showSum && (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setSummaryOpen(!summaryOpen)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              <span>{t.summary}</span>
              <svg className={`h-4 w-4 text-gray-400 transition-transform ${summaryOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {summaryOpen && (
              <div className="border-t border-gray-100 px-4 py-3 space-y-2.5 text-sm">
                {savings > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-green-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white">{t.economy}</span>
                    <span className="text-xs font-bold text-green-700">{t.savings} {formatMAD(savings)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-gray-600">
                  <span>{t.productLine} × {qty}</span>
                  <span className="font-semibold tabular-nums">{formatMAD(unitPrice * qty)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>{t.delivery}</span>
                  <span className={`font-semibold tabular-nums ${freeShip ? "text-green-600" : ""}`}>
                    {freeShip
                      ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">{t.freeDelivery}</span>
                      : selectedCity ? formatMAD(deliveryFee) : <span className="text-gray-400">{t.plusDelivery}</span>
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-2 font-extrabold text-gray-900">
                  <span>{t.total}</span>
                  <span className="text-lg tabular-nums text-orange-600">
                    {selectedCity ? formatMAD(total) : `${formatMAD(unitPrice * qty)} ${t.plusDelivery}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Trust badges ────────────────────────────────────────────────── */}
        {trustItems.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
            {trustItems.map((item, i) => (
              <span key={i} className="text-[11px] text-gray-500">{item}</span>
            ))}
          </div>
        )}

        <p className="text-center text-[10px] text-gray-400">{t.legal}</p>

        {/* ── WhatsApp ────────────────────────────────────────────────────── */}
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""}?text=${encodeURIComponent(t.whatsapp + " " + product.titleFr)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 left-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-xl hover:bg-green-600 md:bottom-6"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      </form>

      {/* ── Sticky mobile CTA ─────────────────────────────────────────────── */}
      <div className={`fixed bottom-0 inset-x-0 z-50 md:hidden transition-all duration-300 ${stickyVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}>
        <div className="border-t border-gray-200 bg-white px-4 pb-4 pt-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400">{t.stickyTotal}</p>
              <p className="text-lg font-extrabold tabular-nums text-gray-900">
                {selectedCity ? formatMAD(total) : formatMAD(unitPrice * qty)}
              </p>
            </div>
            <button
              type="button"
              style={{ backgroundColor: ctaColor }}
              onClick={() => {
                formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                setTimeout(() => submitBtnRef.current?.click(), 600)
              }}
              className="flex-1 rounded-xl py-3.5 text-center text-sm font-extrabold text-white shadow-md active:opacity-90"
            >
              {t.stickyBtn}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
