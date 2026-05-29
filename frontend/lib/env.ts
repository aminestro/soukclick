import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("https://soukclick.ma"),
  NEXT_PUBLIC_API_URL: z.string().url().default("https://api.soukclick.ma"),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
  NEXT_PUBLIC_TIKTOK_PIXEL_ID: z.string().optional(),
  NEXT_PUBLIC_SNAP_PIXEL_ID: z.string().optional(),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
  NEXT_PUBLIC_TIKTOK_PIXEL_ID: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
  NEXT_PUBLIC_SNAP_PIXEL_ID: process.env.NEXT_PUBLIC_SNAP_PIXEL_ID,
});
