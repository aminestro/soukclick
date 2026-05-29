"use client"

import type { CtaData } from "@/types/landing"

const PRESET_COLORS = ["#f97316","#ef4444","#3b82f6","#22c55e","#8b5cf6","#000000"]

interface CTAEditorProps {
  data:     CtaData
  onChange: (data: CtaData) => void
}

export function CTAEditor({ data, onChange }: CTAEditorProps) {
  function set<K extends keyof CtaData>(key: K, val: CtaData[K]) {
    onChange({ ...data, [key]: val })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="field-label">Titre d'accroche</label>
        <textarea
          rows={2}
          value={data.headline}
          onChange={(e) => set("headline", e.target.value)}
          className="field-input resize-none"
          placeholder="Commandez maintenant — Stock limité !"
        />
      </div>

      <div>
        <label className="field-label">Texte du bouton</label>
        <input
          type="text"
          value={data.cta_text}
          onChange={(e) => set("cta_text", e.target.value)}
          className="field-input"
        />
      </div>

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
                className="h-6 w-6 rounded-md border-2 border-white shadow"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="field-label">Texte d'urgence (optionnel)</label>
        <input
          type="text"
          value={data.urgency_text ?? ""}
          onChange={(e) => set("urgency_text", e.target.value || null)}
          className="field-input"
          placeholder="⚠️ Offre limitée — livraison gratuite aujourd'hui"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
        <p className="text-xs text-gray-500 font-medium">Compte à rebours (V2)</p>
        <p className="text-xs text-gray-400 mt-0.5">Disponible dans la prochaine version</p>
      </div>
    </div>
  )
}
