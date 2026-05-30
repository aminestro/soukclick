"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { City, Offer } from "@prisma/client"
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
    orderTitle:      "🛒 Commander Maintenant",
    orderSubtitle:   "Remplissez le formulaire ci-dessous",
    chooseOffer:     "Choisissez votre offre",
    quantity:        "Quantité",
    fullName:        "Nom complet",
    namePlaceholder: "Ex: Mohamed Alami",
    phone:           "Téléphone",
    city:            "Ville",
    cityPlaceholder: "Choisissez votre ville…",
    citySearch:      "Rechercher une ville…",
    cityNotFound:    "Aucune ville trouvée",
    address:         "Adresse complète",
    addrPlaceholder: "Quartier, rue, numéro d'appartement…",
    delivery:        "Livraison",
    freeDelivery:    "Gratuite 🎁",
    productLine:     "Produit",
    total:           "Total à payer",
    savings:         "Vous économisez",
    sending:         "Envoi en cours…",
    sent:            "Commande envoyée !",
    confirm:         "✅ Confirmer ma commande",
    trust1:          "Paiement uniquement à la livraison — aucun prépaiement",
    trust2:          "Livraison en 24-72h partout au Maroc",
    trust3:          "Retour gratuit si vous n'êtes pas satisfait",
    legal:           "En commandant, vous acceptez d'être contacté pour confirmer votre commande.",
    stickyTotal:     "Total estimé",
    stickyBtn:       "Commander →",
    freeShipping:    "🎁 Livraison gratuite",
    distant:         "DISTANT",
    deliveryEst:     "Livraison estimée :",
    days:            "j",
    remoteZone:      "Zone distante",
    mostChosen:      "⭐ Le plus choisi",
    economy:         "ÉCONOMIE",
    secureMsg:       "🔒 Sécurisé",
    codMsg:          "🚚 Paiement à la livraison",
    officialMsg:     "✅ Site officiel",
    whatsapp:        "Bonjour, je voudrais commander",
    plusDelivery:    "+ livraison",
  },
  darija: {
    orderTitle:      "🛒 اطلب دابا",
    orderSubtitle:   "عمر البيانات ديالك هنا",
    chooseOffer:     "اختار العرض ديالك",
    quantity:        "الكمية",
    fullName:        "الاسم الكامل",
    namePlaceholder: "مثلاً: محمد علمي",
    phone:           "رقم الهاتف",
    city:            "المدينة",
    cityPlaceholder: "اختار المدينة ديالك…",
    citySearch:      "قلب على مدينة…",
    cityNotFound:    "ما لقيناش المدينة",
    address:         "العنوان",
    addrPlaceholder: "الحي، الزنقة، رقم الدار…",
    delivery:        "التوصيل",
    freeDelivery:    "مجاني 🎁",
    productLine:     "المنتج",
    total:           "المجموع",
    savings:         "كنوفر",
    sending:         "كيتصفط…",
    sent:            "تصفط الطلب!",
    confirm:         "✅ أكد الطلب ديالك",
    trust1:          "الدفع عند الاستلام — بلا دفع مسبق",
    trust2:          "التوصيل في 24-72 ساعة في جميع أنحاء المغرب",
    trust3:          "إرجاع مجاني إلا ما رضيتيش",
    legal:           "بالطلب، قبلتي باش نتواصلو معك لتأكيد الطلب.",
    stickyTotal:     "المجموع",
    stickyBtn:       "اطلب دابا ←",
    freeShipping:    "🎁 التوصيل مجاني",
    distant:         "بعيد",
    deliveryEst:     "التوصيل المتوقع:",
    days:            "أيام",
    remoteZone:      "منطقة بعيدة",
    mostChosen:      "⭐ الأكثر اختياراً",
    economy:         "توفير",
    secureMsg:       "🔒 مأمون",
    codMsg:          "🚚 الدفع عند الاستلام",
    officialMsg:     "✅ الموقع الرسمي",
    whatsapp:        "السلام عليكم، بغيت نطلب",
    plusDelivery:    "+ التوصيل",
  },
  ar: {
    orderTitle:      "🛒 اطلب الآن",
    orderSubtitle:   "أدخل بياناتك أدناه",
    chooseOffer:     "اختر عرضك",
    quantity:        "الكمية",
    fullName:        "الاسم الكامل",
    namePlaceholder: "مثال: محمد العلمي",
    phone:           "رقم الهاتف",
    city:            "المدينة",
    cityPlaceholder: "اختر مدينتك…",
    citySearch:      "ابحث عن مدينة…",
    cityNotFound:    "لم يتم العثور على المدينة",
    address:         "العنوان الكامل",
    addrPlaceholder: "الحي، الشارع، رقم المنزل…",
    delivery:        "التوصيل",
    freeDelivery:    "مجاني 🎁",
    productLine:     "المنتج",
    total:           "المجموع الكلي",
    savings:         "توفرت",
    sending:         "جارٍ الإرسال…",
    sent:            "تم إرسال الطلب!",
    confirm:         "✅ تأكيد الطلب",
    trust1:          "الدفع عند الاستلام — بدون دفع مسبق",
    trust2:          "التوصيل خلال 24-72 ساعة في جميع أنحاء المغرب",
    trust3:          "إرجاع مجاني في حالة عدم الرضا",
    legal:           "بالطلب، تقبل التواصل معك لتأكيد طلبك.",
    stickyTotal:     "المجموع",
    stickyBtn:       "اطلب الآن ←",
    freeShipping:    "🎁 توصيل مجاني",
    distant:         "بعيد",
    deliveryEst:     "موعد التسليم المتوقع:",
    days:            "أيام",
    remoteZone:      "منطقة نائية",
    mostChosen:      "⭐ الأكثر اختياراً",
    economy:         "توفير",
    secureMsg:       "🔒 آمن",
    codMsg:          "🚚 الدفع عند الاستلام",
    officialMsg:     "✅ الموقع الرسمي",
    whatsapp:        "السلام عليكم، أرغب في طلب",
    plusDelivery:    "+ التوصيل",
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

interface OrderFormProps {
  product:       ProductSummary
  offers:        Offer[]
  cities:        City[]
  landingPageId: string
  language?:     string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMAD(centimes: number): string {
  return `${(centimes / 100).toFixed(0)} MAD`
}

function computeUnitPrice(basePrice: number, offers: Offer[], qty: number): number {
  const applicable = offers
    .filter((o) => o.isActive && o.minQuantity <= qty)
    .sort((a, b) => b.minQuantity - a.minQuantity)
  const best = applicable[0]
  if (!best || best.discountPercent === 0) return basePrice
  return Math.round(basePrice * (1 - best.discountPercent / 100))
}

function isFreeShipping(offers: Offer[], qty: number): boolean {
  return offers.some((o) => o.isActive && o.minQuantity <= qty && o.freeShipping)
}

function discountPct(base: number, unit: number): number {
  if (unit >= base) return 0
  return Math.round(((base - unit) / base) * 100)
}

// ─── City selector ────────────────────────────────────────────────────────────

function CitySelector({
  cities, value, onChange, freeShip, error, t,
}: {
  cities:   City[]
  value:    string
  onChange: (id: string) => void
  freeShip: boolean
  error?:   string
  t:        typeof T[Lang]
}) {
  const [search,       setSearch]  = useState("")
  const [open,         setOpen]    = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  const selectedCity = cities.find((c) => c.id === value)

  const filtered = useMemo(() => {
    if (!search.trim()) return cities
    const q = search.toLowerCase()
    return cities.filter(
      (c) => c.nameFr.toLowerCase().includes(q) || c.wilaya.toLowerCase().includes(q),
    )
  }, [search, cities])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function select(city: City) {
    onChange(city.id)
    setOpen(false)
    setSearch("")
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 10) }}
        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-orange-400 ${
          error
            ? "border-red-400 bg-red-50"
            : open
            ? "border-orange-400 bg-white ring-2 ring-orange-200"
            : "border-gray-300 bg-white hover:border-gray-400"
        }`}
      >
        <span className="text-lg leading-none">📍</span>
        <span className={`flex-1 text-sm ${selectedCity ? "text-gray-900 font-medium" : "text-gray-400"}`}>
          {selectedCity ? (
            <span className="flex items-center justify-between">
              <span>{selectedCity.nameFr}</span>
              <span className="text-xs font-semibold text-orange-600">
                {freeShip ? t.freeDelivery : formatMAD(selectedCity.deliveryPrice)}
              </span>
            </span>
          ) : (
            t.cityPlaceholder
          )}
        </span>
        <svg className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl shadow-black/15">
          <div className="border-b border-gray-100 p-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.citySearch}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </div>
          <div className="max-h-56 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">{t.cityNotFound}</p>
            ) : (
              filtered.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => select(city)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-orange-50 ${
                    city.id === value ? "bg-orange-50 font-semibold text-orange-700" : "text-gray-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {city.nameFr}
                    {city.isRemote && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                        {t.distant}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col items-end gap-0.5">
                    <span className={`text-xs font-semibold ${freeShip ? "text-green-600" : "text-orange-600"}`}>
                      {freeShip ? t.freeDelivery : formatMAD(city.deliveryPrice)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {city.deliveryDays}{t.days}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {selectedCity && !open && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500">
          <span>🕐</span>
          {t.deliveryEst} {selectedCity.deliveryDays} {t.days}
          {selectedCity.isRemote && (
            <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
              {t.remoteZone}
            </span>
          )}
        </p>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrderForm({ product, offers, cities, landingPageId, language = "fr" }: OrderFormProps) {
  const router = useRouter()
  const lang   = (language in T ? language : "fr") as Lang
  const t      = T[lang]
  const isRtl  = lang === "darija" || lang === "ar"

  const [qty,           setQty]           = useState(() => {
    const first = offers.filter((o) => o.isActive).sort((a, b) => a.minQuantity - b.minQuantity)[0]
    return first?.minQuantity ?? 1
  })
  const [loading,       setLoading]       = useState(false)
  const [submitted,     setSubmitted]     = useState(false)
  const [phoneDisplay,  setPhoneDisplay]  = useState("")
  const [shaking,       setShaking]       = useState(false)
  const [stickyVisible, setStickyVisible] = useState(false)

  const submitBtnRef = useRef<HTMLButtonElement>(null)
  const formRef      = useRef<HTMLFormElement>(null)

  const activeOffers = useMemo(
    () => offers.filter((o) => o.isActive).sort((a, b) => a.minQuantity - b.minQuantity),
    [offers],
  )

  useEffect(() => {
    if (!submitBtnRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry?.isIntersecting),
      { threshold: 0.5 },
    )
    observer.observe(submitBtnRef.current)
    return () => observer.disconnect()
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormValues>({
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
    const raw       = e.target.value.replace(/\D/g, "").slice(0, 10)
    const formatted = raw
      .replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")
      .replace(/(\d{2})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4")
      .replace(/(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3")
      .replace(/(\d{2})(\d{2})$/, "$1 $2")
    setPhoneDisplay(formatted)
    setValue("phone", raw, { shouldValidate: raw.length === 10 })
  }

  function handleQtyChange(newQty: number) {
    if (newQty < 1 || newQty > 10) return
    setQty(newQty)
    setValue("quantity", newQty)
    firePixelEvent("AddToCart", {
      contentIds:  [product.id],
      contentName: product.titleFr,
      value:       (computeUnitPrice(product.price, offers, newQty) * newQty) / 100,
      currency:    "MAD",
      numItems:    newQty,
    })
  }

  function triggerShake() {
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
  }

  async function onSubmit(values: OrderFormValues) {
    setLoading(true)
    firePixelEvent("InitiateCheckout", { contentIds: [product.id], contentName: product.titleFr, value: total / 100, currency: "MAD", numItems: qty })
    fireTikTokEvent("InitiateCheckout",  { value: total / 100, currency: "MAD" })
    fireGA4Event("begin_checkout",       { value: total / 100, currency: "MAD" })

    const clickIds = getStoredClickIds()
    try {
      const res = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...values,
          quantity:        qty,
          product_id:      product.id,
          landing_page_id: landingPageId,
          ...clickIds,
        }),
      })
      const body = await res.json() as { orderId?: string; orderNumber?: string; error?: string }
      if (!res.ok) {
        toast.error(body.error ?? "Une erreur est survenue.")
        setLoading(false)
        return
      }
      firePixelEvent("Lead", { contentIds: [product.id], contentName: product.titleFr, value: total / 100, currency: "MAD" })
      setSubmitted(true)
      setTimeout(() => router.push(`/merci/${body.orderId}`), 600)
    } catch {
      toast.error("Erreur réseau.")
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100%{ transform:translateX(0) }
          15%    { transform:translateX(-6px) }
          30%    { transform:translateX(6px) }
          45%    { transform:translateX(-4px) }
          60%    { transform:translateX(4px) }
          75%    { transform:translateX(-2px) }
          90%    { transform:translateX(2px) }
        }
        .form-shake { animation: shake 0.45s ease }
        @keyframes pulse-cta {
          0%,100%{ box-shadow: 0 0 0 0 rgba(249,115,22,.45) }
          60%    { box-shadow: 0 0 0 14px rgba(249,115,22,0) }
        }
        .pulse-cta { animation: pulse-cta 2.2s ease infinite }
      `}</style>

      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit, () => triggerShake())}
        className={`space-y-5 ${shaking ? "form-shake" : ""}`}
        dir={isRtl ? "rtl" : "ltr"}
        noValidate
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white px-5 py-4">
          <h2 className="text-xl font-extrabold text-gray-900">{t.orderTitle}</h2>
          <p className="mt-0.5 text-sm text-gray-500">{t.orderSubtitle}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {[t.secureMsg, t.codMsg, t.officialMsg].map((msg) => (
              <span key={msg} className="flex items-center gap-1 text-[11px] font-semibold text-gray-600">
                {msg}
              </span>
            ))}
          </div>
        </div>

        {/* ── Offer cards ─────────────────────────────────────────────────── */}
        {activeOffers.length > 0 && (
          <div>
            <p className="mb-2.5 text-[13px] font-bold text-gray-700">{t.chooseOffer}</p>
            <div className="space-y-2.5">
              {activeOffers.map((offer, idx) => {
                const offerUnit = computeUnitPrice(product.price, offers, offer.minQuantity)
                const pct       = discountPct(product.price, offerUnit)
                const active    = qty === offer.minQuantity
                const isMostPop = idx === Math.min(1, activeOffers.length - 1) && activeOffers.length > 1

                return (
                  <button
                    key={offer.id}
                    type="button"
                    onClick={() => handleQtyChange(offer.minQuantity)}
                    className={`relative w-full rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-150 ${
                      active
                        ? "border-orange-500 bg-orange-50 shadow-md shadow-orange-100"
                        : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm"
                    }`}
                  >
                    {isMostPop && (
                      <span className={`absolute -top-2.5 ${isRtl ? "right-4" : "left-4"} rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm`}>
                        {t.mostChosen}
                      </span>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold transition-colors ${
                          active ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700"
                        }`}>
                          x{offer.minQuantity}
                        </div>
                        <div>
                          <p className={`text-sm font-bold leading-tight ${active ? "text-orange-900" : "text-gray-900"}`}>
                            {offer.labelFr}
                          </p>
                          {offer.freeShipping && (
                            <p className="text-[11px] font-semibold text-green-600">{t.freeShipping}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pct > 0 && (
                          <span className="rounded-lg bg-red-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                            -{pct}%
                          </span>
                        )}
                        <div className="text-right">
                          <p className={`text-base font-extrabold tabular-nums ${active ? "text-orange-600" : "text-gray-800"}`}>
                            {formatMAD(offerUnit * offer.minQuantity)}
                          </p>
                          {pct > 0 && (
                            <p className="text-[10px] text-gray-400 line-through tabular-nums">
                              {formatMAD(product.price * offer.minQuantity)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {active && (
                      <div className={`absolute ${isRtl ? "left-3" : "right-3"} top-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm`}>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Simple stepper when no offers */}
        {activeOffers.length === 0 && (
          <div>
            <p className="mb-2 text-[13px] font-bold text-gray-700">{t.quantity}</p>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => handleQtyChange(qty - 1)} disabled={qty <= 1}
                className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-gray-200 text-xl font-bold text-gray-700 hover:border-orange-400 hover:text-orange-600 disabled:opacity-30">
                −
              </button>
              <span className="w-10 text-center text-xl font-bold tabular-nums text-gray-900">{qty}</span>
              <button type="button" onClick={() => handleQtyChange(qty + 1)} disabled={qty >= 10}
                className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-gray-200 text-xl font-bold text-gray-700 hover:border-orange-400 hover:text-orange-600 disabled:opacity-30">
                +
              </button>
              <span className="text-sm text-gray-500 tabular-nums">{formatMAD(unitPrice * qty)}</span>
            </div>
          </div>
        )}

        {/* ── Name ────────────────────────────────────────────────────────── */}
        <div>
          <label htmlFor="customer_name" className="mb-1.5 block text-[13px] font-bold text-gray-700">
            {t.fullName} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">👤</span>
            <input
              id="customer_name"
              type="text"
              autoComplete="name"
              placeholder={t.namePlaceholder}
              {...register("customer_name")}
              className={`w-full rounded-xl border py-3.5 pl-11 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-400 ${
                errors.customer_name
                  ? "border-red-400 bg-red-50 focus:ring-red-300"
                  : "border-gray-300 bg-white hover:border-gray-400 focus:border-orange-400"
              }`}
            />
          </div>
          {errors.customer_name && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600">
              <span>⚠</span> {errors.customer_name.message}
            </p>
          )}
        </div>

        {/* ── Phone ───────────────────────────────────────────────────────── */}
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-[13px] font-bold text-gray-700">
            {t.phone} <span className="text-red-500">*</span>
          </label>
          <div
            className="relative flex overflow-hidden rounded-xl border transition-all focus-within:ring-2 focus-within:ring-orange-400"
            style={{ borderColor: errors.phone ? "#f87171" : "#d1d5db" }}
          >
            <div className="flex shrink-0 items-center gap-1.5 border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-500">
              <span className="text-base">📱</span>
              <span>+212</span>
            </div>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="06 XX XX XX XX"
              value={phoneDisplay}
              onChange={handlePhoneChange}
              className={`flex-1 py-3.5 pl-3 pr-4 text-sm outline-none ${errors.phone ? "bg-red-50" : "bg-white"}`}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600">
              <span>⚠</span> {errors.phone.message}
            </p>
          )}
        </div>

        {/* ── City ────────────────────────────────────────────────────────── */}
        <div>
          <label className="mb-1.5 block text-[13px] font-bold text-gray-700">
            {t.city} <span className="text-red-500">*</span>
          </label>
          <CitySelector
            cities={cities}
            value={cityId ?? ""}
            freeShip={freeShip}
            error={errors.city_id?.message}
            t={t}
            onChange={(id) => setValue("city_id", id, { shouldValidate: true })}
          />
          {errors.city_id && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600">
              <span>⚠</span> {errors.city_id.message}
            </p>
          )}
        </div>

        {/* ── Address ─────────────────────────────────────────────────────── */}
        <div>
          <label htmlFor="address" className="mb-1.5 block text-[13px] font-bold text-gray-700">
            {t.address} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-3.5 text-lg">📍</span>
            <textarea
              id="address"
              rows={2}
              placeholder={t.addrPlaceholder}
              {...register("address")}
              className={`w-full resize-none rounded-xl border py-3 pl-11 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-400 ${
                errors.address
                  ? "border-red-400 bg-red-50 focus:ring-red-300"
                  : "border-gray-300 bg-white hover:border-gray-400 focus:border-orange-400"
              }`}
            />
          </div>
          {errors.address && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600">
              <span>⚠</span> {errors.address.message}
            </p>
          )}
        </div>

        {/* ── Price summary ────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 space-y-2.5">
          {savings > 0 && (
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-green-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                {t.economy}
              </span>
              <span className="text-[12px] font-bold text-green-700">
                {t.savings} {formatMAD(savings)} !
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{t.productLine} × {qty}</span>
            <span className="font-semibold text-gray-800 tabular-nums">{formatMAD(unitPrice * qty)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{t.delivery}</span>
            <span className={`font-semibold tabular-nums ${freeShip ? "text-green-600" : "text-gray-800"}`}>
              {freeShip
                ? t.freeDelivery
                : selectedCity
                ? formatMAD(deliveryFee)
                : <span className="text-gray-400">{t.plusDelivery}</span>
              }
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-orange-200 pt-2.5">
            <span className="text-base font-extrabold text-gray-900">{t.total}</span>
            <span className="text-xl font-extrabold tabular-nums text-orange-600">
              {selectedCity
                ? formatMAD(total)
                : `${formatMAD(unitPrice * qty)} ${t.plusDelivery}`
              }
            </span>
          </div>
        </div>

        {/* ── Submit ──────────────────────────────────────────────────────── */}
        <button
          ref={submitBtnRef}
          type="submit"
          disabled={loading || submitted}
          className={`relative flex w-full items-center justify-center overflow-hidden rounded-2xl py-4 text-center text-lg font-extrabold text-white shadow-lg transition-all disabled:opacity-80 ${
            submitted
              ? "bg-green-500"
              : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800"
          } ${!loading && !submitted ? "pulse-cta" : ""}`}
          style={{ minHeight: 56 }}
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
            t.confirm
          )}
        </button>

        {/* ── Trust footer ────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          {[t.trust1, t.trust2, t.trust3].map((text) => (
            <p key={text} className="flex items-start gap-2 text-[11px] text-gray-500">
              <span className="shrink-0 leading-tight">•</span>
              <span>{text}</span>
            </p>
          ))}
        </div>

        <p className="text-center text-[10px] text-gray-400">{t.legal}</p>

        {/* ── WhatsApp float ───────────────────────────────────────────────── */}
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""}?text=${encodeURIComponent(t.whatsapp + " " + product.titleFr)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="fixed bottom-20 left-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-xl transition hover:bg-green-600 active:bg-green-700 md:bottom-6"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </form>

      {/* ── Sticky mobile CTA ─────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-all duration-300 ${
          stickyVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="border-t border-orange-200 bg-white px-4 pb-4 pt-3 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-gray-400 leading-none">{t.stickyTotal}</p>
              <p className="text-lg font-extrabold tabular-nums text-gray-900 leading-tight">
                {selectedCity ? formatMAD(total) : formatMAD(unitPrice * qty)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                setTimeout(() => submitBtnRef.current?.click(), 600)
              }}
              className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3.5 text-center text-sm font-extrabold text-white shadow-md shadow-orange-300 active:from-orange-700 active:to-orange-800"
            >
              {t.stickyBtn}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
