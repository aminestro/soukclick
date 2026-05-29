import { apiClient } from "@/lib/api-client";
import type { TrackingEventName, TrackingPayload } from "@/lib/tracking";

export function sendServerTrackingEvent(eventName: TrackingEventName, payload: TrackingPayload) {
  return apiClient<{ ok: boolean }>("/api/v1/tracking/events", {
    method: "POST",
    body: JSON.stringify({
      event_name: eventName,
      payload,
    }),
  });
}

