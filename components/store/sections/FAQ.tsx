"use client"

import { useState } from "react"
import type { FaqData } from "@/types/landing"

interface FAQProps {
  data: FaqData
}

export function FAQ({ data }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const items = data.items.slice(0, 8)

  return (
    <section className="bg-white py-10 px-4">
      <div className="mx-auto max-w-2xl">
        {data.title && (
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900 md:text-2xl">
            {data.title}
          </h2>
        )}

        <div className="space-y-2">
          {items.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-gray-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm md:text-base">{item.question}</span>
                  <svg
                    className={`h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isOpen ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <p className="px-4 pb-4 text-sm text-gray-600 leading-relaxed md:text-base">
                    {item.answer}
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
