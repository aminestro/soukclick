"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import {
  Star, Trash2, Loader2, Plus, Copy, Check,
  Image as ImageIcon, Film, Zap, FileText, Megaphone,
} from "lucide-react"
import { ImageUpload } from "@/components/admin/ImageUpload"

// ─── Types ────────────────────────────────────────────────────────────────────

type CreativeType = "IMAGE" | "VIDEO" | "HOOK" | "UGC_SCRIPT" | "AD_COPY"
type Platform     = "META" | "TIKTOK" | "GOOGLE" | "ALL"

interface Creative {
  id:        string
  productId: string
  type:      CreativeType
  platform:  Platform
  title:     string
  content:   string | null
  fileUrl:   string | null
  isWinner:  boolean
  notes:     string | null
  tags:      string[]
  createdAt: string
}

interface ProductOption { id: string; titleFr: string }

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copié !" : "Copier"}
    </button>
  )
}

// ─── Platform badge ───────────────────────────────────────────────────────────

const PLATFORM_COLOR: Record<Platform, string> = {
  META:   "bg-blue-100 text-blue-700",
  TIKTOK: "bg-pink-100 text-pink-700",
  GOOGLE: "bg-yellow-100 text-yellow-700",
  ALL:    "bg-gray-100 text-gray-600",
}

function PlatformSelect({ value, onChange }: { value: Platform; onChange: (v: Platform) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Platform)}
      className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold outline-none focus:border-orange-400"
    >
      {(["ALL","META","TIKTOK","GOOGLE"] as Platform[]).map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  )
}

// ─── Media grid (Images / Videos) ────────────────────────────────────────────

function MediaTab({
  productId,
  type,
  creatives,
  onUpdate,
  onDelete,
  onAdded,
}: {
  productId:  string
  type:       "IMAGE" | "VIDEO"
  creatives:  Creative[]
  onUpdate:   (id: string, data: Partial<Creative>) => Promise<void>
  onDelete:   (id: string) => Promise<void>
  onAdded:    (c: Creative) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [platform,  setPlatform]  = useState<Platform>("ALL")
  const [title,     setTitle]     = useState("")

  async function handleUpload(urls: string[]) {
    for (const url of urls) {
      setUploading(true)
      const res = await fetch("/api/admin/creatives", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          productId,
          type,
          platform,
          title: title || (type === "IMAGE" ? "Image" : "Vidéo"),
          fileUrl: url,
        }),
      })
      if (res.ok) {
        const c = await res.json() as Creative
        onAdded(c)
        setTitle("")
        toast.success(`${type === "IMAGE" ? "Image" : "Vidéo"} ajoutée`)
      }
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "IMAGE" ? "Nom de l'image (optionnel)" : "Nom de la vidéo (optionnel)"}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
          />
          <PlatformSelect value={platform} onChange={setPlatform} />
        </div>
        <ImageUpload
          value={[]}
          onChange={handleUpload}
          folder="creatives"
          maxFiles={type === "IMAGE" ? 10 : 3}
          accept={type === "IMAGE" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/mov,video/webm"}
        />
        {uploading && <p className="text-xs text-orange-500 flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" />Upload en cours…</p>}
      </div>

      {/* Grid */}
      {creatives.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">Aucun fichier — uploadez ci-dessus</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {creatives.map((c) => (
            <div key={c.id} className="group relative rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              {type === "IMAGE" ? (
                <img src={c.fileUrl ?? ""} alt={c.title} className="aspect-square w-full object-cover" />
              ) : (
                <video src={c.fileUrl ?? ""} className="aspect-video w-full object-cover" muted />
              )}

              {/* Winner star */}
              <button
                type="button"
                onClick={() => onUpdate(c.id, { isWinner: !c.isWinner })}
                className={`absolute top-1.5 left-1.5 rounded-lg p-1 transition ${c.isWinner ? "bg-yellow-400" : "bg-white/70 opacity-0 group-hover:opacity-100"}`}
              >
                <Star className={`h-4 w-4 ${c.isWinner ? "fill-white text-white" : "text-gray-500"}`} />
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => onDelete(c.id)}
                className="absolute top-1.5 right-1.5 rounded-lg bg-white/70 p-1 opacity-0 group-hover:opacity-100 transition text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <div className="p-2">
                <p className="text-xs font-semibold text-gray-700 truncate">{c.title}</p>
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${PLATFORM_COLOR[c.platform]}`}>{c.platform}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Text creative tab (Hook / UGC_SCRIPT / AD_COPY) ─────────────────────────

function TextTab({
  productId,
  type,
  creatives,
  onUpdate,
  onDelete,
  onAdded,
}: {
  productId: string
  type:      "HOOK" | "UGC_SCRIPT" | "AD_COPY"
  creatives: Creative[]
  onUpdate:  (id: string, data: Partial<Creative>) => Promise<void>
  onDelete:  (id: string) => Promise<void>
  onAdded:   (c: Creative) => void
}) {
  const [title,    setTitle]    = useState("")
  const [content,  setContent]  = useState("")
  const [platform, setPlatform] = useState<Platform>("META")
  const [saving,   setSaving]   = useState(false)

  const isAdCopy = type === "AD_COPY"

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    const res = await fetch("/api/admin/creatives", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ productId, type, platform, title: title || type, content }),
    })
    if (res.ok) {
      const c = await res.json() as Creative
      onAdded(c)
      setTitle(""); setContent("")
      toast.success("Créatif ajouté")
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Add form */}
      <form onSubmit={submit} className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isAdCopy ? "Titre / Headline" : "Titre (optionnel)"}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
          />
          <PlatformSelect value={platform} onChange={setPlatform} />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={type === "UGC_SCRIPT" ? 6 : 4}
          placeholder={
            type === "HOOK"       ? "Écrivez votre hook accrocheur…"
            : type === "AD_COPY"  ? "Texte de l'annonce…"
            : "Script UGC complet…"
          }
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none"
        />
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Ajouter
        </button>
      </form>

      {/* List */}
      {creatives.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-6">Aucun créatif — ajoutez-en un ci-dessus</p>
      ) : (
        <div className="space-y-3">
          {creatives.map((c) => (
            <div key={c.id} className={`rounded-2xl border bg-white p-4 shadow-sm transition ${c.isWinner ? "border-yellow-300 bg-yellow-50/30" : "border-gray-200"}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{c.title}</p>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${PLATFORM_COLOR[c.platform]}`}>{c.platform}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdate(c.id, { isWinner: !c.isWinner })}
                    className={`rounded-lg p-1.5 transition ${c.isWinner ? "bg-yellow-400 text-white" : "text-gray-300 hover:text-yellow-400 hover:bg-yellow-50"}`}
                  >
                    <Star className={`h-4 w-4 ${c.isWinner ? "fill-white" : ""}`} />
                  </button>
                  <CopyButton text={c.content ?? ""} />
                  <button
                    type="button"
                    onClick={() => onDelete(c.id)}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS: Array<{ id: CreativeType; label: string; icon: React.ElementType }> = [
  { id: "IMAGE",      label: "Images",      icon: ImageIcon  },
  { id: "VIDEO",      label: "Vidéos",      icon: Film       },
  { id: "HOOK",       label: "Hooks",       icon: Zap        },
  { id: "UGC_SCRIPT", label: "UGC Scripts", icon: FileText   },
  { id: "AD_COPY",    label: "Ad Copy",     icon: Megaphone  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreativesPage() {
  const [products,  setProducts]  = useState<ProductOption[]>([])
  const [productId, setProductId] = useState("")
  const [tab,       setTab]       = useState<CreativeType>("IMAGE")
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    fetch("/api/admin/products?pageSize=100")
      .then((r) => r.json())
      .then((d: { products: ProductOption[] }) => setProducts(d.products ?? []))
  }, [])

  const fetchCreatives = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    const res  = await fetch(`/api/admin/creatives?productId=${productId}&type=${tab}`)
    const data = await res.json() as Creative[]
    setCreatives(data)
    setLoading(false)
  }, [productId, tab])

  useEffect(() => { fetchCreatives() }, [fetchCreatives])

  const updateCreative = useCallback(async (id: string, data: Partial<Creative>) => {
    const res = await fetch(`/api/admin/creatives/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json() as Creative
      setCreatives((prev) => prev.map((c) => c.id === id ? updated : c))
    } else {
      toast.error("Erreur de sauvegarde")
    }
  }, [])

  const deleteCreative = useCallback(async (id: string) => {
    if (!confirm("Supprimer ce créatif ?")) return
    const res = await fetch(`/api/admin/creatives/${id}`, { method: "DELETE" })
    if (res.ok) {
      setCreatives((prev) => prev.filter((c) => c.id !== id))
      toast.success("Créatif supprimé")
    }
  }, [])

  const tabCreatives = creatives.filter((c) => c.type === tab)

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
          Sélectionnez un produit pour gérer ses créatifs
        </div>
      ) : (
        <>
          {/* Type tabs */}
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-100 p-1">
            {TABS.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl bg-gray-100 aspect-square" />
                ))}
              </div>
            ) : (tab === "IMAGE" || tab === "VIDEO") ? (
              <MediaTab
                productId={productId}
                type={tab}
                creatives={tabCreatives}
                onUpdate={updateCreative}
                onDelete={deleteCreative}
                onAdded={(c) => setCreatives((prev) => [c, ...prev])}
              />
            ) : (
              <TextTab
                productId={productId}
                type={tab}
                creatives={tabCreatives}
                onUpdate={updateCreative}
                onDelete={deleteCreative}
                onAdded={(c) => setCreatives((prev) => [c, ...prev])}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
