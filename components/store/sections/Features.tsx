import Image from "next/image"
import type { FeaturesData } from "@/types/landing"

interface FeaturesProps {
  data: FeaturesData
}

export function Features({ data }: FeaturesProps) {
  return (
    <section className="bg-white py-10 px-4">
      <div className="mx-auto max-w-3xl">
        {data.title && (
          <h2 className="mb-8 text-center text-xl font-bold text-gray-900 md:text-2xl">
            {data.title}
          </h2>
        )}

        <div className="space-y-10">
          {data.items.map((item, i) => {
            const isEven = i % 2 === 0
            return (
              <div
                key={i}
                className={`flex flex-col gap-5 md:flex-row md:items-center ${
                  !isEven ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Image */}
                {item.image_url && (
                  <div className="relative w-full overflow-hidden rounded-2xl bg-gray-100 md:w-1/2 aspect-[4/3]">
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Text */}
                <div className={item.image_url ? "md:w-1/2" : "w-full"}>
                  <h3 className="text-lg font-bold text-gray-900 md:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 md:text-base leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
