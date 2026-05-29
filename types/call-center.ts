import type { OrderStatus, ConfirmationStatus } from "@prisma/client"

export interface CCOrder {
  id:                   string
  orderNumber:          string
  customerName:         string
  phone:                string
  wilaya:               string
  address:              string
  quantity:             number
  unitPrice:            number
  deliveryPrice:        number
  total:                number
  status:               OrderStatus
  confirmationStatus:   ConfirmationStatus
  confirmationAttempts: number
  riskScore:            number
  isDuplicate:          boolean
  isBlacklisted:        boolean
  agentNotes:           string | null
  callbackAt:           string | null
  utmSource:            string | null
  utmCampaign:          string | null
  fbclid:               string | null
  pixelEventId:         string | null
  createdAt:            string
  product: {
    id:      string
    titleFr: string
    images:  string[]
  }
  city: {
    id:       string
    nameFr:   string
    wilaya:   string
    isRemote: boolean
  }
  landingPage: { slug: string } | null
  // Enriched fields from API
  duplicateCount: number
  lastOrder: {
    orderNumber: string
    createdAt:   string
    titleFr:     string
  } | null
}

export interface CCStats {
  confirmedToday: number
  cancelledToday: number
  pendingCount:   number
  noAnswerCount:  number
}
