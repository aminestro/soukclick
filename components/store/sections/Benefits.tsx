import type { BenefitsData } from "@/types/landing"

interface BenefitsProps {
  data: BenefitsData
}

export function Benefits({ data }: BenefitsProps) {
  return (
    <section className="bg-white py-10 px-4">
      <div className="mx-auto max-w-3xl">
        {data.title && (
          <h2 className="mb-8 text-center text-xl font-bold text-gray-900 md:text-2xl">
            {data.title}
          </h2>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {data.items.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center shadow-sm"
            >
              <span className="mb-2 text-3xl" role="img" aria-hidden="true">
                {item.icon}
              </span>
              <h3 className="text-sm font-bold text-gray-900 md:text-base">
                {item.title}
              </h3>
              <p className="mt-1 text-xs text-gray-500 md:text-sm">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
