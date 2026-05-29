"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Copy, Phone, MapPin, Package, Clock, ChevronDown, ChevronUp } from "lucide-react"
import type { CCOrder } from "@/types/call-center"

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderDetailProps {
  order:         CCOrder
  agentId:       string
  onConfirmed:   (nextId: string | null) => void
  onCancelled:   () => void
  onNoAnswer:    (attempts: number) => void
  onCallbackSet: () => void
  onNotesSaved:  (note: string) => void
}

const CANCEL_REASONS = [
  "Client a refusé",
  "Mauvais numéro",
  "Commande en double",
  "Hors zone livraison",
  "Autre",
]

const CALLBACK_OPTIONS = [
  { label: "Dans 30 min",    minutesFromNow: 30  },
  { label: "Dans 1 heure",   minutesFromNow: 60  },
  { label: "Dans 2 heures",  minutesFromNow: 120 },
  { label: "Demain matin",   minutesFromNow: null }, // special
]

function formatMAD(c: number) { return `${(c / 100).toFixed(0)} MAD` }
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-MA", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrderDetail({
  order,
  onConfirmed,
  onCancelled,
  onNoAnswer,
  onCallbackSet,
  onNotesSaved,
}: OrderDetailProps) {
  const [loading, setLoading]       = useState<string | null>(null) // which button is loading
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [showCallback, setShowCallback] = useState(false)
  const [showNote, setShowNote]    = useState(false)
  const [note, setNote]            = useState(order.agentNotes ?? "")
  const [showAbandoned, setShowAbandoned] = useState(false)

  const total = order.unitPrice * order.quantity + order.deliveryPrice

  // ── API calls ──────────────────────────────────────────────────────────────

  const confirm = useCallback(async () => {
    setLoading("confirm")
    try {
      const res  = await fetch(`/api/admin/call-center/orders/${order.id}/confirm`, { method: "POST" })
      const body = await res.json() as { success: boolean; nextOrderId: string | null; error?: string }
      if (!res.ok) { toast.error(body.error ?? "Erreur"); return }
      toast.success(`✅ Commande ${order.orderNumber} confirmée`)
      onConfirmed(body.nextOrderId)
    } catch { toast.error("Erreur réseau") }
    finally { setLoading(null) }
  }, [order.id, order.orderNumber, onConfirmed])

  const cancel = useCallback(async () => {
    const reason = cancelReason === "Autre" ? customReason : cancelReason
    if (!reason.trim()) { toast.error("Sélectionnez une raison"); return }
    setLoading("cancel")
    try {
      const res = await fetch(`/api/admin/call-center/orders/${order.id}/cancel`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reason }),
      })
      if (!res.ok) { toast.error("Erreur"); return }
      toast.error(`❌ Commande ${order.orderNumber} annulée`)
      onCancelled()
    } catch { toast.error("Erreur réseau") }
    finally { setLoading(null); setShowCancel(false) }
  }, [order.id, order.orderNumber, cancelReason, customReason, onCancelled])

  const noAnswer = useCallback(async () => {
    setLoading("no-answer")
    try {
      const res  = await fetch(`/api/admin/call-center/orders/${order.id}/no-answer`, { method: "POST" })
      const body = await res.json() as { success: boolean; attempts: number }
      if (!res.ok) { toast.error("Erreur"); return }
      toast(`📞 Tentative enregistrée (${body.attempts}/3)`)
      onNoAnswer(body.attempts)
      if (body.attempts >= 3) setShowAbandoned(true)
    } catch { toast.error("Erreur réseau") }
    finally { setLoading(null) }
  }, [order.id, onNoAnswer])

  const scheduleCallback = useCallback(async (minutesFromNow: number | null) => {
    let callbackAt: Date
    if (minutesFromNow === null) {
      // Tomorrow 9am
      callbackAt = new Date()
      callbackAt.setDate(callbackAt.getDate() + 1)
      callbackAt.setHours(9, 0, 0, 0)
    } else {
      callbackAt = new Date(Date.now() + minutesFromNow * 60_000)
    }
    setLoading("callback")
    try {
      const res = await fetch(`/api/admin/call-center/orders/${order.id}/callback`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ callback_at: callbackAt.toISOString() }),
      })
      if (!res.ok) { toast.error("Erreur"); return }
      toast.success(`📅 Rappel planifié — ${callbackAt.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" })}`)
      setShowCallback(false)
      onCallbackSet()
    } catch { toast.error("Erreur réseau") }
    finally { setLoading(null) }
  }, [order.id, onCallbackSet])

  const saveNote = useCallback(async () => {
    setLoading("note")
    try {
      const res = await fetch(`/api/admin/call-center/orders/${order.id}/note`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ note }),
      })
      if (!res.ok) { toast.error("Erreur"); return }
      toast.success("Note enregistrée")
      onNotesSaved(note)
    } catch { toast.error("Erreur réseau") }
    finally { setLoading(null) }
  }, [order.id, note, onNotesSaved])

  const copyPhone = () => {
    navigator.clipboard.writeText(order.phone)
    toast("📋 Numéro copié")
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* ── Section 1: Customer info ────────────────────────────────────── */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
          {/* Blacklist banner */}
          {order.isBlacklisted && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2">
              <span className="text-red-600 text-lg">🚫</span>
              <p className="text-sm font-bold text-red-700">
                Client blacklisté — traiter avec prudence
              </p>
            </div>
          )}

          {/* Name */}
          <h2 className="text-xl font-extrabold text-gray-900 leading-tight">
            {order.customerName}
          </h2>

          {/* Phone */}
          <div className="mt-2 flex items-center gap-2">
            <a
              href={`tel:${order.phone}`}
              className="text-2xl font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
            >
              <Phone className="h-5 w-5" />
              {order.phone}
            </a>
            <button
              onClick={copyPhone}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              title="Copier le numéro"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>

          {/* City + address */}
          <div className="mt-3 flex items-start gap-1.5 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
            <div>
              <span className="font-semibold">{order.city.nameFr}</span>
              <span className="text-gray-400 mx-1">·</span>
              <span>{order.wilaya}</span>
              {order.city.isRemote && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                  Zone éloignée
                </span>
              )}
              <p className="mt-0.5 text-gray-500 text-xs">{order.address}</p>
            </div>
          </div>

          {/* Risk score */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-500">Score de risque</span>
              <span className={`text-xs font-bold ${
                order.riskScore <= 40 ? "text-green-600" :
                order.riskScore <= 70 ? "text-orange-600" : "text-red-600"
              }`}>
                {order.riskScore}/100
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  order.riskScore <= 40 ? "bg-green-400" :
                  order.riskScore <= 70 ? "bg-orange-400" : "bg-red-500"
                }`}
                style={{ width: `${order.riskScore}%` }}
              />
            </div>
          </div>

          {/* Duplicate warning */}
          {order.duplicateCount > 1 && (
            <div className="mt-3 rounded-xl bg-orange-50 border border-orange-200 px-3 py-2.5">
              <p className="text-sm font-semibold text-orange-800">
                ⚠ Ce numéro a commandé {order.duplicateCount} fois ces 30 derniers jours
              </p>
              {order.lastOrder && (
                <p className="text-xs text-orange-600 mt-0.5">
                  Dernière: {order.lastOrder.orderNumber} — {order.lastOrder.titleFr}
                  {" "}({new Date(order.lastOrder.createdAt).toLocaleDateString("fr-MA")})
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Section 2: Order info ───────────────────────────────────────── */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
          <div className="flex items-start gap-3 mb-4">
            {order.product.images[0] && (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={order.product.images[0]}
                  alt={order.product.titleFr}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm leading-tight">
                {order.product.titleFr}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Qté: {order.quantity}
                <span className="mx-1.5 text-gray-300">·</span>
                {order.orderNumber}
                <span className="mx-1.5 text-gray-300">·</span>
                {formatDateTime(order.createdAt)}
              </p>
              {(order.utmSource || order.utmCampaign) && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {[order.utmSource, order.utmCampaign].filter(Boolean).join(" / ")}
                </p>
              )}
            </div>
          </div>

          {/* Financials */}
          <div className="space-y-1.5 border-t border-gray-100 pt-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Prix unitaire × {order.quantity}</span>
              <span>{formatMAD(order.unitPrice * order.quantity)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Livraison</span>
              <span>{order.deliveryPrice === 0 ? "Gratuite" : formatMAD(order.deliveryPrice)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-gray-900 text-lg border-t border-gray-200 pt-2">
              <span>TOTAL</span>
              <span>{formatMAD(total)}</span>
            </div>
          </div>
        </div>

        {/* ── Section 3: Action buttons ───────────────────────────────────── */}
        <div className="space-y-2">
          {/* CONFIRM */}
          <button
            type="button"
            onClick={confirm}
            disabled={!!loading}
            className="flex w-full items-center justify-between rounded-2xl bg-green-500 px-5 py-4 text-white shadow-md transition hover:bg-green-600 active:bg-green-700 disabled:opacity-60"
            title="Raccourci: C"
          >
            <span className="text-lg font-extrabold">✅ CONFIRMER</span>
            <div className="flex items-center gap-2">
              {loading === "confirm" && (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              )}
              <kbd className="rounded-lg bg-green-400/40 px-2 py-0.5 text-xs font-bold">C</kbd>
            </div>
          </button>

          {/* CANCEL */}
          {!showCancel ? (
            <button
              type="button"
              onClick={() => setShowCancel(true)}
              disabled={!!loading}
              className="flex w-full items-center justify-between rounded-2xl bg-red-500 px-5 py-4 text-white shadow-md transition hover:bg-red-600 active:bg-red-700 disabled:opacity-60"
              title="Raccourci: X"
            >
              <span className="text-lg font-extrabold">❌ ANNULER</span>
              <kbd className="rounded-lg bg-red-400/40 px-2 py-0.5 text-xs font-bold">X</kbd>
            </button>
          ) : (
            <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 space-y-2">
              <p className="text-sm font-bold text-red-800">Raison de l'annulation :</p>
              <div className="space-y-1.5">
                {CANCEL_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCancelReason(r)}
                    className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition ${
                      cancelReason === r
                        ? "bg-red-500 text-white"
                        : "bg-white border border-red-200 text-red-700 hover:bg-red-50"
                    }`}
                  >
                    {r}
                  </button>
                ))}
                {cancelReason === "Autre" && (
                  <textarea
                    rows={2}
                    placeholder="Précisez la raison…"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400"
                  />
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancel}
                  disabled={!!loading}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {loading === "cancel" ? "…" : "Confirmer annulation"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCancel(false); setCancelReason(""); setCustomReason("") }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Retour
                </button>
              </div>
            </div>
          )}

          {/* NO ANSWER */}
          <button
            type="button"
            onClick={noAnswer}
            disabled={!!loading}
            className="flex w-full items-center justify-between rounded-2xl bg-gray-500 px-5 py-4 text-white shadow-sm transition hover:bg-gray-600 active:bg-gray-700 disabled:opacity-60"
            title="Raccourci: N"
          >
            <span className="font-bold">📞 PAS DE RÉPONSE</span>
            <div className="flex items-center gap-2">
              {loading === "no-answer" && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              )}
              <kbd className="rounded-lg bg-gray-400/40 px-2 py-0.5 text-xs font-bold">N</kbd>
            </div>
          </button>

          {/* Abandoned prompt after 3 no-answers */}
          {showAbandoned && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                3 tentatives sans réponse — marquer comme abandonné ?
              </p>
              <button
                type="button"
                onClick={cancel.bind(null)}
                className="rounded-xl bg-gray-700 px-4 py-2 text-xs font-bold text-white hover:bg-gray-800"
              >
                Oui, annuler la commande
              </button>
            </div>
          )}

          {/* CALLBACK */}
          <div>
            <button
              type="button"
              onClick={() => setShowCallback(!showCallback)}
              disabled={!!loading}
              className="flex w-full items-center justify-between rounded-2xl bg-blue-500 px-5 py-4 text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-60"
            >
              <span className="font-bold">📅 PLANIFIER UN RAPPEL</span>
              {showCallback ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showCallback && (
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {CALLBACK_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => scheduleCallback(opt.minutesFromNow)}
                    disabled={loading === "callback"}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                  >
                    <Clock className="inline h-3.5 w-3.5 mr-1" />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AGENT NOTE */}
          <div>
            <button
              type="button"
              onClick={() => setShowNote(!showNote)}
              className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <span>📝 Note agent {note ? "(✓)" : ""}</span>
              {showNote ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showNote && (
              <div className="mt-1.5 space-y-2">
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note interne visible uniquement par l'équipe…"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 resize-none"
                />
                <button
                  type="button"
                  onClick={saveNote}
                  disabled={loading === "note"}
                  className="w-full rounded-xl bg-gray-800 py-2.5 text-sm font-bold text-white hover:bg-gray-900 disabled:opacity-60"
                >
                  {loading === "note" ? "Enregistrement…" : "Enregistrer la note"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 4: Status history ───────────────────────────────────── */}
        {order.confirmationAttempts > 0 && (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-gray-400" /> Historique des tentatives
            </h3>
            <p className="text-sm text-gray-500">
              {order.confirmationAttempts} tentative{order.confirmationAttempts > 1 ? "s" : ""} enregistrée{order.confirmationAttempts > 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
