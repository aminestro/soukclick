"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ShoppingCart, CheckCircle, XCircle, Clock,
  TrendingUp, AlertTriangle,
} from "lucide-react"
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { StatsCard }   from "@/components/admin/StatsCard"
import { StatusBadge } from "@/components/admin/StatusBadge"
import type { OrderStatus } from "@prisma/client"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayData {
  date:    string
  orders:  number
  revenue: number
}

interface RecentOrder {
  id:           string
  orderNumber:  string
  customerName: string
  phone:        string
  total:        number
  status:       OrderStatus
  createdAt:    string
  city:         { nameFr: string }
  product:      { titleFr: string }
}

interface TopProduct {
  productId: string
  titleFr:   string
  orders:    number
  revenue:   number
}

interface DashboardData {
  today: {
    orders:       number
    confirmed:    number
    revenue:      number
    cancelled:    number
    pending:      number
    lowStock:     number
    confirmedPct: number
    cancelledPct: number
  }
  last7Days:    DayData[]
  recentOrders: RecentOrder[]
  topProducts:  TopProduct[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMAD(centimes: number) {
  return `${(centimes / 100).toLocaleString("fr-MA")} MAD`
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-MA", { day: "2-digit", month: "2-digit" })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m    = Math.floor(diff / 60_000)
  if (m < 1)   return "À l'instant"
  if (m < 60)  return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h`
  return `${Math.floor(h / 24)}j`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d as DashboardData); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const today = data?.today

  return (
    <div className="space-y-6">
      {/* ── Stats grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatsCard
          label="Commandes aujourd'hui"
          value={loading ? "…" : (today?.orders ?? 0)}
          icon={ShoppingCart}
          color="gray"
          loading={loading}
        />
        <StatsCard
          label="Confirmées"
          value={loading ? "…" : (today?.confirmed ?? 0)}
          subLabel={loading ? undefined : `${today?.confirmedPct ?? 0}%`}
          icon={CheckCircle}
          color="blue"
          loading={loading}
        />
        <StatsCard
          label="Revenu confirmé"
          value={loading ? "…" : formatMAD(today?.revenue ?? 0)}
          icon={TrendingUp}
          color="green"
          loading={loading}
        />
        <StatsCard
          label="Annulées"
          value={loading ? "…" : (today?.cancelled ?? 0)}
          subLabel={loading ? undefined : `${today?.cancelledPct ?? 0}%`}
          icon={XCircle}
          color="red"
          loading={loading}
        />
        <StatsCard
          label="En attente confirmation"
          value={loading ? "…" : (today?.pending ?? 0)}
          icon={Clock}
          color="orange"
          loading={loading}
        />
        <StatsCard
          label="Stock faible"
          value={loading ? "…" : (today?.lowStock ?? 0)}
          subLabel={today?.lowStock ? "Produits" : undefined}
          icon={AlertTriangle}
          color={today?.lowStock ? "red" : "gray"}
          loading={loading}
        />
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Orders bar chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-900">
            Commandes — 7 derniers jours
          </h2>
          {loading ? (
            <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <BarChart data={data?.last7Days} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip
                  formatter={(v: number) => [v, "Commandes"]}
                  labelFormatter={shortDate}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue line chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-900">
            Revenu (MAD) — 7 derniers jours
          </h2>
          {loading ? (
            <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <LineChart data={data?.last7Days} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickFormatter={(v: number) => `${(v / 100).toFixed(0)}`}
                />
                <Tooltip
                  formatter={(v: number) => [formatMAD(v), "Revenu"]}
                  labelFormatter={shortDate}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#22c55e" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent orders + Top products ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-bold text-gray-900">Commandes récentes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">N°</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Il y a</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 w-20 rounded bg-gray-100" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : (data?.recentOrders ?? []).map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="cursor-pointer hover:bg-orange-50 transition"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                          {order.orderNumber}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 truncate max-w-[120px]">
                            {order.customerName}
                          </p>
                          <p className="text-xs text-gray-400">{order.city.nameFr}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 truncate max-w-[100px]">
                          {order.product.titleFr}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                          {formatMAD(order.total)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {timeAgo(order.createdAt)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-bold text-gray-900">Top produits — ce mois</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-3 px-5 py-4">
                    <div className="h-10 w-10 rounded-xl bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-gray-100" />
                      <div className="h-3 w-1/2 rounded bg-gray-100" />
                    </div>
                  </div>
                ))
              : (data?.topProducts ?? []).map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3 px-5 py-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-sm font-extrabold text-orange-600">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {p.titleFr}
                      </p>
                      <p className="text-xs text-gray-400">
                        {p.orders} commande{p.orders !== 1 ? "s" : ""}
                        {p.revenue > 0 && ` · ${formatMAD(p.revenue)}`}
                      </p>
                    </div>
                  </div>
                ))}
            {!loading && (data?.topProducts ?? []).length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-gray-400">
                Aucun produit ce mois-ci
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
