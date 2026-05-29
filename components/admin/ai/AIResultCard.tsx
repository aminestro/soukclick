"use client"

import { useState } from "react"
import { Copy, Check, Pencil, Save, X } from "lucide-react"

interface AIResultCardProps {
  label?:       string
  content:      string
  onSave?:      (updated: string) => void
  dir?:         "ltr" | "rtl"
  mono?:        boolean
  className?:   string
}

export function AIResultCard({
  label,
  content,
  onSave,
  dir    = "ltr",
  mono   = false,
  className = "",
}: AIResultCardProps) {
  const [copied,  setCopied]  = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(content)

  async function copy() {
    await navigator.clipboard.writeText(editing ? draft : content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function save() {
    onSave?.(draft)
    setEditing(false)
  }

  function cancel() {
    setDraft(content)
    setEditing(false)
  }

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      {(label || onSave) && (
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 bg-gray-50">
          {label && <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>}
          <div className="flex items-center gap-1.5 ml-auto">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={save}
                  className="flex items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-orange-600"
                >
                  <Save className="h-3 w-3" />
                  Sauvegarder
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={copy}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  {copied
                    ? <><Check className="h-3 w-3 text-green-500" />Copié</>
                    : <><Copy className="h-3 w-3" />Copier</>
                  }
                </button>
                {onSave && (
                  <button
                    type="button"
                    onClick={() => { setDraft(content); setEditing(true) }}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                  >
                    <Pencil className="h-3 w-3" />
                    Modifier
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            dir={dir}
            rows={Math.max(3, draft.split("\n").length + 1)}
            autoFocus
            className={`w-full rounded-xl border border-orange-300 bg-white px-3 py-2 text-sm outline-none ring-1 ring-orange-200 resize-none ${mono ? "font-mono" : ""}`}
          />
        ) : (
          <p
            dir={dir}
            className={`text-sm text-gray-800 whitespace-pre-wrap leading-relaxed ${mono ? "font-mono" : ""}`}
          >
            {content}
          </p>
        )}
      </div>
    </div>
  )
}
