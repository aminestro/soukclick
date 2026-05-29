"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Plus, Trash2, Loader2, Tag, Truck, Package } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type OfferType = "QUANTITY_DISCOUNT" | "FREE_SHIPPING" | "BUNDLE"

interface Offer {
  id:              string
  productId:       string
  type:            OfferType
  labelFr:         string
  labelAr:         string | null
  minQuantity:     number
  discountPercent: number
  freeShipping:    boolean
  isActive:        boolean
}

interface ProductOption { id: string; titleFr: string; price: number }

// ─── Offer preview ────────────────────────────────────────────────────────────

function OfferPreview({ offer }: { offer: Offer }) {
  let text = offer.labelFr

  if (offer.type === "QUANTITY_DISCOUNT" && offer.discountPercent > 0) {
    text = `Achetez ${offer.minQuantity} → -${offer.discountPercent}%`
  } else if (offer.type === "FREE_SHIPPING" || offer.freeShipping) {
    text = `Achetez ${offer.minQuantity} → Livraison gratuite`
  } else if (offer.type === "BUNDLE") {
    text = `Pack de ${offer.minQuantity} — ${offer.labelFr}`
  }

  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
      offer.type === "FREE_SHIPPING" ? "bg-blue-50 text-blue-700 border border-blue-200"
      : offer.type === "BUNDLE"      ? "bg-purple-50 text-purple-700 border border-purple-200"
      : "bg-green-50 text-green-700 border border-green-200"
    }`}>
      {offer.type === "FREE_SHIPPING" ? <Truck className="h-4 w-4" />
       : offer.type === "BUNDLE"       ? <Package className="h-4 w-4" />
       : <Tag className="h-4 w-4" />}
      {text}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${value ? "bg-green-500" : "bg-gray-300"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${value ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  )
}

// ─── Add Offer Form ───────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  type:            "QUANTITY_DISCOUNT" as OfferType,
  labelFr:         "",
  labelAr:         "",
  minQuantity:     2,
  discountPercent: 10,
  freeShipping:    false,
  isActive:        true,
}

function AddOfferForm({ productId, onAdded }: { productId: string; onAdded: (o: Offer) => void }) {
  const [form,   setForm]   = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [open,   setOpen]   = useState(false)

  function set<K extends keyof typeof DEFAULT_FORM>(k: K, v: typeof DEFAULT_FORM[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/admin/offers", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        productId,
        ...form,
        labelAr: form.labelAr || null,
      }),
    })
    const body = await res.json() as Offer & { error?: string }
    if (res.ok) {
      onAdded(body)
      setForm(DEFAULT_FORM)
      setOpen(false)
      toast.success("Offre ajoutée")
    } else {
      toast.error(body.error ?? "Erreur")
    }
    setSaving(false)
  }

  if (!open) return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-500 hover:border-orange-400 hover:text-orange-500 transition"
    >
      <Plus className="h-4 w-4" />
      Ajouter une offre
    </button>
  )

  return (
    <form onSubmit={submit} className="rounded-2xl border border-orange-200 bg-orange-50/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Nouvelle offre</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">Annuler</button>
      </div>

      {/* Type */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-500">Type</label>
        <div className="grid grid-cols-3 gap-2">
          {(["QUANTITY_DISCOUNT","FREE_SHIPPING","BUNDLE"] as OfferType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("type", t)}
              className={`rounded-xl border py-2 text-xs font-semibold transition ${
                form.type === t ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {t === "QUANTITY_DISCOUNT" ? "Remise %" : t === "FREE_SHIPPING" ? "Livraison gratuite" : "Bundle"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Label FR *</label>
          <input
            value={form.labelFr}
            onChange={(e) => set("labelFr", e.target.value)}
            required
            placeholder="ex: Pack 2 pièces"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Label AR</label>
          <input
            value={form.labelAr}
            onChange={(e) => set("labelAr", e.target.value)}
            placeholder="عرض…"
            dir="rtl"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Qté min</label>
          <input
            type="number" min="1" value={form.minQuantity}
            onChange={(e) => set("minQuantity", parseInt(e.target.value) || 1)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        {form.type === "QUANTITY_DISCOUNT" && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Remise %</label>
            <input
              type="number" min="0" max="100" value={form.discountPercent}
              onChange={(e) => set("discountPercent", parseInt(e.target.value) || 0)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        )}
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
            <Toggle value={form.freeShipping} onChange={(v) => set("freeShipping", v)} />
            Livraison gratuite
          </label>
        </div>
      </div>

      {/* Live preview */}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Aperçu</p>
        <OfferPreview offer={{ id: "", productId, ...form, labelAr: form.labelAr || null }} />
      </div>

      <button
        type="submit"
        disabled={saving || !form.labelFr.trim()}
        className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Ajouter l'offre
      </button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OffersPage() {
  const [products,  setProducts]  = useState<ProductOption[]>([])
  const [productId, setProductId] = useState("")
  const [offers,    setOffers]    = useState<Offer[]>([])
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    fetch("/api/admin/products?pageSize=100")
      .then((r) => r.json())
      .then((d: { products: ProductOption[] }) => setProducts(d.products ?? []))
  }, [])

  const fetchOffers = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    const res  = await fetch(`/api/admin/offers?productId=${productId}`)
    const data = await res.json() as Offer[]
    setOffers(data)
    setLoading(false)
  }, [productId])

  useEffect(() => { fetchOffers() }, [fetchOffers])

  async function toggleActive(offer: Offer) {
    const res = await fetch(`/api/admin/offers/${offer.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isActive: !offer.isActive }),
    })
    if (res.ok) {
      const updated = await res.json() as Offer
      setOffers((prev) => prev.map((o) => o.id === offer.id ? updated : o))
    }
  }

  async function deleteOffer(id: string) {
    if (!confirm("Supprimer cette offre ?")) return
    const res = await fetch(`/api/admin/offers/${id}`, { method: "DELETE" })
    if (res.ok) {
      setOffers((prev) => prev.filter((o) => o.id !== id))
      toast.success("Offre supprimée")
    }
  }

  const TYPE_LABEL: Record<OfferType, string> = {
    QUANTITY_DISCOUNT: "Remise quantité",
    FREE_SHIPPING:     "Livraison gratuite",
    BUNDLE:            "Bundle",
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
          Sélectionnez un produit pour gérer ses offres
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {offers.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
              Aucune offre — ajoutez-en une ci-dessous
            </div>
          )}

          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm transition ${offer.isActive ? "border-gray-200" : "border-gray-100 opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                      {TYPE_LABEL[offer.type]}
                    </span>
                    <span className="text-xs text-gray-400">Qté min: {offer.minQuantity}</span>
                    {offer.discountPercent > 0 && (
                      <span className="text-xs text-gray-400">Remise: {offer.discountPercent}%</span>
                    )}
                    {offer.freeShipping && (
                      <span className="text-xs text-blue-600 font-semibold">+ Livraison gratuite</span>
                    )}
                  </div>
                  <OfferPreview offer={offer} />
                  {offer.labelAr && (
                    <p className="text-sm text-gray-500 dir-rtl" dir="rtl">{offer.labelAr}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Toggle value={offer.isActive} onChange={() => toggleActive(offer)} />
                  <button
                    type="button"
                    onClick={() => deleteOffer(offer.id)}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <AddOfferForm
            productId={productId}
            onAdded={(o) => setOffers((prev) => [...prev, o])}
          />
        </div>
      )}
    </div>
  )
}
