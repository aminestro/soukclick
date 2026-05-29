"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Plus, ExternalLink, Copy, Trash2, Eye, EyeOff, Edit3 } from "lucide-react"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

interface LPCard {
  id:        string
  slug:      string
  template:  string
  isActive:  boolean
  metaTitle: string | null
  createdAt: string
  product:   { id: string; titleFr: string; images: string[] }
  stats:     { totalOrders: number; confirmedOrders: number; conversionPct: number }
  _count:    { orders: number }
}

const TEMPLATE_LABELS: Record<string, string> = {
  PROBLEM_SOLUTION: "Problème / Solution",
  GADGET_DEMO:      "Gadget Demo",
  BEFORE_AFTER:     "Avant / Après",
  BUNDLE:           "Bundle",
  VIRAL:            "Viral",
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPagesPage() {
  const router = useRouter()
  const [pages,      setPages]      = useState<LPCard[]>([])
  const [loading,    setLoading]    = useState(true)
  const [productFilter, setProductFilter] = useState("")
  const [statusFilter,  setStatusFilter]  = useState("")

  const fetchPages = useCallback(async () => {
    setLoading(true)
    const qs = new URLSearchParams({
      ...(productFilter ? { productId: productFilter } : {}),
      ...(statusFilter  ? { status: statusFilter     } : {}),
    })
    const res  = await fetch(`/api/admin/landing-pages?${qs}`)
    const body = await res.json() as LPCard[]
    setPages(Array.isArray(body) ? body : [])
    setLoading(false)
  }, [productFilter, statusFilter])

  useEffect(() => { fetchPages() }, [fetchPages])

  async function duplicate(id: string) {
    const res  = await fetch(`/api/admin/landing-pages/${id}/duplicate`, { method: "POST" })
    const body = await res.json() as { id?: string }
    if (res.ok && body.id) {
      toast.success("Landing page dupliquée")
      router.push(`/admin/landing-pages/${body.id}/builder`)
    } else {
      toast.error("Erreur")
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/landing-pages/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isActive: !current }),
    })
    toast.success(!current ? "Page activée" : "Page désactivée")
    fetchPages()
  }

  async function deletePage(id: string, slug: string) {
    if (!confirm(`Supprimer la landing page /${slug} ?`)) return
    await fetch(`/api/admin/landing-pages/${id}`, { method: "DELETE" })
    toast.success("Page supprimée")
    setPages((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Landing Pages</h1>
          <p className="text-sm text-gray-500">{pages.length} page{pages.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/admin/landing-pages/new"
          className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" /> Créer une Landing Page
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="draft">Brouillon</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
              <div className="h-32 rounded-xl bg-gray-100" />
              <div className="h-4 w-2/3 rounded bg-gray-100" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-20">
          <span className="text-4xl mb-3">📄</span>
          <p className="text-gray-400 text-sm">Aucune landing page créée</p>
          <Link href="/admin/landing-pages/new" className="mt-3 text-orange-500 hover:underline text-sm font-semibold">
            Créer votre première landing page
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => (
            <div
              key={page.id}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col"
            >
              {/* Product thumbnail */}
              <div className="relative h-32 bg-gray-100">
                {page.product.images[0] ? (
                  <Image
                    src={page.product.images[0]}
                    alt={page.product.titleFr}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl">📦</div>
                )}
                {/* Active badge */}
                <div className="absolute top-2 right-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    page.isActive
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}>
                    {page.isActive ? "Actif" : "Brouillon"}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-4 gap-3">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">{page.product.titleFr}</p>
                  <p className="font-bold text-gray-900 text-sm">/{page.slug}</p>
                  <span className="inline-block mt-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                    {TEMPLATE_LABELS[page.template] ?? page.template}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Commandes",   value: page.stats.totalOrders      },
                    { label: "Confirmées",  value: page.stats.confirmedOrders  },
                    { label: "Conversion",  value: `${page.stats.conversionPct}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-gray-50 p-2">
                      <p className="text-sm font-bold text-gray-900">{value}</p>
                      <p className="text-[10px] text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-auto flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={`/admin/landing-pages/${page.id}/builder`}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-orange-500 py-2 text-xs font-bold text-white hover:bg-orange-600"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Builder
                  </Link>
                  <Link
                    href={`/${page.slug}`}
                    target="_blank"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
                    title="Voir la page"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => duplicate(page.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
                    title="Dupliquer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(page.id, page.isActive)}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border hover:bg-gray-50 ${
                      page.isActive ? "border-green-200 text-green-600" : "border-gray-200 text-gray-400"
                    }`}
                    title={page.isActive ? "Désactiver" : "Activer"}
                  >
                    {page.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePage(page.id, page.slug)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-red-400 hover:bg-red-50"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
