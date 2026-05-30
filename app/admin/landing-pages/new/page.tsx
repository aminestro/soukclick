"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft, Check, Sparkles, Link2, Loader2,
  Wand2, Globe,
} from "lucide-react"
import Link from "next/link"
import { generateSlug } from "@/lib/slug"

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id:          "PROBLEM_SOLUTION",
    label:       "Problème / Solution",
    emoji:       "🎯",
    description: "Présente le problème client, puis ton produit comme solution. Le plus utilisé en COD.",
    sections:    "Hero → Bénéfices → Vidéo → Avis → FAQ → CTA",
    recommended: true,
  },
  {
    id:          "GADGET_DEMO",
    label:       "Gadget Demo",
    emoji:       "⚡",
    description: "Parfait pour les gadgets tech. Montre les caractéristiques et la démo en vidéo.",
    sections:    "Hero → Features → Vidéo → Bénéfices → Avis → FAQ → CTA",
    recommended: false,
  },
  {
    id:          "BEFORE_AFTER",
    label:       "Avant / Après",
    emoji:       "🔄",
    description: "Transformation visuelle. Idéal pour produits beauté, santé, nettoyage.",
    sections:    "Hero → Avant/Après → Bénéfices → Avis → FAQ → CTA",
    recommended: false,
  },
  {
    id:          "BUNDLE",
    label:       "Bundle / Pack",
    emoji:       "📦",
    description: "Met en valeur un pack de produits ou une offre multi-unités.",
    sections:    "Hero → Features → Bénéfices → Avis → FAQ → CTA",
    recommended: false,
  },
  {
    id:          "VIRAL",
    label:       "Viral Social",
    emoji:       "🔥",
    description: "Optimisé pour le trafic TikTok/Instagram. Vidéo en avant, ambiance virale.",
    sections:    "Hero → Vidéo → Bénéfices → Avis → FAQ → CTA",
    recommended: false,
  },
] as const

type TemplateId = (typeof TEMPLATES)[number]["id"]
type Language   = "fr" | "darija" | "ar"

const LANG_OPTIONS: Array<{ value: Language; flag: string; label: string; sublabel: string }> = [
  { value: "fr",     flag: "🇫🇷", label: "Français",  sublabel: "Marché francophone"     },
  { value: "darija", flag: "🇲🇦", label: "Darija",    sublabel: "دارجة مغربية"            },
  { value: "ar",     flag: "🇸🇦", label: "Arabe",     sublabel: "عربية فصحى"              },
]

// Generation steps shown in the loading UI
const GEN_STEPS = [
  "Analyse du produit…",
  "Génération Hero + CTA…",
  "Génération Bénéfices…",
  "Génération Features…",
  "Génération FAQ…",
  "Génération Avis clients…",
  "Construction des sections…",
  "Landing page prête !",
]

interface ProductOption {
  id:      string
  slug:    string
  titleFr: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewLandingPage() {
  const router = useRouter()

  const [products,    setProducts]    = useState<ProductOption[]>([])
  const [productId,   setProductId]   = useState("")
  const [template,    setTemplate]    = useState<TemplateId>("PROBLEM_SOLUTION")
  const [language,    setLanguage]    = useState<Language>("fr")
  const [slug,        setSlug]        = useState("")
  const [slugEdited,  setSlugEdited]  = useState(false)
  const [useAI,       setUseAI]       = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [genStep,     setGenStep]     = useState(-1)  // -1 = not started
  const [errors,      setErrors]      = useState<Record<string, string>>({})

  // Load active products
  useEffect(() => {
    fetch("/api/admin/products?pageSize=100&status=ACTIVE")
      .then((r) => r.json())
      .then((d: { products: ProductOption[] }) => setProducts(d.products ?? []))
  }, [])

  // Auto-slug from product
  useEffect(() => {
    if (!slugEdited && productId) {
      const p = products.find((x) => x.id === productId)
      if (p) setSlug(p.slug)
    }
  }, [productId, products, slugEdited])

  // Animate generation steps
  useEffect(() => {
    if (!saving || !useAI) return
    setGenStep(0)
    let step = 0
    const interval = setInterval(() => {
      step++
      if (step < GEN_STEPS.length - 1) {
        setGenStep(step)
      } else {
        clearInterval(interval)
      }
    }, 900)
    return () => clearInterval(interval)
  }, [saving, useAI])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!productId)   e.productId = "Sélectionnez un produit"
    if (!slug.trim()) e.slug      = "Slug requis"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)

    try {
      let sections: object[] | undefined
      let aiReviews: object[] | undefined

      // ── Step A: AI content generation ────────────────────────────────────────
      if (useAI) {
        const aiRes  = await fetch("/api/admin/ai/generate-landing-content", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ productId, template, language }),
        })
        const aiBody = await aiRes.json() as { sections?: object[]; reviews?: object[]; error?: string }

        if (!aiRes.ok) {
          toast.error(aiBody.error ?? "Erreur génération AI")
          setSaving(false)
          setGenStep(-1)
          return
        }

        sections  = aiBody.sections
        aiReviews = aiBody.reviews
        setGenStep(GEN_STEPS.length - 1)
      }

      // ── Step B: Create landing page ───────────────────────────────────────────
      const lpRes  = await fetch("/api/admin/landing-pages", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          productId,
          template,
          language,
          slug:      slug.trim(),
          sections,  // if undefined, API uses template defaults
        }),
      })
      const lpBody = await lpRes.json() as { id?: string; error?: string }

      if (!lpRes.ok) {
        toast.error(lpBody.error ?? "Erreur création")
        setSaving(false)
        setGenStep(-1)
        return
      }

      // ── Step C: Import AI-generated reviews as product reviews ────────────────
      if (aiReviews?.length && lpBody.id) {
        await fetch(`/api/admin/landing-pages/${lpBody.id}/import-reviews`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ reviews: aiReviews, productId }),
        }).catch(() => { /* best-effort */ })
      }

      toast.success("Landing page créée — ouverture du builder…")
      router.push(`/admin/landing-pages/${lpBody.id}/builder`)
    } catch {
      toast.error("Erreur réseau")
      setSaving(false)
      setGenStep(-1)
    }
  }

  // ─── Loading screen ──────────────────────────────────────────────────────────

  if (saving && useAI) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-sm space-y-6 text-center">
          {/* Spinner */}
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-orange-500" />
            <Sparkles className="absolute inset-0 m-auto h-7 w-7 text-orange-500" />
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-gray-900">
              Génération du contenu en cours…
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              L&apos;IA crée une landing page complète pour vous
            </p>
          </div>

          {/* Step list */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-left space-y-2.5">
            {GEN_STEPS.map((step, i) => {
              const done    = genStep > i
              const current = genStep === i
              return (
                <div key={i} className={`flex items-center gap-3 transition-opacity ${
                  i > genStep + 1 ? "opacity-30" : "opacity-100"
                }`}>
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                    done    ? "bg-green-500 text-white" :
                    current ? "bg-orange-500 text-white" :
                              "bg-gray-100 text-gray-400"
                  }`}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span className={`text-sm ${
                    current ? "font-semibold text-gray-900" :
                    done    ? "text-gray-400 line-through" :
                              "text-gray-500"
                  }`}>
                    {step}
                  </span>
                  {current && (
                    <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-orange-400 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-xs text-gray-400">Cela prend environ 15-25 secondes</p>
        </div>
      </div>
    )
  }

  // ─── Form ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/admin/landing-pages" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Landing Pages
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-900">Nouvelle</span>
      </div>

      {/* AI URL shortcut */}
      <Link
        href="/admin/ai-tools/url-generator"
        className="group flex items-center gap-4 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/60 p-4 hover:border-orange-400 hover:bg-orange-50 transition-all"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 shadow-sm">
          <Link2 className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-extrabold text-orange-700 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Vous avez une URL produit ?
          </p>
          <p className="text-xs text-orange-600 mt-0.5">
            Générer automatiquement la fiche + landing page depuis AliExpress, Alibaba, Amazon…
          </p>
        </div>
        <span className="text-xs font-bold text-orange-500 group-hover:text-orange-600 whitespace-nowrap">
          Générer →
        </span>
      </Link>

      <h1 className="text-xl font-extrabold text-gray-900">Créer une landing page</h1>

      <form onSubmit={submit} className="space-y-5">

        {/* Step 1 — Product */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">1. Choisir le produit</h2>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-orange-400"
          >
            <option value="">— Sélectionnez un produit —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.titleFr}</option>
            ))}
          </select>
          {errors.productId && <p className="mt-1 text-xs text-red-600">{errors.productId}</p>}
        </div>

        {/* Step 2 — Template */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">2. Choisir le template</h2>
          <div className="space-y-3">
            {TEMPLATES.map((tmpl) => {
              const selected = template === tmpl.id
              return (
                <label
                  key={tmpl.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${
                    selected ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={tmpl.id}
                    checked={selected}
                    onChange={() => setTemplate(tmpl.id)}
                    className="mt-0.5 accent-orange-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{tmpl.emoji}</span>
                      <span className="font-bold text-gray-900 text-sm">{tmpl.label}</span>
                      {tmpl.recommended && (
                        <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-bold text-white">
                          RECOMMANDÉ
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{tmpl.description}</p>
                    <p className="mt-1.5 text-[10px] font-mono text-gray-400">{tmpl.sections}</p>
                  </div>
                  {selected && <Check className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />}
                </label>
              )
            })}
          </div>
        </div>

        {/* Step 2.5 — Language */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-gray-400" />
            <h2 className="font-bold text-gray-900">2.5 Langue de la landing page</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLanguage(opt.value)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-4 px-3 text-center transition ${
                  language === opt.value
                    ? "border-orange-400 bg-orange-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className="text-2xl">{opt.flag}</span>
                <span className={`text-sm font-bold ${
                  language === opt.value ? "text-orange-700" : "text-gray-700"
                }`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-gray-400">{opt.sublabel}</span>
                {language === opt.value && (
                  <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3 — AI Generation toggle */}
        <div className={`rounded-2xl border-2 p-5 shadow-sm transition ${
          useAI ? "border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50" : "border-gray-200 bg-white"
        }`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
              useAI ? "bg-orange-500 shadow-sm" : "bg-gray-100"
            }`}>
              <Wand2 className={`h-5 w-5 ${useAI ? "text-white" : "text-gray-400"}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`font-bold text-sm ${useAI ? "text-orange-800" : "text-gray-900"}`}>
                    3. ✨ Générer le contenu avec AI
                  </h2>
                  <p className={`text-xs mt-0.5 ${useAI ? "text-orange-600" : "text-gray-500"}`}>
                    {useAI
                      ? `L'IA remplit toutes les sections en ${LANG_OPTIONS.find((l) => l.value === language)?.label ?? "Français"} — prêt à publier`
                      : "Les sections auront du contenu générique à modifier manuellement"
                    }
                  </p>
                </div>

                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => setUseAI(!useAI)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    useAI ? "bg-orange-500" : "bg-gray-200"
                  }`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    useAI ? "translate-x-5" : "translate-x-0.5"
                  }`} />
                </button>
              </div>

              {useAI && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["Hero & CTA", "Bénéfices", "Features", "FAQ (5 Q&A)", "3 Avis clients"].map((tag) => (
                    <span key={tag} className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-semibold text-orange-700">
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 4 — Slug */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">4. URL de la landing page</h2>
          <div className="flex items-center">
            <span className="rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-400 whitespace-nowrap">
              soukclick.store/
            </span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugEdited(true)
                setSlug(generateSlug(e.target.value))
              }}
              className="flex-1 rounded-r-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              placeholder="mon-produit"
            />
          </div>
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
          <p className="mt-1.5 text-xs text-gray-400">Auto-généré depuis le produit. Vous pouvez le modifier.</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-4 text-sm font-bold text-white shadow hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 transition"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {useAI ? "Génération en cours…" : "Création en cours…"}
            </span>
          ) : (
            useAI
              ? "✨ Générer avec AI & Ouvrir le Builder →"
              : "Créer et ouvrir le Builder →"
          )}
        </button>
      </form>
    </div>
  )
}
