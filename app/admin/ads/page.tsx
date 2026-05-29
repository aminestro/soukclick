"use client"

import { useEffect, useState, useCallback } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { Download } from "lucide-react"
import { MetricCard, roasColor } from "@/components/admin/profit/MetricCard"
import { DailyInputTable, type AdsRow } from "@/components/admin/ads/DailyInputTable"
import { fromCentimes } from "@/lib/format"

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "META" | "TIKTOK" | "GOOGLE" | "ALL"
type Preset   = "today" | "7d" | "30d" | "custom"

interface ProductOption { id: string; titleFr: string }

interface AdsTotals {
  spend:       number | null
  impressions: number | null
  clicks:      number | null
  orders:      number | null
  revenue:     number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateRange(preset: Preset) {
  const today  = new Date()
  const fmt    = (d: Date) => d.toISOString().slice(0, 10)
  const offset = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return d }
  if (preset === "today") return { start: fmt(today),      end: fmt(today)      }
  if (preset === "7d")    return { start: fmt(offset(6)),  end: fmt(today)      }
  if (preset === "30d")   return { start: fmt(offset(29)), end: fmt(today)      }
  return { start: fmt(offset(6)), end: fmt(today) }
}

function fmad(c: number | null) {
  if (c === null) return "—"
  return `${fromCentimes(c).toFixed(0)} MAD`
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-MA", { day: "2-digit", month: "2-digit" })
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportCsv(rows: AdsRow[]) {
  const headers = ["Date","Plateforme","Dépense (MAD)","Impressions","Clics","Commandes","Revenu (MAD)","CPA (MAD)","ROAS","Notes"]
  const lines = rows.map((r) => {
    const cpa  = r.orders && r.spend ? fromCentimes(Math.round(r.spend / r.orders)).toFixed(2) : ""
    const roas = r.spend ? (r.revenue / r.spend).toFixed(2) : ""
    return [
      r.date,
      r.platform,
      fromCentimes(r.spend).toFixed(2),
      r.impressions,
      r.clicks,
      r.orders,
      fromCentimes(r.revenue).toFixed(2),
      cpa,
      roas,
      r.notes ?? "",
    ].join(",")
  })
  const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href = url; a.download = `ads-export-${new Date().toISOString().slice(0,10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

// ─── Page component ───────────────────────────────────────────────────────────

const PLATFORMS: Platform[] = ["ALL","META","TIKTOK","GOOGLE"]
const PRESETS: Array<{ id: Preset; label: string }> = [
  { id: "today", label: "Aujourd'hui" },
  { id: "7d",    label: "7 jours"     },
  { id: "30d",   label: "30 jours"    },
  { id: "custom",label: "Personnalisé"},
]

export default function AdsPage() {
  const [products,  setProducts]  = useState<ProductOption[]>([])
  const [productId, setProductId] = useState("")
  const [platform,  setPlatform]  = useState<Platform>("ALL")
  const [preset,    setPreset]    = useState<Preset>("30d")
  const [startDate, setStartDate] = useState(getDateRange("30d").start)
  const [endDate,   setEndDate]   = useState(getDateRange("30d").end)
  const [rows,      setRows]      = useState<AdsRow[]>([])
  const [totals,    setTotals]    = useState<AdsTotals | null>(null)
  const [loading,   setLoading]   = useState(false)

  // load products once
  useEffect(() => {
    fetch("/api/admin/products?pageSize=100")
      .then((r) => r.json())
      .then((d: { products: ProductOption[] }) => setProducts(d.products ?? []))
  }, [])

  const fetchRows = useCallback(async () => {
    setLoading(true)
    const qs = new URLSearchParams({ startDate, endDate, platform })
    if (productId) qs.set("productId", productId)
    const res  = await fetch(`/api/admin/ads?${qs}`)
    const body = await res.json() as { reports: AdsRow[]; totals: AdsTotals }
    // normalise date field (API returns DateTime, strip time portion)
    const normalised = (body.reports ?? []).map((r) => ({
      ...r,
      date: r.date.slice(0, 10),
    }))
    setRows(normalised)
    setTotals(body.totals)
    setLoading(false)
  }, [productId, platform, startDate, endDate])

  useEffect(() => { fetchRows() }, [fetchRows])

  function applyPreset(p: Preset) {
    setPreset(p)
    if (p !== "custom") {
      const { start, end } = getDateRange(p)
      setStartDate(start); setEndDate(end)
    }
  }

  // row callbacks
  const handleUpdated = useCallback((updated: AdsRow) => {
    setRows((prev) => prev.map((r) => r.id === updated.id ? { ...updated, date: updated.date.slice(0,10) } : r))
  }, [])

  const handleDeleted = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const handleAdded = useCallback((row: AdsRow) => {
    setRows((prev) => [...prev, { ...row, date: row.date.slice(0,10) }].sort((a,b) => a.date.localeCompare(b.date)))
  }, [])

  // derived metrics
  const spend   = totals?.spend       ?? 0
  const revenue = totals?.revenue     ?? 0
  const orders  = totals?.orders      ?? 0
  const roas    = spend > 0 ? revenue / spend : null
  const cpa     = orders > 0 && spend > 0 ? spend / orders : null

  // chart data — aggregate by date (all platforms)
  type ChartDay = { date: string; spend: number; orders: number }
  const chartData = Object.values(
    rows.reduce<Record<string, ChartDay>>((acc, r) => {
      const key = r.date
      if (!acc[key]) acc[key] = { date: key, spend: 0, orders: 0 }
      acc[key].spend  += fromCentimes(r.spend)
      acc[key].orders += r.orders
      return acc
    }, {})
  ).sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-5">
      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {/* Product */}
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

        {/* Custom dates */}
        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
            <span className="text-gray-400">→</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
          </div>
        )}

        {/* CSV export */}
        <button
          type="button"
          onClick={() => exportCsv(rows)}
          disabled={rows.length === 0}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          Exporter CSV
        </button>
      </div>

      {/* ── Platform tabs ────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 w-fit">
        {PLATFORMS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlatform(p)}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              platform === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* ── Summary cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Dépense pub"
          value={fmad(spend)}
          color="gray"
          loading={loading}
          tooltip="Total des dépenses publicitaires"
        />
        <MetricCard
          label="Commandes"
          value={loading ? "—" : String(orders)}
          color="blue"
          loading={loading}
          tooltip="Commandes attribuées via pub"
        />
        <MetricCard
          label="CPA"
          value={cpa !== null ? fmad(cpa) : "—"}
          color="gray"
          loading={loading}
          tooltip="Coût par commande = Dépense ÷ Commandes"
        />
        <MetricCard
          label="ROAS"
          value={roas !== null ? `${roas.toFixed(2)}x` : "—"}
          color={roasColor(roas)}
          loading={loading}
          tooltip="Revenu ÷ Dépense pub"
        />
      </div>

      {/* ── Bar chart ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-gray-900">Dépense vs Commandes par jour</h2>
        {loading ? (
          <div className="h-56 animate-pulse rounded-xl bg-gray-100" />
        ) : chartData.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">Aucune donnée sur la période</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip
                labelFormatter={shortDate}
                contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left"  dataKey="spend"  name="Dépense (MAD)"  fill="#f97316" radius={[4,4,0,0]} />
              <Bar yAxisId="right" dataKey="orders" name="Commandes"       fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Daily input table ─────────────────────────────────────── */}
      {productId ? (
        <DailyInputTable
          rows={rows}
          productId={productId}
          platform={platform}
          onRowUpdated={handleUpdated}
          onRowDeleted={handleDeleted}
          onRowAdded={handleAdded}
        />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-gray-900">Saisie journalière</h2>
          <p className="text-sm text-gray-400">
            Sélectionnez un produit pour saisir ou modifier les données publicitaires.
          </p>
          {/* Read-only table when no product selected */}
          {rows.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Date","Produit","Plateforme","Dépense","Impressions","Clics","Commandes","ROAS"].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((r) => {
                    const rowRoas = r.spend > 0 ? r.revenue / r.spend : null
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs font-mono text-gray-500">{shortDate(r.date)}</td>
                        <td className="px-3 py-2 text-xs text-gray-700 max-w-[140px] truncate">
                          {products.find((p) => p.id === (r as unknown as { productId: string }).productId)?.titleFr ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{r.platform}</span>
                        </td>
                        <td className="px-3 py-2 text-sm tabular-nums">{fmad(r.spend)}</td>
                        <td className="px-3 py-2 text-sm tabular-nums text-gray-600">{r.impressions.toLocaleString()}</td>
                        <td className="px-3 py-2 text-sm tabular-nums text-gray-600">{r.clicks.toLocaleString()}</td>
                        <td className="px-3 py-2 text-sm tabular-nums text-gray-700 font-semibold">{r.orders}</td>
                        <td className={`px-3 py-2 text-xs font-bold ${
                          rowRoas === null ? "text-gray-300"
                            : rowRoas >= 3  ? "text-green-600"
                            : rowRoas >= 2  ? "text-orange-500"
                            : "text-red-600"
                        }`}>
                          {rowRoas !== null ? `${rowRoas.toFixed(2)}x` : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
