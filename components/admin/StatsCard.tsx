import type { LucideIcon } from "lucide-react"

type ColorVariant = "blue" | "green" | "red" | "orange" | "gray" | "purple"

interface StatsCardProps {
  label:     string
  value:     string | number
  subLabel?: string
  icon:      LucideIcon
  color:     ColorVariant
  loading?:  boolean
}

const COLOR_MAP: Record<ColorVariant, { icon: string; badge: string }> = {
  blue:   { icon: "bg-blue-100 text-blue-600",   badge: "text-blue-600"   },
  green:  { icon: "bg-green-100 text-green-600", badge: "text-green-600"  },
  red:    { icon: "bg-red-100 text-red-600",     badge: "text-red-600"    },
  orange: { icon: "bg-orange-100 text-orange-600", badge: "text-orange-600" },
  gray:   { icon: "bg-gray-100 text-gray-600",   badge: "text-gray-600"   },
  purple: { icon: "bg-purple-100 text-purple-600", badge: "text-purple-600" },
}

export function StatsCard({ label, value, subLabel, icon: Icon, color, loading }: StatsCardProps) {
  const colors = COLOR_MAP[color]

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse">
        <div className="flex items-start justify-between">
          <div className="h-10 w-10 rounded-xl bg-gray-100" />
          <div className="h-4 w-16 rounded bg-gray-100" />
        </div>
        <div className="mt-4 h-8 w-24 rounded bg-gray-100" />
        <div className="mt-2 h-4 w-32 rounded bg-gray-100" />
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        {subLabel && (
          <span className={`text-xs font-semibold ${colors.badge}`}>
            {subLabel}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-extrabold text-gray-900 tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 text-sm text-gray-500">{label}</p>
    </div>
  )
}
