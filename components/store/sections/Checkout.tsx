import type { CheckoutData } from "@/types/landing"

// Builder preview — shows a non-interactive mockup of the checkout form
export function CheckoutPreview({ data }: { data: CheckoutData }) {
  return (
    <section className="bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-lg">
        {/* Title */}
        <h2 className="mb-5 text-center text-xl font-extrabold text-gray-900">
          {data.title}
        </h2>
        {data.subtitle && (
          <p className="mb-5 text-center text-sm text-gray-500">{data.subtitle}</p>
        )}

        {/* Fake offer cards */}
        <div className="space-y-3 mb-5">
          {[
            { qty: 1, label: "1 قطعة",  price: "170 درهم", pct: "10%", active: true  },
            { qty: 2, label: "قطعتان", price: "250 درهم", pct: "34%", active: false },
          ].map((o, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${
                o.active ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-white"
              }`}
            >
              {data.show_product_images && (
                <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xl">
                  📦
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{o.label}</p>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                  خصم {o.pct}
                </span>
              </div>
              <div className="text-right">
                <p className="text-base font-extrabold text-orange-600">{o.price}</p>
              </div>
              <div className={`h-4 w-4 rounded-full border-2 ${o.active ? "border-orange-500 bg-orange-500" : "border-gray-300"}`} />
            </div>
          ))}
        </div>

        {/* Fake fields — 2-column grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {["الاسم", "الهاتف", "المدينة", "العنوان"].map((f) => (
            <div key={f} className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-right text-sm text-gray-400">
              {f}
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          type="button"
          style={{ backgroundColor: data.cta_color }}
          className="w-full rounded-xl py-4 text-lg font-extrabold text-white shadow-lg"
        >
          {data.cta_text}
        </button>

        {/* Summary */}
        {data.show_summary && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span>🛒 ملخص الطلب</span>
              <span className="text-gray-400">▼</span>
            </div>
          </div>
        )}

        {/* Trust */}
        {data.trust_items.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {data.trust_items.map((item, i) => (
              <span key={i} className="text-xs text-gray-500">{item}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
