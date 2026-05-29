"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft, ExternalLink, Copy, Save, Globe, EyeOff,
} from "lucide-react"
import { SectionsList }   from "@/components/admin/builder/SectionsList"
import { SectionEditor }  from "@/components/admin/builder/SectionEditor"
import { BuilderPreview } from "@/components/admin/builder/BuilderPreview"
import { Toggle }         from "@/components/admin/builder/editors/HeroEditor"
import type { LandingSection, SectionType } from "@/types/landing"
import type { Offer, Review } from "@prisma/client"

// ─── Types ────────────────────────────────────────────────────────────────────

interface LPData {
  id:        string
  slug:      string
  isActive:  boolean
  metaTitle: string | null
  metaDesc:  string | null
  template:  string
  sections:  LandingSection[]
  product: {
    id:          string
    titleFr:     string
    price:       number
    comparePrice:number | null
    images:      string[]
    reviews:     Array<{ id: string; authorName: string; authorCity: string | null; rating: number } & Review>
    offers:      Offer[]
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BuilderPage() {
  const params  = useParams()
  const router  = useRouter()
  const id      = params.id as string

  const [lpData,       setLpData]       = useState<LPData | null>(null)
  const [sections,     setSections]     = useState<LandingSection[]>([])
  const [selectedType, setSelectedType] = useState<SectionType | null>(null)
  const [isActive,     setIsActive]     = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [dirty,        setDirty]        = useState(false)
  const [loading,      setLoading]      = useState(true)

  // Track unsaved changes
  const isDirty = useRef(false)

  // ── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/admin/landing-pages/${id}`)
      .then((r) => r.json())
      .then((d: LPData) => {
        setLpData(d)
        setSections(d.sections ?? [])
        setIsActive(d.isActive)
        // Auto-select first enabled section
        const first = (d.sections ?? []).find((s) => s.enabled)
        if (first) setSelectedType(first.type)
        setLoading(false)
      })
      .catch(() => { toast.error("Erreur de chargement"); router.push("/admin/landing-pages") })
  }, [id, router])

  // ── Sections change ────────────────────────────────────────────────────────

  function handleSectionsChange(newSections: LandingSection[]) {
    setSections(newSections)
    isDirty.current = true
    setDirty(true)
  }

  function handleSectionEdit(updated: LandingSection) {
    setSections((prev) =>
      prev.map((s) => s.type === updated.type ? updated : s),
    )
    isDirty.current = true
    setDirty(true)
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  const save = useCallback(async (publish?: boolean) => {
    setSaving(true)
    const body: Record<string, unknown> = { sections }
    if (publish !== undefined) body["isActive"] = publish

    const res = await fetch(`/api/admin/landing-pages/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    })

    if (res.ok) {
      const updated = await res.json() as { isActive: boolean }
      setIsActive(updated.isActive)
      isDirty.current = false
      setDirty(false)
      toast.success(publish ? "Landing page publiée ✓" : "Sauvegardé ✓")
    } else {
      toast.error("Erreur lors de la sauvegarde")
    }
    setSaving(false)
  }, [id, sections])

  // Keyboard save shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [save])

  async function toggleActive() {
    const next = !isActive
    setSaving(true)
    const res = await fetch(`/api/admin/landing-pages/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isActive: next }),
    })
    if (res.ok) {
      setIsActive(next)
      toast.success(next ? "Page activée" : "Page désactivée")
    }
    setSaving(false)
  }

  function copyLink() {
    const url = `${window.location.origin}/${lpData?.slug}`
    navigator.clipboard.writeText(url)
    toast("🔗 Lien copié")
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center -m-6 bg-gray-100">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-gray-500">Chargement du builder…</p>
        </div>
      </div>
    )
  }

  if (!lpData) return null

  const selectedSection = sections.find((s) => s.type === selectedType) ?? null

  const previewProduct = {
    titleFr:     lpData.product.titleFr,
    price:       lpData.product.price,
    comparePrice:lpData.product.comparePrice,
    images:      lpData.product.images,
    reviews:     lpData.product.reviews as unknown as Review[],
    offers:      lpData.product.offers,
  }

  return (
    // Full-screen builder — override admin shell padding
    <div className="fixed inset-0 flex flex-col bg-white" style={{ zIndex: 40 }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/landing-pages"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Landing Pages</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <span className="text-sm font-mono text-gray-500">/{lpData.slug}</span>
            <button
              type="button"
              onClick={copyLink}
              className="rounded p-1 text-gray-400 hover:text-gray-700"
              title="Copier le lien"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          {dirty && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
              Non sauvegardé
            </span>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Active toggle */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-1.5">
            {isActive
              ? <Globe className="h-3.5 w-3.5 text-green-600" />
              : <EyeOff className="h-3.5 w-3.5 text-gray-400" />}
            <span className="text-xs font-semibold text-gray-700 hidden sm:inline">
              {isActive ? "Active" : "Brouillon"}
            </span>
            <Toggle checked={isActive} onChange={toggleActive} />
          </div>

          {/* View page */}
          <Link
            href={`/${lpData.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Voir</span>
          </Link>

          {/* Save */}
          <button
            type="button"
            onClick={() => save()}
            disabled={saving || !dirty}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            title="Ctrl+S"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Enregistrer</span>
          </button>

          {/* Publish */}
          {!isActive && (
            <button
              type="button"
              onClick={() => save(true)}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-green-600 disabled:opacity-60"
            >
              <Globe className="h-3.5 w-3.5" />
              Publier
            </button>
          )}
        </div>
      </header>

      {/* ── 3-column body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — sections list (260px) */}
        <div className="w-[260px] shrink-0 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
          <SectionsList
            sections={sections}
            selectedType={selectedType}
            onChange={handleSectionsChange}
            onSelect={(type) => setSelectedType(type)}
          />
        </div>

        {/* Center — live preview (flex-1) */}
        <div className="flex-1 overflow-hidden">
          <BuilderPreview sections={sections} product={previewProduct} />
        </div>

        {/* Right — section editor (320px) */}
        <div className="w-[320px] shrink-0 border-l border-gray-200 bg-white overflow-hidden flex flex-col">
          {selectedSection ? (
            <SectionEditor
              section={selectedSection}
              onChange={handleSectionEdit}
              reviews={lpData.product.reviews.map((r) => ({
                id:         r.id,
                authorName: r.authorName,
                authorCity: r.authorCity,
                rating:     r.rating,
              }))}
              productId={lpData.product.id}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-gray-400 p-6 text-center">
              <span className="text-3xl mb-3">👈</span>
              <p className="text-sm font-medium">Sélectionnez une section</p>
              <p className="text-xs mt-1">dans la liste à gauche pour l'éditer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
