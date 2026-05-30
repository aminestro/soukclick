"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ImageUpload }  from "@/components/admin/ImageUpload"
import { PriceInput }   from "@/components/admin/products/PriceInput"
import { generateSlug } from "@/lib/slug"
import { calcMargin, marginColor, fromCentimes, toCentimes } from "@/lib/format"
import type { Offer, Review, LandingPage } from "@prisma/client"

// ─── Zod schema ───────────────────────────────────────────────────────────────

const productSchema = z.object({
  titleFr:        z.string().min(1, "Titre requis"),
  titleAr:        z.string().optional(),
  slug:           z.string().min(1, "Slug requis").max(60),
  descriptionFr:  z.string().optional(),
  descriptionAr:  z.string().optional(),
  price:          z.number().int().min(0, "Prix requis"),
  costPrice:      z.number().int().min(0).default(0),
  comparePrice:   z.number().int().min(0).nullable().optional(),
  stock:          z.number().int().min(0).default(0),
  lowStockAlert:  z.number().int().min(0).default(10),
  status:         z.enum(["DRAFT","ACTIVE","PAUSED","ARCHIVED"]),
  testingStatus:  z.enum(["TESTING","WINNER","SCALING","STOPPED"]),
  images:         z.array(z.string().url()).max(8).default([]),
  supplierUrl:    z.string().url().or(z.literal("")).optional(),
  alibabaUrl:     z.string().url().or(z.literal("")).optional(),
  url1688:        z.string().url().or(z.literal("")).optional(),
  buyingPrice:    z.number().int().min(0).optional(),
})

export type ProductFormValues = z.infer<typeof productSchema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductFormProps {
  productId?:   string
  defaultValues?: Partial<ProductFormValues>
  // Edit-only relations
  landingPages?: (LandingPage & { _count: { orders: number } })[]
  offers?:       Offer[]
  reviews?:      Review[]
}

const TABS_NEW  = ["Informations","Prix","Description","Images","Fournisseur"] as const
const TABS_EDIT = [...TABS_NEW, "Landing Pages","Offres","Avis","📢 Publicités"] as const

// ─── Offer manager (edit-only tab) ───────────────────────────────────────────

function OffersTab({ productId }: { productId: string }) {
  const [offers, setOffers]   = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/products/${productId}`)
      .then((r) => r.json())
      .then((d: { offers: Offer[] }) => { setOffers(d.offers ?? []); setLoading(false) })
  }, [productId])

  async function toggleOffer(id: string, isActive: boolean) {
    await fetch(`/api/admin/offers/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isActive: !isActive }),
    })
    setOffers((prev) => prev.map((o) => o.id === id ? { ...o, isActive: !isActive } : o))
  }

  async function deleteOffer(id: string) {
    await fetch(`/api/admin/offers/${id}`, { method: "DELETE" })
    setOffers((prev) => prev.filter((o) => o.id !== id))
    toast.success("Offre supprimée")
  }

  if (loading) return <div className="py-8 text-center text-sm text-gray-400">Chargement…</div>

  return (
    <div className="space-y-3">
      {offers.length === 0 && (
        <p className="text-sm text-gray-400 py-4 text-center">Aucune offre configurée</p>
      )}
      {offers.map((offer) => (
        <div key={offer.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{offer.labelFr}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Min {offer.minQuantity} unité{offer.minQuantity > 1 ? "s" : ""}
              {offer.discountPercent > 0 && ` · -${offer.discountPercent}%`}
              {offer.freeShipping && " · Livraison gratuite"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleOffer(offer.id, offer.isActive)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                offer.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {offer.isActive ? "Actif" : "Inactif"}
            </button>
            <button
              type="button"
              onClick={() => deleteOffer(offer.id)}
              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Reviews tab (edit-only) ──────────────────────────────────────────────────

function ReviewsTab({ productId }: { productId: string }) {
  const [reviews, setReviews]   = useState<Review[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch(`/api/admin/products/${productId}`)
      .then((r) => r.json())
      .then((d: { reviews: Review[] }) => { setReviews(d.reviews ?? []); setLoading(false) })
  }, [productId])

  async function toggleReview(id: string, isActive: boolean) {
    await fetch(`/api/admin/reviews/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isActive: !isActive }),
    })
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, isActive: !isActive } : r))
  }

  if (loading) return <div className="py-8 text-center text-sm text-gray-400">Chargement…</div>

  return (
    <div className="space-y-3">
      {reviews.length === 0 && (
        <p className="text-sm text-gray-400 py-4 text-center">Aucun avis pour ce produit</p>
      )}
      {reviews.map((review) => (
        <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{review.authorName}</p>
              <p className="text-xs text-gray-400">{review.authorCity} · {"⭐".repeat(review.rating)}</p>
              <p className="text-sm text-gray-600 mt-1">{review.content}</p>
            </div>
            <button
              type="button"
              onClick={() => toggleReview(review.id, review.isActive)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                review.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {review.isActive ? "Visible" : "Masqué"}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Ads Copy Tab ────────────────────────────────────────────────────────────

type AdsPlatform = "META" | "TIKTOK" | "INSTAGRAM" | "GOOGLE"
type AdsLanguage = "fr" | "darija" | "ar"

interface AdsCopyResult {
  hooks:          string[]
  primary_texts:  string[]
  headlines:      string[]
  tiktok_script?: { hook: string; body: string; cta: string }
  hashtags:       string[]
}

function CopyCard({
  text,
  label,
  productId,
  platform,
  language,
  type,
}: {
  text:      string
  label:     string
  productId: string
  platform:  AdsPlatform
  language:  AdsLanguage
  type:      "HOOK" | "AD_COPY"
}) {
  const [copied,  setCopied]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [saving,  setSaving]  = useState(false)
  const isRtl = language !== "fr"

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function save() {
    setSaving(true)
    const res = await fetch("/api/admin/creatives", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        productId,
        type,
        platform: platform === "INSTAGRAM" ? "META" : platform,
        title:    `${label} — ${platform} — ${language.toUpperCase()}`,
        content:  text,
        tags:     [platform.toLowerCase(), language],
      }),
    })
    if (res.ok) {
      setSaved(true)
      toast.success("Sauvegardé dans Créatifs ✅")
    } else {
      toast.error("Erreur de sauvegarde")
    }
    setSaving(false)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2.5">
      <p dir={isRtl ? "rtl" : "ltr"} className="text-sm text-gray-800 leading-relaxed font-medium">
        {text}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
        >
          {copied ? "✅ Copié" : "📋 Copier"}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || saved}
          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
            saved
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
          } disabled:opacity-60`}
        >
          {saving ? "…" : saved ? "⭐ Sauvegardé" : "⭐ Sauvegarder"}
        </button>
      </div>
    </div>
  )
}

function AdsTab({ productId }: { productId: string }) {
  const [platform,  setPlatform]  = useState<AdsPlatform>("META")
  const [language,  setLanguage]  = useState<AdsLanguage>("fr")
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState<AdsCopyResult | null>(null)

  async function generate() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/ai/ads-copy", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ productId, platform, language }),
      })
      const data = await res.json() as AdsCopyResult & { error?: string }
      if (!res.ok) { toast.error(data.error ?? "Erreur"); return }
      setResult(data)
    } catch { toast.error("Erreur réseau") }
    finally { setLoading(false) }
  }

  const PLATFORMS: AdsPlatform[] = ["META", "TIKTOK", "INSTAGRAM", "GOOGLE"]
  const LANGUAGES: Array<{ id: AdsLanguage; label: string }> = [
    { id: "fr",     label: "Français" },
    { id: "darija", label: "Darija"   },
    { id: "ar",     label: "Arabe"    },
  ]

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        {/* Platform */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">Plateforme</label>
          <div className="flex gap-2 flex-wrap">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                  platform === p
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                {p === "META" ? "🔵 META" : p === "TIKTOK" ? "🎵 TIKTOK" : p === "INSTAGRAM" ? "📸 INSTAGRAM" : "🔍 GOOGLE"}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">Langue</label>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLanguage(l.id)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  language === l.id
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 transition"
        >
          {loading
            ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Génération en cours…</>
            : <>🤖 Générer les Copies</>
          }
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-16 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
          <p className="text-sm font-semibold text-gray-600">GPT-4o génère vos copies publicitaires…</p>
          <p className="text-xs text-gray-400">Optimisé pour le marché marocain COD</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-5">
          {/* Section 1 — Hooks */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
              🎣 Accroches — Hooks ({result.hooks.length})
            </h3>
            <div className="space-y-2.5">
              {result.hooks.map((hook, i) => (
                <CopyCard
                  key={i}
                  text={hook}
                  label={`Hook ${i + 1}`}
                  productId={productId}
                  platform={platform}
                  language={language}
                  type="HOOK"
                />
              ))}
            </div>
          </div>

          {/* Section 2 — Primary Texts */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
              📝 Texte Principal ({result.primary_texts.length} versions)
            </h3>
            <div className="space-y-2.5">
              {result.primary_texts.map((text, i) => (
                <CopyCard
                  key={i}
                  text={text}
                  label={`Primary Text ${i + 1}`}
                  productId={productId}
                  platform={platform}
                  language={language}
                  type="AD_COPY"
                />
              ))}
            </div>
          </div>

          {/* Section 3 — Headlines */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widests text-gray-400">
              💬 Titres — Headlines ({result.headlines.length})
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {result.headlines.map((h, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm font-bold text-gray-900 mb-2">{h}</p>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(h)
                      toast.success("Headline copiée")
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    📋 Copier
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4 — TikTok Script */}
          {result.tiktok_script && (
            <div className="rounded-2xl border border-pink-100 bg-pink-50/40 p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-pink-600">
                  🎵 Script TikTok / UGC
                </h3>
                <button
                  type="button"
                  onClick={async () => {
                    const full = `HOOK:\n${result.tiktok_script!.hook}\n\nSCRIPT:\n${result.tiktok_script!.body}\n\nCTA:\n${result.tiktok_script!.cta}`
                    await navigator.clipboard.writeText(full)
                    toast.success("Script complet copié")
                  }}
                  className="flex items-center gap-1 rounded-lg border border-pink-200 bg-white px-2.5 py-1 text-xs font-semibold text-pink-600 hover:bg-pink-50"
                >
                  📋 Copier tout
                </button>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-pink-200 bg-white p-3">
                  <p className="mb-1 text-xs font-bold text-pink-500 uppercase">🎣 Hook (3 secondes)</p>
                  <p className="text-sm text-gray-800" dir={language !== "fr" ? "rtl" : "ltr"}>{result.tiktok_script.hook}</p>
                </div>
                <div className="rounded-xl border border-pink-200 bg-white p-3">
                  <p className="mb-1 text-xs font-bold text-pink-500 uppercase">📜 Script complet</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap" dir={language !== "fr" ? "rtl" : "ltr"}>{result.tiktok_script.body}</p>
                </div>
                <div className="rounded-xl border border-pink-200 bg-white p-3">
                  <p className="mb-1 text-xs font-bold text-pink-500 uppercase">📢 CTA</p>
                  <p className="text-sm font-bold text-gray-900" dir={language !== "fr" ? "rtl" : "ltr"}>{result.tiktok_script.cta}</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 5 — Hashtags */}
          {result.hashtags?.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  # Hashtags Maroc ({result.hashtags.length})
                </h3>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(result.hashtags.join(" "))
                    toast.success("Hashtags copiés")
                  }}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  📋 Copier tout
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.hashtags.map((tag, i) => (
                  <span
                    key={i}
                    onClick={async () => {
                      await navigator.clipboard.writeText(tag)
                      toast.success(`${tag} copié`)
                    }}
                    className="cursor-pointer rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function ProductForm({ productId, defaultValues, landingPages }: ProductFormProps) {
  const router        = useRouter()
  const isEdit        = !!productId
  const TABS          = isEdit ? TABS_EDIT : TABS_NEW
  const [activeTab, setActiveTab] = useState<string>(TABS[0])
  const [saving, setSaving]       = useState<string | null>(null)
  const [slugEdited, setSlugEdited] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver:      zodResolver(productSchema),
    defaultValues: {
      status:        "DRAFT",
      testingStatus: "TESTING",
      stock:         0,
      lowStockAlert: 10,
      price:         0,
      costPrice:     0,
      images:        [],
      ...defaultValues,
    },
  })

  const titleFr    = watch("titleFr")
  const price      = watch("price")
  const costPrice  = watch("costPrice")
  const images     = watch("images")

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugEdited && titleFr) {
      setValue("slug", generateSlug(titleFr))
    }
  }, [titleFr, slugEdited, setValue])

  const margin    = calcMargin(price, costPrice)
  const marginClr = marginColor(margin)

  // ── Submit ────────────────────────────────────────────────────────────────

  async function submit(data: ProductFormValues, targetStatus?: "DRAFT" | "ACTIVE") {
    const finalData = { ...data, status: targetStatus ?? data.status }
    setSaving(targetStatus ?? "save")

    const method = isEdit ? "PATCH" : "POST"
    const url    = isEdit ? `/api/admin/products/${productId}` : "/api/admin/products"

    const res  = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(finalData),
    })
    const body = await res.json() as { id?: string; error?: string }

    if (!res.ok) {
      toast.error(body.error ?? "Erreur lors de l'enregistrement")
      setSaving(null)
      return
    }

    toast.success(isEdit ? "Produit mis à jour" : "Produit créé")
    if (!isEdit && body.id) {
      router.push(`/admin/products/${body.id}/edit`)
    }
    setSaving(null)
  }

  return (
    <form onSubmit={handleSubmit((data) => submit(data))} className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-0.5 overflow-x-auto rounded-2xl border border-gray-200 bg-gray-100 p-1 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab: Informations ─────────────────────────────────────────────── */}
      {activeTab === "Informations" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          {/* Title FR */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Titre (français) <span className="text-red-500">*</span>
            </label>
            <input
              {...register("titleFr")}
              placeholder="Ex: Montre Connectée Pro Max"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
            {errors.titleFr && <p className="mt-1 text-xs text-red-600">{errors.titleFr.message}</p>}
          </div>

          {/* Title AR */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Titre (arabe)</label>
            <input
              {...register("titleAr")}
              dir="rtl"
              placeholder="عنوان المنتج"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Slug URL</label>
            <div className="flex items-center gap-0">
              <span className="rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400">/</span>
              <input
                {...register("slug")}
                onChange={(e) => {
                  setSlugEdited(true)
                  setValue("slug", generateSlug(e.target.value))
                }}
                className="flex-1 rounded-r-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              />
            </div>
            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
          </div>

          {/* Status + Testing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Statut</label>
              <select {...register("status")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-400">
                <option value="DRAFT">Brouillon</option>
                <option value="ACTIVE">Actif</option>
                <option value="PAUSED">Pausé</option>
                <option value="ARCHIVED">Archivé</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Phase de test</label>
              <select {...register("testingStatus")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-400">
                <option value="TESTING">En test</option>
                <option value="WINNER">Winner</option>
                <option value="SCALING">Scaling</option>
                <option value="STOPPED">Arrêté</option>
              </select>
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Stock</label>
              <input
                type="number"
                min="0"
                {...register("stock", { valueAsNumber: true })}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Alerte stock faible</label>
              <input
                type="number"
                min="0"
                {...register("lowStockAlert", { valueAsNumber: true })}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Prix ─────────────────────────────────────────────────────── */}
      {activeTab === "Prix" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <PriceInput
                label="Prix de vente"
                required
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.price && <p className="text-xs text-red-600">{errors.price.message}</p>}

          <Controller
            name="costPrice"
            control={control}
            render={({ field }) => (
              <PriceInput
                label="Prix de revient (coût)"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            name="comparePrice"
            control={control}
            render={({ field }) => (
              <PriceInput
                label="Prix barré (optionnel)"
                value={field.value ?? 0}
                onChange={(c) => field.onChange(c > 0 ? c : null)}
              />
            )}
          />

          {/* Margin display */}
          {price > 0 && costPrice > 0 && (
            <div className={`rounded-xl p-4 ${
              marginClr === "green"  ? "bg-green-50 border border-green-100" :
              marginClr === "orange" ? "bg-orange-50 border border-orange-100" :
                                       "bg-red-50 border border-red-100"
            }`}>
              <p className={`text-sm font-bold ${
                marginClr === "green" ? "text-green-700" :
                marginClr === "orange" ? "text-orange-700" : "text-red-700"
              }`}>
                Marge brute : {margin.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Bénéfice par unité : {fromCentimes(price - costPrice).toFixed(0)} MAD
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Description ──────────────────────────────────────────────── */}
      {activeTab === "Description" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Description (français)</label>
            <textarea
              {...register("descriptionFr")}
              rows={8}
              placeholder="Décrivez votre produit en détail…"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 resize-y"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Description (arabe)</label>
            <textarea
              {...register("descriptionAr")}
              dir="rtl"
              rows={8}
              placeholder="وصف المنتج…"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 resize-y"
            />
          </div>
        </div>
      )}

      {/* ── Tab: Images ───────────────────────────────────────────────────── */}
      {activeTab === "Images" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <Controller
            name="images"
            control={control}
            render={({ field }) => (
              <ImageUpload
                value={field.value}
                onChange={field.onChange}
                folder="products"
                maxFiles={8}
              />
            )}
          />
        </div>
      )}

      {/* ── Tab: Fournisseur ──────────────────────────────────────────────── */}
      {activeTab === "Fournisseur" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          {[
            { name: "supplierUrl" as const, label: "Lien AliExpress", placeholder: "https://aliexpress.com/…" },
            { name: "alibabaUrl"  as const, label: "Lien Alibaba",    placeholder: "https://alibaba.com/…"   },
            { name: "url1688"     as const, label: "Lien 1688",       placeholder: "https://1688.com/…"      },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
              <input
                {...register(name)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400"
              />
            </div>
          ))}
          <Controller
            name="buyingPrice"
            control={control}
            render={({ field }) => (
              <PriceInput
                label="Prix d'achat fournisseur"
                value={field.value ?? 0}
                onChange={(c) => field.onChange(c > 0 ? c : undefined)}
              />
            )}
          />
        </div>
      )}

      {/* ── Edit-only tabs ─────────────────────────────────────────────────── */}
      {isEdit && activeTab === "Landing Pages" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          {(landingPages ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Aucune landing page créée</p>
          ) : (
            (landingPages ?? []).map((lp) => (
              <div key={lp.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                <div>
                  <p className="font-semibold text-sm text-gray-900">/{lp.slug}</p>
                  <p className="text-xs text-gray-400">{lp.template} · {lp._count.orders} commande{lp._count.orders !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  {lp.isActive && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">Active</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isEdit && activeTab === "Offres" && productId && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <OffersTab productId={productId} />
        </div>
      )}

      {isEdit && activeTab === "Avis" && productId && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <ReviewsTab productId={productId} />
        </div>
      )}

      {isEdit && activeTab === "📢 Publicités" && productId && (
        <AdsTab productId={productId} />
      )}

      {/* ── Save buttons (visible on all tabs except edit-only) ─────────────── */}
      {!["Landing Pages","Offres","Avis","📢 Publicités"].includes(activeTab) && (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={handleSubmit((d) => submit(d, "DRAFT"))}
            disabled={!!saving}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {saving === "DRAFT" ? "Enregistrement…" : "Enregistrer comme brouillon"}
          </button>
          <button
            type="button"
            onClick={handleSubmit((d) => submit(d, "ACTIVE"))}
            disabled={!!saving}
            className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {saving === "ACTIVE" ? "Publication…" : "Publier"}
          </button>
        </div>
      )}
    </form>
  )
}
