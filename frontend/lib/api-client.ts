import { publicEnv } from "@/lib/env";

type ApiRequestOptions = RequestInit & {
  next?: NextFetchRequestConfig;
};

export async function apiClient<TResponse>(path: string, options: ApiRequestOptions = {}) {
  const response = await fetch(`${publicEnv.NEXT_PUBLIC_API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
    ...options,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    const fallback = response.status === 403 ? "ماقدرناش نكملو الطلب دابا، عافاك تواصل معنا فالواتساب." : `API request failed: ${response.status}`;
    const detail = typeof errorPayload?.detail === "string" ? errorPayload.detail : fallback;
    throw new Error(detail);
  }

  return response.json() as Promise<TResponse>;
}
