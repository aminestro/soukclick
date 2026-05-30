"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import {
  Sparkles, Loader2, Copy, Check, Save,
  Wand2, FileText, Video, Search, HelpCircle, Link2, ChevronRight,
  PackagePlus, ImageIcon,
} from "lucide-react"
import Link from "next/link"
import { AIResultCard } from "@/components/admin/ai/AIResultCard"

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "product" | "copy" | "tiktok" | "seo" | "faq"

interface ProductOption { id: string; titleFr: string; descriptionFr: string | null }

// ─── Shared helpers ────────────────────────────────────────────────────────────

function LoadingOverlay() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
      </div>
      <p className="text-sm font-semibold text-gray-600">GPT-4o génère votre contenu…</p>
      <p className="text-xs text-gray-400">Cela peut prendre 10-20 secondes</p>
    </div>
  )
}

function GenerateButton({ loading, label = "Générer" }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 transition"
    >
      {loading
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : <Sparkles className="h-4 w-4" />
      }
      {loading ? "Génération en cours…" : label}
    </button>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
    >
      {copied ? <><Check className="h-3 w-3 text-green-500" />Copié</> : <><Copy className="h-3 w-3" />Copier</>}
    </button>
  )
}

function Select({ label, value, onChange, options }: {
  label:    string
  value:    string
  onChange: (v: string) => void
  options:  Array<{ value: string; label: string }>
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ─── Tab 1: Product Generator ─────────────────────────────────────────────────

interface ProductResult {
  title:        string
  titleAr:      string
  description:  string
  benefits:     string[]
  features:     string[]
  suggestedPrice: number
  suggestedCost:  number
  faq:          Array<{ question: string; answer: string }>
  metaAdsCopy:  Array<{ headline: string; primaryText: string; description: string }>
  tiktokHooks:  string[]
  imageUrl?:     string | null
  images?:       string[]
}

interface CreatedProduct {
  id:        string
  titleFr:   string
  slug:      string
  price:     number
  costPrice: number
  images:    string[]
}

function ProductGeneratorTab() {
  const [url,      setUrl]      = useState("")
  const [language, setLanguage] = useState("fr")
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<ProductResult | null>(null)
  const [creatingProduct, setCreatingProduct] = useState(false)
  const [savingAssets,    setSavingAssets]    = useState(false)
  const [createdProduct,  setCreatedProduct]  = useState<CreatedProduct | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/ai/product-generator", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url, language }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erreur"); return }
      setResult(data as ProductResult)
      setCreatedProduct(null)
    } catch { toast.error("Erreur réseau") }
    finally { setLoading(false) }
  }

  async function createProduct() {
    if (!result) return
    setCreatingProduct(true)
    try {
      const productImage = result.images?.[0] ?? result.imageUrl ?? null
      const res = await fetch("/api/admin/products", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          titleFr:       result.title,
          titleAr:       result.titleAr,
          descriptionFr: result.description,
          descriptionAr: null,
          price:         Math.round(result.suggestedPrice * 100),
          costPrice:     Math.round(result.suggestedCost * 100),
          images:        productImage ? [productImage] : [],
          stock:         0,
          status:        "DRAFT",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Erreur de création")
        return
      }
      setCreatedProduct(data as CreatedProduct)
      toast.success("Produit créé!")
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setCreatingProduct(false)
    }
  }

  async function saveCreativesAndFaq() {
    if (!result) return
    if (!createdProduct) {
      toast.error("Créez le produit d'abord")
      return
    }

    setSavingAssets(true)
    try {
      await Promise.all(
        result.tiktokHooks.map((hook, index) =>
          fetch("/api/admin/creatives", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
              productId: createdProduct.id,
              type:      "HOOK",
              platform:  "TIKTOK",
              title:     `Hook TikTok ${index + 1} — ${createdProduct.titleFr}`,
              content:   hook,
              tags:      ["ai", "tiktok", "hook"],
            }),
          }),
        ),
      )

      const landingRes = await fetch("/api/admin/landing-pages", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          productId: createdProduct.id,
          template:  "GADGET_DEMO",
          metaTitle: result.title,
          metaDesc:  result.description.slice(0, 320),
        }),
      })
      const landingPage = await landingRes.json()
      if (!landingRes.ok) {
        toast.error(landingPage.error ?? "Créatifs sauvegardés, FAQ non ajoutée")
        return
      }

      const sections = Array.isArray(landingPage.sections) ? landingPage.sections : []
      const faqSection = {
        type:    "faq",
        enabled: true,
        order:   sections.length + 1,
        data: {
          title: "Questions fréquentes",
          items: result.faq.map((item) => ({
            question: item.question,
            answer:   item.answer,
          })),
        },
      }

      const patchedSections = sections.some((section: { type?: string }) => section.type === "faq")
        ? sections.map((section: { type?: string }) => section.type === "faq" ? faqSection : section)
        : [...sections, faqSection]

      const faqRes = await fetch(`/api/admin/landing-pages/${landingPage.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sections: patchedSections }),
      })
      if (!faqRes.ok) {
        toast.error("Créatifs sauvegardés, FAQ non ajoutée")
        return
      }

      toast.success("Créatifs et FAQ sauvegardés")
    } catch {
      toast.error("Erreur de sauvegarde")
    } finally {
      setSavingAssets(false)
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">URL du produit fournisseur</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://aliexpress.com/item/… ou alibaba.com, 1688.com, amazon.com"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
          />
          <p className="mt-1 text-xs text-gray-400">Supporte AliExpress, Alibaba, 1688, Amazon, et plus</p>
        </div>

        <Select label="Langue de génération" value={language} onChange={setLanguage} options={[
          { value: "fr",     label: "Français" },
          { value: "darija", label: "Darija (دارجة)" },
          { value: "ar",     label: "Arabe classique (عربية)" },
        ]} />

        <GenerateButton loading={loading} label="Analyser & Générer la fiche produit" />
      </form>

      {loading && <div className="rounded-2xl border border-gray-200 bg-white shadow-sm"><LoadingOverlay /></div>}

      {result && !loading && (
        <div className="space-y-4">
          {/* Title + pricing */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Titre & Contenu</h3>
              <AIResultCard label="Titre FR" content={result.title} onSave={(v) => setResult((p) => p ? { ...p, title: v } : p)} />
              <AIResultCard label="Titre AR/Darija" content={result.titleAr} dir="rtl" onSave={(v) => setResult((p) => p ? { ...p, titleAr: v } : p)} />
              <AIResultCard label="Description" content={result.description} onSave={(v) => setResult((p) => p ? { ...p, description: v } : p)} />
            </div>
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-green-600">Prix suggérés</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Prix de vente</p>
                  <p className="text-2xl font-extrabold text-green-600">{result.suggestedPrice} MAD</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Coût estimé</p>
                  <p className="text-lg font-bold text-gray-700">{result.suggestedCost} MAD</p>
                </div>
                <div className="border-t border-green-200 pt-2">
                  <p className="text-xs text-gray-500">Marge estimée</p>
                  <p className="text-base font-bold text-green-700">
                    {result.suggestedPrice > 0
                      ? `${Math.round(((result.suggestedPrice - result.suggestedCost) / result.suggestedPrice) * 100)}%`
                      : "—"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits + Features */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Bénéfices ({result.benefits.length})</h3>
              <ul className="space-y-2">
                {result.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-0.5 text-green-500 font-bold">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Caractéristiques ({result.features.length})</h3>
              <ul className="space-y-2">
                {result.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-0.5 text-blue-400 font-bold">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Meta Ads */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Copy Meta Ads (3 versions)</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {result.metaAdsCopy.map((ad, i) => (
                <div key={i} className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600">Version {i + 1}</span>
                    <CopyBtn text={`${ad.headline}\n\n${ad.primaryText}\n\n${ad.description}`} />
                  </div>
                  <p className="text-sm font-bold text-gray-900">{ad.headline}</p>
                  <p className="text-xs text-gray-600">{ad.primaryText}</p>
                  <p className="text-xs text-gray-400 italic">{ad.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* TikTok Hooks */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Hooks TikTok (Darija)</h3>
            <div className="space-y-2">
              {result.tiktokHooks.map((hook, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-pink-100 bg-pink-50/40 px-4 py-2.5">
                  <span className="text-xs font-bold text-pink-500 shrink-0">Hook {i + 1}</span>
                  <p className="flex-1 text-sm text-gray-800" dir="rtl">{hook}</p>
                  <CopyBtn text={hook} />
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">FAQ ({result.faq.length} questions)</h3>
            <div className="space-y-3">
              {result.faq.map((item, i) => (
                <div key={i} className="rounded-xl border border-gray-100 p-3">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{item.question}</p>
                  <p className="text-sm text-gray-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Create product */}
          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-orange-500">Création produit</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[140px_1fr]">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                {result.images?.[0] || result.imageUrl ? (
                  <img
                    src={result.images?.[0] ?? result.imageUrl ?? ""}
                    alt={result.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-center text-xs font-semibold">Aucune image</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Produit généré</p>
                  <p className="mt-1 text-lg font-extrabold text-gray-900">{result.title}</p>
                  {result.titleAr && <p className="mt-0.5 text-sm text-gray-500" dir="rtl">{result.titleAr}</p>}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-green-50 p-3">
                    <p className="text-xs text-gray-500">Prix suggéré</p>
                    <p className="text-lg font-extrabold text-green-600">{result.suggestedPrice} MAD</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Coût estimé</p>
                    <p className="text-lg font-extrabold text-gray-700">{result.suggestedCost} MAD</p>
                  </div>
                  <div className="rounded-xl bg-orange-50 p-3">
                    <p className="text-xs text-gray-500">Marge</p>
                    <p className="text-lg font-extrabold text-orange-600">
                      {result.suggestedPrice > 0
                        ? `${Math.round(((result.suggestedPrice - result.suggestedCost) / result.suggestedPrice) * 100)}%`
                        : "—"
                      }
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={createProduct}
                    disabled={creatingProduct || !!createdProduct}
                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creatingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
                    {createdProduct ? "Produit créé" : "Créer le Produit"}
                  </button>

                  <button
                    type="button"
                    onClick={saveCreativesAndFaq}
                    disabled={savingAssets || !createdProduct}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingAssets ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Sauvegarder les Créatifs
                  </button>

                  {createdProduct && (
                    <div className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700">
                      Produit créé!
                      <Link href="/admin/landing-pages/new" className="text-orange-600 hover:text-orange-700">
                        Créer une Landing Page →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab 2: Copy Generator ────────────────────────────────────────────────────

function CopyGeneratorTab({ products }: { products: ProductOption[] }) {
  const [productId, setProductId] = useState("")
  const [platform,  setPlatform]  = useState("meta")
  const [language,  setLanguage]  = useState("fr")
  const [type,      setType]      = useState("primary")
  const [loading,   setLoading]   = useState(false)
  const [copies,    setCopies]    = useState<string[]>([])

  const selectedProduct = products.find((p) => p.id === productId)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProduct) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/ai/copy-generator", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          productTitle:    selectedProduct.titleFr,
          productBenefits: selectedProduct.descriptionFr ?? "",
          platform, language, type,
        }),
      })
      const data = await res.json() as { copies?: string[]; error?: string }
      if (!res.ok) { toast.error(data.error ?? "Erreur"); return }
      setCopies(data.copies ?? [])
    } catch { toast.error("Erreur réseau") }
    finally { setLoading(false) }
  }

  async function saveToCreatives(copy: string) {
    if (!productId) return
    const res = await fetch("/api/admin/creatives", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        productId,
        type:     "AD_COPY",
        platform: platform.toUpperCase(),
        title:    `${type} — ${platform.toUpperCase()}`,
        content:  copy,
      }),
    })
    if (res.ok) toast.success("Sauvegardé dans les créatifs")
    else toast.error("Erreur de sauvegarde")
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Produit</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
            >
              <option value="">— Sélectionner —</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.titleFr}</option>)}
            </select>
          </div>
          <Select label="Plateforme" value={platform} onChange={setPlatform} options={[
            { value: "meta",   label: "Meta (Facebook/Instagram)" },
            { value: "tiktok", label: "TikTok" },
            { value: "google", label: "Google Ads" },
          ]} />
          <Select label="Langue" value={language} onChange={setLanguage} options={[
            { value: "fr",     label: "Français" },
            { value: "darija", label: "Darija (دارجة)" },
            { value: "ar",     label: "Arabe (عربية)" },
          ]} />
          <Select label="Type de copy" value={type} onChange={setType} options={[
            { value: "headline",    label: "Headline (titre)" },
            { value: "primary",     label: "Primary Text (texte principal)" },
            { value: "description", label: "Description" },
          ]} />
        </div>
        <GenerateButton loading={loading} label="Générer 3 versions" />
      </form>

      {loading && <div className="rounded-2xl border border-gray-200 bg-white shadow-sm"><LoadingOverlay /></div>}

      {copies.length > 0 && !loading && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {copies.map((copy, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-500">Version {i + 1}</span>
                <div className="flex gap-1.5">
                  <CopyBtn text={copy} />
                  {productId && (
                    <button
                      type="button"
                      onClick={() => saveToCreatives(copy)}
                      className="flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-100"
                    >
                      <Save className="h-3 w-3" />
                      Sauvegarder
                    </button>
                  )}
                </div>
              </div>
              <p className={`text-sm text-gray-800 leading-relaxed ${language !== "fr" ? "dir-rtl" : ""}`} dir={language !== "fr" ? "rtl" : "ltr"}>
                {copy}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab 3: TikTok Script ─────────────────────────────────────────────────────

interface TikTokResult { hook: string; script: string; cta: string; duration: number }

function TikTokScriptTab({ products }: { products: ProductOption[] }) {
  const [productId, setProductId] = useState("")
  const [duration,  setDuration]  = useState<15|30|60>(30)
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState<TikTokResult | null>(null)

  const selectedProduct = products.find((p) => p.id === productId)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProduct) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/ai/tiktok-script", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          productTitle:    selectedProduct.titleFr,
          productBenefits: selectedProduct.descriptionFr ?? "",
          duration,
        }),
      })
      const data = await res.json() as TikTokResult & { error?: string }
      if (!res.ok) { toast.error(data.error ?? "Erreur"); return }
      setResult(data)
    } catch { toast.error("Erreur réseau") }
    finally { setLoading(false) }
  }

  async function saveToCreatives() {
    if (!result || !productId) return
    const content = `🎣 HOOK:\n${result.hook}\n\n📝 SCRIPT:\n${result.script}\n\n📢 CTA:\n${result.cta}`
    const res = await fetch("/api/admin/creatives", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        productId,
        type:     "UGC_SCRIPT",
        platform: "TIKTOK",
        title:    `Script UGC ${duration}s — Darija`,
        content,
      }),
    })
    if (res.ok) toast.success("Script sauvegardé dans les créatifs")
    else toast.error("Erreur de sauvegarde")
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Produit</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
            >
              <option value="">— Sélectionner —</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.titleFr}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Durée de la vidéo</label>
            <div className="flex gap-2">
              {([15, 30, 60] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition ${
                    duration === d ? "border-orange-400 bg-orange-50 text-orange-600" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>
        </div>
        <GenerateButton loading={loading} label="Générer le script TikTok en Darija" />
      </form>

      {loading && <div className="rounded-2xl border border-gray-200 bg-white shadow-sm"><LoadingOverlay /></div>}

      {result && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={saveToCreatives}
              className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600"
            >
              <Save className="h-3.5 w-3.5" />
              Sauvegarder dans Créatifs
            </button>
          </div>
          <AIResultCard label={`🎣 HOOK (premières 2-3 secondes)`}    content={result.hook}   dir="rtl" />
          <AIResultCard label={`📝 SCRIPT COMPLET (${duration}s)`}   content={result.script} dir="rtl" />
          <AIResultCard label="📢 CTA (call to action)"               content={result.cta}    dir="rtl" />
        </div>
      )}
    </div>
  )
}

// ─── Tab 4: SEO Generator ─────────────────────────────────────────────────────

interface SeoResult {
  metaTitle:       string
  metaDescription: string
  keywords:        string[]
  slug:            string
  h1:              string
  altText:         string
}

function SeoGeneratorTab({ products }: { products: ProductOption[] }) {
  const [productId, setProductId] = useState("")
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState<SeoResult | null>(null)

  const selectedProduct = products.find((p) => p.id === productId)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProduct) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/ai/seo-generator", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          productTitle:       selectedProduct.titleFr,
          productDescription: selectedProduct.descriptionFr ?? "",
        }),
      })
      const data = await res.json() as SeoResult & { error?: string }
      if (!res.ok) { toast.error(data.error ?? "Erreur"); return }
      setResult(data)
    } catch { toast.error("Erreur réseau") }
    finally { setLoading(false) }
  }

  async function applyToLandingPage() {
    if (!result || !productId) return
    const pages = await fetch(`/api/admin/landing-pages?productId=${productId}`)
      .then((r) => r.json()) as { landingPages: Array<{ id: string }> }

    const pageId = pages.landingPages?.[0]?.id
    if (!pageId) { toast.error("Aucune landing page active pour ce produit"); return }

    const res = await fetch(`/api/admin/landing-pages/${pageId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        metaTitle:    result.metaTitle,
        metaDesc:     result.metaDescription,
        metaKeywords: result.keywords.join(", "),
      }),
    })
    if (res.ok) toast.success("SEO appliqué à la landing page")
    else toast.error("Erreur d'application")
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Produit</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
          >
            <option value="">— Sélectionner un produit —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.titleFr}</option>)}
          </select>
        </div>
        <GenerateButton loading={loading} label="Générer le SEO" />
      </form>

      {loading && <div className="rounded-2xl border border-gray-200 bg-white shadow-sm"><LoadingOverlay /></div>}

      {result && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={applyToLandingPage}
              className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600"
            >
              <Save className="h-3.5 w-3.5" />
              Appliquer à la Landing Page
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <AIResultCard
              label={`Meta Title (${result.metaTitle.length}/60 chars)`}
              content={result.metaTitle}
              onSave={(v) => setResult((p) => p ? { ...p, metaTitle: v } : p)}
            />
            <AIResultCard
              label={`Meta Description (${result.metaDescription.length}/160 chars)`}
              content={result.metaDescription}
              onSave={(v) => setResult((p) => p ? { ...p, metaDescription: v } : p)}
            />
            <AIResultCard
              label="Slug URL suggéré"
              content={result.slug}
              mono
              onSave={(v) => setResult((p) => p ? { ...p, slug: v } : p)}
            />
            <AIResultCard
              label="H1 suggéré"
              content={result.h1}
              onSave={(v) => setResult((p) => p ? { ...p, h1: v } : p)}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Mots-clés ({result.keywords.length})</p>
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((kw, i) => (
                <span key={i} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab 5: FAQ Generator ─────────────────────────────────────────────────────

interface FaqItem { question: string; questionDarija: string; answer: string; category: string }

const CATEGORY_COLOR: Record<string, string> = {
  livraison: "bg-blue-100 text-blue-700",
  paiement:  "bg-green-100 text-green-700",
  produit:   "bg-orange-100 text-orange-700",
  retour:    "bg-red-100 text-red-700",
  support:   "bg-purple-100 text-purple-700",
}

function FaqGeneratorTab({ products }: { products: ProductOption[] }) {
  const [productId, setProductId] = useState("")
  const [loading,   setLoading]   = useState(false)
  const [faqs,      setFaqs]      = useState<FaqItem[]>([])

  const selectedProduct = products.find((p) => p.id === productId)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProduct) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/ai/faq-generator", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          productTitle:    selectedProduct.titleFr,
          productBenefits: selectedProduct.descriptionFr ?? "",
        }),
      })
      const data = await res.json() as { faq?: FaqItem[]; error?: string }
      if (!res.ok) { toast.error(data.error ?? "Erreur"); return }
      setFaqs(data.faq ?? [])
    } catch { toast.error("Erreur réseau") }
    finally { setLoading(false) }
  }

  async function addToLandingPage() {
    if (!faqs.length || !productId) return

    const pages = await fetch(`/api/admin/landing-pages?productId=${productId}`)
      .then((r) => r.json()) as { landingPages: Array<{ id: string; sections: unknown }> }

    const page = pages.landingPages?.[0]
    if (!page) { toast.error("Aucune landing page active pour ce produit"); return }

    const faqSection = {
      id:      crypto.randomUUID(),
      type:    "faq",
      visible: true,
      data: {
        title: "Questions fréquentes",
        items: faqs.map((f) => ({ question: f.question, answer: f.answer })),
      },
    }

    const currentSections = Array.isArray(page.sections) ? page.sections : []
    const res = await fetch(`/api/admin/landing-pages/${page.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sections: [...currentSections, faqSection] }),
    })
    if (res.ok) toast.success("FAQ ajoutée à la landing page")
    else toast.error("Erreur d'ajout")
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Produit</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
          >
            <option value="">— Sélectionner un produit —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.titleFr}</option>)}
          </select>
        </div>
        <GenerateButton loading={loading} label="Générer 8 FAQ Maroc COD" />
      </form>

      {loading && <div className="rounded-2xl border border-gray-200 bg-white shadow-sm"><LoadingOverlay /></div>}

      {faqs.length > 0 && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={addToLandingPage}
              className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600"
            >
              <Save className="h-3.5 w-3.5" />
              Ajouter à la Landing Page
            </button>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${CATEGORY_COLOR[faq.category] ?? "bg-gray-100 text-gray-600"}`}>
                        {faq.category}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{faq.question}</p>
                    {faq.questionDarija && (
                      <p className="text-xs text-gray-400 mt-0.5" dir="rtl">{faq.questionDarija}</p>
                    )}
                  </div>
                  <CopyBtn text={`${faq.question}\n${faq.answer}`} />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
  { id: "product", label: "Fiche Produit",    icon: Wand2       },
  { id: "copy",    label: "Copy Ads",         icon: FileText    },
  { id: "tiktok",  label: "Script TikTok",    icon: Video       },
  { id: "seo",     label: "SEO",              icon: Search      },
  { id: "faq",     label: "FAQ",              icon: HelpCircle  },
]

export default function AIToolsPage() {
  const [tab,      setTab]      = useState<Tab>("product")
  const [products, setProducts] = useState<ProductOption[]>([])

  useEffect(() => {
    fetch("/api/admin/products?pageSize=100")
      .then((r) => r.json())
      .then((d: { products: ProductOption[] }) => setProducts(d.products ?? []))
  }, [])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-yellow-50 p-4 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 shadow-sm">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="font-extrabold text-gray-900">AI Tools — Powered by GPT-4o</h2>
          <p className="text-xs text-gray-500">Générez du contenu optimisé pour le marché marocain COD</p>
        </div>
      </div>

      {/* ── URL Generator CTA ── Primary feature */}
      <Link
        href="/admin/ai-tools/url-generator"
        className="group flex items-center gap-4 rounded-2xl border-2 border-orange-300 bg-gradient-to-r from-orange-500 to-pink-500 p-5 shadow-md hover:shadow-lg transition-all hover:scale-[1.01]"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
          <Link2 className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-extrabold text-white leading-tight">
            🔗 Générer depuis une URL
          </p>
          <p className="text-sm text-orange-100 mt-0.5">
            Collez n'importe quelle URL produit — l'IA crée la fiche + landing page complète en 30 secondes
          </p>
          <p className="mt-1.5 text-xs text-orange-200">
            AliExpress · Alibaba · 1688 · Amazon · Shopify · et plus
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 group-hover:bg-white/30 transition">
          <ChevronRight className="h-5 w-5 text-white" />
        </div>
      </Link>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-100 p-1">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold transition ${
                tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === "product" && <ProductGeneratorTab />}
      {tab === "copy"    && <CopyGeneratorTab    products={products} />}
      {tab === "tiktok"  && <TikTokScriptTab     products={products} />}
      {tab === "seo"     && <SeoGeneratorTab     products={products} />}
      {tab === "faq"     && <FaqGeneratorTab     products={products} />}
    </div>
  )
}
