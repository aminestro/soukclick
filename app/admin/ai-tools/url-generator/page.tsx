"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Link2, Loader2, Sparkles, Check, RefreshCw,
  ChevronRight, ImageIcon, Pencil, Plus, X, ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { fromCentimes } from "@/lib/format"

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "url" | "loading" | "review"

interface LoadingStep {
  id:      string
  label:   string
  done:    boolean
  active:  boolean
}

interface ProductDraft {
  titleFr:       string
  titleAr:       string
  descriptionFr: string
  price:         number   // centimes
  costPrice:     number   // centimes
  images:        string[]
  status:        string
}

interface LandingPageDraft {
  sections:  unknown[]
  metaTitle: string
  metaDesc:  string
  template:  string
}

interface RawData {
  benefits:          Array<{ fr: string; ar: string }>
  features:          Array<{ title: string; description: string }>
  faq:               Array<{ question: string; answer: string }>
  descriptionDarija: string
  heroHeadline:      string
  heroSubheadline:   string
  ctaText:           string
  trustBadges:       string[]
}

interface GenerationResult {
  product:     ProductDraft
  landingPage: LandingPageDraft
  raw:         RawData
  sourceUrl:   string
  scrapeInfo:  { title: string | null; imageCount: number; r2Count: number; hasScreenshot: boolean }
}

const TEMPLATES = [
  { id: "PROBLEM_SOLUTION", label: "Problème / Solution", emoji: "🎯" },
  { id: "GADGET_DEMO",      label: "Gadget Demo",         emoji: "⚡" },
  { id: "BEFORE_AFTER",     label: "Avant / Après",       emoji: "🔄" },
  { id: "BUNDLE",           label: "Bundle / Pack",       emoji: "📦" },
  { id: "VIRAL",            label: "Viral",               emoji: "🔥" },
]

// ─── Loading steps display ────────────────────────────────────────────────────

const LOADING_STEPS: Array<{ id: string; label: string }> = [
  { id: "scrape",  label: "Scraping de la page produit…" },
  { id: "analyze", label: "Analyse IA avec GPT-4o…"      },
  { id: "images",  label: "Téléchargement des images…"   },
  { id: "build",   label: "Construction de la landing page…" },
]

function LoadingState({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-4 border-orange-100 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        </div>
        <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-yellow-400 animate-pulse" />
      </div>

      <div className="text-center">
        <h2 className="text-lg font-extrabold text-gray-900">Génération en cours</h2>
        <p className="text-sm text-gray-400 mt-1">Cela peut prendre 20-40 secondes…</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {LOADING_STEPS.map((s, i) => {
          const isDone   = i < currentStep
          const isActive = i === currentStep
          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                isDone   ? "bg-green-50 border border-green-100"
                : isActive ? "bg-orange-50 border border-orange-200"
                : "bg-gray-50 border border-gray-100"
              }`}
            >
              {isDone ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              ) : isActive ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-orange-500" />
              ) : (
                <div className="h-5 w-5 shrink-0 rounded-full border-2 border-gray-200" />
              )}
              <span className={`text-sm font-semibold ${
                isDone ? "text-green-700" : isActive ? "text-orange-700" : "text-gray-400"
              }`}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Editable text field ──────────────────────────────────────────────────────

function EditableField({
  label, value, onChange, textarea = false, dir = "ltr", hint,
}: {
  label:     string
  value:     string
  onChange:  (v: string) => void
  textarea?: boolean
  dir?:      "ltr" | "rtl"
  hint?:     string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {hint && <p className="mb-1 text-xs text-gray-400">{hint}</p>}
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={dir}
          rows={4}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={dir}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
        />
      )}
    </div>
  )
}

// ─── Review step ─────────────────────────────────────────────────────────────

function ReviewStep({
  result,
  onUpdate,
  onRestart,
}: {
  result:   GenerationResult
  onUpdate: (r: GenerationResult) => void
  onRestart:() => void
}) {
  const router   = useRouter()
  const [saving, setSaving] = useState(false)

  const p = result.product
  const l = result.landingPage
  const r = result.raw

  function setProduct(patch: Partial<ProductDraft>) {
    onUpdate({ ...result, product: { ...p, ...patch } })
  }
  function setLanding(patch: Partial<LandingPageDraft>) {
    onUpdate({ ...result, landingPage: { ...l, ...patch } })
  }
  function setRaw(patch: Partial<RawData>) {
    onUpdate({ ...result, raw: { ...r, ...patch } })
  }

  const margin = p.price > 0
    ? Math.round(((p.price - p.costPrice) / p.price) * 100)
    : 0

  function updateBenefit(i: number, fr: string) {
    const benefits = [...r.benefits]
    benefits[i] = { ...benefits[i], fr }
    setRaw({ benefits })
  }
  function removeBenefit(i: number) {
    setRaw({ benefits: r.benefits.filter((_, j) => j !== i) })
  }
  function addBenefit() {
    setRaw({ benefits: [...r.benefits, { fr: "Nouveau bénéfice", ar: "" }] })
  }

  function updateFaq(i: number, field: "question" | "answer", val: string) {
    const faq = [...r.faq]
    faq[i] = { ...faq[i], [field]: val }
    setRaw({ faq })
  }

  async function handleCreate() {
    setSaving(true)
    try {
      // 1. Create product
      const productRes = await fetch("/api/admin/products", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          titleFr:       p.titleFr,
          titleAr:       p.titleAr || null,
          descriptionFr: p.descriptionFr || null,
          price:         p.price,
          costPrice:     p.costPrice,
          images:        p.images,
          status:        "DRAFT",
          supplierUrl:   result.sourceUrl,
        }),
      })

      if (!productRes.ok) {
        const err = await productRes.json() as { error?: string }
        toast.error(err.error ?? "Erreur création produit")
        return
      }

      const product = await productRes.json() as { id: string; slug: string }

      // Rebuild sections with updated raw data
      const updatedSections = rebuildSections(r, p.images, l.sections as unknown[])

      // 2. Create landing page
      const lpRes = await fetch("/api/admin/landing-pages", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          productId:    product.id,
          template:     l.template,
          sections:     updatedSections,
          metaTitle:    l.metaTitle || null,
          metaDesc:     l.metaDesc || null,
          isActive:     false,
        }),
      })

      if (!lpRes.ok) {
        toast.error("Produit créé mais erreur landing page")
        router.push(`/admin/products/${product.id}/edit`)
        return
      }

      const lp = await lpRes.json() as { id: string }
      toast.success("Produit + Landing Page créés !")
      router.push(`/admin/landing-pages/${lp.id}/builder`)
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setSaving(false)
    }
  }

  // Rebuild sections with latest edits
  function rebuildSections(raw: RawData, images: string[], original: unknown[]): unknown[] {
    return (original as Array<{ type: string; data: unknown; enabled: boolean; order: number }>).map((s) => {
      if (s.type === "hero") {
        return {
          ...s,
          data: {
            ...(s.data as Record<string, unknown>),
            headline:    raw.heroHeadline,
            subheadline: raw.heroSubheadline,
            image_url:   images[0] ?? null,
            cta_text:    raw.ctaText,
          },
        }
      }
      if (s.type === "benefits") {
        return {
          ...s,
          data: {
            title: "Pourquoi choisir ce produit ?",
            items: raw.benefits.map((b) => ({
              icon:        "✅",
              title:       b.fr.split(" ").slice(0, 3).join(" "),
              description: b.fr,
            })),
          },
        }
      }
      if (s.type === "faq") {
        return { ...s, data: { title: "Questions fréquentes", items: raw.faq } }
      }
      return s
    })
  }

  return (
    <div className="space-y-6">
      {/* Scrape info banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
        <Check className="h-5 w-5 text-green-500 shrink-0" />
        <div className="flex-1 text-sm text-green-700">
          <span className="font-bold">Analyse complète.</span>
          {" "}{result.scrapeInfo.r2Count} image{result.scrapeInfo.r2Count !== 1 ? "s" : ""} uploadée{result.scrapeInfo.r2Count !== 1 ? "s" : ""} sur R2
          {result.scrapeInfo.hasScreenshot && " · Analyse visuelle incluse"}
        </div>
        <span className="text-xs text-green-500 truncate max-w-[180px]">{result.sourceUrl}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── LEFT: Product Info ──────────────────────────────────── */}
        <div className="space-y-5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-gray-900 uppercase tracking-wide">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-orange-600 text-xs font-bold">1</span>
            Infos produit
          </h2>

          {/* Images grid */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
              Images ({p.images.length}) — Cliquez pour sélectionner la principale
            </p>
            {p.images.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-300">
                <ImageIcon className="h-8 w-8" />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {p.images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      const imgs = [img, ...p.images.filter((_, j) => j !== i)]
                      setProduct({ images: imgs })
                    }}
                    className={`relative cursor-pointer overflow-hidden rounded-xl border-2 transition ${
                      i === 0 ? "border-orange-400 ring-2 ring-orange-200" : "border-gray-100 hover:border-orange-300"
                    }`}
                  >
                    <img src={img} alt="" className="aspect-square w-full object-cover" />
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-orange-500 py-0.5 text-center text-[9px] font-bold text-white">
                        Principale
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Editable product fields */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <EditableField label="Titre FR *"   value={p.titleFr}       onChange={(v) => setProduct({ titleFr: v })} />
            <EditableField label="Titre AR"     value={p.titleAr ?? ""} onChange={(v) => setProduct({ titleAr: v })} dir="rtl" />
            <EditableField label="Description"  value={p.descriptionFr ?? ""} onChange={(v) => setProduct({ descriptionFr: v })} textarea />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Prix de vente (MAD)</label>
                <input
                  type="number" min="0" step="1"
                  value={fromCentimes(p.price).toFixed(0)}
                  onChange={(e) => setProduct({ price: Math.round(parseFloat(e.target.value || "0") * 100) })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Coût estimé (MAD)</label>
                <input
                  type="number" min="0" step="1"
                  value={fromCentimes(p.costPrice).toFixed(0)}
                  onChange={(e) => setProduct({ costPrice: Math.round(parseFloat(e.target.value || "0") * 100) })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Margin pill */}
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              margin >= 50 ? "bg-green-100 text-green-700"
              : margin >= 30 ? "bg-orange-100 text-orange-700"
              : "bg-red-100 text-red-600"
            }`}>
              Marge : {margin}%
              {margin >= 50 ? " ✅ Excellente" : margin >= 30 ? " ⚠️ Correcte" : " ❌ Trop faible"}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Landing Page ─────────────────────────────────── */}
        <div className="space-y-5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-gray-900 uppercase tracking-wide">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-600 text-xs font-bold">2</span>
            Landing Page
          </h2>

          {/* Template selector */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Template</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setLanding({ template: t.id })}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${
                    l.template === t.id
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <span className="text-[10px] font-semibold leading-tight">{t.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Suggestion IA : <span className="font-semibold text-orange-600">{TEMPLATES.find((t) => t.id === l.template)?.label ?? l.template}</span>
            </p>
          </div>

          {/* Hero copy */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Copy Hero</p>
            <EditableField label="Headline *"    value={r.heroHeadline}    onChange={(v) => setRaw({ heroHeadline: v })}    hint="Max 60 chars" />
            <EditableField label="Sous-headline" value={r.heroSubheadline} onChange={(v) => setRaw({ heroSubheadline: v })} hint="Mentionner livraison COD" />
            <EditableField label="Texte CTA"     value={r.ctaText}         onChange={(v) => setRaw({ ctaText: v })} />
          </div>

          {/* Benefits */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Bénéfices ({r.benefits.length})</p>
              <button type="button" onClick={addBenefit} className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-semibold">
                <Plus className="h-3.5 w-3.5" />Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {r.benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-green-500 shrink-0">✓</span>
                  <input
                    value={b.fr}
                    onChange={(e) => updateBenefit(i, e.target.value)}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-orange-400"
                  />
                  <button type="button" onClick={() => removeBenefit(i)} className="text-gray-300 hover:text-red-400 shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">FAQ ({r.faq.length})</p>
            <div className="space-y-3">
              {r.faq.map((f, i) => (
                <div key={i} className="rounded-xl border border-gray-100 p-3 space-y-1.5">
                  <input
                    value={f.question}
                    onChange={(e) => updateFaq(i, "question", e.target.value)}
                    placeholder="Question"
                    className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-orange-400"
                  />
                  <textarea
                    value={f.answer}
                    onChange={(e) => updateFaq(i, "answer", e.target.value)}
                    rows={2}
                    placeholder="Réponse"
                    className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-orange-400 resize-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SEO */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">SEO</p>
            <EditableField label={`Meta Title (${l.metaTitle.length}/60)`}         value={l.metaTitle} onChange={(v) => setLanding({ metaTitle: v })} />
            <EditableField label={`Meta Description (${l.metaDesc.length}/160)`}  value={l.metaDesc}  onChange={(v) => setLanding({ metaDesc: v })} textarea />
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
        <button
          type="button"
          onClick={onRestart}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Recommencer
        </button>

        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !p.titleFr.trim()}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-sm hover:from-orange-600 hover:to-orange-700 disabled:opacity-60"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Création en cours…</>
          ) : (
            <><Sparkles className="h-4 w-4" />Créer le Produit + Landing Page<ChevronRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UrlGeneratorPage() {
  const [step,         setStep]        = useState<Step>("url")
  const [url,          setUrl]         = useState("")
  const [loadingStep,  setLoadingStep] = useState(0)
  const [result,       setResult]      = useState<GenerationResult | null>(null)

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setStep("loading")
    setLoadingStep(0)

    // Simulate step progression while waiting
    const ticker = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, 3))
    }, 6000)

    try {
      const res  = await fetch("/api/admin/ai/url-to-landing", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url }),
      })
      const data = await res.json()

      clearInterval(ticker)

      if (!res.ok) {
        toast.error(data.error ?? "Erreur de génération")
        setStep("url")
        return
      }

      setLoadingStep(4)
      setTimeout(() => {
        setResult(data as GenerationResult)
        setStep("review")
      }, 600)
    } catch {
      clearInterval(ticker)
      toast.error("Erreur réseau")
      setStep("url")
    }
  }, [url])

  function restart() {
    setStep("url")
    setUrl("")
    setResult(null)
    setLoadingStep(0)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/ai-tools" className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 shadow-sm">
            <Link2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-gray-900">URL → Landing Page</h1>
            <p className="text-xs text-gray-400">Copiez une URL produit et laissez l'IA faire le reste</p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      {step !== "loading" && (
        <div className="flex items-center gap-2 text-xs font-semibold">
          {["url","review"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === s ? "bg-orange-500 text-white"
                : (step === "review" && s === "url") ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-400"
              }`}>
                {(step === "review" && s === "url") ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={step === s ? "text-gray-900" : "text-gray-400"}>
                {s === "url" ? "URL" : "Révision"}
              </span>
              {i === 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-300" />}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: URL input */}
      {step === "url" && (
        <form onSubmit={handleGenerate} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-900">URL du produit fournisseur</label>
            <p className="mb-3 text-xs text-gray-400">
              Compatible : AliExpress · Alibaba · 1688 · Amazon · Shopify · n'importe quelle page produit
            </p>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="https://aliexpress.com/item/…"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-orange-400 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={!url.trim()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 whitespace-nowrap"
              >
                <Sparkles className="h-4 w-4" />
                Analyser & Générer
              </button>
            </div>
          </div>

          {/* Examples */}
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Exemples d'URL supportées</p>
            <div className="flex flex-wrap gap-2">
              {[
                "aliexpress.com/item/…",
                "alibaba.com/product/…",
                "1688.com/offer/…",
                "amazon.com/dp/…",
              ].map((ex) => (
                <span key={ex} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">{ex}</span>
              ))}
            </div>
          </div>

          {/* What happens */}
          <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4 space-y-2">
            <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">Ce qui va se passer</p>
            {LOADING_STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-200 text-orange-700 font-bold text-[10px]">{i + 1}</span>
                {s.label}
              </div>
            ))}
          </div>
        </form>
      )}

      {/* Step 2: Loading */}
      {step === "loading" && <LoadingState currentStep={loadingStep} />}

      {/* Step 3: Review */}
      {step === "review" && result && (
        <ReviewStep
          result={result}
          onUpdate={setResult}
          onRestart={restart}
        />
      )}
    </div>
  )
}
