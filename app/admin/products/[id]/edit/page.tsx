import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { ProductForm } from "@/components/admin/products/ProductForm"
import type { ProductFormValues } from "@/components/admin/products/ProductForm"
import { ArchiveProductButton }  from "@/components/admin/products/ArchiveProductButton"
import { DeleteProductButton }   from "@/components/admin/products/DeleteProductButton"

interface PageProps {
  params: { id: string }
}

export default async function EditProductPage({ params }: PageProps) {
  await requireAdmin()

  // Guard against malformed IDs before hitting DB
  if (!params.id || params.id.length < 10) notFound()

  let product
  try {
    product = await prisma.product.findUnique({
      where:   { id: params.id },
      include: {
        landingPages: {
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { orders: true } } },
        },
        offers:   { orderBy: { minQuantity: "asc" } },
        reviews:  { orderBy: { sortOrder: "asc" } },
        research: true,
      },
    })
  } catch (err) {
    console.error("[EditProductPage] DB error:", err)
    redirect("/admin/products?error=db")
  }

  if (!product) notFound()

  const defaultValues: Partial<ProductFormValues> = {
    titleFr:       product.titleFr,
    titleAr:       product.titleAr       ?? "",
    slug:          product.slug,
    descriptionFr: product.descriptionFr ?? "",
    descriptionAr: product.descriptionAr ?? "",
    price:         product.price,
    costPrice:     product.costPrice,
    comparePrice:  product.comparePrice  ?? undefined,
    stock:         product.stock,
    lowStockAlert: product.lowStockAlert,
    status:        product.status,
    testingStatus: product.testingStatus,
    images:        product.images ?? [],
    supplierUrl:   product.research?.supplierUrl ?? "",
    alibabaUrl:    product.research?.alibabaUrl  ?? "",
    url1688:       product.research?.url1688     ?? "",
    buyingPrice:   product.research?.buyingPrice ?? undefined,
  }

  return (
    <div className="space-y-4 pb-10 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Produits
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
          {product.titleFr}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">{product.titleFr}</h1>
          <p className="text-sm text-gray-500 font-mono mt-0.5">/{product.slug}</p>
        </div>
        <Link
          href={`/${product.slug}`}
          target="_blank"
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 shrink-0 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Voir la page
        </Link>
      </div>

      {/* Form */}
      <ProductForm
        productId={product.id}
        defaultValues={defaultValues}
        landingPages={product.landingPages}
        offers={product.offers}
        reviews={product.reviews}
      />

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 space-y-4">
        <h2 className="font-bold text-red-800 flex items-center gap-2">
          ⚠️ Zone danger
        </h2>

        {/* Archive */}
        {product.status !== "ARCHIVED" && (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-red-600">
              <strong>Archiver</strong> — masque le produit sans le supprimer. Réversible.
            </p>
            <ArchiveProductButton productId={product.id} />
          </div>
        )}

        {/* Delete */}
        <div className="border-t border-red-200 pt-4 flex flex-col gap-1.5">
          <p className="text-sm text-red-700">
            <strong>Supprimer définitivement</strong> — supprime le produit, ses images, ses landing pages et toutes les données associées. <strong>Irréversible.</strong>
          </p>
          <DeleteProductButton productId={product.id} productName={product.titleFr} />
        </div>
      </div>
    </div>
  )
}
