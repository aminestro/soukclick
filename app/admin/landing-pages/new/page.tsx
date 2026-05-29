"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowLeft, Check } from "lucide-react"
import Link from "next/link"
import { generateSlug } from "@/lib/slug"

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  productId: z.string().min(1, "Sélectionnez un produit"),
  template:  z.enum(["PROBLEM_SOLUTION","GADGET_DEMO","BEFORE_AFTER","BUNDLE","VIRAL"]),
  slug:      z.string().min(1, "Slug requis").max(80),
})

type FormValues = z.infer<typeof schema>

// ─── Template cards ───────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

interface ProductOption {
  id:     string
  slug:   string
  titleFr:string
}

export default function NewLandingPage() {
  const router  = useRouter()
  const [products, setProducts] = useState<ProductOption[]>([])
  const [saving,   setSaving]   = useState(false)
  const [slugEdited, setSlugEdited] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver:      zodResolver(schema),
    defaultValues: { template: "PROBLEM_SOLUTION", slug: "" },
  })

  const selectedProductId = watch("productId")
  const selectedTemplate  = watch("template")

  // Load products
  useEffect(() => {
    fetch("/api/admin/products?pageSize=100&status=ACTIVE")
      .then((r) => r.json())
      .then((d: { products: ProductOption[] }) => setProducts(d.products ?? []))
  }, [])

  // Auto-slug from product
  useEffect(() => {
    if (!slugEdited && selectedProductId) {
      const product = products.find((p) => p.id === selectedProductId)
      if (product) setValue("slug", product.slug)
    }
  }, [selectedProductId, products, slugEdited, setValue])

  async function onSubmit(values: FormValues) {
    setSaving(true)
    const res  = await fetch("/api/admin/landing-pages", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(values),
    })
    const body = await res.json() as { id?: string; error?: string }

    if (!res.ok) {
      toast.error(body.error ?? "Erreur")
      setSaving(false)
      return
    }

    toast.success("Landing page créée — ouverture du builder…")
    router.push(`/admin/landing-pages/${body.id}/builder`)
  }

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

      <h1 className="text-xl font-extrabold text-gray-900">Créer une landing page</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1 — Product */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">1. Choisir le produit</h2>
          <select
            {...register("productId")}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-orange-400"
          >
            <option value="">— Sélectionnez un produit —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.titleFr}</option>
            ))}
          </select>
          {errors.productId && <p className="mt-1 text-xs text-red-600">{errors.productId.message}</p>}
        </div>

        {/* Step 2 — Template */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">2. Choisir le template</h2>
          <div className="space-y-3">
            {TEMPLATES.map((tmpl) => {
              const selected = selectedTemplate === tmpl.id
              return (
                <label
                  key={tmpl.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${
                    selected ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    value={tmpl.id}
                    {...register("template")}
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

        {/* Step 3 — Slug */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">3. URL de la landing page</h2>
          <div className="flex items-center gap-0">
            <span className="rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-400">
              soukclick.store/
            </span>
            <input
              {...register("slug")}
              onChange={(e) => {
                setSlugEdited(true)
                setValue("slug", generateSlug(e.target.value))
              }}
              className="flex-1 rounded-r-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              placeholder="mon-produit"
            />
          </div>
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
          <p className="mt-1.5 text-xs text-gray-400">Auto-généré depuis le produit. Vous pouvez le modifier.</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow hover:bg-orange-600 disabled:opacity-60"
        >
          {saving ? "Création en cours…" : "Créer et ouvrir le Builder →"}
        </button>
      </form>
    </div>
  )
}
