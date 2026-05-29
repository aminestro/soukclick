"use client"

import { HeroEditor }        from "@/components/admin/builder/editors/HeroEditor"
import { BenefitsEditor }    from "@/components/admin/builder/editors/BenefitsEditor"
import { FeaturesEditor }    from "@/components/admin/builder/editors/FeaturesEditor"
import { VideoEditor }       from "@/components/admin/builder/editors/VideoEditor"
import { ReviewsEditor }     from "@/components/admin/builder/editors/ReviewsEditor"
import { FAQEditor }         from "@/components/admin/builder/editors/FAQEditor"
import { BeforeAfterEditor } from "@/components/admin/builder/editors/BeforeAfterEditor"
import { CTAEditor }         from "@/components/admin/builder/editors/CTAEditor"
import type { LandingSection } from "@/types/landing"

interface ReviewOption {
  id: string; authorName: string; authorCity: string | null; rating: number
}

interface SectionEditorProps {
  section:   LandingSection
  onChange:  (section: LandingSection) => void
  reviews:   ReviewOption[]
  productId: string
}

const SECTION_LABELS: Record<LandingSection["type"], string> = {
  hero:         "Hero",
  benefits:     "Bénéfices",
  features:     "Caractéristiques",
  video:        "Vidéo",
  reviews:      "Avis clients",
  faq:          "FAQ",
  before_after: "Avant / Après",
  cta:          "Appel à l'action",
}

export function SectionEditor({ section, onChange, reviews, productId }: SectionEditorProps) {
  function patchData(newData: LandingSection["data"]) {
    onChange({ ...section, data: newData } as LandingSection)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="font-bold text-gray-900 text-sm">
          Éditer — {SECTION_LABELS[section.type]}
        </h3>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
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
      </div>
    </div>
  )
}
