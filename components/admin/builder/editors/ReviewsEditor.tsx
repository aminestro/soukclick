"use client"

import Link from "next/link"
import type { ReviewsData } from "@/types/landing"

interface ReviewOption {
  id:         string
  authorName: string
  authorCity: string | null
  rating:     number
}

interface ReviewsEditorProps {
  data:        ReviewsData
  onChange:    (data: ReviewsData) => void
  reviews:     ReviewOption[]   // from product.reviews
  productId:   string
}

export function ReviewsEditor({ data, onChange, reviews, productId }: ReviewsEditorProps) {
  function toggleReview(id: string) {
    const selected = data.review_ids.includes(id)
      ? data.review_ids.filter((r) => r !== id)
      : [...data.review_ids, id]
    onChange({ ...data, review_ids: selected })
  }

  const selectedCount = data.review_ids.length

  return (
    <div className="space-y-4">
      <div>
        <label className="field-label">Titre de section</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="field-input"
          placeholder="Ce que disent nos clients"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="field-label mb-0">
            Avis sélectionnés
            <span className="ml-1.5 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
              {selectedCount === 0 ? "tous" : `${selectedCount} choisi${selectedCount > 1 ? "s" : ""}`}
            </span>
          </label>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={() => onChange({ ...data, review_ids: [] })}
              className="text-[11px] text-gray-400 hover:text-red-500"
            >
              Tout désélectionner
            </button>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-6 text-center">
            <p className="text-sm text-gray-400">Aucun avis pour ce produit</p>
            <Link
              href={`/admin/products/${productId}/edit`}
              className="mt-1 inline-block text-xs text-orange-500 hover:underline"
            >
              Ajouter des avis →
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {reviews.map((review) => (
              <label
                key={review.id}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer transition ${
                  data.review_ids.includes(review.id)
                    ? "border-orange-300 bg-orange-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={data.review_ids.includes(review.id)}
                  onChange={() => toggleReview(review.id)}
                  className="h-4 w-4 rounded border-gray-300 accent-orange-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{review.authorName}</p>
                  <p className="text-xs text-gray-400">
                    {"⭐".repeat(review.rating)} {review.authorCity && `· ${review.authorCity}`}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        <p className="mt-2 text-[11px] text-gray-400">
          {selectedCount === 0
            ? "Aucun sélectionné = tous les avis actifs s'afficheront"
            : `Seuls les ${selectedCount} avis sélectionnés s'afficheront`}
        </p>
      </div>

      <Link
        href={`/admin/products/${productId}/edit`}
        className="block text-center text-xs font-semibold text-orange-500 hover:underline"
      >
        Gérer les avis du produit →
      </Link>
    </div>
  )
}
