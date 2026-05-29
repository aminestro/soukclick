"use client"

import { Plus, Trash2, GripVertical } from "lucide-react"
import type { BenefitsData, BenefitItem } from "@/types/landing"

interface BenefitsEditorProps {
  data:     BenefitsData
  onChange: (data: BenefitsData) => void
}

export function BenefitsEditor({ data, onChange }: BenefitsEditorProps) {
  function setTitle(title: string) { onChange({ ...data, title }) }

  function setItem(idx: number, patch: Partial<BenefitItem>) {
    const items = data.items.map((it, i) => i === idx ? { ...it, ...patch } : it)
    onChange({ ...data, items })
  }

  function addItem() {
    if (data.items.length >= 6) return
    onChange({ ...data, items: [...data.items, { icon: "⭐", title: "", description: "" }] })
  }

  function removeItem(idx: number) {
    onChange({ ...data, items: data.items.filter((_, i) => i !== idx) })
  }

  function moveItem(from: number, to: number) {
    const items = [...data.items]
    const [item] = items.splice(from, 1)
    items.splice(to, 0, item!)
    onChange({ ...data, items })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="field-label">Titre de section</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => setTitle(e.target.value)}
          className="field-input"
          placeholder="Pourquoi choisir ce produit ?"
        />
      </div>

      <div>
        <label className="field-label">Bénéfices ({data.items.length}/6)</label>
        <div className="space-y-2">
          {data.items.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
              {/* Header row */}
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-gray-400 shrink-0 cursor-grab" />
                <input
                  type="text"
                  value={item.icon}
                  onChange={(e) => setItem(idx, { icon: e.target.value })}
                  className="w-12 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-sm"
                  placeholder="⭐"
                  maxLength={4}
                />
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => setItem(idx, { title: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
                  placeholder="Titre"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => idx > 0 && moveItem(idx, idx - 1)}
                    disabled={idx === 0}
                    className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  >↑</button>
                  <button
                    type="button"
                    onClick={() => idx < data.items.length - 1 && moveItem(idx, idx + 1)}
                    disabled={idx === data.items.length - 1}
                    className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  >↓</button>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="rounded p-1 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {/* Description */}
              <textarea
                rows={2}
                value={item.description}
                onChange={(e) => setItem(idx, { description: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm resize-none"
                placeholder="Description du bénéfice…"
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
            <Plus className="h-4 w-4" /> Ajouter un bénéfice
          </button>
        )}
      </div>
    </div>
  )
}
