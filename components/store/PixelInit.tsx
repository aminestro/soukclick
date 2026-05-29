"use client"

import { useEffect } from "react"
import { captureClickIds, firePixelEvent, fireTikTokEvent, fireGA4Event } from "@/lib/tracking"

interface PixelInitProps {
  productId:   string
  productName: string
  price:       number  // centimes
  slug:        string
}

export function PixelInit({ productId, productName, price }: PixelInitProps) {
  useEffect(() => {
    // 1. Capture UTM params + click IDs → sessionStorage
    captureClickIds()

    // 2. ViewContent after 2 seconds
    const timer = setTimeout(() => {
      const priceMAD = price / 100

      firePixelEvent("ViewContent", {
        contentIds:  [productId],
        contentName: productName,
        contentType: "product",
        value:       priceMAD,
        currency:    "MAD",
      })

      fireTikTokEvent("ViewContent", {
        contentIds:  [productId],
        contentName: productName,
        value:       priceMAD,
        currency:    "MAD",
      })

      fireGA4Event("view_item", {
        contentIds:  [productId],
        contentName: productName,
        value:       priceMAD,
        currency:    "MAD",
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [productId, productName, price])

  return null
}
