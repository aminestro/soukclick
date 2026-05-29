import Image from "next/image"
import type { BeforeAfterData } from "@/types/landing"

interface BeforeAfterProps {
  data: BeforeAfterData
}

export function BeforeAfter({ data }: BeforeAfterProps) {
  return (
    <section className="bg-white py-10 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="grid grid-cols-2 gap-3 md:gap-6">
          {/* Before */}
          <div className="flex flex-col gap-2">
            <div className="relative w-full overflow-hidden rounded-2xl bg-gray-100 aspect-[3/4]">
              <Image
                src={data.before_image}
                alt="Avant"
                fill
                sizes="(max-width: 768px) 50vw, 40vw"
                className="object-cover"
              />
            </div>
            <span className="flex items-center justify-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 border border-red-100">
              ❌ Avant
            </span>
          </div>

          {/* After */}
          <div className="flex flex-col gap-2">
            <div className="relative w-full overflow-hidden rounded-2xl bg-gray-100 aspect-[3/4]">
              <Image
                src={data.after_image}
                alt="Après"
                fill
                sizes="(max-width: 768px) 50vw, 40vw"
                className="object-cover"
              />
            </div>
            <span className="flex items-center justify-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-600 border border-green-100">
              ✅ Après
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
