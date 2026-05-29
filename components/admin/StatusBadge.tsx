import type { OrderStatus } from "@prisma/client"

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  NOUVEAU:  { label: "Nouveau",   className: "bg-gray-100 text-gray-700 border-gray-200" },
  CONFIRME: { label: "Confirmé",  className: "bg-blue-100 text-blue-700 border-blue-200" },
  PREPARE:  { label: "Préparé",   className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  EXPEDIE:  { label: "Expédié",   className: "bg-purple-100 text-purple-700 border-purple-200" },
  LIVRE:    { label: "Livré",     className: "bg-green-100 text-green-700 border-green-200" },
  ANNULE:   { label: "Annulé",    className: "bg-red-100 text-red-700 border-red-200" },
  RETOURNE: { label: "Retourné",  className: "bg-orange-100 text-orange-700 border-orange-200" },
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}
