import type { Metadata } from "next"
import { PixelProvider } from "@/components/store/PixelProvider"

export const metadata: Metadata = {
  title: {
    template: "%s | SoukClick",
    default:  "SoukClick — Livraison partout au Maroc",
  },
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PixelProvider
        metaPixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID}
        tiktokPixelId={process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID}
        ga4Id={process.env.NEXT_PUBLIC_GA4_ID}
        gtmId={process.env.NEXT_PUBLIC_GTM_ID}
      />
      {children}
    </>
  )
}
