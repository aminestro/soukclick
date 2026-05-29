import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ProductForm } from "@/components/admin/products/ProductForm"

export const metadata = { title: "Nouveau produit" }

export default function NewProductPage() {
  return (
    <div className="space-y-4 pb-10 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Produits
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-900">Nouveau produit</span>
      </div>

      <h1 className="text-xl font-extrabold text-gray-900">Créer un produit</h1>

      <ProductForm />
    </div>
  )
}
