"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Column<T> {
  key:        string
  header:     string
  cell:       (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns:    Column<T>[]
  data:       T[]
  loading?:   boolean
  emptyText?: string
  page:       number
  pageSize:   number
  total:      number
  onPage:     (page: number) => void
  onRow?:     (row: T) => void
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows({ cols, rows = 8 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 w-full max-w-[120px] rounded bg-gray-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading,
  emptyText = "Aucun résultat",
  page,
  pageSize,
  total,
  onPage,
  onRow,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / pageSize)
  const start      = (page - 1) * pageSize + 1
  const end        = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col gap-0">
      {/* Horizontal scroll wrapper */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <SkeletonRows cols={columns.length} />
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-sm text-gray-400"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRow?.(row)}
                  className={`transition ${
                    onRow ? "cursor-pointer hover:bg-orange-50" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-gray-700 ${col.className ?? ""}`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between px-1 pt-3 text-sm text-gray-500">
          <span>
            {start}–{end} sur {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPage(page - 1)}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…")
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPage(p as number)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                      p === page
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              onClick={() => onPage(page + 1)}
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
