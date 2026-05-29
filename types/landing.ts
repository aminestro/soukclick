// ─── Section type discriminated union ─────────────────────────────────────────

export type SectionType =
  | "hero"
  | "benefits"
  | "features"
  | "video"
  | "reviews"
  | "faq"
  | "before_after"
  | "cta"

interface BaseSection {
  type:    SectionType
  enabled: boolean
  order:   number
}

// hero -------------------------------------------------------------------------

export interface HeroBadge {
  id:    "cod" | "livraison_gratuite" | "garantie" | "retour"
  label: string
}

export interface HeroData {
  headline:           string
  subheadline:        string
  image_url:          string | null
  video_url:          string | null
  cta_text:           string
  cta_color:          string
  show_price:         boolean
  show_compare_price: boolean
  badges:             Array<"cod" | "livraison_gratuite" | "garantie" | "retour">
}

export interface HeroSection extends BaseSection {
  type: "hero"
  data: HeroData
}

// benefits --------------------------------------------------------------------

export interface BenefitItem {
  icon:        string
  title:       string
  description: string
}

export interface BenefitsData {
  title: string
  items: BenefitItem[]
}

export interface BenefitsSection extends BaseSection {
  type: "benefits"
  data: BenefitsData
}

// features --------------------------------------------------------------------

export interface FeatureItem {
  image_url:   string | null
  title:       string
  description: string
}

export interface FeaturesData {
  title: string
  items: FeatureItem[]
}

export interface FeaturesSection extends BaseSection {
  type: "features"
  data: FeaturesData
}

// video -----------------------------------------------------------------------

export interface VideoData {
  url:           string
  thumbnail_url: string | null
  caption:       string | null
}

export interface VideoSection extends BaseSection {
  type: "video"
  data: VideoData
}

// reviews ---------------------------------------------------------------------

export interface ReviewsData {
  title:      string
  review_ids: string[]
}

export interface ReviewsSection extends BaseSection {
  type: "reviews"
  data: ReviewsData
}

// faq -------------------------------------------------------------------------

export interface FaqItem {
  question: string
  answer:   string
}

export interface FaqData {
  title: string
  items: FaqItem[]
}

export interface FaqSection extends BaseSection {
  type: "faq"
  data: FaqData
}

// before_after ----------------------------------------------------------------

export interface BeforeAfterData {
  before_image: string
  after_image:  string
  caption:      string | null
}

export interface BeforeAfterSection extends BaseSection {
  type: "before_after"
  data: BeforeAfterData
}

// cta -------------------------------------------------------------------------

export interface CtaData {
  headline:     string
  cta_text:     string
  cta_color:    string
  urgency_text: string | null
}

export interface CtaSection extends BaseSection {
  type: "cta"
  data: CtaData
}

// union -----------------------------------------------------------------------

export type LandingSection =
  | HeroSection
  | BenefitsSection
  | FeaturesSection
  | VideoSection
  | ReviewsSection
  | FaqSection
  | BeforeAfterSection
  | CtaSection
