"use client"

import { useState, useCallback, useRef, useId } from "react"
import Image from "next/image"
import { Upload, X, GripVertical, Loader2 } from "lucide-react"
import { formatFileSize } from "@/lib/format"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImageUploadProps {
  value:     string[]
  onChange:  (urls: string[]) => void
  folder:    "products" | "creatives" | "reviews"
  maxFiles?: number
  accept?:   string
}

interface UploadingFile {
  id:       string
  name:     string
  size:     number
  progress: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageUpload({
  value    = [],
  onChange,
  folder,
  maxFiles = 8,
  accept   = "image/jpeg,image/png,image/webp",
}: ImageUploadProps) {
  const inputId = useId()
  const inputRef                    = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver]     = useState(false)
  const [uploading, setUploading]   = useState<UploadingFile[]>([])

  // Drag-to-reorder state
  const dragItem                    = useRef<number | null>(null)
  const dragOverItem                = useRef<number | null>(null)

  // ── Upload handler ─────────────────────────────────────────────────────────

  const uploadFiles = useCallback(async (files: File[]) => {
    const remaining = maxFiles - value.length
    const toUpload  = files.slice(0, remaining)

    if (toUpload.length === 0) {
      toast.error(`Maximum ${maxFiles} images`)
      return
    }

    const placeholders: UploadingFile[] = toUpload.map((f) => ({
      id:       `${Date.now()}-${Math.random()}`,
      name:     f.name,
      size:     f.size,
      progress: 0,
    }))

    setUploading((prev) => [...prev, ...placeholders])

    const urls: string[] = []

    await Promise.all(
      toUpload.map(async (file, idx) => {
        const placeholder = placeholders[idx]!
        const fd = new FormData()
        fd.append("file",   file)
        fd.append("folder", folder)

        try {
          // Fake progress — XHR needed for real progress, fetch doesn't support it
          setUploading((prev) =>
            prev.map((p) => (p.id === placeholder.id ? { ...p, progress: 40 } : p)),
          )

          const res  = await fetch("/api/upload", { method: "POST", body: fd })
          const body = await res.json() as { url?: string; error?: string }

          if (!res.ok || !body.url) {
            toast.error(body.error ?? `Échec: ${file.name}`)
            return
          }

          setUploading((prev) =>
            prev.map((p) => (p.id === placeholder.id ? { ...p, progress: 100 } : p)),
          )

          urls.push(body.url)
        } catch {
          toast.error(`Erreur réseau: ${file.name}`)
        } finally {
          setUploading((prev) => prev.filter((p) => p.id !== placeholder.id))
        }
      }),
    )

    if (urls.length > 0) {
      onChange([...value, ...urls])
    }
  }, [value, onChange, folder, maxFiles])

  // ── Delete handler ─────────────────────────────────────────────────────────

  const deleteImage = useCallback(async (url: string) => {
    // Remove from UI immediately
    onChange(value.filter((u) => u !== url))

    // Delete from R2 (best-effort)
    fetch("/api/upload/delete", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ url }),
    }).catch(() => {/* ignore */})
  }, [value, onChange])

  // ── Drag to reorder ────────────────────────────────────────────────────────

  function onDragStart(index: number) { dragItem.current = index }
  function onDragEnter(index: number) { dragOverItem.current = index }

  function onDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null) return
    if (dragItem.current === dragOverItem.current) { dragItem.current = null; dragOverItem.current = null; return }

    const reordered = [...value]
    const dragged   = reordered.splice(dragItem.current, 1)[0]!
    reordered.splice(dragOverItem.current, 0, dragged)
    onChange(reordered)
    dragItem.current      = null
    dragOverItem.current  = null
  }

  // ── Drop zone handlers ─────────────────────────────────────────────────────

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) uploadFiles(files)
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) uploadFiles(files)
    e.target.value = ""
  }

  const canAddMore = value.length + uploading.length < maxFiles

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-10 transition ${
            dragOver
              ? "border-orange-400 bg-orange-50"
              : "border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50/50"
          }`}
        >
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm font-semibold text-gray-700">
            Glissez vos images ici
          </p>
          <p className="mt-1 text-xs text-gray-400">
            ou cliquez pour choisir · max {formatFileSize(10 * 1024 * 1024)} · {maxFiles - value.length} restante{maxFiles - value.length > 1 ? "s" : ""}
          </p>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            multiple
            className="sr-only"
            onChange={onFileInput}
          />
        </div>
      )}

      {/* Upload progress indicators */}
      {uploading.map((u) => (
        <div key={u.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{u.name}</p>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-orange-400 transition-all duration-300"
                style={{ width: `${u.progress}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-gray-400 shrink-0">{formatFileSize(u.size)}</span>
        </div>
      ))}

      {/* Image grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2 md:grid-cols-5">
          {value.map((url, idx) => (
            <div
              key={url}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragEnter={() => onDragEnter(idx)}
              onDragEnd={onDragEnd}
              className="group relative aspect-square overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-100 cursor-grab active:cursor-grabbing"
            >
              <Image
                src={url}
                alt={`Image ${idx + 1}`}
                fill
                sizes="(max-width: 768px) 25vw, 20vw"
                className="object-cover"
              />

              {/* Main image badge */}
              {idx === 0 && (
                <span className="absolute left-1 top-1 rounded-md bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  Principal
                </span>
              )}

              {/* Drag handle */}
              <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition">
                <GripVertical className="h-4 w-4 text-white drop-shadow" />
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => deleteImage(url)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <p className="text-xs text-gray-400">
          Glissez pour réorganiser · La première image est l'image principale
        </p>
      )}
    </div>
  )
}
