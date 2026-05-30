"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  MoreVertical, Edit, Copy, Archive, ExternalLink,
  AlertTriangle, Trash2,
} from "lucide-react"
import { calcMargin, marginColor, formatMADShort } from "@/lib/format"
import type { ProductStatus, TestingStatus } from "@prisma/client"

// ─── Badge configs ────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<ProductStatus, { label: string; className: string }> = {
  DRAFT:    { label: "Brouillon", className: "bg-gray-100 text-gray-600"     },
  ACTIVE:   { label: "Actif",     className: "bg-green-100 text-green-700"   },
  PAUSED:   { label: "Pausé",     className: "bg-yellow-100 text-yellow-700" },
  ARCHIVED: { label: "Archivé",   className: "bg-red-100 text-red-700"       },
}

const TESTING_BADGE: Record<TestingStatus, { label: string; className: string }> = {
  TESTING: { label: "Test",    className: "bg-blue-100 text-blue-700"    },
  WINNER:  { label: "Winner",  className: "bg-green-100 text-green-700"  },
  SCALING: { label: "Scaling", className: "bg-purple-100 text-purple-700"},
  STOPPED: { label: "Arrêté",  className: "bg-gray-100 text-gray-600"    },
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: {
    id:            string
    slug:          string
    titleFr:       string
    price:         number
    costPrice:     number
    comparePrice:  number | null
    stock:         number
    lowStockAlert: number
    status:        ProductStatus
    testingStatus: TestingStatus
    images:        string[]
    createdAt:     string
    _count:        { orders: number }
  }
  onArchived?:   () => void
  onDuplicated?: (newId: string) => void
  onDeleted?:    () => void
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

function DeleteModal({
  productName,
  onConfirm,
  onCancel,
  loading,
}: {
  productName: string
  onConfirm:   () => void
  onCancel:    () => void
  loading:     boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>

        <h2 className="mb-1 text-lg font-bold text-gray-900">
          Supprimer ce produit ?
        </h2>
        <p className="mb-1 text-sm text-gray-500">Vous êtes sur le point de supprimer :</p>
        <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800 truncate">
          {productName}
        </p>
        <p className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠️ Cette action est <strong>irréversible</strong>. Le produit, ses images et toutes ses données seront définitivement supprimés.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Suppression…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Supprimer définitivement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductCard({ product, onArchived, onDuplicated, onDeleted }: ProductCardProps) {
  const router      = useRouter()
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [deleteModal,   setDeleteModal]   = useState(false)
  const [loading,       setLoading]       = useState<string | null>(null)

  const margin     = calcMargin(product.price, product.costPrice)
  const marginClr  = marginColor(margin)
  const isLowStock = product.stock < product.lowStockAlert && product.stock >= 0
  const statusCfg  = STATUS_BADGE[product.status]
  const testingCfg = TESTING_BADGE[product.testingStatus]

  async function duplicate() {
    setMenuOpen(false)
    setLoading("dup")
    try {
      const res  = await fetch(`/api/admin/products/${product.id}/duplicate`, { method: "POST" })
      const body = await res.json() as { id?: string; error?: string }
      if (res.ok && body.id) {
        toast.success("Produit dupliqué")
        onDuplicated?.(body.id)
        router.push(`/admin/products/${body.id}/edit`)
      } else {
        toast.error(body.error ?? "Erreur lors de la duplication")
      }
    } catch {
      toast.error("Erreur réseau")
    }
    setLoading(null)
  }

  async function archive() {
    setMenuOpen(false)
    setLoading("arc")
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: "ARCHIVED" }),
      })
      if (res.ok) {
        toast.success("Produit archivé")
        onArchived?.()
      } else {
        const body = await res.json() as { error?: string }
        toast.error(body.error ?? "Erreur lors de l'archivage")
      }
    } catch {
      toast.error("Erreur réseau")
    }
    setLoading(null)
  }

  async function hardDelete() {
    setLoading("del")
    try {
      const res  = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" })
      const body = await res.json() as { success?: boolean; error?: string }
      if (res.ok && body.success) {
        toast.success("Produit supprimé définitivement")
        setDeleteModal(false)
        onDeleted?.()
      } else {
        toast.error(body.error ?? "Erreur lors de la suppression")
        setDeleteModal(false)
      }
    } catch {
      toast.error("Erreur réseau")
      setDeleteModal(false)
    }
    setLoading(null)
  }

  return (
    <>
      <div className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.titleFr}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300 text-4xl">📦</div>
          )}

          {/* Status badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${testingCfg.className}`}>
              {testingCfg.label}
            </span>
          </div>

          {/* Orders badge */}
          {product._count.orders > 0 && (
            <div className="absolute right-2 top-2 rounded-full bg-gray-900/80 px-2 py-0.5 text-[10px] font-bold text-white">
              {product._count.orders} cmd/mois
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-3">
          <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2 mb-2">
            {product.titleFr}
          </h3>

          {/* Price row */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-base font-extrabold text-gray-900">
              {formatMADShort(product.price)}
            </span>
            {product.comparePrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatMADShort(product.comparePrice)}
              </span>
            )}
          </div>

          {/* Cost + margin */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500">
              Coût: {formatMADShort(product.costPrice)}
            </span>
            <span className={`text-xs font-bold ${
              marginClr === "green"  ? "text-green-600" :
              marginClr === "orange" ? "text-orange-500" : "text-red-600"
            }`}>
              {margin.toFixed(1)}%
            </span>
          </div>

          {/* Stock */}
          <div className={`flex items-center gap-1.5 text-xs font-semibold mb-3 ${
            isLowStock ? "text-red-600" : "text-gray-600"
          }`}>
            {isLowStock && <AlertTriangle className="h-3.5 w-3.5" />}
            <span>Stock: {product.stock}</span>
            {isLowStock && <span className="text-red-400">(faible)</span>}
          </div>

          {/* Actions */}
          <div className="mt-auto flex items-center gap-1.5">
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-orange-500 py-2 text-xs font-bold text-white hover:bg-orange-600 transition"
            >
              <Edit className="h-3.5 w-3.5" /> Modifier
            </Link>

            {/* More menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                disabled={!!loading}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-60 transition-colors"
              >
                {loading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                ) : (
                  <MoreVertical className="h-4 w-4" />
                )}
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 bottom-full z-20 mb-1 w-48 rounded-xl border border-gray-200 bg-white shadow-lg py-1 text-sm">
                    <Link
                      href={`/${product.slug}`}
                      target="_blank"
                      className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <ExternalLink className="h-4 w-4 text-gray-400" /> Voir la page
                    </Link>
                    <button
                      type="button"
                      onClick={duplicate}
                      className="flex w-full items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <Copy className="h-4 w-4 text-gray-400" /> Dupliquer
                    </button>

                    <hr className="my-1 border-gray-100" />

                    {product.status !== "ARCHIVED" && (
                      <button
                        type="button"
                        onClick={archive}
                        className="flex w-full items-center gap-2 px-3 py-2 text-orange-600 hover:bg-orange-50"
                      >
                        <Archive className="h-4 w-4" /> Archiver
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); setDeleteModal(true) }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteModal && (
        <DeleteModal
          productName={product.titleFr}
          loading={loading === "del"}
          onConfirm={hardDelete}
          onCancel={() => setDeleteModal(false)}
        />
      )}
    </>
  )
}
