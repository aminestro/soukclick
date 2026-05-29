"use client"

import { useState } from "react"
import Image from "next/image"
import type { VideoData } from "@/types/landing"

interface VideoProps {
  data: VideoData
}

function getEmbedUrl(url: string): string {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  )
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`

  // TikTok
  const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/)
  if (ttMatch) return `https://www.tiktok.com/embed/v2/${ttMatch[1]}`

  // Direct mp4 / other
  return url
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url)
}

export function Video({ data }: VideoProps) {
  const [playing, setPlaying] = useState(false)
  const embedUrl = getEmbedUrl(data.url)

  return (
    <section className="bg-gray-900 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-2xl bg-black shadow-2xl">
          {playing ? (
            isDirectVideo(data.url) ? (
              <video
                src={data.url}
                autoPlay
                controls
                playsInline
                className="w-full aspect-video"
              />
            ) : (
              <iframe
                src={embedUrl}
                title="Vidéo produit"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="w-full aspect-video border-0"
              />
            )
          ) : (
            /* Thumbnail with play button */
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="relative block w-full aspect-video group"
              aria-label="Lire la vidéo"
            >
              {data.thumbnail_url ? (
                <Image
                  src={data.thumbnail_url}
                  alt="Aperçu vidéo"
                  fill
                  sizes="(max-width: 768px) 100vw, 672px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-800" />
              )}

              {/* Play button overlay */}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-xl transition group-hover:scale-110 group-active:scale-95">
                  <svg
                    className="ml-1 h-7 w-7 text-gray-900"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            </button>
          )}
        </div>

        {data.caption && (
          <p className="mt-4 text-center text-sm text-gray-300">
            {data.caption}
          </p>
        )}
      </div>
    </section>
  )
}
