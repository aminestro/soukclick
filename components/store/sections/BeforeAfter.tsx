import Image from "next/image"
import type { BeforeAfterData } from "@/types/landing"

interface BeforeAfterProps {
  data:      BeforeAfterData
  language?: string
}

const LABELS: Record<string, { before: string; after: string }> = {
  fr:     { before: "Avant",  after: "Après" },
  darija: { before: "قبل",    after: "بعد"   },
  ar:     { before: "قبل",    after: "بعد"   },
}

export function BeforeAfter({ data, language = "fr" }: BeforeAfterProps) {
  const labels = LABELS[language] ?? LABELS.fr!

  return (
    <section className="bg-white py-10 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="grid grid-cols-2 gap-3 md:gap-6">

          {/* Before */}
          <div className="flex flex-col gap-2">
            <div className="relative w-full overflow-hidden rounded-2xl bg-gray-100 aspect-[3/4]">
              {data.before_image ? (
                <Image
                  src={data.before_image}
                  alt={labels.before}
                  fill
                  sizes="(max-width: 768px) 50vw, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300 text-3xl">📷</div>
              )}
            </div>
            <span className="flex items-center justify-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 border border-red-100">
              ❌ {labels.before}
            </span>
          </div>

          {/* After */}
          <div className="flex flex-col gap-2">
            <div className="relative w-full overflow-hidden rounded-2xl bg-gray-100 aspect-[3/4]">
              {data.after_image ? (
                <Image
                  src={data.after_image}
                  alt={labels.after}
                  fill
                  sizes="(max-width: 768px) 50vw, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300 text-3xl">📷</div>
              )}
            </div>
            <span className="flex items-center justify-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-600 border border-green-100">
              ✅ {labels.after}
            </span>
          </div>
        </div>

        {data.caption && (
          <p className="mt-5 text-center text-sm text-gray-500 md:text-base">
            {data.caption}
          </p>
        )}
      </div>
    </section>
  )
}
