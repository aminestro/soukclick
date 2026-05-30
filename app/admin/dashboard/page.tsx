"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  TrendingUp, TrendingDown, ShoppingCart, CheckCircle,
  Clock, Truck, AlertCircle, AlertTriangle, Phone,
  Package, FileText, Sparkles, ArrowRight,
} from "lucide-react"
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
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
  statusCounts: Record<string, number>
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
  if (m < 1)  return "À l'instant"
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}j`
}

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = performance.now()
    function tick(now: number) {
      const pct = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - pct, 3)
      setValue(Math.round(ease * target))
      if (pct < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return value
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  loading,
}: {
  label:      string
  value:      string | number
  sub?:       string
  icon:       React.ElementType
  iconBg:     string
  iconColor:  string
  trend?:     { pct: number; label: string }
  loading:    boolean
}) {
  const numericTarget = typeof value === "number" ? value : 0
  const animated = useCountUp(loading ? 0 : numericTarget)
  const display  = loading ? "—" : typeof value === "number" ? animated : value

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.07)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-[18px] w-[18px] ${iconColor}`} />
        </div>
        {trend && !loading && (
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            trend.pct >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
          }`}>
            {trend.pct >= 0
              ? <TrendingUp className="h-3 w-3" />
              : <TrendingDown className="h-3 w-3" />
            }
            {Math.abs(trend.pct)}%
          </div>
        )}
      </div>
      {loading ? (
        <>
          <div className="h-7 w-20 rounded-lg bg-gray-100 animate-pulse mb-1" />
          <div className="h-3.5 w-28 rounded bg-gray-100 animate-pulse" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900 tabular-nums leading-tight">{display}</p>
          <p className="mt-0.5 text-[12px] text-gray-500 leading-tight">{label}</p>
          {sub && <p className="mt-1 text-[11px] text-gray-400">{sub}</p>}
        </>
      )}
    </div>
  )
}

// ─── Status donut colours ─────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  NOUVEAU:   "#F97316",
  CONFIRME:  "#22C55E",
  ANNULE:    "#EF4444",
  EN_COURS:  "#3B82F6",
  LIVRE:     "#8B5CF6",
  RETOURNE:  "#F59E0B",
}

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU:  "Nouveau",
  CONFIRME: "Confirmé",
  ANNULE:   "Annulé",
  EN_COURS: "En cours",
  LIVRE:    "Livré",
  RETOURNE: "Retourné",
}

// ─── Live Clock ───────────────────────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span>
      {now.toLocaleDateString("fr-MA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      {" · "}
      {now.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label ? shortDate(label) : ""}</p>
      <p className="text-orange-500 font-bold">{formatMAD(payload[0].value)}</p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [data,    setData]    = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period,  setPeriod]  = useState<"7j" | "30j">("7j")

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d as DashboardData); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const today = data?.today

  // Donut chart data
  const donutData = data?.statusCounts
    ? Object.entries(data.statusCounts)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: STATUS_LABELS[k] ?? k, value: v, color: STATUS_COLORS[k] ?? "#9ca3af" }))
    : []
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0)

  // Revenue chart — revenue is in centimes, display in MAD
  const chartData = (data?.last7Days ?? []).map((d) => ({
    ...d,
    revenueMAD: d.revenue / 100,
  }))

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Bonjour, Admin 👋
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Voici ce qui se passe aujourd&apos;hui
          </p>
        </div>
        <div className="hidden text-right md:block">
          <p className="text-xs font-medium text-gray-400 tabular-nums">
            <LiveClock />
          </p>
        </div>
      </div>

      {/* ── Alert banner ────────────────────────────────────────────────────── */}
      {!loading && (today?.pending ?? 0) > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">
            <span className="font-bold">{today?.pending}</span> commande{(today?.pending ?? 0) > 1 ? "s" : ""} en attente de confirmation
          </p>
          <Link
            href="/admin/call-center"
            className="ml-auto flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors whitespace-nowrap"
          >
            Traiter <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
      {!loading && (today?.lowStock ?? 0) > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-100 bg-yellow-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600" />
          <p className="text-sm font-medium text-yellow-800">
            <span className="font-bold">{today?.lowStock}</span> produit{(today?.lowStock ?? 0) > 1 ? "s" : ""} en stock faible
          </p>
          <Link
            href="/admin/products"
            className="ml-auto flex items-center gap-1 text-xs font-semibold text-yellow-700 hover:text-yellow-900 transition-colors whitespace-nowrap"
          >
            Voir <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Chiffre d'affaires"
          value={loading ? "—" : formatMAD(today?.revenue ?? 0)}
          sub="Commandes confirmées"
          icon={TrendingUp}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          loading={loading}
        />
        <StatCard
          label="Commandes aujourd'hui"
          value={loading ? 0 : (today?.orders ?? 0)}
          sub={loading ? undefined : `dont ${today?.pending ?? 0} en attente`}
          icon={ShoppingCart}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          loading={loading}
        />
        <StatCard
          label="Taux de confirmation"
          value={loading ? 0 : (today?.confirmedPct ?? 0)}
          sub={loading ? undefined : `${today?.confirmed ?? 0} confirmées`}
          icon={CheckCircle}
          iconBg="bg-green-50"
          iconColor="text-green-500"
          loading={loading}
        />
        <StatCard
          label="En attente confirmation"
          value={loading ? 0 : (today?.pending ?? 0)}
          sub={loading ? undefined : `${today?.cancelled ?? 0} annulées`}
          icon={Clock}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
          loading={loading}
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">

        {/* Area chart — Revenue */}
        <div className="lg:col-span-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Évolution du CA</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Chiffre d&apos;affaires confirmé (MAD)</p>
            </div>
            <div className="flex gap-1 rounded-lg border border-gray-100 p-0.5">
              {(["7j", "30j"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    period === p
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="h-52 animate-pulse rounded-xl bg-gray-50" />
          ) : (
            <ResponsiveContainer width="100%" height={208}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F97316" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickFormatter={(v: number) => `${v.toFixed(0)}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenueMAD"
                  stroke="#F97316"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#F97316", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut — Orders by status */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900">Commandes par statut</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Total : {donutTotal} commandes</p>
          </div>
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-36 w-36 rounded-full bg-gray-50 animate-pulse" />
              <div className="w-full space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 rounded bg-gray-50 animate-pulse" />
                ))}
              </div>
            </div>
          ) : donutData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">
              Aucune commande
            </div>
          ) : (
            <>
              <div className="relative flex justify-center">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      strokeWidth={2}
                      stroke="#fff"
                      dataKey="value"
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-gray-900">{donutTotal}</span>
                  <span className="text-[10px] text-gray-400">total</span>
                </div>
              </div>
              <div className="mt-2 space-y-1.5">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-[12px]">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="flex-1 text-gray-600">{d.name}</span>
                    <span className="font-semibold text-gray-800 tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Recent orders + Top products ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
          <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
            <h2 className="text-sm font-bold text-gray-900">Commandes récentes</h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-[11px] font-semibold text-orange-500 hover:text-orange-600 transition-colors"
            >
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-left">
                  <th className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">N°</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">Client</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 hidden md:table-cell">Produit</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">Total</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">Statut</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">Heure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-4 py-3.5">
                            <div className="h-3.5 rounded bg-gray-100 animate-pulse" style={{ width: `${40 + (j * 17) % 40}px` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : (data?.recentOrders ?? []).slice(0, 8).map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="cursor-pointer hover:bg-orange-50/60 transition-colors group"
                      >
                        <td className="px-5 py-3.5 font-mono text-[11px] text-gray-500 group-hover:text-orange-600">
                          {order.orderNumber}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-gray-900 truncate max-w-[110px] text-[12px]">{order.customerName}</p>
                          <p className="text-[10px] text-gray-400">{order.city.nameFr}</p>
                        </td>
                        <td className="px-4 py-3.5 text-[12px] text-gray-500 truncate max-w-[100px] hidden md:table-cell">
                          {order.product.titleFr}
                        </td>
                        <td className="px-4 py-3.5 text-[12px] font-semibold text-gray-800 tabular-nums whitespace-nowrap">
                          {formatMAD(order.total)}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3.5 text-[11px] text-gray-400 whitespace-nowrap">
                          {timeAgo(order.createdAt)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {!loading && (data?.recentOrders ?? []).length === 0 && (
              <p className="py-10 text-center text-sm text-gray-400">Aucune commande aujourd&apos;hui</p>
            )}
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
          <div className="border-b border-gray-50 px-5 py-4">
            <h2 className="text-sm font-bold text-gray-900">Top produits</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Ce mois-ci par commandes</p>
          </div>
          <div className="divide-y divide-gray-50/80">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 px-5 py-4 animate-pulse">
                    <div className="h-9 w-9 rounded-xl bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-3/4 rounded bg-gray-100" />
                      <div className="h-2.5 w-1/2 rounded bg-gray-100" />
                      <div className="h-1.5 rounded-full bg-gray-100" />
                    </div>
                  </div>
                ))
              : (() => {
                  const products = data?.topProducts ?? []
                  const maxOrders = Math.max(1, ...products.map((p) => p.orders))
                  return products.map((p, i) => (
                    <div key={p.productId} className="flex items-start gap-3 px-5 py-4">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold ${
                        i === 0 ? "bg-orange-500 text-white" :
                        i === 1 ? "bg-orange-100 text-orange-600" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[12px] font-semibold text-gray-900 leading-tight">{p.titleFr}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {p.orders} commande{p.orders !== 1 ? "s" : ""}
                          {p.revenue > 0 && ` · ${formatMAD(p.revenue)}`}
                        </p>
                        <div className="mt-1.5 h-1 w-full rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-orange-400 transition-all duration-700"
                            style={{ width: `${(p.orders / maxOrders) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                })()
            }
            {!loading && (data?.topProducts ?? []).length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Aucun produit ce mois-ci</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Call center stats */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
              <Phone className="h-[15px] w-[15px] text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Call Center</h2>
              <p className="text-[11px] text-gray-400">Suivi du jour</p>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="h-3.5 w-28 rounded bg-gray-100" />
                  <div className="h-6 w-10 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-600">Confirmées aujourd&apos;hui</span>
                <span className="text-lg font-bold text-green-600 tabular-nums">{today?.confirmed ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-600">Annulées</span>
                <span className="text-lg font-bold text-red-500 tabular-nums">{today?.cancelled ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-600">En attente</span>
                <span className="text-lg font-bold text-orange-500 tabular-nums">{today?.pending ?? 0}</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-gray-500">Taux de confirmation</span>
                  <span className="text-[12px] font-bold text-gray-800">{today?.confirmedPct ?? 0}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-700"
                    style={{ width: `${today?.confirmedPct ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-900">Actions rapides</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Raccourcis fréquents</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { href: "/admin/products/new",      icon: Package,  label: "Nouveau produit",        bg: "bg-orange-50", color: "text-orange-600", border: "border-orange-100" },
              { href: "/admin/landing-pages/new", icon: FileText, label: "Nouvelle landing page",  bg: "bg-blue-50",   color: "text-blue-600",   border: "border-blue-100"   },
              { href: "/admin/ai-tools",          icon: Sparkles, label: "Générer avec AI",        bg: "bg-purple-50", color: "text-purple-600", border: "border-purple-100" },
              { href: "/admin/call-center",       icon: Phone,    label: "Call Center",            bg: "bg-green-50",  color: "text-green-600",  border: "border-green-100"  },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`flex items-center gap-2.5 rounded-xl border ${action.border} ${action.bg} px-3.5 py-3 transition-all hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]`}
              >
                <action.icon className={`h-4 w-4 shrink-0 ${action.color}`} />
                <span className={`text-[12px] font-semibold leading-tight ${action.color}`}>{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
