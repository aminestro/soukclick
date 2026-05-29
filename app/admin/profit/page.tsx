"use client"

import { useEffect, useState, useCallback } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import {
  TrendingUp, TrendingDown, ShoppingBag,
  Truck, BarChart2, DollarSign,
} from "lucide-react"
import {
  MetricCard, roasColor, marginColor, profitColor,
} from "@/components/admin/profit/MetricCard"
import { fromCentimes } from "@/lib/format"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyRow {
  date:        string
  revenue:     number
  deliveryCost:number
  adSpend:     number
  grossProfit: number
  orders:      number
  impressions: number
  clicks:      number
  roas:        number | null
}

interface Totals {
  revenue:       number
  cost:          number
  deliveryCost:  number
  adSpend:       number
  grossProfit:   number
  netProfit:     number
  marginPct:     number
  roas:          number | null
  cpa:           number | null
  breakEvenCpa:  number | null
  confirmedCount:number
  deliveredCount:number
  impressions:   number
  clicks:        number
}

interface ProfitData {
  totals: Totals
  daily:  DailyRow[]
}

interface ProductOption {
  id:     string
  titleFr:string
}

// ─── Date presets ─────────────────────────────────────────────────────────────

type Preset = "today" | "7d" | "30d" | "custom"

function getDateRange(preset: Preset): { start: string; end: string } {
  const today  = new Date()
  const format = (d: Date) => d.toISOString().slice(0, 10)
  const offset = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return d }

  if (preset === "today")  return { start: format(today),      end: format(today) }
  if (preset === "7d")     return { start: format(offset(6)),  end: format(today) }
  if (preset === "30d")    return { start: format(offset(29)), end: format(today) }
  return { start: format(offset(6)), end: format(today) }
}

function formatMAD(c: number) { return `${fromCentimes(c).toFixed(0)} MAD` }
function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-MA", { day: "2-digit", month: "2-digit" })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfitPage() {
  const [products,   setProducts]   = useState<ProductOption[]>([])
  const [productId,  setProductId]  = useState("")
  const [preset,     setPreset]     = useState<Preset>("30d")
  const [startDate,  setStartDate]  = useState(getDateRange("30d").start)
  const [endDate,    setEndDate]    = useState(getDateRange("30d").end)
  const [data,       setData]       = useState<ProfitData | null>(null)
  const [loading,    setLoading]    = useState(false)

  useEffect(() => {
    fetch("/api/admin/products?pageSize=100")
      .then((r) => r.json())
      .then((d: { products: ProductOption[] }) => setProducts(d.products ?? []))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const qs = new URLSearchParams({ startDate, endDate, ...(productId ? { productId } : {}) })
    const res = await fetch(`/api/admin/profit?${qs}`)
    const body = await res.json() as ProfitData
    setData(body)
    setLoading(false)
  }, [productId, startDate, endDate])

  useEffect(() => { fetchData() }, [fetchData])

  function applyPreset(p: Preset) {
    setPreset(p)
    if (p !== "custom") {
      const { start, end } = getDateRange(p)
      setStartDate(start); setEndDate(end)
    }
  }

  const t = data?.totals

  const PRESETS: Array<{ id: Preset; label: string }> = [
    { id: "today", label: "Aujourd'hui" },
    { id: "7d",    label: "7 jours"     },
    { id: "30d",   label: "30 jours"    },
    { id: "custom",label: "Personnalisé"},
  ]

  return (
    <div className="space-y-5">
      {/* Header + filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-semibold text-gray-500">Produit</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
          >
            <option value="">Tous les produits</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.titleFr}</option>)}
          </select>
        </div>

        {/* Preset tabs */}
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                preset === p.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
            <span className="text-gray-400">→</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
          </div>
        )}
      </div>

      {/* Metrics grid — row 1 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Revenu (livré)"    value={t ? formatMAD(t.revenue)      : "—"} color="blue"  icon={DollarSign}  loading={loading} tooltip="Somme des commandes au statut LIVRE" />
        <MetricCard label="Coût produit"      value={t ? formatMAD(t.cost)         : "—"} color="gray"  icon={ShoppingBag} loading={loading} tooltip="Coût d'achat × quantités livrées" />
        <MetricCard label="Coût livraison"    value={t ? formatMAD(t.deliveryCost) : "—"} color="gray"  icon={Truck}       loading={loading} />
        <MetricCard label="Dépenses pub"      value={t ? formatMAD(t.adSpend)      : "—"} color="gray"  icon={BarChart2}   loading={loading} />
        <MetricCard label="Commandes livréés" value={t ? String(t.deliveredCount)  : "—"} color="blue"  loading={loading} />
      </div>

      {/* Metrics grid — row 2 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          label="Bénéfice brut"
          value={t ? formatMAD(t.grossProfit) : "—"}
          color={t ? profitColor(t.grossProfit) : "gray"}
          icon={TrendingUp}
          loading={loading}
          tooltip="Revenu - Coût produit - Coût livraison"
        />
        <MetricCard
          label="Bénéfice net"
          value={t ? formatMAD(t.netProfit) : "—"}
          color={t ? profitColor(t.netProfit) : "gray"}
          icon={t && t.netProfit >= 0 ? TrendingUp : TrendingDown}
          loading={loading}
          tooltip="Bénéfice brut - Dépenses pub"
        />
        <MetricCard
          label="Marge nette"
          value={t ? `${t.marginPct.toFixed(1)}%` : "—"}
          color={t ? marginColor(t.marginPct) : "gray"}
          loading={loading}
        />
        <MetricCard
          label="ROAS"
          value={t?.roas != null ? `${t.roas.toFixed(2)}x` : "—"}
          color={t ? roasColor(t.roas) : "gray"}
          loading={loading}
          tooltip="Revenu ÷ Dépenses pub"
        />
        <MetricCard
          label="CPA"
          value={t?.cpa != null ? formatMAD(t.cpa) : "—"}
          color="gray"
          loading={loading}
          tooltip="Dépenses pub ÷ commandes confirmées"
        />
      </div>

      {/* Break-even CPA highlight */}
      {t?.breakEvenCpa != null && (
        <div className={`rounded-2xl border p-4 flex items-center justify-between ${
          t.cpa == null
            ? "border-gray-200 bg-gray-50"
            : t.cpa <= t.breakEvenCpa
            ? "border-green-100 bg-green-50"
            : "border-red-100 bg-red-50"
        }`}>
          <div>
            <p className="text-sm font-bold text-gray-900">
              CPA de rentabilité : <span className="text-orange-600">{formatMAD(t.breakEvenCpa)}</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Votre CPA actuel est {t.cpa == null ? "inconnu" : t.cpa <= t.breakEvenCpa ? "✅ en dessous du seuil" : "❌ au-dessus du seuil"}
            </p>
          </div>
          {t.cpa != null && (
            <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${
              t.cpa <= t.breakEvenCpa ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}>
              CPA actuel : {formatMAD(t.cpa)}
            </span>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-gray-900">Évolution journalière</h2>
        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.daily ?? []} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tickFormatter={(v: number) => `${fromCentimes(v).toFixed(0)}`} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip
                formatter={(v: number, name: string) => [formatMAD(v), name]}
                labelFormatter={shortDate}
                contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue"     name="Revenu"         stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="adSpend"     name="Pub"            stroke="#f97316" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="grossProfit" name="Bénéfice brut"  stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Daily breakdown table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-bold text-gray-900">Détail jour par jour</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                {["Date","Revenu","Coût liv.","Pub","Bén. brut","Commandes","ROAS"].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 w-20 rounded bg-gray-100" /></td>
                    ))}
                  </tr>
                ))
              ) : (data?.daily ?? []).filter((d) => d.revenue > 0 || d.adSpend > 0).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Aucune donnée sur la période sélectionnée
                  </td>
                </tr>
              ) : (
                (data?.daily ?? [])
                  .filter((d) => d.revenue > 0 || d.adSpend > 0)
                  .map((row) => (
                    <tr key={row.date} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{shortDate(row.date)}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatMAD(row.revenue)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatMAD(row.deliveryCost)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatMAD(row.adSpend)}</td>
                      <td className={`px-4 py-3 font-bold ${row.grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatMAD(row.grossProfit)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{row.orders}</td>
                      <td className={`px-4 py-3 font-bold text-sm ${
                        !row.roas ? "text-gray-300"
                          : row.roas >= 3 ? "text-green-600"
                          : row.roas >= 2 ? "text-orange-500"
                          : "text-red-600"
                      }`}>
                        {row.roas != null ? `${row.roas.toFixed(2)}x` : "—"}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
