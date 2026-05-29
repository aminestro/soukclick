"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Archive } from "lucide-react"
import { toast } from "sonner"

export function ArchiveProductButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function archive() {
    if (!confirm("Archiver ce produit ? Il ne sera pas supprimé.")) return
    setLoading(true)
    const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Produit archivé")
      router.push("/admin/products")
    } else {
      toast.error("Erreur lors de l'archivage")
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
      <h2 className="mb-3 font-bold text-red-800 flex items-center gap-2">
        <Archive className="h-4 w-4" /> Zone danger
      </h2>
      <p className="text-sm text-red-600 mb-3">
        Archiver ce produit le rendra invisible sur le site. Il ne sera pas supprimé.
      </p>
      <button
        type="button"
        onClick={archive}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        <Archive className="h-4 w-4" />
        {loading ? "Archivage…" : "Archiver le produit"}
      </button>
    </div>
  )
}
