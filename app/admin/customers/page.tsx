"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import {
  Search, ChevronDown, ChevronRight,
  ShieldBan, ShieldCheck, Loader2,
} from "lucide-react"
import { formatMAD, formatDate } from "@/lib/format"

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskTag = "BLACKLISTED" | "VIP" | "RISKY" | "REGULAR"

interface Customer {
  id:              string
  phone:           string
  name:            string
  totalOrders:     number
  totalRevenue:    number
  totalProfit:     number
  lastOrderAt:     string | null
  isBlacklisted:   boolean
  blacklistReason: string | null
  tags:            string[]
  riskTag:         RiskTag
}

interface Order {
  id:          string
  orderNumber: string
  status:      string
  total:       number
  quantity:    number
  createdAt:   string
  product:     { titleFr: string }
}

const RISK_BADGE: Record<RiskTag, string> = {
  BLACKLISTED: "bg-red-100 text-red-700 border border-red-200",
  VIP:         "bg-purple-100 text-purple-700 border border-purple-200",
  RISKY:       "bg-yellow-100 text-yellow-700 border border-yellow-200",
  REGULAR:     "bg-gray-100 text-gray-600",
}

const STATUS_LABEL: Record<string, string> = {
  NOUVEAU:  "Nouveau",
  CONFIRME: "Confirmé",
  PREPARE:  "Préparé",
  EXPEDIE:  "Expédié",
  LIVRE:    "Livré",
  ANNULE:   "Annulé",
  RETOURNE: "Retourné",
}

const STATUS_COLOR: Record<string, string> = {
  NOUVEAU:  "bg-blue-100 text-blue-700",
  CONFIRME: "bg-orange-100 text-orange-700",
  PREPARE:  "bg-yellow-100 text-yellow-700",
  EXPEDIE:  "bg-purple-100 text-purple-700",
  LIVRE:    "bg-green-100 text-green-700",
  ANNULE:   "bg-gray-100 text-gray-500",
  RETOURNE: "bg-red-100 text-red-600",
}

// ─── Blacklist Modal ──────────────────────────────────────────────────────────

function BlacklistModal({
  customer,
  onClose,
  onConfirm,
}: {
  customer:  Customer
  onClose:   () => void
  onConfirm: (reason: string) => Promise<void>
}) {
  const [reason,  setReason]  = useState(customer.blacklistReason ?? "")
  const [saving,  setSaving]  = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onConfirm(reason)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-base font-bold text-gray-900">Blacklister {customer.name}</h3>
        <p className="mb-4 text-xs text-gray-400">{customer.phone}</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Raison (optionnel)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
              placeholder="Faux commandes, numéro invalide…"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldBan className="h-4 w-4" />}
              Blacklister
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Expanded row ─────────────────────────────────────────────────────────────

function ExpandedOrders({ phone }: { phone: string }) {
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/orders?phone=${encodeURIComponent(phone)}&pageSize=20`)
      .then((r) => r.json())
      .then((d: { orders: Order[] }) => { setOrders(d.orders ?? []); setLoading(false) })
  }, [phone])

  if (loading) return (
    <tr><td colSpan={8} className="px-6 py-3">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Chargement…
      </div>
    </td></tr>
  )

  return (
    <tr>
      <td colSpan={8} className="bg-gray-50 px-6 py-3">
        <p className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Historique des commandes</p>
        {orders.length === 0 ? (
          <p className="text-xs text-gray-400">Aucune commande trouvée</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400">
                {["N°","Produit","Qté","Total","Statut","Date"].map((h) => (
                  <th key={h} className="pb-1.5 pr-4 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="py-1.5 pr-4 font-mono text-gray-500">{o.orderNumber}</td>
                  <td className="py-1.5 pr-4 text-gray-700 max-w-[180px] truncate">{o.product.titleFr}</td>
                  <td className="py-1.5 pr-4 text-gray-600">{o.quantity}</td>
                  <td className="py-1.5 pr-4 font-semibold text-gray-800">{formatMAD(o.total)}</td>
                  <td className="py-1.5 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="py-1.5 text-gray-400">{new Date(o.createdAt).toLocaleDateString("fr-MA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [customers,   setCustomers]   = useState<Customer[]>([])
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState("")
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [blModal,     setBlModal]     = useState<Customer | null>(null)

  const fetchCustomers = useCallback(async (q = search) => {
    setLoading(true)
    const qs  = new URLSearchParams({ ...(q ? { search: q } : {}), limit: "50" })
    const res = await fetch(`/api/admin/customers?${qs}`)
    const d   = await res.json() as { customers: Customer[]; total: number }
    setCustomers(d.customers ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }, [search])

  useEffect(() => { fetchCustomers() }, [])

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    fetchCustomers(search)
  }

  async function handleBlacklist(customer: Customer, reason: string) {
    const res = await fetch("/api/admin/customers", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ phone: customer.phone, isBlacklisted: true, blacklistReason: reason }),
    })
    if (res.ok) {
      const updated = await res.json() as Customer
      setCustomers((prev) => prev.map((c) => c.phone === customer.phone ? updated : c))
      setBlModal(null)
      toast.success(`${customer.name} blacklisté`)
    }
  }

  async function handleUnblacklist(customer: Customer) {
    const res = await fetch("/api/admin/customers", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ phone: customer.phone, isBlacklisted: false }),
    })
    if (res.ok) {
      const updated = await res.json() as Customer
      setCustomers((prev) => prev.map((c) => c.phone === customer.phone ? updated : c))
      toast.success(`${customer.name} retiré de la blacklist`)
    }
  }

  return (
    <div className="space-y-5">
      {/* Search + stats */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou téléphone…"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-orange-400"
          />
        </form>
        <div className="text-sm text-gray-500">
          <span className="font-bold text-gray-900">{total}</span> clients
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="w-8 px-3 py-3" />
                {["Nom","Téléphone","Commandes","Revenu","Profit","Dernière cmd","Risque",""].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-gray-50">
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-3 py-3"><div className="h-4 w-16 rounded bg-gray-100" /></td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">Aucun client trouvé</td>
                </tr>
              ) : (
                customers.flatMap((c) => [
                  <tr
                    key={c.id}
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className={`cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition ${c.isBlacklisted ? "bg-red-50/30" : ""}`}
                  >
                    <td className="px-3 py-3 text-gray-300">
                      {expanded === c.id
                        ? <ChevronDown className="h-4 w-4 text-gray-500" />
                        : <ChevronRight className="h-4 w-4" />
                      }
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      {c.blacklistReason && (
                        <p className="text-xs text-red-500 truncate max-w-[140px]">{c.blacklistReason}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-600">{c.phone}</td>
                    <td className="px-3 py-3 tabular-nums font-bold text-gray-900">{c.totalOrders}</td>
                    <td className="px-3 py-3 tabular-nums text-gray-700">{formatMAD(c.totalRevenue)}</td>
                    <td className={`px-3 py-3 tabular-nums font-semibold ${c.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatMAD(c.totalProfit)}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-400">
                      {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("fr-MA") : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${RISK_BADGE[c.riskTag]}`}>
                        {c.riskTag}
                      </span>
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      {c.isBlacklisted ? (
                        <button
                          type="button"
                          onClick={() => handleUnblacklist(c)}
                          className="flex items-center gap-1 rounded-xl border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-100"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Débloquer
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setBlModal(c)}
                          className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          <ShieldBan className="h-3.5 w-3.5" />
                          Blacklist
                        </button>
                      )}
                    </td>
                  </tr>,
                  ...(expanded === c.id ? [<ExpandedOrders key={`exp-${c.id}`} phone={c.phone} />] : []),
                ])
              )}
            </tbody>
          </table>
        </div>
      </div>

      {blModal && (
        <BlacklistModal
          customer={blModal}
          onClose={() => setBlModal(null)}
          onConfirm={(reason) => handleBlacklist(blModal, reason)}
        />
      )}
    </div>
  )
}
