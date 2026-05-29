"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { ArrowLeft, Phone, MapPin, Package, Link2, Truck, AlertTriangle } from "lucide-react"
import { StatusBadge } from "@/components/admin/StatusBadge"
import type { OrderStatus, ConfirmationStatus } from "@prisma/client"

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id:        string
  oldStatus: OrderStatus
  newStatus: OrderStatus
  note:      string | null
  createdAt: string
  agent:     { name: string } | null
}

interface OrderDetail {
  id:                 string
  orderNumber:        string
  status:             OrderStatus
  confirmationStatus: ConfirmationStatus
  riskScore:          number
  isDuplicate:        boolean
  isBlacklisted:      boolean
  customerName:       string
  phone:              string
  address:            string
  wilaya:             string
  quantity:           number
  unitPrice:          number
  deliveryPrice:      number
  total:              number
  agentNotes:         string | null
  trackingNumber:     string | null
  utmSource:          string | null
  utmCampaign:        string | null
  fbclid:             string | null
  createdAt:          string
  confirmedAt:        string | null
  city:               { nameFr: string; wilaya: string; deliveryDays: number }
  product:            { id: string; titleFr: string; images: string[]; price: number }
  deliveryCompany:    { id: string; name: string } | null
  statusHistory:      HistoryEntry[]
}

const STATUSES: OrderStatus[] = ["NOUVEAU","CONFIRME","PREPARE","EXPEDIE","LIVRE","ANNULE","RETOURNE"]

function formatMAD(c: number) { return `${(c / 100).toFixed(0)} MAD` }
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-MA", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order,     setOrder]     = useState<OrderDetail | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("")
  const [note,      setNote]      = useState("")
  const [tracking,  setTracking]  = useState("")
  const [blReason,  setBlReason]  = useState("")
  const [showBlForm, setShowBlForm] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d as OrderDetail)
        setTracking(d.trackingNumber ?? "")
        setNote(d.agentNotes ?? "")
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [orderId])

  async function save() {
    if (!order) return
    setSaving(true)
    const body: Record<string, unknown> = { agentNotes: note, trackingNumber: tracking }
    if (newStatus && newStatus !== order.status) {
      body["status"] = newStatus
      body["note"]   = note
    }

    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json() as OrderDetail
      setOrder((prev) => prev ? { ...prev, ...updated, statusHistory: prev.statusHistory } : prev)
      toast.success("Commande mise à jour")
      setNewStatus("")
      // Re-fetch to get updated history
      fetch(`/api/admin/orders/${orderId}`)
        .then((r) => r.json())
        .then((d) => setOrder(d as OrderDetail))
    } else {
      toast.error("Erreur lors de la mise à jour")
    }
    setSaving(false)
  }

  async function blacklistCustomer() {
    if (!blReason.trim()) { toast.error("Raison requise"); return }
    setSaving(true)
    const res = await fetch(`/api/admin/customers/${order?.phone}/blacklist`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ reason: blReason }),
    })
    if (res.ok) {
      toast.success("Client blacklisté")
      setShowBlForm(false)
    } else {
      toast.error("Erreur")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-32 rounded-xl bg-gray-100" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="h-96 rounded-2xl bg-gray-100" />
          <div className="h-96 rounded-2xl bg-gray-100" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <p className="text-lg font-semibold">Commande introuvable</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-orange-500 hover:underline">
          Retour
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-10">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux commandes
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-extrabold text-gray-900">{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
        {order.isDuplicate  && (
          <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-700">
            ⚠ Doublon
          </span>
        )}
        {order.isBlacklisted && (
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
            🚫 Blacklist
          </span>
        )}
        <span className="ml-auto text-sm text-gray-400">{formatDate(order.createdAt)}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Status management */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-gray-900">Gestion du statut</h2>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Nouveau statut</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus | "")}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm outline-none focus:border-orange-400"
                >
                  <option value="">— Statut actuel : {order.status} —</option>
                  {STATUSES.filter((s) => s !== order.status).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Notes agent</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ajouter une note interne…"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-orange-400 resize-none"
                />
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>

          {/* Status history */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-gray-900">Historique</h2>
            {order.statusHistory.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun historique</p>
            ) : (
              <ol className="relative border-l border-gray-200 space-y-4 pl-5">
                {order.statusHistory.map((h) => (
                  <li key={h.id} className="relative">
                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-orange-400 bg-white" />
                    <div className="flex items-start gap-2">
                      <StatusBadge status={h.oldStatus} className="text-[10px]" />
                      <span className="text-gray-400">→</span>
                      <StatusBadge status={h.newStatus} className="text-[10px]" />
                    </div>
                    {h.note && <p className="mt-1 text-xs text-gray-500 italic">"{h.note}"</p>}
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {h.agent?.name ?? "Système"} · {formatDate(h.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-gray-900 flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" /> Client
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Nom</dt>
                <dd className="font-semibold text-gray-900">{order.customerName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Téléphone</dt>
                <dd>
                  <a href={`tel:${order.phone}`} className="font-semibold text-blue-600 hover:underline">
                    {order.phone}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />Ville</dt>
                <dd className="font-semibold text-gray-900">{order.city.nameFr}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Wilaya</dt>
                <dd className="text-gray-700">{order.wilaya}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-gray-500">Adresse</dt>
                <dd className="text-gray-700 text-xs">{order.address}</dd>
              </div>
            </dl>
          </div>

          {/* Product + Financials */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-400" /> Produit & Financier
            </h2>
            <div className="flex gap-3 mb-4">
              {order.product.images[0] && (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  <Image src={order.product.images[0]} alt={order.product.titleFr} fill sizes="64px" className="object-cover" />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 text-sm">{order.product.titleFr}</p>
                <p className="text-xs text-gray-500">Qté: {order.quantity}</p>
              </div>
            </div>
            <dl className="space-y-1.5 text-sm border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Prix unitaire</dt>
                <dd>{formatMAD(order.unitPrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Livraison</dt>
                <dd>{order.deliveryPrice === 0 ? "Gratuite" : formatMAD(order.deliveryPrice)}</dd>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-1.5">
                <dt>Total</dt>
                <dd>{formatMAD(order.total)}</dd>
              </div>
            </dl>
          </div>

          {/* Attribution */}
          {(order.utmSource || order.utmCampaign || order.fbclid) && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-bold text-gray-900 flex items-center gap-2">
                <Link2 className="h-4 w-4 text-gray-400" /> Attribution
              </h2>
              <dl className="space-y-1.5 text-sm">
                {order.utmSource   && <div className="flex justify-between"><dt className="text-gray-500">UTM Source</dt><dd className="text-gray-700">{order.utmSource}</dd></div>}
                {order.utmCampaign && <div className="flex justify-between"><dt className="text-gray-500">Campagne</dt><dd className="text-gray-700 truncate max-w-[160px]">{order.utmCampaign}</dd></div>}
                {order.fbclid      && <div className="flex justify-between"><dt className="text-gray-500">FBCLID</dt><dd className="text-gray-400 text-xs truncate max-w-[160px]">{order.fbclid}</dd></div>}
              </dl>
            </div>
          )}

          {/* Delivery */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-4 w-4 text-gray-400" /> Livraison
            </h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Transporteur</label>
                <p className="text-sm text-gray-700">{order.deliveryCompany?.name ?? "Non assigné"}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">N° de suivi</label>
                <input
                  type="text"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="Ex: AMN123456789"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-orange-400"
                />
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
            <h2 className="mb-3 font-bold text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Zone danger
            </h2>
            <div className="space-y-3">
              {!showBlForm ? (
                <button
                  onClick={() => setShowBlForm(true)}
                  className="w-full rounded-xl border border-red-200 bg-white py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  🚫 Blacklister ce client
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={blReason}
                    onChange={(e) => setBlReason(e.target.value)}
                    placeholder="Raison du blacklist…"
                    className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={blacklistCustomer}
                      disabled={saving}
                      className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => setShowBlForm(false)}
                      className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={async () => {
                  if (!confirm("Annuler cette commande ?")) return
                  setSaving(true)
                  await fetch(`/api/admin/orders/${orderId}`, {
                    method:  "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify({ status: "ANNULE", note: "Annulé manuellement" }),
                  })
                  toast.success("Commande annulée")
                  router.refresh()
                  setSaving(false)
                }}
                disabled={order.status === "ANNULE" || saving}
                className="w-full rounded-xl border border-red-200 bg-white py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
              >
                Annuler la commande
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
