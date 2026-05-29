"use client"

import { ImageUpload } from "@/components/admin/ImageUpload"
import type { BeforeAfterData } from "@/types/landing"

interface BeforeAfterEditorProps {
  data:     BeforeAfterData
  onChange: (data: BeforeAfterData) => void
}

export function BeforeAfterEditor({ data, onChange }: BeforeAfterEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="field-label">Image "Avant"</label>
        <ImageUpload
          value={data.before_image ? [data.before_image] : []}
          onChange={(urls) => onChange({ ...data, before_image: urls[0] ?? "" })}
          folder="products"
          maxFiles={1}
        />
      </div>

      <div>
        <label className="field-label">Image "Après"</label>
        <ImageUpload
          value={data.after_image ? [data.after_image] : []}
          onChange={(urls) => onChange({ ...data, after_image: urls[0] ?? "" })}
          folder="products"
          maxFiles={1}
        />
      </div>

      <div>
        <label className="field-label">Légende (optionnel)</label>
        <input
          type="text"
          value={data.caption ?? ""}
          onChange={(e) => onChange({ ...data, caption: e.target.value || null })}
          className="field-input"
          placeholder="Résultats avant / après"
        />
      </div>
    </div>
  )
}
