"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import {
  Search, Download, CheckSquare, Square,
  ExternalLink, Pencil, X, Check, Loader2,
} from "lucide-react"
import { fromCentimes, toCentimes } from "@/lib/format"

// ─── Types ────────────────────────────────────────────────────────────────────

interface City {
  id:            string
  nameFr:        string
  nameAr:        string | null
  wilaya:        string
  wilayaCode:    string
  deliveryPrice: number
  deliveryDays:  number
  isRemote:      boolean
  isActive:      boolean
}

interface Company {
  id:           string
  name:         string
  slug:         string
  logoUrl:      string | null
  trackingUrl:  string | null
  exportFormat: "EXCEL" | "CSV"
  isActive:     boolean
  _count:       { orders: number }
}

type Tab = "villes" | "societes"

// ─── Inline editable cell ─────────────────────────────────────────────────────

function EditCell({
  value,
  onSave,
  type = "number",
  min,
}: {
  value:   string | number
  onSave:  (v: string) => Promise<void>
  type?:   "number" | "text"
  min?:    number
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState("")
  const [saving,  setSaving]  = useState(false)

  function start() {
    setDraft(String(value))
    setEditing(true)
  }

  async function commit() {
    setEditing(false)
    if (draft === String(value)) return
    setSaving(true)
    await onSave(draft)
    setSaving(false)
  }

  if (saving) return <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-400" />

  return editing ? (
    <input
      autoFocus
      type={type}
      min={min}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditing(false) }}
      className="w-24 rounded-lg border border-orange-400 bg-white px-2 py-1 text-sm outline-none ring-1 ring-orange-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
    />
  ) : (
    <span
      onClick={start}
      className="cursor-pointer rounded px-1 py-0.5 text-sm hover:bg-orange-50 transition tabular-nums"
    >
      {value}
    </span>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${value ? "bg-green-500" : "bg-gray-300"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${value ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  )
}

// ─── Tab Villes ───────────────────────────────────────────────────────────────

function VillesTab() {
  const [cities,    setCities]    = useState<City[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState("")
  const [selected,  setSelected]  = useState<Set<string>>(new Set())
  const [bulkPrice, setBulkPrice] = useState("")
  const [applying,  setApplying]  = useState(false)

  const fetchCities = useCallback(async () => {
    setLoading(true)
    const res  = await fetch("/api/admin/delivery/cities")
    const data = await res.json() as City[]
    setCities(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchCities() }, [fetchCities])

  const filtered = cities.filter((c) => {
    const q = search.toLowerCase()
    return c.nameFr.toLowerCase().includes(q) || c.wilaya.toLowerCase().includes(q)
  })

  async function updateCity(id: string, data: Partial<City>) {
    const res = await fetch(`/api/admin/delivery/cities/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json() as City
      setCities((prev) => prev.map((c) => c.id === id ? updated : c))
    } else {
      toast.error("Erreur de sauvegarde")
    }
  }

  async function applyBulkPrice() {
    const price = parseFloat(bulkPrice)
    if (isNaN(price) || selected.size === 0) return
    setApplying(true)
    const res = await fetch("/api/admin/delivery/cities", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ids: Array.from(selected), deliveryPrice: toCentimes(price) }),
    })
    if (res.ok) {
      await fetchCities()
      setSelected(new Set())
      setBulkPrice("")
      toast.success(`Prix mis à jour pour ${selected.size} villes`)
    }
    setApplying(false)
  }

  function exportCsv() {
    const headers = ["Nom FR","Nom AR","Wilaya","Code","Prix livraison (MAD)","Jours","Zone remote","Actif"]
    const rows = cities.map((c) => [
      c.nameFr, c.nameAr ?? "", c.wilaya, c.wilayaCode,
      fromCentimes(c.deliveryPrice).toFixed(2),
      c.deliveryDays, c.isRemote ? "Oui" : "Non", c.isActive ? "Oui" : "Non",
    ].join(","))
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a"); a.href = url
    a.download = `villes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id))

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map((c) => c.id)))
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher ville ou wilaya…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-orange-400"
          />
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Bulk edit bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-orange-50 border border-orange-200 px-4 py-2.5">
          <span className="text-sm font-semibold text-orange-700">{selected.size} ville(s) sélectionnée(s)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={bulkPrice}
            onChange={(e) => setBulkPrice(e.target.value)}
            placeholder="Nouveau prix MAD"
            className="w-36 rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={applyBulkPrice}
            disabled={applying || !bulkPrice}
            className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Appliquer
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-3 py-3 w-10">
                  <button type="button" onClick={toggleAll}>
                    {allSelected
                      ? <CheckSquare className="h-4 w-4 text-orange-500" />
                      : <Square className="h-4 w-4 text-gray-400" />
                    }
                  </button>
                </th>
                {["Ville","Wilaya","Prix livraison","Jours","Remote","Actif"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-3 py-3"><div className="h-4 w-16 rounded bg-gray-100" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">Aucune ville trouvée</td>
                </tr>
              ) : (
                filtered.map((city) => (
                  <tr key={city.id} className={`hover:bg-gray-50 transition ${selected.has(city.id) ? "bg-orange-50/40" : ""}`}>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => toggleOne(city.id)}>
                        {selected.has(city.id)
                          ? <CheckSquare className="h-4 w-4 text-orange-500" />
                          : <Square className="h-4 w-4 text-gray-300 hover:text-gray-500" />
                        }
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900">{city.nameFr}</div>
                      {city.nameAr && <div className="text-xs text-gray-400 dir-rtl">{city.nameAr}</div>}
                    </td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{city.wilaya}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <EditCell
                          value={fromCentimes(city.deliveryPrice).toFixed(0)}
                          min={0}
                          onSave={async (v) => updateCity(city.id, { deliveryPrice: toCentimes(parseFloat(v) || 0) })}
                        />
                        <span className="text-xs text-gray-400">MAD</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <EditCell
                          value={city.deliveryDays}
                          min={1}
                          onSave={async (v) => updateCity(city.id, { deliveryDays: parseInt(v) || 1 })}
                        />
                        <span className="text-xs text-gray-400">j</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {city.isRemote
                        ? <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">Remote</span>
                        : <span className="text-gray-300 text-xs">—</span>
                      }
                    </td>
                    <td className="px-3 py-3">
                      <Toggle value={city.isActive} onChange={(v) => updateCity(city.id, { isActive: v })} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Tab Sociétés ─────────────────────────────────────────────────────────────

function SocietesTab() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading,   setLoading]   = useState(true)
  const [editing,   setEditing]   = useState<string | null>(null)
  const [draft,     setDraft]     = useState<Partial<Company>>({})
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    fetch("/api/admin/delivery/companies")
      .then((r) => r.json())
      .then((d: Company[]) => { setCompanies(d); setLoading(false) })
  }, [])

  function startEdit(c: Company) {
    setEditing(c.id)
    setDraft({ trackingUrl: c.trackingUrl ?? "", name: c.name, exportFormat: c.exportFormat })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const res = await fetch(`/api/admin/delivery/companies/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(draft),
    })
    if (res.ok) {
      const updated = await res.json() as Company
      setCompanies((prev) => prev.map((c) => c.id === id ? { ...updated, _count: c._count } : c))
      setEditing(null)
      toast.success("Société mise à jour")
    } else {
      toast.error("Erreur de sauvegarde")
    }
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/admin/delivery/companies/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isActive: !current }),
    })
    if (res.ok) {
      const updated = await res.json() as Company
      setCompanies((prev) => prev.map((c) => c.id === id ? { ...updated, _count: c._count } : c))
    }
  }

  if (loading) return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 h-40" />
      ))}
    </div>
  )

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {companies.map((c) => (
        <div key={c.id} className={`rounded-2xl border bg-white p-5 shadow-sm transition ${c.isActive ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
          {editing === c.id ? (
            <div className="space-y-3">
              <input
                value={draft.name ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nom"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
              <input
                value={draft.trackingUrl ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, trackingUrl: e.target.value }))}
                placeholder="URL de suivi (optionnel)"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
              <select
                value={draft.exportFormat}
                onChange={(e) => setDraft((p) => ({ ...p, exportFormat: e.target.value as "EXCEL" | "CSV" }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
              >
                <option value="CSV">CSV</option>
                <option value="EXCEL">Excel</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => saveEdit(c.id)}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-orange-500 py-1.5 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  {saving ? "Sauvegarde…" : "Enregistrer"}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c._count.orders} commandes</p>
                </div>
                <Toggle value={c.isActive} onChange={() => toggleActive(c.id, c.isActive)} />
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Format export</span>
                  <span className="font-semibold text-gray-700">{c.exportFormat}</span>
                </div>
                {c.trackingUrl && (
                  <a
                    href={c.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Lien de suivi
                  </a>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <Pencil className="h-3 w-3" />
                  Modifier
                </button>
                <a
                  href={`/api/admin/delivery/export?companyId=${c.id}`}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <Download className="h-3 w-3" />
                  CSV
                </a>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeliveryPage() {
  const [tab, setTab] = useState<Tab>("villes")

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 w-fit">
        {(["villes", "societes"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition capitalize ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "villes" ? "Villes" : "Sociétés de livraison"}
          </button>
        ))}
      </div>

      {tab === "villes"   && <VillesTab />}
      {tab === "societes" && <SocietesTab />}
    </div>
  )
}
