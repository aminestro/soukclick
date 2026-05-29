"use client"

import { ImageUpload } from "@/components/admin/ImageUpload"
import type { HeroData } from "@/types/landing"

const PRESET_COLORS = ["#f97316","#ef4444","#3b82f6","#22c55e","#8b5cf6","#ec4899","#000000"]

const BADGE_OPTIONS: Array<{ id: HeroData["badges"][number]; label: string }> = [
  { id: "cod",                label: "Paiement à la livraison" },
  { id: "livraison_gratuite", label: "Livraison gratuite"      },
  { id: "garantie",           label: "Satisfait ou remboursé"  },
  { id: "retour",             label: "Retour facile"           },
]

interface HeroEditorProps {
  data:     HeroData
  onChange: (data: HeroData) => void
}

export function HeroEditor({ data, onChange }: HeroEditorProps) {
  function set<K extends keyof HeroData>(key: K, val: HeroData[K]) {
    onChange({ ...data, [key]: val })
  }

  function toggleBadge(id: HeroData["badges"][number]) {
    const has = data.badges.includes(id)
    set("badges", has ? data.badges.filter((b) => b !== id) : [...data.badges, id])
  }

  return (
    <div className="space-y-4">
      {/* Headline */}
      <div>
        <label className="field-label">Titre principal</label>
        <textarea
          rows={2}
          value={data.headline}
          onChange={(e) => set("headline", e.target.value)}
          className="field-input resize-none"
          placeholder="Le produit qui change tout"
        />
      </div>

      {/* Subheadline */}
      <div>
        <label className="field-label">Sous-titre</label>
        <textarea
          rows={2}
          value={data.subheadline}
          onChange={(e) => set("subheadline", e.target.value)}
          className="field-input resize-none"
          placeholder="Livraison rapide — Paiement à la livraison"
        />
      </div>

      {/* Image */}
      <div>
        <label className="field-label">Image du produit</label>
        <ImageUpload
          value={data.image_url ? [data.image_url] : []}
          onChange={(urls) => set("image_url", urls[0] ?? null)}
          folder="products"
          maxFiles={1}
        />
      </div>

      {/* Video URL */}
      <div>
        <label className="field-label">URL vidéo (optionnel)</label>
        <input
          type="url"
          value={data.video_url ?? ""}
          onChange={(e) => set("video_url", e.target.value || null)}
          className="field-input"
          placeholder="https://youtube.com/watch?v=…"
        />
        <p className="mt-1 text-[11px] text-gray-400">Si défini, remplace l'image</p>
      </div>

      {/* CTA text */}
      <div>
        <label className="field-label">Texte du bouton</label>
        <input
          type="text"
          value={data.cta_text}
          onChange={(e) => set("cta_text", e.target.value)}
          className="field-input"
        />
      </div>

      {/* CTA color */}
      <div>
        <label className="field-label">Couleur du bouton</label>
        <div className="flex items-center gap-2">
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
                title={c}
                className="h-6 w-6 rounded-md border-2 border-white shadow"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        {[
          { key: "show_price",         label: "Afficher le prix"         },
          { key: "show_compare_price", label: "Afficher le prix barré"   },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 cursor-pointer">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <Toggle
              checked={data[key as "show_price" | "show_compare_price"]}
              onChange={(v) => set(key as "show_price" | "show_compare_price", v)}
            />
          </label>
        ))}
      </div>

      {/* Badges */}
      <div>
        <label className="field-label">Badges de confiance</label>
        <div className="space-y-1.5">
          {BADGE_OPTIONS.map(({ id, label }) => (
            <label key={id} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={data.badges.includes(id)}
                onChange={() => toggleBadge(id)}
                className="h-4 w-4 rounded border-gray-300 accent-orange-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-orange-500" : "bg-gray-200"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </button>
  )
}
