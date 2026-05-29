import type { CartItem } from "@/types/cart";
import type { Product } from "@/types/product";
import type { MarketingMetadata } from "@/features/analytics/services/utm-service";

export type TrackingEventName =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Lead"
  | "SubmitOrder"
  | "Purchase"
  | "CODOrderPlaced"
  | "UpsellShown"
  | "UpsellAccepted"
  | "UpsellSkipped"
  | "ThankYouViewed";

export type TrackingPayload = Record<string, string | number | boolean | null | undefined | TrackingContent[]>;

export type TrackingContent = {
  id: string;
  quantity: number;
  item_price?: number;
  title?: string;
};

export type TrackingEvent = {
  event_id: string;
  event_name: TrackingEventName;
  value?: number;
  currency?: "MAD";
  contents?: TrackingContent[];
} & TrackingPayload;

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[][]; loaded?: boolean; version?: string };
    ttq?: { track?: (...args: unknown[]) => void; page?: () => void; load?: (...args: unknown[]) => void };
    snaptr?: (...args: unknown[]) => void;
  }
}

export function createEventId(eventName: TrackingEventName) {
  return `${eventName}_${Date.now()}_${crypto.randomUUID()}`;
}

export function trackEvent(eventName: TrackingEventName, payload: TrackingPayload = {}) {
  const event: TrackingEvent = {
    event_id: createEventId(eventName),
    event_name: eventName,
    ...payload,
  };

  if (typeof window === "undefined") {
    return event;
  }

  sendBrowserPixels(event);
  window.dispatchEvent(new CustomEvent("soukclick:track", { detail: event }));
  return event;
}

export function trackPageView(payload: TrackingPayload = {}) {
  return trackEvent("PageView", payload);
}

export function trackProductView(product: Product, marketing?: MarketingMetadata) {
  return trackEvent("ViewContent", {
    product_slug: product.slug,
    product_name: product.darija_name,
    value: product.offers.find((offer) => offer.is_default)?.price ?? product.base_price,
    currency: "MAD",
    contents: [{ id: product.slug, quantity: 1, title: product.darija_name }],
    ...marketing,
  });
}

export function trackAddToCart(product: Product, offerQuantity: number, offerPrice: number, marketing?: MarketingMetadata) {
  return trackEvent("AddToCart", {
    product_slug: product.slug,
    product_name: product.darija_name,
    offer_quantity: offerQuantity,
    value: offerPrice,
    currency: "MAD",
    contents: [{ id: product.slug, quantity: offerQuantity, item_price: offerPrice / offerQuantity, title: product.darija_name }],
    ...marketing,
  });
}

export function trackCheckoutStart(items: CartItem[], value: number, marketing?: MarketingMetadata) {
  return trackEvent("InitiateCheckout", {
    value,
    currency: "MAD",
    contents: cartItemsToContents(items),
    ...marketing,
  });
}

export function trackOrderSubmitted(params: {
  orderCode: string;
  eventId?: string;
  value: number;
  city?: string;
  phone?: string;
  items: CartItem[];
  marketing?: MarketingMetadata;
}) {
  return trackEvent("CODOrderPlaced", {
    event_id: params.eventId,
    order_id: params.orderCode,
    value: params.value,
    currency: "MAD",
    city: params.city,
    phone: params.phone,
    contents: cartItemsToContents(params.items),
    ...params.marketing,
  });
}

export function trackLead(params: { value: number; items: CartItem[]; marketing?: MarketingMetadata }) {
  return trackEvent("Lead", {
    value: params.value,
    currency: "MAD",
    contents: cartItemsToContents(params.items),
    ...params.marketing,
  });
}

export function trackUpsell(action: "shown" | "accepted" | "skipped", payload: TrackingPayload = {}) {
  const eventName = action === "shown" ? "UpsellShown" : action === "accepted" ? "UpsellAccepted" : "UpsellSkipped";
  return trackEvent(eventName, payload);
}

function cartItemsToContents(items: CartItem[]): TrackingContent[] {
  return items.map((item) => ({
    id: item.slug,
    quantity: item.offer.quantity,
    item_price: item.offer.price / item.offer.quantity,
    title: item.darijaName,
  }));
}

function sendBrowserPixels(event: TrackingEvent) {
  sendMetaPixel(event);
  sendTikTokPixel(event);
  sendSnapPixel(event);
}

function sendMetaPixel(event: TrackingEvent) {
  if (!window.fbq) return;
  const metaName = mapMetaEvent(event.event_name);
  window.fbq("track", metaName, pixelPayload(event), { eventID: event.event_id });
}

function sendTikTokPixel(event: TrackingEvent) {
  if (!window.ttq?.track) return;
  const tiktokName = mapTikTokEvent(event.event_name);
  window.ttq.track(tiktokName, pixelPayload(event), { event_id: event.event_id });
}

function sendSnapPixel(event: TrackingEvent) {
  if (!window.snaptr) return;
  const snapName = mapSnapEvent(event.event_name);
  window.snaptr("track", snapName, pixelPayload(event));
}

function pixelPayload(event: TrackingEvent) {
  return {
    event_id: event.event_id,
    value: event.value,
    currency: event.currency ?? "MAD",
    contents: event.contents,
    content_ids: event.contents?.map((content) => content.id),
    content_type: "product",
    order_id: event.order_id,
    city: event.city,
    phone: event.phone,
    utm_source: event.utm_source,
    utm_medium: event.utm_medium,
    utm_campaign: event.utm_campaign,
    utm_content: event.utm_content,
    utm_term: event.utm_term,
  };
}

function mapMetaEvent(eventName: TrackingEventName) {
  if (eventName === "ViewContent") return "ViewContent";
  if (eventName === "AddToCart") return "AddToCart";
  if (eventName === "InitiateCheckout") return "InitiateCheckout";
  if (eventName === "Lead" || eventName === "SubmitOrder") return "Lead";
  if (eventName === "Purchase" || eventName === "CODOrderPlaced") return "Purchase";
  return eventName;
}

function mapTikTokEvent(eventName: TrackingEventName) {
  if (eventName === "CODOrderPlaced" || eventName === "Purchase") return "CompletePayment";
  if (eventName === "Lead" || eventName === "SubmitOrder") return "SubmitForm";
  return eventName;
}

function mapSnapEvent(eventName: TrackingEventName) {
  if (eventName === "PageView") return "PAGE_VIEW";
  if (eventName === "ViewContent") return "VIEW_CONTENT";
  if (eventName === "AddToCart") return "ADD_CART";
  if (eventName === "InitiateCheckout") return "START_CHECKOUT";
  if (eventName === "CODOrderPlaced" || eventName === "Purchase") return "PURCHASE";
  return eventName;
}
