"use client"

import { Plus, Trash2 } from "lucide-react"
import type { FaqData, FaqItem } from "@/types/landing"

interface FAQEditorProps {
  data:     FaqData
  onChange: (data: FaqData) => void
}

export function FAQEditor({ data, onChange }: FAQEditorProps) {
  function setItem(idx: number, patch: Partial<FaqItem>) {
    onChange({ ...data, items: data.items.map((it, i) => i === idx ? { ...it, ...patch } : it) })
  }

  function addItem() {
    if (data.items.length >= 8) return
    onChange({ ...data, items: [...data.items, { question: "", answer: "" }] })
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
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="field-input"
          placeholder="Questions fréquentes"
        />
      </div>

      <div>
        <label className="field-label">Questions ({data.items.length}/8)</label>
        <div className="space-y-2">
          {data.items.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Question {idx + 1}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => idx > 0 && moveItem(idx, idx - 1)}
                    disabled={idx === 0}
                    className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 text-sm"
                  >↑</button>
                  <button
                    type="button"
                    onClick={() => idx < data.items.length - 1 && moveItem(idx, idx + 1)}
                    disabled={idx === data.items.length - 1}
                    className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 text-sm"
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
              <input
                type="text"
                value={item.question}
                onChange={(e) => setItem(idx, { question: e.target.value })}
                className="field-input"
                placeholder="Comment passer une commande ?"
              />
              <textarea
                rows={2}
                value={item.answer}
                onChange={(e) => setItem(idx, { answer: e.target.value })}
                className="field-input resize-none"
                placeholder="Réponse à la question…"
              />
            </div>
          ))}
        </div>

        {data.items.length < 8 && (
          <button
            type="button"
            onClick={addItem}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-orange-400 hover:text-orange-600"
          >
            <Plus className="h-4 w-4" /> Ajouter une question
          </button>
        )}
      </div>
    </div>
  )
}
