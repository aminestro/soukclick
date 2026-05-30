"use client"

import { Plus, X } from "lucide-react"
import type { CheckoutData } from "@/types/landing"
import { Toggle } from "@/components/admin/builder/editors/HeroEditor"

const PRESET_COLORS = ["#f97316","#ef4444","#3b82f6","#22c55e","#8b5cf6","#000000"]

interface CheckoutEditorProps {
  data:     CheckoutData
  onChange: (data: CheckoutData) => void
}

export function CheckoutEditor({ data, onChange }: CheckoutEditorProps) {
  function set<K extends keyof CheckoutData>(key: K, val: CheckoutData[K]) {
    onChange({ ...data, [key]: val })
  }

  function addTrust() {
    set("trust_items", [...data.trust_items, ""])
  }
  function updateTrust(i: number, val: string) {
    const items = [...data.trust_items]
    items[i] = val
    set("trust_items", items)
  }
  function removeTrust(i: number) {
    set("trust_items", data.trust_items.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-5">

      {/* Title */}
      <div>
        <label className="field-label">Titre du formulaire</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => set("title", e.target.value)}
          className="field-input"
          placeholder="👇 أدخل معلوماتك للطلب"
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="field-label">Sous-titre (optionnel)</label>
        <input
          type="text"
          value={data.subtitle ?? ""}
          onChange={(e) => set("subtitle", e.target.value || null)}
          className="field-input"
          placeholder="Livraison partout au Maroc"
        />
      </div>

      {/* CTA text */}
      <div>
        <label className="field-label">Texte du bouton</label>
        <input
          type="text"
          value={data.cta_text}
          onChange={(e) => set("cta_text", e.target.value)}
          className="field-input"
          placeholder="أطلب الآن / Commander Maintenant"
        />
      </div>

      {/* CTA color */}
      <div>
        <label className="field-label">Couleur du bouton</label>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="color"
            value={data.cta_color}
            onChange={(e) => set("cta_color", e.target.value)}
            className="h-9 w-9 cursor-pointer rounded-lg border border-gray-200 p-0.5"
          />
          <input
            type="text"
            value={data.cta_color}
            onChange={(e) => set("cta_color", e.target.value)}
            className="field-input w-28 font-mono"
          />
          <div className="flex gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("cta_color", c)}
                className="h-6 w-6 rounded-md border-2 border-white shadow"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Options</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Images produit dans les offres</p>
            <p className="text-xs text-gray-500">Affiche la photo du produit sur chaque carte</p>
          </div>
          <Toggle
            checked={data.show_product_images}
            onChange={(v) => set("show_product_images", v)}
          />
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Récapitulatif collapsible</p>
            <p className="text-xs text-gray-500">Onglet "ملخص الطلب" avec total</p>
          </div>
          <Toggle
            checked={data.show_summary}
            onChange={(v) => set("show_summary", v)}
          />
        </div>
      </div>

      {/* Trust items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="field-label mb-0">Badges de confiance</label>
          <button
            type="button"
            onClick={addTrust}
            className="flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-100"
          >
            <Plus className="h-3 w-3" /> Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {data.trust_items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateTrust(i, e.target.value)}
                className="field-input flex-1"
                placeholder="🔒 Paiement à la livraison"
              />
              <button
                type="button"
                onClick={() => removeTrust(i)}
                className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {data.trust_items.length === 0 && (
            <p className="rounded-xl border-2 border-dashed border-gray-200 py-3 text-center text-xs text-gray-400">
              Aucun badge — cliquez Ajouter
            </p>
          )}
        </div>
      </div>

    </div>
  )
}
