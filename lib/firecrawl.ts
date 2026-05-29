import FirecrawlApp from "@mendable/firecrawl-js"

export function getFirecrawlClient(): FirecrawlApp {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY not configured. Add it in Settings → API Keys or as an environment variable.")
  }
  return new FirecrawlApp({ apiKey })
}

export interface ScrapeResult {
  markdown:   string
  screenshot: string | null   // base64 data URI or public URL
  title:      string | null
  description:string | null
  imageUrls:  string[]
}

export async function scrapeProductPage(url: string): Promise<ScrapeResult> {
  const client = getFirecrawlClient()

  const result = await client.scrapeUrl(url, {
    formats: ["markdown", "screenshot"],
  })

  if (!result.success) {
    throw new Error(`Firecrawl failed: ${(result as { error?: string }).error ?? "unknown error"}`)
  }

  // Extract image URLs from markdown (![alt](url) pattern)
  const imageUrls: string[] = []
  const imgRegex = /!\[[^\]]*\]\((https?:\/\/[^)\s"]+)\)/g
  let match: RegExpExecArray | null
  const markdown = result.markdown ?? ""
  while ((match = imgRegex.exec(markdown)) !== null) {
    const imgUrl = match[1]
    if (imgUrl && !imageUrls.includes(imgUrl)) {
      imageUrls.push(imgUrl)
    }
  }

  return {
    markdown,
    screenshot:  result.screenshot ?? null,
    title:       result.metadata?.title ?? null,
    description: result.metadata?.description ?? null,
    imageUrls:   imageUrls.slice(0, 10),
  }
}
