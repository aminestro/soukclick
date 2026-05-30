import Image from "next/image"
import type { ReviewsData } from "@/types/landing"
import type { Review } from "@prisma/client"

interface ReviewsProps {
  data:      ReviewsData
  reviews:   Review[]
  language?: string
}

const LABELS: Record<string, { verified: string; reviews: string }> = {
  fr:     { verified: "Vérifié",          reviews: "avis"       },
  darija: { verified: "مشتري حقيقي",      reviews: "تعليق"      },
  ar:     { verified: "مشترٍ موثَّق",     reviews: "تقييم"      },
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function Reviews({ data, reviews, language = "fr" }: ReviewsProps) {
  if (reviews.length === 0) return null

  const labels = LABELS[language] ?? LABELS.fr!
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length

  return (
    <section className="bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-3xl">

        {data.title && (
          <h2 className="mb-2 text-center text-xl font-bold text-gray-900 md:text-2xl">
            {data.title}
          </h2>
        )}

        {/* Aggregate rating */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <StarRating rating={Math.round(avgRating)} />
          <span className="text-sm text-gray-500">
            {avgRating.toFixed(1)} / 5 &nbsp;({reviews.length} {labels.reviews})
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 text-sm">
                      {review.authorName}
                    </span>
                    {review.isVerified && (
                      <span className="flex items-center gap-0.5 rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {labels.verified}
                      </span>
                    )}
                  </div>
                  {review.authorCity && (
                    <p className="text-xs text-gray-400">{review.authorCity}</p>
                  )}
                </div>
                <StarRating rating={review.rating} />
              </div>

              {/* Content */}
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                {review.content}
              </p>

              {/* Image */}
              {review.imageUrl && (
                <div className="mt-3 relative h-40 w-full overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={review.imageUrl}
                    alt={`${review.authorName}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
