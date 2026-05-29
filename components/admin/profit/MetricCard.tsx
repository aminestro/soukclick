import type { LucideIcon } from "lucide-react"

type MetricColor = "green" | "orange" | "red" | "blue" | "gray"

interface MetricCardProps {
  label:      string
  value:      string
  subValue?:  string        // e.g. previous period
  delta?:     number        // positive = better, negative = worse
  color:      MetricColor
  icon?:      LucideIcon
  loading?:   boolean
  tooltip?:   string
}

const COLOR: Record<MetricColor, { bg: string; text: string; badge: string }> = {
  green:  { bg: "bg-green-50  border-green-100",  text: "text-green-700",  badge: "bg-green-100  text-green-700"  },
  orange: { bg: "bg-orange-50 border-orange-100", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
  red:    { bg: "bg-red-50    border-red-100",    text: "text-red-700",    badge: "bg-red-100    text-red-700"    },
  blue:   { bg: "bg-blue-50   border-blue-100",   text: "text-blue-700",   badge: "bg-blue-100   text-blue-700"  },
  gray:   { bg: "bg-gray-50   border-gray-100",   text: "text-gray-700",   badge: "bg-gray-100   text-gray-600"  },
}

export function MetricCard({
  label, value, subValue, delta, color, icon: Icon, loading, tooltip,
}: MetricCardProps) {
  const c = COLOR[color]

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="h-3 w-24 rounded bg-gray-100 mb-3" />
        <div className="h-7 w-32 rounded bg-gray-100 mb-2" />
        <div className="h-3 w-16 rounded bg-gray-100" />
      </div>
    )
  }

  return (
    <div
      title={tooltip}
      className={`rounded-2xl border p-4 shadow-sm ${c.bg}`}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        {Icon && <Icon className={`h-4 w-4 ${c.text}`} />}
      </div>

      <p className={`text-2xl font-extrabold tabular-nums leading-tight ${c.text}`}>
        {value}
      </p>

      <div className="mt-1.5 flex items-center gap-2">
        {delta !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-bold ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {subValue && (
          <span className="text-xs text-gray-400">{subValue}</span>
        )}
      </div>
    </div>
  )
}

// ─── Color resolver helpers ───────────────────────────────────────────────────

export function roasColor(roas: number | null): MetricColor {
  if (roas === null) return "gray"
  if (roas >= 3)    return "green"
  if (roas >= 2)    return "orange"
  return "red"
}

export function marginColor(pct: number): MetricColor {
  if (pct >= 40) return "green"
  if (pct >= 20) return "orange"
  return "red"
}

export function profitColor(val: number): MetricColor {
  if (val > 0)  return "green"
  if (val === 0)return "gray"
  return "red"
}
