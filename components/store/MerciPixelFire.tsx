"use client"

import { useEffect } from "react"
import { firePixelEvent, fireTikTokEvent, fireGA4Event } from "@/lib/tracking"

interface MerciPixelFireProps {
  productId:    string
  productName:  string
  total:        number  // centimes
  pixelEventId: string | undefined
}

export function MerciPixelFire({
  productId,
  productName,
  total,
  pixelEventId,
}: MerciPixelFireProps) {
  useEffect(() => {
    const valueMAD = total / 100

    // Lead event (form-submit confirmation)
    firePixelEvent("Lead", {
      contentIds:  [productId],
      contentName: productName,
      value:       valueMAD,
      currency:    "MAD",
      eventId:     pixelEventId ? `lead_${pixelEventId}` : undefined,
    })

    fireTikTokEvent("SubmitForm", {
      contentIds:  [productId],
      contentName: productName,
      value:       valueMAD,
      currency:    "MAD",
    })

    fireGA4Event("generate_lead", {
      value:    valueMAD,
      currency: "MAD",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
