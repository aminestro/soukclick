"use client"

import { useEffect, useState, useRef } from "react"
import { Monitor, Smartphone, RefreshCw } from "lucide-react"
import type { LandingSection } from "@/types/landing"
import { SectionRenderer } from "@/components/store/SectionRenderer"
import type { Offer, Review } from "@prisma/client"

interface PreviewProduct {
  titleFr:     string
  price:       number
  comparePrice:number | null
  images:      string[]
  reviews:     Review[]
  offers:      Offer[]
}

interface BuilderPreviewProps {
  sections: LandingSection[]
  product:  PreviewProduct
}

type ViewMode = "mobile" | "desktop"

export function BuilderPreview({ sections, product }: BuilderPreviewProps) {
  const [viewMode, setViewMode]     = useState<ViewMode>("mobile")
  const [renderKey, setRenderKey]   = useState(0)
  const [isRendering, setIsRendering] = useState(false)
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [displayedSections, setDisplayedSections] = useState(sections)

  // Debounce section updates so the preview doesn't thrash on every keystroke
  useEffect(() => {
    setIsRendering(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDisplayedSections(sections)
      setRenderKey((k) => k + 1)
      setIsRendering(false)
    }, 500)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [sections])

  const orderedSections = [...displayedSections]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)

  const frameWidth = viewMode === "mobile" ? "375px" : "100%"

  return (
    <div className="flex h-full flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 p-1">
          <button
            onClick={() => setViewMode("mobile")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "mobile"
                ? "bg-orange-500 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" /> Mobile
          </button>
          <button
            onClick={() => setViewMode("desktop")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "desktop"
                ? "bg-orange-500 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" /> Desktop
          </button>
        </div>

        <button
          onClick={() => setRenderKey((k) => k + 1)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
          title="Actualiser la prévisualisation"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Actualiser
        </button>
      </div>

      {/* Preview frame */}
      <div className="flex-1 overflow-auto p-4 flex justify-center">
        <div
          className="relative transition-all duration-300 bg-white shadow-xl overflow-hidden"
          style={{
            width:     frameWidth,
            minWidth:  viewMode === "mobile" ? "375px" : "100%",
            maxWidth:  viewMode === "desktop" ? "1200px" : "375px",
            minHeight: "600px",
            borderRadius: viewMode === "mobile" ? "24px" : "12px",
          }}
        >
          {/* Loading overlay */}
          {isRendering && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
                <p className="text-xs text-gray-500">Mise à jour…</p>
              </div>
            </div>
          )}

          {/* Mobile notch decoration */}
          {viewMode === "mobile" && (
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1.5 w-16 rounded-full bg-gray-200" />
            </div>
          )}

          {/* Actual sections render */}
          <div key={renderKey}>
            {orderedSections.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-gray-400 text-sm">
                Activez des sections pour voir la prévisualisation
              </div>
            ) : (
              <SectionRenderer sections={displayedSections} product={product} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
