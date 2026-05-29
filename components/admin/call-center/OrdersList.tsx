import type { CCOrder } from "@/types/call-center"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m    = Math.floor(diff / 60_000)
  if (m < 1)   return "À l'instant"
  if (m < 60)  return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24)  return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

function borderColor(riskScore: number): string {
  if (riskScore <= 40) return "border-l-green-400"
  if (riskScore <= 70) return "border-l-orange-400"
  return "border-l-red-500"
}

function formatMAD(c: number): string {
  return `${(c / 100).toFixed(0)} MAD`
}

// ─── Props ────────────────────────────────────────────────────────────────────

type FilterTab = "pending" | "callback" | "high-risk" | "no-answer"

interface OrdersListProps {
  orders:     CCOrder[]
  selectedId: string | null
  filter:     FilterTab
  onSelect:   (order: CCOrder) => void
  onFilter:   (tab: FilterTab) => void
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: Array<{ id: FilterTab; label: string }> = [
  { id: "pending",    label: "En attente"  },
  { id: "callback",   label: "Rappel"      },
  { id: "high-risk",  label: "Risque élevé"},
  { id: "no-answer",  label: "Pas répond"  },
]

function applyFilter(orders: CCOrder[], filter: FilterTab): CCOrder[] {
  switch (filter) {
    case "pending":   return orders.filter((o) => o.confirmationStatus === "PENDING")
    case "callback":  return orders.filter((o) => o.confirmationStatus === "CALLBACK")
    case "no-answer": return orders.filter((o) => o.confirmationStatus === "NO_ANSWER")
    case "high-risk": return orders.filter((o) => o.riskScore > 70)
  }
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function OrderCard({
  order,
  selected,
  onClick,
}: {
  order:    CCOrder
  selected: boolean
  onClick:  () => void
}) {
  const total = order.unitPrice * order.quantity + order.deliveryPrice

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left border-l-4 transition-colors ${borderColor(order.riskScore)} ${
        selected
          ? "bg-orange-50 border-r-2 border-r-orange-400"
          : "bg-white hover:bg-gray-50"
      } border-b border-gray-100 px-4 py-3`}
    >
      {/* Row 1: order number + time */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-xs font-bold text-gray-500">
          {order.orderNumber}
        </span>
        <span className="text-[11px] text-gray-400">{timeAgo(order.createdAt)}</span>
      </div>

      {/* Row 2: name + phone */}
      <p className="text-sm font-bold text-gray-900 leading-tight truncate">
        {order.customerName}
      </p>
      <p className="text-sm font-semibold text-blue-600 mt-0.5">{order.phone}</p>

      {/* Row 3: product + total */}
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-xs text-gray-500 truncate max-w-[160px]">
          {order.product.titleFr}
          {order.quantity > 1 && <span className="ml-1 text-gray-400">×{order.quantity}</span>}
        </p>
        <span className="text-xs font-bold text-gray-900 shrink-0">{formatMAD(total)}</span>
      </div>

      {/* Row 4: city */}
      <p className="text-[11px] text-gray-400 mt-0.5">
        {order.city.nameFr} · {order.city.wilaya}
      </p>

      {/* Badges row */}
      <div className="flex flex-wrap gap-1 mt-2">
        {order.isBlacklisted && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
            🚫 BLACKLIST
          </span>
        )}
        {order.isDuplicate && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
            ⚠ Doublon
          </span>
        )}
        {order.riskScore > 70 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
            Risque élevé
          </span>
        )}
        {order.city.isRemote && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
            Zone éloignée
          </span>
        )}
        {order.confirmationStatus === "CALLBACK" && order.callbackAt && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
            📅 Rappel {new Date(order.callbackAt).toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        {order.confirmationAttempts > 0 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
            Tentative {order.confirmationAttempts}/3
          </span>
        )}
      </div>
    </button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrdersList({ orders, selectedId, filter, onSelect, onFilter }: OrdersListProps) {
  const visible = applyFilter(orders, filter)

  return (
    <div className="flex h-full flex-col">
      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 bg-white shrink-0">
        {TABS.map((tab) => {
          const count = applyFilter(orders, tab.id).length
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilter(tab.id)}
              className={`flex-1 py-2.5 px-1 text-[11px] font-semibold transition border-b-2 ${
                filter === tab.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  filter === tab.id ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-gray-400">
            <span className="text-3xl mb-2">✅</span>
            <p className="text-sm font-medium">Aucune commande en attente</p>
          </div>
        ) : (
          visible.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              selected={order.id === selectedId}
              onClick={() => onSelect(order)}
            />
          ))
        )}
      </div>
    </div>
  )
}
