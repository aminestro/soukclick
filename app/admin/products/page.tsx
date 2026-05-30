"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Search, LayoutGrid, List, Plus, Trash2, AlertTriangle } from "lucide-react"
import { ProductCard } from "@/components/admin/products/ProductCard"
import { StatusBadge }  from "@/components/admin/StatusBadge"
import { DataTable, type Column } from "@/components/admin/DataTable"
import { formatMADShort, calcMargin } from "@/lib/format"
import { toast } from "sonner"
import type { ProductStatus, TestingStatus } from "@prisma/client"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductRow {
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

const STATUSES = [
  { value: "",         label: "Tous les statuts" },
  { value: "ACTIVE",   label: "Actif"            },
  { value: "DRAFT",    label: "Brouillon"        },
  { value: "PAUSED",   label: "Pausé"            },
  { value: "ARCHIVED", label: "Archivé"          },
]

const TESTING = [
  { value: "",         label: "Tous les phases" },
  { value: "TESTING",  label: "En test"         },
  { value: "WINNER",   label: "Winner"          },
  { value: "SCALING",  label: "Scaling"         },
  { value: "STOPPED",  label: "Arrêté"          },
]

const SORTS = [
  { value: "newest",    label: "Plus récents"      },
  { value: "stock_asc", label: "Stock (croissant)" },
  { value: "price_asc", label: "Prix (croissant)"  },
]

const TESTING_BADGE: Record<TestingStatus, string> = {
  TESTING: "bg-blue-100 text-blue-700",
  WINNER:  "bg-green-100 text-green-700",
  SCALING: "bg-purple-100 text-purple-700",
  STOPPED: "bg-gray-100 text-gray-600",
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && onCancel()} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="mb-1 text-lg font-bold text-gray-900">Supprimer ce produit ?</h2>
        <p className="mb-1 text-sm text-gray-500">Vous êtes sur le point de supprimer :</p>
        <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800 truncate">
          {productName}
        </p>
        <p className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠️ Cette action est <strong>irréversible</strong>. Le produit et toutes ses données seront définitivement supprimés.
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
              <><Trash2 className="h-4 w-4" /> Supprimer définitivement</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Table columns (list view) ────────────────────────────────────────────────

function buildColumns(onRefresh: () => void): Column<ProductRow>[] {
  return [
    {
      key:    "product",
      header: "Produit",
      cell:   (r) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
            {r.images[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.images[0]} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm truncate max-w-[200px]">{r.titleFr}</p>
            <p className="text-xs text-gray-400 font-mono">{r.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key:    "price",
      header: "Prix / Coût",
      cell:   (r) => (
        <div>
          <p className="font-bold text-gray-900">{formatMADShort(r.price)}</p>
          <p className="text-xs text-gray-400">{formatMADShort(r.costPrice)} coût</p>
        </div>
      ),
    },
    {
      key:    "margin",
      header: "Marge",
      cell:   (r) => {
        const m   = calcMargin(r.price, r.costPrice)
        const cls = m >= 50 ? "text-green-600" : m >= 30 ? "text-orange-500" : "text-red-600"
        return <span className={`font-bold text-sm ${cls}`}>{m.toFixed(1)}%</span>
      },
    },
    {
      key:    "stock",
      header: "Stock",
      cell:   (r) => (
        <span className={`font-semibold text-sm ${r.stock < r.lowStockAlert ? "text-red-600" : "text-gray-700"}`}>
          {r.stock}
        </span>
      ),
    },
    {
      key:    "status",
      header: "Statut",
      cell:   (r) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={r.status as Parameters<typeof StatusBadge>[0]["status"]} />
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold w-fit ${TESTING_BADGE[r.testingStatus]}`}>
            {r.testingStatus}
          </span>
        </div>
      ),
    },
    {
      key:    "orders",
      header: "Cmd/mois",
      cell:   (r) => <span className="font-semibold text-gray-700">{r._count.orders}</span>,
    },
    {
      key:    "actions",
      header: "Actions",
      cell:   (r) => <ListRowActions product={r} onRefresh={onRefresh} />,
    },
  ]
}

// Extracted so it can hold its own modal state without re-rendering the whole table
function ListRowActions({ product, onRefresh }: { product: ProductRow; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false)
  const [loading,   setLoading]   = useState(false)

  async function hardDelete() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" })
      const body = await res.json() as { success?: boolean; error?: string }
      if (res.ok && body.success) {
        toast.success("Produit supprimé définitivement")
        setShowModal(false)
        onRefresh()
      } else {
        toast.error(body.error ?? "Erreur lors de la suppression")
        setShowModal(false)
      }
    } catch {
      toast.error("Erreur réseau")
      setShowModal(false)
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <Link
        href={`/admin/products/${product.id}/edit`}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Modifier
      </Link>
      <Link
        href={`/${product.slug}`}
        target="_blank"
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Voir
      </Link>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
        title="Supprimer"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {showModal && (
        <DeleteModal
          productName={product.titleFr}
          loading={loading}
          onConfirm={hardDelete}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products,  setProducts]  = useState<ProductRow[]>([])
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [loading,   setLoading]   = useState(true)
  const [viewMode,  setViewMode]  = useState<"grid" | "list">("grid")

  const [search,        setSearch]        = useState("")
  const [statusFilter,  setStatusFilter]  = useState("")
  const [testingFilter, setTestingFilter] = useState("")
  const [sort,          setSort]          = useState("newest")

  const PAGE_SIZE = 20

  const fetchProducts = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({
        page:     String(p),
        pageSize: String(PAGE_SIZE),
        sort,
        ...(search        ? { search }                         : {}),
        ...(statusFilter  ? { status: statusFilter }           : {}),
        ...(testingFilter ? { testingStatus: testingFilter }   : {}),
      })
      const res  = await fetch(`/api/admin/products?${qs}`)
      const body = await res.json() as { products: ProductRow[]; total: number }
      setProducts(body.products ?? [])
      setTotal(body.total ?? 0)
      setPage(p)
    } catch {
      // ignore network errors — table stays stale
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, testingFilter, sort])

  useEffect(() => { fetchProducts(1) }, [search, statusFilter, testingFilter, sort])

  const columns = buildColumns(() => fetchProducts(page))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Produits</h1>
          <p className="text-sm text-gray-500">{total} produit{total !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-600 transition"
        >
          <Plus className="h-4 w-4" /> Ajouter un produit
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none focus:border-orange-400"
        >
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <select
          value={testingFilter}
          onChange={(e) => setTestingFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none focus:border-orange-400"
        >
          {TESTING.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none focus:border-orange-400"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-1 rounded-xl border border-gray-200 p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-lg p-1.5 transition ${viewMode === "grid" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-gray-700"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg p-1.5 transition ${viewMode === "list" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-gray-700"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        <>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-100" />
                    <div className="h-4 w-1/2 rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-20">
              <span className="text-4xl mb-3">📦</span>
              <p className="text-gray-400 text-sm">Aucun produit trouvé</p>
              <Link href="/admin/products/new" className="mt-3 text-orange-500 hover:underline text-sm font-semibold">
                Ajouter votre premier produit
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onArchived={() => fetchProducts(page)}
                    onDuplicated={() => fetchProducts(page)}
                    onDeleted={() => fetchProducts(page)}
                  />
                ))}
              </div>
              {total > PAGE_SIZE && (
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => fetchProducts(page - 1)}
                    disabled={page <= 1}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
                  >
                    Précédent
                  </button>
                  <span className="flex items-center px-3 text-sm text-gray-500">
                    {page} / {Math.ceil(total / PAGE_SIZE)}
                  </span>
                  <button
                    onClick={() => fetchProducts(page + 1)}
                    disabled={page >= Math.ceil(total / PAGE_SIZE)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          emptyText="Aucun produit trouvé"
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPage={fetchProducts}
        />
      )}
    </div>
  )
}
