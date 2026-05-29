"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import {
  Star, Trash2, GripVertical, Loader2, Plus, Image as ImageIcon,
} from "lucide-react"
import { ImageUpload } from "@/components/admin/ImageUpload"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Review {
  id:         string
  productId:  string
  authorName: string
  authorCity: string | null
  rating:     number
  content:    string
  imageUrl:   string | null
  isVerified: boolean
  isActive:   boolean
  sortOrder:  number
  createdAt:  string
}

interface ProductOption { id: string; titleFr: string }

// ─── Star rating ──────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "sm",
}: {
  value:     number
  onChange?: (v: number) => void
  readonly?: boolean
  size?:     "sm" | "md"
}) {
  const cls = size === "md" ? "h-5 w-5" : "h-4 w-4"
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !readonly && onChange?.(n)}
          disabled={readonly}
          className="disabled:cursor-default"
        >
          <Star
            className={`${cls} transition ${n <= value ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} ${!readonly ? "hover:fill-yellow-300 hover:text-yellow-300" : ""}`}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${value ? "bg-green-500" : "bg-gray-300"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${value ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  )
}

// ─── Review row ───────────────────────────────────────────────────────────────

function ReviewRow({
  review,
  onUpdate,
  onDelete,
  dragHandleProps,
}: {
  review:           Review
  onUpdate:         (id: string, data: Partial<Review>) => Promise<void>
  onDelete:         (id: string) => Promise<void>
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm("Supprimer cet avis ?")) return
    setDeleting(true)
    await onDelete(review.id)
    setDeleting(false)
  }

  return (
    <tr className="hover:bg-gray-50 transition group">
      {/* Drag handle */}
      <td className="px-2 py-3 text-center">
        <div {...dragHandleProps} className="cursor-grab text-gray-300 hover:text-gray-500 inline-flex">
          <GripVertical className="h-4 w-4" />
        </div>
      </td>

      <td className="px-3 py-3">
        <div className="font-medium text-gray-900 text-sm">{review.authorName}</div>
        {review.authorCity && <div className="text-xs text-gray-400">{review.authorCity}</div>}
      </td>

      <td className="px-3 py-3">
        <StarRating value={review.rating} readonly />
      </td>

      <td className="px-3 py-3 max-w-[240px]">
        <p className="text-sm text-gray-600 line-clamp-2">{review.content}</p>
      </td>

      <td className="px-3 py-3">
        {review.imageUrl
          ? <img src={review.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
          : <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center"><ImageIcon className="h-4 w-4 text-gray-300" /></div>
        }
      </td>

      <td className="px-3 py-3">
        <Toggle value={review.isVerified} onChange={(v) => onUpdate(review.id, { isVerified: v })} />
      </td>

      <td className="px-3 py-3">
        <Toggle value={review.isActive} onChange={(v) => onUpdate(review.id, { isActive: v })} />
      </td>

      <td className="px-3 py-3 text-xs text-gray-400">
        {new Date(review.createdAt).toLocaleDateString("fr-MA")}
      </td>

      <td className="px-3 py-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 transition rounded-lg p-1.5 text-red-400 hover:bg-red-50 disabled:opacity-40"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </td>
    </tr>
  )
}

// ─── Add review form ──────────────────────────────────────────────────────────

function AddReviewForm({
  productId,
  onAdded,
}: {
  productId: string
  onAdded:   (r: Review) => void
}) {
  const [name,    setName]    = useState("")
  const [city,    setCity]    = useState("")
  const [rating,  setRating]  = useState(5)
  const [content, setContent] = useState("")
  const [imageUrl,setImageUrl]= useState<string | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [open,    setOpen]    = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return
    setSaving(true)
    const res = await fetch("/api/admin/reviews", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ productId, authorName: name, authorCity: city || null, rating, content, imageUrl }),
    })
    const body = await res.json() as Review & { error?: string }
    if (res.ok) {
      onAdded(body)
      setName(""); setCity(""); setRating(5); setContent(""); setImageUrl(null)
      setOpen(false)
      toast.success("Avis ajouté")
    } else {
      toast.error(body.error ?? "Erreur")
    }
    setSaving(false)
  }

  if (!open) return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-500 hover:border-orange-400 hover:text-orange-500 transition w-full justify-center"
    >
      <Plus className="h-4 w-4" />
      Ajouter un avis
    </button>
  )

  return (
    <form onSubmit={submit} className="rounded-2xl border border-orange-200 bg-orange-50/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Nouvel avis</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">Annuler</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Nom *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Ville</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-500">Note</label>
        <StarRating value={rating} onChange={setRating} size="md" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500">Avis *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={3}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500">Photo (optionnel)</label>
        <ImageUpload
          value={imageUrl ? [imageUrl] : []}
          onChange={(urls) => setImageUrl(urls[0] ?? null)}
          maxFiles={1}
        />
      </div>

      <button
        type="submit"
        disabled={saving || !name.trim() || !content.trim()}
        className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Ajouter l'avis
      </button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const [products,  setProducts]  = useState<ProductOption[]>([])
  const [productId, setProductId] = useState("")
  const [reviews,   setReviews]   = useState<Review[]>([])
  const [loading,   setLoading]   = useState(false)
  const dragItem    = useRef<number | null>(null)
  const dragOver    = useRef<number | null>(null)

  useEffect(() => {
    fetch("/api/admin/products?pageSize=100")
      .then((r) => r.json())
      .then((d: { products: ProductOption[] }) => setProducts(d.products ?? []))
  }, [])

  const fetchReviews = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    const res  = await fetch(`/api/admin/reviews?productId=${productId}`)
    const data = await res.json() as Review[]
    setReviews(data)
    setLoading(false)
  }, [productId])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const updateReview = useCallback(async (id: string, data: Partial<Review>) => {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json() as Review
      setReviews((prev) => prev.map((r) => r.id === id ? updated : r))
    } else {
      toast.error("Erreur de sauvegarde")
    }
  }, [])

  const deleteReview = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" })
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== id))
      toast.success("Avis supprimé")
    }
  }, [])

  // ── Drag-to-reorder ──────────────────────────────────────────────────────────

  function handleDragStart(i: number) { dragItem.current = i }
  function handleDragEnter(i: number) { dragOver.current = i }

  async function handleDrop() {
    const from = dragItem.current
    const to   = dragOver.current
    if (from === null || to === null || from === to) return
    dragItem.current = null; dragOver.current = null

    const reordered = [...reviews]
    const [moved]   = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)

    // Optimistic update
    const updated = reordered.map((r, i) => ({ ...r, sortOrder: i }))
    setReviews(updated)

    // Persist each changed sort_order
    await Promise.all(
      updated
        .filter((r, i) => r.sortOrder !== reviews[i]?.sortOrder)
        .map((r) => updateReview(r.id, { sortOrder: r.sortOrder }))
    )
  }

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
          Sélectionnez un produit pour gérer ses avis
        </div>
      ) : (
        <>
          {/* Reviews table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <h2 className="text-sm font-bold text-gray-900">
                Avis{reviews.length > 0 ? ` (${reviews.length})` : ""}
              </h2>
              <p className="text-xs text-gray-400">Glissez les lignes pour réordonner</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-2 py-3 w-10" />
                    {["Auteur","Note","Avis","Photo","Vérifié","Actif","Date",""].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 9 }).map((__, j) => (
                          <td key={j} className="px-3 py-3"><div className="h-4 w-16 rounded bg-gray-100" /></td>
                        ))}
                      </tr>
                    ))
                  ) : reviews.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                        Aucun avis — ajoutez-en un ci-dessous
                      </td>
                    </tr>
                  ) : (
                    reviews.map((review, i) => (
                      <tr
                        key={review.id}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragEnter={() => handleDragEnter(i)}
                        onDragEnd={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="hover:bg-gray-50 transition group"
                      >
                        <td className="px-2 py-3 text-center">
                          <div className="cursor-grab text-gray-300 hover:text-gray-500 inline-flex">
                            <GripVertical className="h-4 w-4" />
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-gray-900">{review.authorName}</div>
                          {review.authorCity && <div className="text-xs text-gray-400">{review.authorCity}</div>}
                        </td>
                        <td className="px-3 py-3"><StarRating value={review.rating} readonly /></td>
                        <td className="px-3 py-3 max-w-[240px]">
                          <p className="text-sm text-gray-600 line-clamp-2">{review.content}</p>
                        </td>
                        <td className="px-3 py-3">
                          {review.imageUrl
                            ? <img src={review.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            : <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center"><ImageIcon className="h-4 w-4 text-gray-300" /></div>
                          }
                        </td>
                        <td className="px-3 py-3">
                          <Toggle value={review.isVerified} onChange={(v) => updateReview(review.id, { isVerified: v })} />
                        </td>
                        <td className="px-3 py-3">
                          <Toggle value={review.isActive} onChange={(v) => updateReview(review.id, { isActive: v })} />
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString("fr-MA")}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm("Supprimer cet avis ?")) return
                              await deleteReview(review.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition rounded-lg p-1.5 text-red-400 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add form */}
          <AddReviewForm
            productId={productId}
            onAdded={(r) => setReviews((prev) => [...prev, r])}
          />
        </>
      )}
    </div>
  )
}
