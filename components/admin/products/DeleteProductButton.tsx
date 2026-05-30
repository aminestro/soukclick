"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface DeleteProductButtonProps {
  productId:   string
  productName: string
}

export function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const router          = useRouter()
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)

  async function confirmDelete() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" })
      const body = await res.json() as { success?: boolean; error?: string }

      if (res.ok && body.success) {
        toast.success("Produit supprimé définitivement")
        router.push("/admin/products")
      } else {
        toast.error(body.error ?? "Erreur lors de la suppression")
        setLoading(false)
        setOpen(false)
      }
    } catch {
      toast.error("Erreur réseau")
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Supprimer le produit
      </button>

      {/* Confirmation modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !loading && setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            {/* Icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <h2 className="mb-1 text-lg font-bold text-gray-900">
              Supprimer ce produit ?
            </h2>
            <p className="mb-1 text-sm text-gray-500">
              Vous êtes sur le point de supprimer :
            </p>
            <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800 truncate">
              {productName}
            </p>
            <p className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              ⚠️ Cette action est <strong>irréversible</strong>. Le produit, ses images, ses landing pages et toutes ses données associées seront définitivement supprimés.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Suppression…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Supprimer définitivement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
