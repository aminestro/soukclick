"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, CheckCheck } from "lucide-react"
import type { NotificationType } from "@prisma/client"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id:        string
  type:      NotificationType
  title:     string
  message:   string
  isRead:    boolean
  orderId:   string | null
  productId: string | null
  createdAt: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, { label: string; dotClass: string; bgClass: string }> = {
  NEW_ORDER:       { label: "Nouvelle commande", dotClass: "bg-blue-500",   bgClass: "bg-blue-50 border-blue-100"   },
  LOW_STOCK:       { label: "Stock faible",       dotClass: "bg-orange-500", bgClass: "bg-orange-50 border-orange-100" },
  BLACKLIST_ORDER: { label: "Commande blacklist",  dotClass: "bg-red-500",   bgClass: "bg-red-50 border-red-100"     },
  DUPLICATE_ORDER: { label: "Commande doublon",    dotClass: "bg-yellow-500", bgClass: "bg-yellow-50 border-yellow-100"},
  DELIVERY_UPDATE: { label: "Mise à jour livraison", dotClass: "bg-green-500", bgClass: "bg-green-50 border-green-100" },
}

const TYPE_FILTERS: Array<{ value: string; label: string }> = [
  { value: "",                label: "Tous" },
  { value: "NEW_ORDER",       label: "Commandes"  },
  { value: "LOW_STOCK",       label: "Stock"      },
  { value: "BLACKLIST_ORDER", label: "Blacklist"  },
  { value: "DUPLICATE_ORDER", label: "Doublons"   },
  { value: "DELIVERY_UPDATE", label: "Livraison"  },
]

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m    = Math.floor(diff / 60_000)
  if (m < 1)   return "À l'instant"
  if (m < 60)  return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h`
  return `${Math.floor(h / 24)}j`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter()
  const [notifs,   setNotifs]   = useState<Notification[]>([])
  const [total,    setTotal]    = useState(0)
  const [unread,   setUnread]   = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [typeFilter, setTypeFilter] = useState("")
  const [page,     setPage]     = useState(1)
  const PAGE_SIZE = 30

  const fetchNotifs = useCallback(async (p = 1) => {
    setLoading(true)
    const qs = new URLSearchParams({
      page:    String(p),
      limit:   String(PAGE_SIZE),
      ...(typeFilter ? { type: typeFilter } : {}),
    })
    const res  = await fetch(`/api/admin/notifications?${qs}`)
    const body = await res.json() as {
      notifications: Notification[]
      total: number
      unreadCount: number
    }
    setNotifs(body.notifications)
    setTotal(body.total)
    setUnread(body.unreadCount)
    setPage(p)
    setLoading(false)
  }, [typeFilter])

  useEffect(() => { fetchNotifs(1) }, [fetchNotifs])

  async function markRead(ids: string[]) {
    await fetch("/api/admin/notifications", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ids }),
    })
    setNotifs((prev) => prev.map((n) => ids.includes(n.id) ? { ...n, isRead: true } : n))
    setUnread((prev) => Math.max(0, prev - ids.length))
  }

  async function markAllRead() {
    await fetch("/api/admin/notifications", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ markAll: true }),
    })
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnread(0)
  }

  function handleClick(n: Notification) {
    if (!n.isRead) markRead([n.id])
    if (n.orderId)   router.push(`/admin/orders/${n.orderId}`)
    if (!n.orderId && n.productId) router.push(`/admin/products/${n.productId}`)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-400" />
          <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
          {unread > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {unread} non lues
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              typeFilter === f.value
                ? "border-orange-500 bg-orange-500 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4 flex gap-3">
              <div className="h-3 w-3 rounded-full bg-gray-100 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-gray-100" />
                <div className="h-3 w-72 rounded bg-gray-100" />
              </div>
            </div>
          ))
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-20">
            <Bell className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Aucune notification</p>
          </div>
        ) : (
          notifs.map((n) => {
            const config = TYPE_CONFIG[n.type]
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-3 rounded-2xl border p-4 transition cursor-pointer hover:opacity-90 ${
                  n.isRead ? "bg-white border-gray-100" : `${config.bgClass}`
                }`}
              >
                {/* Dot */}
                <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.isRead ? "bg-gray-200" : config.dotClass}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${n.isRead ? "text-gray-700" : "text-gray-900"}`}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {timeAgo(n.createdAt)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        n.isRead ? "bg-gray-100 text-gray-500" : "bg-white/80 text-gray-700"
                      }`}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mark single read */}
                {!n.isRead && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markRead([n.id]) }}
                    className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-white hover:text-green-600"
                    title="Marquer comme lu"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={() => fetchNotifs(page - 1)}
            disabled={page <= 1}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="flex items-center px-3 text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => fetchNotifs(page + 1)}
            disabled={page >= totalPages}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}
