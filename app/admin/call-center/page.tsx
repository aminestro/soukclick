"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { CheckCircle, XCircle, Clock, PhoneMissed, RefreshCw, ArrowLeft } from "lucide-react"
import { OrdersList }  from "@/components/admin/call-center/OrdersList"
import { OrderDetail } from "@/components/admin/call-center/OrderDetail"
import type { CCOrder, CCStats } from "@/types/call-center"

// ─── Filter type ──────────────────────────────────────────────────────────────

type FilterTab = "pending" | "callback" | "high-risk" | "no-answer"

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats, loading }: { stats: CCStats | null; loading: boolean }) {
  return (
    <div className="flex gap-3 px-4 py-3 bg-gray-950 text-sm">
      <div className="flex items-center gap-1.5 text-green-400 font-bold">
        <CheckCircle className="h-4 w-4" />
        <span>{loading ? "…" : stats?.confirmedToday ?? 0}</span>
        <span className="text-green-600 font-normal text-xs hidden sm:inline">confirmées</span>
      </div>
      <div className="flex items-center gap-1.5 text-red-400 font-bold">
        <XCircle className="h-4 w-4" />
        <span>{loading ? "…" : stats?.cancelledToday ?? 0}</span>
        <span className="text-red-600 font-normal text-xs hidden sm:inline">annulées</span>
      </div>
      <div className="flex items-center gap-1.5 text-orange-400 font-bold">
        <Clock className="h-4 w-4" />
        <span>{loading ? "…" : stats?.pendingCount ?? 0}</span>
        <span className="text-orange-600 font-normal text-xs hidden sm:inline">en attente</span>
      </div>
      <div className="flex items-center gap-1.5 text-gray-400 font-bold">
        <PhoneMissed className="h-4 w-4" />
        <span>{loading ? "…" : stats?.noAnswerCount ?? 0}</span>
        <span className="text-gray-600 font-normal text-xs hidden sm:inline">sans réponse</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CallCenterPage() {
  const { data: session } = useSession()
  const agentId = session?.user?.id ?? ""

  const [orders,     setOrders]     = useState<CCOrder[]>([])
  const [stats,      setStats]      = useState<CCStats | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter,     setFilter]     = useState<FilterTab>("pending")
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Mobile: show detail view when order selected
  const [mobileView, setMobileView] = useState<"list" | "detail">("list")

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Fetch orders ───────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const res  = await fetch("/api/admin/call-center/orders")
      const body = await res.json() as { orders: CCOrder[]; stats: CCStats }
      setOrders(body.orders)
      setStats(body.stats)

      // Auto-select first order if none selected
      setSelectedId((prev) => {
        if (prev && body.orders.some((o) => o.id === prev)) return prev
        return body.orders[0]?.id ?? null
      })
    } catch { /* silent fail */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchOrders()
    intervalRef.current = setInterval(() => fetchOrders(true), 30_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchOrders])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs
      if (["INPUT","TEXTAREA","SELECT"].includes((e.target as HTMLElement).tagName)) return

      const visibleOrders = orders.filter((o) => {
        switch (filter) {
          case "pending":   return o.confirmationStatus === "PENDING"
          case "callback":  return o.confirmationStatus === "CALLBACK"
          case "no-answer": return o.confirmationStatus === "NO_ANSWER"
          case "high-risk": return o.riskScore > 70
        }
      })

      const idx = visibleOrders.findIndex((o) => o.id === selectedId)

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          if (idx < visibleOrders.length - 1) setSelectedId(visibleOrders[idx + 1]!.id)
          break
        case "ArrowUp":
          e.preventDefault()
          if (idx > 0) setSelectedId(visibleOrders[idx - 1]!.id)
          break
        case "c":
        case "C":
          if (selectedId) {
            fetch(`/api/admin/call-center/orders/${selectedId}/confirm`, { method: "POST" })
              .then((r) => r.json())
              .then((b: { nextOrderId: string | null }) => handleConfirmed(b.nextOrderId))
          }
          break
        case "x":
        case "X":
          // Let the detail panel handle cancel UI — just focus it
          setMobileView("detail")
          break
        case "n":
        case "N":
          if (selectedId) {
            fetch(`/api/admin/call-center/orders/${selectedId}/no-answer`, { method: "POST" })
              .then(() => fetchOrders(true))
          }
          break
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [selectedId, filter, orders, fetchOrders])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleConfirmed(nextId: string | null) {
    setOrders((prev) => prev.filter((o) => o.id !== selectedId))
    setStats((prev) => prev ? { ...prev, confirmedToday: prev.confirmedToday + 1, pendingCount: Math.max(0, prev.pendingCount - 1) } : prev)
    setSelectedId(nextId)
    setMobileView("list")
  }

  function handleCancelled() {
    setOrders((prev) => prev.filter((o) => o.id !== selectedId))
    setStats((prev) => prev ? { ...prev, cancelledToday: prev.cancelledToday + 1, pendingCount: Math.max(0, prev.pendingCount - 1) } : prev)
    const remaining = orders.filter((o) => o.id !== selectedId)
    setSelectedId(remaining[0]?.id ?? null)
    setMobileView("list")
  }

  function handleNoAnswer(attempts: number) {
    setOrders((prev) => prev.map((o) =>
      o.id === selectedId
        ? { ...o, confirmationAttempts: attempts, confirmationStatus: "NO_ANSWER" }
        : o
    ))
  }

  function handleCallbackSet() {
    setOrders((prev) => prev.map((o) =>
      o.id === selectedId ? { ...o, confirmationStatus: "CALLBACK" } : o
    ))
  }

  function handleNotesSaved(note: string) {
    setOrders((prev) => prev.map((o) =>
      o.id === selectedId ? { ...o, agentNotes: note } : o
    ))
  }

  function handleSelectOrder(order: CCOrder) {
    setSelectedId(order.id)
    setMobileView("detail")
  }

  const selectedOrder = orders.find((o) => o.id === selectedId) ?? null

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden -m-4 md:-m-6">
      {/* Stats bar */}
      <div className="flex items-center justify-between bg-gray-950 border-b border-gray-800">
        <StatsBar stats={stats} loading={loading} />
        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="mr-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition"
          title="Actualiser (auto toutes les 30s)"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{refreshing ? "…" : "Actualiser"}</span>
        </button>
      </div>

      {/* Two-panel layout (desktop) / single panel (mobile) */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel: orders list ────────────────────────────────────── */}
        <div className={`
          w-full flex-shrink-0 border-r border-gray-200 bg-white overflow-hidden
          md:w-[380px]
          ${mobileView === "detail" ? "hidden md:flex md:flex-col" : "flex flex-col"}
        `}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Chargement…
            </div>
          ) : (
            <OrdersList
              orders={orders}
              selectedId={selectedId}
              filter={filter}
              onSelect={handleSelectOrder}
              onFilter={setFilter}
            />
          )}
        </div>

        {/* ── Right panel: order detail ──────────────────────────────────── */}
        <div className={`
          flex-1 overflow-hidden
          ${mobileView === "list" ? "hidden md:block" : "block"}
        `}>
          {/* Mobile back button */}
          <div className="md:hidden flex items-center border-b border-gray-200 bg-white px-4 py-2.5">
            <button
              onClick={() => setMobileView("list")}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" /> Retour à la liste
            </button>
          </div>

          {selectedOrder ? (
            <OrderDetail
              key={selectedOrder.id}
              order={selectedOrder}
              agentId={agentId}
              onConfirmed={handleConfirmed}
              onCancelled={handleCancelled}
              onNoAnswer={handleNoAnswer}
              onCallbackSet={handleCallbackSet}
              onNotesSaved={handleNotesSaved}
            />
          ) : (
            <div className="flex h-full items-center justify-center flex-col gap-2 text-gray-400">
              <CheckCircle className="h-12 w-12 text-gray-200" />
              <p className="text-sm font-medium">Sélectionnez une commande</p>
              <p className="text-xs">ou attendez de nouvelles commandes</p>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard shortcut hint — desktop only */}
      <div className="hidden md:flex items-center gap-4 bg-gray-900 border-t border-gray-800 px-4 py-2 text-[11px] text-gray-500">
        <span>Raccourcis clavier :</span>
        <span><kbd className="rounded bg-gray-700 px-1.5 py-0.5 text-gray-300">C</kbd> Confirmer</span>
        <span><kbd className="rounded bg-gray-700 px-1.5 py-0.5 text-gray-300">X</kbd> Annuler</span>
        <span><kbd className="rounded bg-gray-700 px-1.5 py-0.5 text-gray-300">N</kbd> Pas de réponse</span>
        <span><kbd className="rounded bg-gray-700 px-1.5 py-0.5 text-gray-300">↑↓</kbd> Naviguer</span>
      </div>
    </div>
  )
}
