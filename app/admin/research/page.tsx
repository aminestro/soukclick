"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Save, Loader2, Plus, X, ExternalLink } from "lucide-react"
import { fromCentimes, toCentimes } from "@/lib/format"

// ─── Types ────────────────────────────────────────────────────────────────────

type TestingStatus = "TESTING" | "WINNER" | "SCALING" | "STOPPED"

interface Research {
  id:               string
  productId:        string
  supplierUrl:      string | null
  alibabaUrl:       string | null
  url1688:          string | null
  buyingPrice:      number | null
  shippingCost:     number | null
  competitorUrls:   string[]
  competitorPrices: number[]
  testingNotes:     string | null
  winningScore:     number
  breakEvenCpa:     number | null
  adSpendTotal:     number
  confirmedCount:   number
  product:          { price: number; costPrice: number } | null
}

interface ProductOption { id: string; titleFr: string; price: number; costPrice: number }

// ─── Status selector ──────────────────────────────────────────────────────────

const STATUS_STYLE: Record<TestingStatus, string> = {
  TESTING: "border-blue-300 bg-blue-50 text-blue-700",
  WINNER:  "border-green-300 bg-green-50 text-green-700",
  SCALING: "border-purple-300 bg-purple-50 text-purple-700",
  STOPPED: "border-gray-300 bg-gray-50 text-gray-600",
}

function StatusSelector({
  value,
  onChange,
}: {
  value:    TestingStatus
  onChange: (v: TestingStatus) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {(["TESTING","WINNER","SCALING","STOPPED"] as TestingStatus[]).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
            value === s ? STATUS_STYLE[s] : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

// ─── Winning score slider ─────────────────────────────────────────────────────

function ScoreSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const color = value >= 8 ? "accent-green-500" : value >= 5 ? "accent-orange-400" : "accent-red-400"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Score gagnant</label>
        <span className={`text-lg font-extrabold tabular-nums ${
          value >= 8 ? "text-green-600" : value >= 5 ? "text-orange-500" : "text-red-500"
        }`}>
          {value}/10
        </span>
      </div>
      <input
        type="range"
        min={0} max={10} step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={`w-full h-2 rounded-full appearance-none cursor-pointer ${color}`}
      />
      <div className="flex justify-between text-xs text-gray-300">
        <span>0</span><span>5</span><span>10</span>
      </div>
    </div>
  )
}

// ─── Computed card ────────────────────────────────────────────────────────────

function ComputedCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-base font-extrabold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const EMPTY: Omit<Research, "id" | "productId" | "confirmedCount" | "product"> = {
  supplierUrl:      null,
  alibabaUrl:       null,
  url1688:          null,
  buyingPrice:      null,
  shippingCost:     null,
  competitorUrls:   [],
  competitorPrices: [],
  testingNotes:     null,
  winningScore:     5,
  breakEvenCpa:     null,
  adSpendTotal:     0,
}

export default function ResearchPage() {
  const [products,       setProducts]       = useState<ProductOption[]>([])
  const [productId,      setProductId]      = useState("")
  const [product,        setProduct]        = useState<ProductOption | null>(null)
  const [form,           setForm]           = useState({ ...EMPTY })
  const [testingStatus,  setTestingStatus]  = useState<TestingStatus>("TESTING")
  const [confirmedCount, setConfirmedCount] = useState(0)
  const [loading,        setLoading]        = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [newUrl,         setNewUrl]         = useState("")
  const [newPrice,       setNewPrice]       = useState("")

  useEffect(() => {
    fetch("/api/admin/products?pageSize=100")
      .then((r) => r.json())
      .then((d: { products: ProductOption[] }) => setProducts(d.products ?? []))
  }, [])

  const fetchResearch = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    const p = products.find((x) => x.id === productId) ?? null
    setProduct(p)
    const res  = await fetch(`/api/admin/research?productId=${productId}`)
    const data = await res.json() as Research | null
    if (data) {
      setForm({
        supplierUrl:      data.supplierUrl,
        alibabaUrl:       data.alibabaUrl,
        url1688:          data.url1688,
        buyingPrice:      data.buyingPrice,
        shippingCost:     data.shippingCost,
        competitorUrls:   data.competitorUrls,
        competitorPrices: data.competitorPrices,
        testingNotes:     data.testingNotes,
        winningScore:     data.winningScore,
        breakEvenCpa:     data.breakEvenCpa,
        adSpendTotal:     data.adSpendTotal,
      })
      setConfirmedCount(data.confirmedCount ?? 0)
    } else {
      setForm({ ...EMPTY })
      setConfirmedCount(0)
    }
    setLoading(false)
  }, [productId, products])

  useEffect(() => { fetchResearch() }, [fetchResearch])

  function set<K extends keyof typeof EMPTY>(k: K, v: typeof EMPTY[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  // Computed values
  const price    = product?.price    ?? 0
  const cost     = product?.costPrice ?? 0
  const delivery = form.shippingCost ?? 0
  const breakEven = price - cost - delivery
  const margin    = price > 0 ? ((price - cost) / price) * 100 : 0
  const estCpa    = confirmedCount > 0 ? form.adSpendTotal / confirmedCount : null

  function addCompetitor() {
    if (!newUrl.trim()) return
    set("competitorUrls",   [...form.competitorUrls, newUrl.trim()])
    set("competitorPrices", [...form.competitorPrices, toCentimes(parseFloat(newPrice) || 0)])
    setNewUrl(""); setNewPrice("")
  }

  function removeCompetitor(i: number) {
    set("competitorUrls",   form.competitorUrls.filter((_, j) => j !== i))
    set("competitorPrices", form.competitorPrices.filter((_, j) => j !== i))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      productId,
      ...form,
      breakEvenCpa: breakEven > 0 ? breakEven : null,
    }
    const res = await fetch("/api/admin/research", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    if (res.ok) {
      toast.success("Recherche sauvegardée")
    } else {
      toast.error("Erreur de sauvegarde")
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      {/* Product selector */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <label className="mb-1 block text-xs font-semibold text-gray-500">Produit</label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
        >
          <option value="">— Sélectionner un produit —</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.titleFr}</option>)}
        </select>
      </div>

      {!productId ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
          Sélectionnez un produit pour accéder à sa fiche de recherche
        </div>
      ) : loading ? (
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 h-96" />
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          {/* Status + Score */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut de test</label>
              <StatusSelector value={testingStatus} onChange={setTestingStatus} />
            </div>
            <ScoreSlider value={form.winningScore} onChange={(v) => set("winningScore", v)} />
          </div>

          {/* Computed metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ComputedCard
              label="Break-even CPA"
              value={breakEven > 0 ? `${fromCentimes(breakEven).toFixed(0)} MAD` : "—"}
              sub="Prix - Coût - Livraison"
            />
            <ComputedCard
              label="Marge"
              value={`${margin.toFixed(1)}%`}
              sub={`Prix: ${fromCentimes(price).toFixed(0)} MAD`}
            />
            <ComputedCard
              label="CPA estimé"
              value={estCpa != null ? `${fromCentimes(estCpa).toFixed(0)} MAD` : "—"}
              sub={`${confirmedCount} commandes confirmées`}
            />
            <ComputedCard
              label="Total pub dépensé"
              value={`${fromCentimes(form.adSpendTotal).toFixed(0)} MAD`}
            />
          </div>

          {/* Supplier URLs */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Sources fournisseurs</h3>

            {[
              { label: "URL Fournisseur",  key: "supplierUrl" as const, placeholder: "https://supplier.com/…" },
              { label: "Alibaba",          key: "alibabaUrl"  as const, placeholder: "https://alibaba.com/…"  },
              { label: "1688",             key: "url1688"     as const, placeholder: "https://1688.com/…"     },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-semibold text-gray-500">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={form[key] ?? ""}
                    onChange={(e) => set(key, e.target.value || null)}
                    placeholder={placeholder}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                  />
                  {form[key] && (
                    <a href={form[key]!} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Prix d'achat (MAD)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.buyingPrice != null ? fromCentimes(form.buyingPrice) : ""}
                  onChange={(e) => set("buyingPrice", e.target.value ? toCentimes(parseFloat(e.target.value)) : null)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Frais de port (MAD)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.shippingCost != null ? fromCentimes(form.shippingCost) : ""}
                  onChange={(e) => set("shippingCost", e.target.value ? toCentimes(parseFloat(e.target.value)) : null)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          {/* Competitors */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Concurrents</h3>

            {form.competitorUrls.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 truncate text-sm text-blue-500 hover:underline"
                >
                  {url}
                </a>
                <span className="text-sm font-semibold text-gray-700 tabular-nums whitespace-nowrap">
                  {form.competitorPrices[i] ? `${fromCentimes(form.competitorPrices[i]).toFixed(0)} MAD` : "—"}
                </span>
                <button type="button" onClick={() => removeCompetitor(i)} className="text-gray-300 hover:text-red-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2">
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://concurrent.com/…"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
              <input
                type="number" min="0" step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Prix MAD"
                className="w-28 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={addCompetitor}
                disabled={!newUrl.trim()}
                className="rounded-xl bg-gray-100 px-3 py-2 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Ad spend tracker */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Budget pub total</h3>
            <div className="flex items-center gap-3">
              <input
                type="number" min="0" step="0.01"
                value={fromCentimes(form.adSpendTotal)}
                onChange={(e) => set("adSpendTotal", toCentimes(parseFloat(e.target.value) || 0))}
                className="w-40 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm text-gray-500">MAD dépensé depuis le début du test</span>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-400">Notes de test</label>
            <textarea
              value={form.testingNotes ?? ""}
              onChange={(e) => set("testingNotes", e.target.value || null)}
              rows={5}
              placeholder="Observations, résultats de tests, hypothèses…"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 resize-none"
            />
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60 shadow-sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer la fiche
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
