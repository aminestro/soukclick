import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: {
    template: "%s | SoukClick",
    default:  "SoukClick — Livraison partout au Maroc",
  },
  description: "Produits tendance livrés partout au Maroc — Paiement à la livraison",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://soukclick.store"),
}

export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
  minimumScale: 1,
  themeColor:   "#F97316",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        {/* Preconnect to image CDN — eliminates connection latency for LCP image */}
        <link rel="preconnect" href="https://media.soukclick.store" />
        <link rel="dns-prefetch" href="https://media.soukclick.store" />
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="https://wa.me" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://analytics.tiktok.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className="min-w-[375px] antialiased font-sans">
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{ duration: 4000 }}
        />
      </body>
    </html>
  )
}
