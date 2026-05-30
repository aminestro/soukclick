"use client"

import { useState } from "react"
import { HeroEditor }        from "@/components/admin/builder/editors/HeroEditor"
import { BenefitsEditor }    from "@/components/admin/builder/editors/BenefitsEditor"
import { FeaturesEditor }    from "@/components/admin/builder/editors/FeaturesEditor"
import { VideoEditor }       from "@/components/admin/builder/editors/VideoEditor"
import { ReviewsEditor }     from "@/components/admin/builder/editors/ReviewsEditor"
import { FAQEditor }         from "@/components/admin/builder/editors/FAQEditor"
import { BeforeAfterEditor } from "@/components/admin/builder/editors/BeforeAfterEditor"
import { CTAEditor }         from "@/components/admin/builder/editors/CTAEditor"
import { CheckoutEditor }    from "@/components/admin/builder/editors/CheckoutEditor"
import type { LandingSection } from "@/types/landing"

interface ReviewOption {
  id: string; authorName: string; authorCity: string | null; rating: number
}

interface SectionEditorProps {
  section:   LandingSection
  onChange:  (section: LandingSection) => void
  reviews:   ReviewOption[]
  productId: string
  language?: string
}

const LANG_LABEL: Record<string, string> = {
  fr:     "🇫🇷 Français",
  darija: "🇲🇦 Darija",
  ar:     "🇸🇦 Arabe",
}

const SECTION_META: Record<LandingSection["type"], { label: string; icon: string; tabs: string[] }> = {
  hero:         { label: "Hero",              icon: "🦸", tabs: ["Contenu"] },
  benefits:     { label: "Bénéfices",         icon: "✨", tabs: ["Contenu"] },
  features:     { label: "Caractéristiques",  icon: "⚡", tabs: ["Contenu"] },
  video:        { label: "Vidéo",             icon: "🎥", tabs: ["Contenu"] },
  reviews:      { label: "Avis clients",      icon: "⭐", tabs: ["Contenu"] },
  faq:          { label: "FAQ",               icon: "❓", tabs: ["Contenu"] },
  before_after: { label: "Avant / Après",     icon: "🔄", tabs: ["Contenu"] },
  cta:          { label: "Appel à l'action",  icon: "🎯", tabs: ["Contenu"] },
  checkout:     { label: "Formulaire Commande", icon: "🛒", tabs: ["Contenu"] },
}

export function SectionEditor({ section, onChange, reviews, productId, language = "fr" }: SectionEditorProps) {
  const [activeTab, setActiveTab] = useState(0)
  const meta  = SECTION_META[section.type]
  const isRtl = language === "ar" || language === "darija"

  function patchData(newData: LandingSection["data"]) {
    onChange({ ...section, data: newData } as LandingSection)
  }

  return (
    <div className="flex h-full flex-col">

      {/* Panel header */}
      <div className="border-b border-gray-100 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-lg leading-none">
              {meta.icon}
            </div>
            <div>
              <p className="text-[13px] font-bold text-gray-900 leading-tight">Éditer</p>
              <p className="text-[11px] text-gray-400 leading-tight">{meta.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-gray-400">
              {LANG_LABEL[language] ?? language}
            </span>
            {isRtl && (
              <span className="rounded-md bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-600 leading-none">
                RTL
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        {meta.tabs.length > 1 && (
          <div className="mt-3 flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-0.5">
            {meta.tabs.map((tab, i) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`flex-1 rounded-md py-1.5 text-[12px] font-semibold transition-all ${
                  activeTab === i
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto px-4 py-4" dir={isRtl ? "rtl" : "ltr"}>
        {section.type === "hero" && (
          <HeroEditor data={section.data} onChange={patchData} />
        )}
        {section.type === "benefits" && (
          <BenefitsEditor data={section.data} onChange={patchData} />
        )}
        {section.type === "features" && (
          <FeaturesEditor data={section.data} onChange={patchData} />
        )}
        {section.type === "video" && (
          <VideoEditor data={section.data} onChange={patchData} />
        )}
        {section.type === "reviews" && (
          <ReviewsEditor
            data={section.data}
            onChange={patchData}
            reviews={reviews}
            productId={productId}
          />
        )}
        {section.type === "faq" && (
          <FAQEditor data={section.data} onChange={patchData} />
        )}
        {section.type === "before_after" && (
          <BeforeAfterEditor data={section.data} onChange={patchData} />
        )}
        {section.type === "cta" && (
          <CTAEditor data={section.data} onChange={patchData} />
        )}
        {section.type === "checkout" && (
          <CheckoutEditor data={section.data} onChange={patchData} />
        )}
      </div>
    </div>
  )
}
