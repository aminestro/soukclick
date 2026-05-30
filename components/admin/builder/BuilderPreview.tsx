"use client"

import { useEffect, useState, useRef } from "react"
import { Monitor, Smartphone, ExternalLink, ZoomIn, ZoomOut } from "lucide-react"
import type { LandingSection } from "@/types/landing"
import { SectionRenderer } from "@/components/store/SectionRenderer"
import type { Offer, Review } from "@prisma/client"

interface PreviewProduct {
  titleFr:      string
  price:        number
  comparePrice: number | null
  images:       string[]
  reviews:      Review[]
  offers:       Offer[]
}

interface BuilderPreviewProps {
  sections: LandingSection[]
  product:  PreviewProduct
  language?: string
}

type ViewMode = "mobile" | "desktop"

const ZOOM_LEVELS = [50, 75, 100] as const
type ZoomLevel = typeof ZOOM_LEVELS[number]

export function BuilderPreview({ sections, product, language = "fr" }: BuilderPreviewProps) {
  const isRtl = language === "ar" || language === "darija"
  const langAttr = language === "ar" || language === "darija" ? "ar" : "fr"
  const [viewMode,   setViewMode]   = useState<ViewMode>("mobile")
  const [zoom,       setZoom]       = useState<ZoomLevel>(100)
  const [renderKey,  setRenderKey]  = useState(0)
  const [isPending,  setIsPending]  = useState(false)
  const [displayed,  setDisplayed]  = useState(sections)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setIsPending(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDisplayed(sections)
      setRenderKey((k) => k + 1)
      setIsPending(false)
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [sections])

  const orderedSections = [...displayed]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)

  const frameWidth   = viewMode === "mobile" ? 375 : 1200
  const scaledWidth  = Math.round(frameWidth * zoom / 100)
  const isMobile     = viewMode === "mobile"

  function cycleZoom(dir: 1 | -1) {
    const idx = ZOOM_LEVELS.indexOf(zoom)
    const next = ZOOM_LEVELS[Math.max(0, Math.min(ZOOM_LEVELS.length - 1, idx + dir))]
    if (next) setZoom(next)
  }

  return (
    <div className="flex h-full flex-col bg-[#F0F0F0]">

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">

        {/* Device toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          <button
            onClick={() => setViewMode("mobile")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all ${
              isMobile
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Mobile
            {isMobile && <span className="text-[10px] text-orange-400">375px</span>}
          </button>
          <button
            onClick={() => setViewMode("desktop")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all ${
              !isMobile
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            Desktop
            {!isMobile && <span className="text-[10px] text-orange-400">1200px</span>}
          </button>
        </div>

        {/* Center — pending indicator */}
        <div className="flex items-center gap-2">
          {isPending && (
            <div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-600">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              Mise à jour…
            </div>
          )}
        </div>

        {/* Right — zoom + open */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            <button
              onClick={() => cycleZoom(-1)}
              disabled={zoom === ZOOM_LEVELS[0]}
              className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-gray-800 disabled:opacity-30 transition-colors"
            >
              <ZoomOut className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-[11px] font-bold text-gray-700">{zoom}%</span>
            <button
              onClick={() => cycleZoom(1)}
              disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-gray-800 disabled:opacity-30 transition-colors"
            >
              <ZoomIn className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview viewport */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-h-full items-start justify-center p-6">

          {/* Device shell */}
          <div
            className="relative transition-all duration-300"
            style={{ width: scaledWidth }}
          >
            {/* Mobile device frame */}
            {isMobile && (
              <div
                className="relative rounded-[2.5rem] border-[6px] border-gray-800 bg-gray-800 shadow-2xl shadow-black/30"
                style={{ minHeight: 780 }}
              >
                {/* Notch */}
                <div className="absolute inset-x-0 top-0 flex justify-center pt-2 z-10">
                  <div className="h-4 w-20 rounded-full bg-gray-900" />
                </div>

                {/* Screen */}
                <div
                  className="relative overflow-hidden rounded-[2rem] bg-white"
                  style={{ minHeight: 744 }}
                >
                  {/* Loading overlay */}
                  {isPending && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
                      <div className="h-8 w-8 rounded-full border-3 border-gray-200 border-t-orange-500 animate-spin" />
                    </div>
                  )}
                  <div key={renderKey} dir={isRtl ? "rtl" : "ltr"} lang={langAttr}>
                    {orderedSections.length === 0 ? (
                      <EmptyPreview />
                    ) : (
                      <SectionRenderer sections={displayed} product={product} language={language} />
                    )}
                  </div>
                </div>

                {/* Home bar */}
                <div className="flex justify-center py-2">
                  <div className="h-1 w-20 rounded-full bg-gray-600" />
                </div>
              </div>
            )}

            {/* Desktop frame */}
            {!isMobile && (
              <div
                className="relative overflow-hidden rounded-xl border border-gray-300 bg-white shadow-xl shadow-black/10"
                style={{ minHeight: 600 }}
              >
                {/* Browser chrome */}
                <div className="flex h-9 items-center gap-2 border-b border-gray-200 bg-gray-100 px-3">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="mx-auto flex h-5 w-56 items-center rounded-md bg-white px-2 text-[10px] text-gray-400 border border-gray-200">
                    <span className="truncate">soukclick.ma/…</span>
                  </div>
                  <div className="h-5 w-5" />
                </div>

                {/* Loading overlay */}
                {isPending && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
                    <div className="h-8 w-8 rounded-full border-3 border-gray-200 border-t-orange-500 animate-spin" />
                  </div>
                )}

                <div key={renderKey}>
                  {orderedSections.length === 0 ? (
                    <EmptyPreview />
                  ) : (
                    <SectionRenderer sections={displayed} product={product} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyPreview() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-xl">
        📄
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-600">Aucune section active</p>
        <p className="mt-1 text-[11px] text-gray-400">Activez ou ajoutez des sections depuis le panneau gauche</p>
      </div>
    </div>
  )
}
