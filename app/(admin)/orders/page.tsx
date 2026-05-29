"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Download } from "lucide-react"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { DataTable, type Column } from "@/components/admin/DataTable"
import type { OrderStatus } from "@prisma/client"

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderRow {
  id:           string
  orderNumber:  string
  customerName: string
  phone:        string
  total:        number
  status:       OrderStatus
  riskScore:    number
  isDuplicate:  boolean
  isBlacklisted:boolean
  quantity:     number
  createdAt:    string
  city:         { nameFr: string; wilaya: string }
  product:      { titleFr: string }
}

const STATUSES = [
  { value: "", label: "Tous les statuts" },
  { value: "NOUVEAU",  label: "Nouveau"  },
  { value: "CONFIRME", label: "Confirmé" },
  { value: "PREPARE",  label: "Préparé"  },
  { value: "EXPEDIE",  label: "Expédié"  },
  { value: "LIVRE",    label: "Livré"    },
  { value: "ANNULE",   label: "Annulé"   },
  { value: "RETOURNE", label: "Retourné" },
]

const RISKS = [
  { value: "",       label: "Tous les risques" },
  { value: "low",    label: "Faible (0–40)"    },
  { value: "medium", label: "Moyen (41–70)"    },
  { value: "high",   label: "Élevé (71–100)"   },
]

function RiskBadge({ score }: { score: number }) {
  if (score <= 40) return (
    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
      {score}
    </span>
  )
  if (score <= 70) return (
    <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
      {score}
    </span>
  )
  return (
    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
      {score}
    </span>
  )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: Column<OrderRow>[] = [
  {
    key:    "orderNumber",
    header: "N° Commande",
    cell:   (r) => (
      <span className="font-mono text-xs font-semibold text-gray-700">{r.orderNumber}</span>
    ),
  },
  {
    key:    "customer",
    header: "Client",
    cell:   (r) => (
      <div>
        <p className="font-semibold text-gray-900 text-sm">{r.customerName}</p>
        <a
          href={`tel:${r.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-blue-600 hover:underline"
        >
          {r.phone}
        </a>
      </div>
    ),
  },
  {
    key:    "product",
    header: "Produit",
    cell:   (r) => (
      <div>
        <p className="text-sm text-gray-700 truncate max-w-[140px]">{r.product.titleFr}</p>
        <p className="text-xs text-gray-400">Qté: {r.quantity}</p>
      </div>
    ),
  },
  {
    key:    "total",
    header: "Total",
    cell:   (r) => (
      <span className="font-semibold text-gray-900 tabular-nums whitespace-nowrap">
        {(r.total / 100).toFixed(0)} MAD
      </span>
    ),
  },
  {
    key:    "city",
    header: "Ville",
    cell:   (r) => (
      <div>
        <p className="text-sm text-gray-700">{r.city.nameFr}</p>
        <p className="text-xs text-gray-400">{r.city.wilaya}</p>
      </div>
    ),
  },
  {
    key:    "status",
    header: "Statut",
    cell:   (r) => (
      <div className="flex flex-col gap-1">
        <StatusBadge status={r.status} />
        <div className="flex gap-1">
          {r.isDuplicate   && <span title="Doublon"    className="text-[10px] font-bold text-yellow-600">⚠ DUP</span>}
          {r.isBlacklisted && <span title="Blacklist"  className="text-[10px] font-bold text-red-600">🚫 BL</span>}
        </div>
      </div>
    ),
  },
  {
    key:    "risk",
    header: "Risque",
    cell:   (r) => <RiskBadge score={r.riskScore} />,
  },
  {
    key:    "createdAt",
    header: "Date",
    cell:   (r) => (
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {new Date(r.createdAt).toLocaleString("fr-MA", {
          day:   "2-digit",
          month: "2-digit",
          hour:  "2-digit",
          minute:"2-digit",
        })}
      </span>
    ),
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router = useRouter()

  const [orders, setOrders] = useState<OrderRow[]>([])
  const [total,  setTotal]  = useState(0)
  const [page,   setPage]   = useState(1)
  const [loading, setLoading] = useState(true)

  const [search,   setSearch]   = useState("")
  const [status,   setStatus]   = useState("")
  const [risk,     setRisk]     = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo,   setDateTo]   = useState("")

  const pageSize = 25

  const fetchOrders = useCallback(async (p = 1) => {
    setLoading(true)
    const qs = new URLSearchParams({
      page:    String(p),
      pageSize: String(pageSize),
      ...(search   ? { search }   : {}),
      ...(status   ? { status }   : {}),
      ...(risk     ? { risk }     : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo   ? { dateTo }   : {}),
    })

    const res  = await fetch(`/api/admin/orders?${qs}`)
    const body = await res.json() as { orders: OrderRow[]; total: number }
    setOrders(body.orders)
    setTotal(body.total)
    setPage(p)
    setLoading(false)
  }, [search, status, risk, dateFrom, dateTo])

  useEffect(() => { fetchOrders(1) }, [fetchOrders])

  function handleExport() {
    const qs = new URLSearchParams({
      export: "csv",
      ...(search   ? { search }   : {}),
      ...(status   ? { status }   : {}),
      ...(risk     ? { risk }     : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo   ? { dateTo }   : {}),
    })
    window.open(`/api/admin/orders?${qs}`, "_blank")
  }

  return (
    <div className="space-y-4">
      {/* ── Filters bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="N° commande, téléphone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
          />
        </div>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm outline-none focus:border-orange-400"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Risk */}
        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm outline-none focus:border-orange-400"
        >
          {RISKS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm outline-none focus:border-orange-400"
          />
          <span className="text-gray-400 text-xs">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm outline-none focus:border-orange-400"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => { setSearch(""); setStatus(""); setRisk(""); setDateFrom(""); setDateTo("") }}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" /> Réinitialiser
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        emptyText="Aucune commande trouvée"
        page={page}
        pageSize={pageSize}
        total={total}
        onPage={fetchOrders}
        onRow={(row) => router.push(`/admin/orders/${row.id}`)}
      />
    </div>
  )
}
