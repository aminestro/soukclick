import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import "@/app/globals.css";
import { AppProviders } from "@/components/layout/app-providers";
import { siteConfig } from "@/config/site";

const arabic = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
});

const latin = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar-MA" dir="rtl" suppressHydrationWarning>
      <body className={`${arabic.variable} ${latin.variable} font-sans antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

