"use client"

import { ImageUpload } from "@/components/admin/ImageUpload"
import type { VideoData } from "@/types/landing"

interface VideoEditorProps {
  data:     VideoData
  onChange: (data: VideoData) => void
}

function detectPlatform(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url))  return "YouTube"
  if (/tiktok\.com/.test(url))             return "TikTok"
  if (/\.(mp4|webm)/.test(url))            return "Vidéo directe (MP4)"
  return ""
}

export function VideoEditor({ data, onChange }: VideoEditorProps) {
  const platform = detectPlatform(data.url)

  return (
    <div className="space-y-4">
      <div>
        <label className="field-label">URL de la vidéo</label>
        <input
          type="url"
          value={data.url}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
          className="field-input"
          placeholder="https://youtube.com/watch?v=… ou TikTok ou .mp4"
        />
        {platform && (
          <p className="mt-1 text-[11px] font-medium text-orange-600">✓ Détecté: {platform}</p>
        )}
      </div>

      <div>
        <label className="field-label">Image de prévisualisation (thumbnail)</label>
        <ImageUpload
          value={data.thumbnail_url ? [data.thumbnail_url] : []}
          onChange={(urls) => onChange({ ...data, thumbnail_url: urls[0] ?? null })}
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
          placeholder="Regardez comment ça marche"
        />
      </div>
    </div>
  )
}
