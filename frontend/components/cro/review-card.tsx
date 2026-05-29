import { Star } from "lucide-react";
import type { ProductReview } from "@/types/product";

export function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <article className="rounded-card border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold">{review.name}</p>
          <p className="text-sm text-gray-500">{review.city}</p>
        </div>
        <div className="flex text-brand-red">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="h-4 w-4 fill-current" />
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-gray-600">{review.body}</p>
    </article>
  );
}
