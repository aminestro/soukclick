"use client"

import { Plus, Trash2 } from "lucide-react"
import { ImageUpload } from "@/components/admin/ImageUpload"
import type { FeaturesData, FeatureItem } from "@/types/landing"

interface FeaturesEditorProps {
  data:     FeaturesData
  onChange: (data: FeaturesData) => void
}

export function FeaturesEditor({ data, onChange }: FeaturesEditorProps) {
  function setItem(idx: number, patch: Partial<FeatureItem>) {
    onChange({ ...data, items: data.items.map((it, i) => i === idx ? { ...it, ...patch } : it) })
  }

  function addItem() {
    if (data.items.length >= 6) return
    onChange({ ...data, items: [...data.items, { image_url: null, title: "", description: "" }] })
  }

  function removeItem(idx: number) {
    onChange({ ...data, items: data.items.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="field-label">Titre de section</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="field-input"
          placeholder="Caractéristiques du produit"
        />
      </div>

      <div>
        <label className="field-label">Caractéristiques ({data.items.length}/6)</label>
        <div className="space-y-3">
          {data.items.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Caractéristique {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="rounded p-1 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <ImageUpload
                value={item.image_url ? [item.image_url] : []}
                onChange={(urls) => setItem(idx, { image_url: urls[0] ?? null })}
                folder="products"
                maxFiles={1}
              />
              <input
                type="text"
                value={item.title}
                onChange={(e) => setItem(idx, { title: e.target.value })}
                className="field-input"
                placeholder="Titre"
              />
              <textarea
                rows={2}
                value={item.description}
                onChange={(e) => setItem(idx, { description: e.target.value })}
                className="field-input resize-none"
                placeholder="Description…"
              />
            </div>
          ))}
        </div>

        {data.items.length < 6 && (
          <button
            type="button"
            onClick={addItem}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-orange-400 hover:text-orange-600"
          >
            <Plus className="h-4 w-4" /> Ajouter une caractéristique
          </button>
        )}
      </div>
    </div>
  )
}
