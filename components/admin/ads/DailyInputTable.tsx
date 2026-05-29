"use client"

import { useState, useRef, useCallback } from "react"
import { toast } from "sonner"
import { Loader2, Trash2, Plus } from "lucide-react"
import { toCentimes, fromCentimes } from "@/lib/format"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdsRow {
  id:          string
  date:        string   // ISO date YYYY-MM-DD
  platform:    string
  spend:       number   // centimes
  impressions: number
  clicks:      number
  orders:      number
  revenue:     number   // centimes
  notes:       string | null
}

type NumericField = "spend" | "impressions" | "clicks" | "orders" | "revenue"
type Field        = NumericField | "notes"

interface DailyInputTableProps {
  rows:         AdsRow[]
  productId:    string
  platform:     string
  onRowUpdated: (row: AdsRow) => void
  onRowDeleted: (id: string) => void
  onRowAdded:   (row: AdsRow) => void
}

// ─── Editable cell ────────────────────────────────────────────────────────────

function EditableCell({
  rowId,
  field,
  value,
  isMoney,
  onSave,
}: {
  rowId:   string
  field:   Field
  value:   number | string | null
  isMoney: boolean
  onSave:  (id: string, field: Field, val: number | string | null) => Promise<void>
}) {
  const [editing,  setEditing]  = useState(false)
  const [draft,    setDraft]    = useState("")
  const [saving,   setSaving]   = useState(false)
  const inputRef                = useRef<HTMLInputElement>(null)

  function displayValue(): string {
    if (value === null || value === undefined || value === "") return "—"
    if (isMoney) return `${fromCentimes(value as number).toFixed(0)}`
    return String(value)
  }

  function startEdit() {
    setEditing(true)
    const raw = isMoney
      ? (value ? fromCentimes(value as number).toString() : "")
      : (value?.toString() ?? "")
    setDraft(raw)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  async function commit() {
    setEditing(false)
    let finalVal: number | string | null = draft === "" ? null : draft

    if (field !== "notes") {
      const n = parseFloat(draft)
      finalVal = isNaN(n) ? 0 : (isMoney ? toCentimes(n) : Math.round(n))
    }

    if (finalVal === value) return  // no change

    setSaving(true)
    await onSave(rowId, field, finalVal)
    setSaving(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); inputRef.current?.blur() }
    if (e.key === "Escape") { setEditing(false); setDraft("") }
  }

  if (saving) {
    return (
      <td className="px-3 py-2 text-center">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-400 mx-auto" />
      </td>
    )
  }

  return (
    <td
      className="px-3 py-2 cursor-pointer"
      onClick={startEdit}
    >
      {editing ? (
        <input
          ref={inputRef}
          type={field === "notes" ? "text" : "number"}
          min="0"
          step={isMoney ? "0.01" : "1"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          className="w-full rounded-lg border border-orange-400 bg-white px-2 py-1 text-sm outline-none ring-1 ring-orange-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          autoFocus
        />
      ) : (
        <span className={`block text-sm tabular-nums ${value === 0 || value === null ? "text-gray-300" : "text-gray-800"} hover:bg-orange-50 rounded px-1 -mx-1 py-0.5 transition`}>
          {displayValue()}
          {isMoney && value ? " MAD" : ""}
        </span>
      )}
    </td>
  )
}

// ─── New row form ─────────────────────────────────────────────────────────────

function NewRowForm({
  productId,
  platform,
  onAdded,
}: {
  productId: string
  platform:  string
  onAdded:   (row: AdsRow) => void
}) {
  const [date,    setDate]    = useState(() => new Date().toISOString().slice(0, 10))
  const [spend,   setSpend]   = useState("")
  const [saving,  setSaving]  = useState(false)

  async function submit() {
    setSaving(true)
    const res = await fetch("/api/admin/ads", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        productId,
        date,
        platform: platform === "ALL" ? "META" : platform,
        spend:    spend ? toCentimes(parseFloat(spend)) : 0,
      }),
    })
    const body = await res.json() as AdsRow & { error?: string }
    if (res.ok) {
      onAdded(body)
      setSpend("")
      toast.success("Ligne ajoutée")
    } else {
      toast.error(body.error ?? "Erreur")
    }
    setSaving(false)
  }

  return (
    <tr className="border-t-2 border-orange-100 bg-orange-50/40">
      <td className="px-3 py-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-orange-400"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={spend}
          onChange={(e) => setSpend(e.target.value)}
          placeholder="0"
          className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-orange-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="ml-1 text-xs text-gray-400">MAD</span>
      </td>
      <td colSpan={5} className="px-3 py-2">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Ajouter cette journée
        </button>
      </td>
    </tr>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DailyInputTable({
  rows, productId, platform, onRowUpdated, onRowDeleted, onRowAdded,
}: DailyInputTableProps) {

  const saveCell = useCallback(async (
    id: string,
    field: Field,
    val: number | string | null,
  ) => {
    const res = await fetch(`/api/admin/ads/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ [field]: val }),
    })
    if (res.ok) {
      const updated = await res.json() as AdsRow
      onRowUpdated(updated)
    } else {
      toast.error("Erreur de sauvegarde")
    }
  }, [onRowUpdated])

  async function deleteRow(id: string) {
    if (!confirm("Supprimer cette ligne ?")) return
    const res = await fetch(`/api/admin/ads/${id}`, { method: "DELETE" })
    if (res.ok) {
      onRowDeleted(id)
      toast.success("Ligne supprimée")
    }
  }

  // Column definitions
  const cols: Array<{ field: Field; label: string; isMoney: boolean }> = [
    { field: "spend",       label: "Dépense",      isMoney: true  },
    { field: "impressions", label: "Impressions",  isMoney: false },
    { field: "clicks",      label: "Clics",        isMoney: false },
    { field: "orders",      label: "Commandes",    isMoney: false },
    { field: "revenue",     label: "Revenu",       isMoney: true  },
    { field: "notes",       label: "Notes",        isMoney: false },
  ]

  function cpa(row: AdsRow): string {
    if (!row.orders || !row.spend) return "—"
    return `${fromCentimes(Math.round(row.spend / row.orders)).toFixed(0)} MAD`
  }

  function roas(row: AdsRow): string {
    if (!row.spend) return "—"
    const r = row.revenue / row.spend
    return r.toFixed(2) + "x"
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date</th>
            {cols.map((c) => (
              <th key={c.field} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                {c.label}
              </th>
            ))}
            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">CPA</th>
            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">ROAS</th>
            <th className="px-3 py-3" />
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length + 4} className="px-4 py-12 text-center text-sm text-gray-400">
                Aucune donnée — ajoutez une journée ci-dessous
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition group">
                <td className="px-3 py-2 text-xs font-mono text-gray-500 whitespace-nowrap">
                  {new Date(row.date).toLocaleDateString("fr-MA", { day: "2-digit", month: "2-digit" })}
                </td>
                {cols.map((c) => (
                  <EditableCell
                    key={c.field}
                    rowId={row.id}
                    field={c.field}
                    value={row[c.field] as number | string | null}
                    isMoney={c.isMoney}
                    onSave={saveCell}
                  />
                ))}
                {/* Computed CPA + ROAS — read-only */}
                <td className="px-3 py-2 text-xs font-semibold text-gray-600">{cpa(row)}</td>
                <td className={`px-3 py-2 text-xs font-bold ${
                  !row.spend ? "text-gray-300" :
                  row.revenue / row.spend >= 3 ? "text-green-600" :
                  row.revenue / row.spend >= 2 ? "text-orange-500" : "text-red-600"
                }`}>
                  {roas(row)}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => deleteRow(row.id)}
                    className="opacity-0 group-hover:opacity-100 transition rounded-lg p-1 text-red-400 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))
          )}

          {/* New row */}
          <NewRowForm productId={productId} platform={platform} onAdded={onRowAdded} />
        </tbody>
      </table>
    </div>
  )
}
