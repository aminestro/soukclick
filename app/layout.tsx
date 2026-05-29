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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="scroll-smooth">
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
