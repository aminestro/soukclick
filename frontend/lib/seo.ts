import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

type SeoInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
};

export function createMetadata({ title, description, path = "/", image }: SeoInput): Metadata {
  const url = new URL(path, siteConfig.url).toString();

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images: image ? [{ url: image }] : undefined,
      locale: "ar_MA",
      type: "website",
    },
  };
}

