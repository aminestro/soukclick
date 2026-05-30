"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft, ExternalLink, Copy, Save, Globe, EyeOff,
  MoreHorizontal, Check, Pencil,
} from "lucide-react"
import { SectionsList }   from "@/components/admin/builder/SectionsList"
import { SectionEditor }  from "@/components/admin/builder/SectionEditor"
import { BuilderPreview } from "@/components/admin/builder/BuilderPreview"
import { Toggle }         from "@/components/admin/builder/editors/HeroEditor"
import type { LandingSection, SectionType } from "@/types/landing"
import type { Offer, Review } from "@prisma/client"

// ─── Types ────────────────────────────────────────────────────────────────────

export type PageLanguage = "fr" | "darija" | "ar"

interface LPData {
  id:        string
  slug:      string
  isActive:  boolean
  language:  string
  metaTitle: string | null
  metaDesc:  string | null
  template:  string
  sections:  LandingSection[]
  product: {
    id:           string
    titleFr:      string
    price:        number
    comparePrice: number | null
    images:       string[]
    reviews:      Array<{ id: string; authorName: string; authorCity: string | null; rating: number } & Review>
    offers:       Offer[]
  }
}

const LANGUAGES: Array<{ value: PageLanguage; flag: string; label: string; dir: "ltr" | "rtl" }> = [
  { value: "fr",     flag: "🇫🇷", label: "FR",     dir: "ltr" },
  { value: "darija", flag: "🇲🇦", label: "Darija", dir: "rtl" },
  { value: "ar",     flag: "🇸🇦", label: "AR",     dir: "rtl" },
]

// ─── Inline title editor ──────────────────────────────────────────────────────

function EditableTitle({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  function start() { setDraft(value); setEditing(true); setTimeout(() => inputRef.current?.select(), 10) }
  function commit() { if (draft.trim()) onSave(draft.trim()); setEditing(false) }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false) }}
        className="rounded-lg border border-orange-400 bg-white px-2 py-1 text-sm font-semibold text-gray-900 outline-none ring-2 ring-orange-200 w-48"
        autoFocus
      />
    )
  }

  return (
    <button
      type="button"
      onClick={start}
      className="group flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
    >
      <span className="truncate max-w-[160px]">{value}</span>
      <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}

// ─── Language selector ────────────────────────────────────────────────────────

function LanguageSelector({
  value,
  onChange,
}: {
  value:    PageLanguage
  onChange: (lang: PageLanguage) => void
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50/80 p-0.5">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.value}
          type="button"
          onClick={() => onChange(lang.value)}
          title={`${lang.flag} ${lang.label}${lang.dir === "rtl" ? " (RTL)" : ""}`}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all ${
            value === lang.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <span>{lang.flag}</span>
          <span className="hidden sm:inline">{lang.label}</span>
          {lang.dir === "rtl" && value === lang.value && (
            <span className="text-[8px] font-bold text-orange-500 leading-none">RTL</span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── More menu ────────────────────────────────────────────────────────────────

function MoreMenu({ onCopyLink }: { onCopyLink: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-44 rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl shadow-black/10">
          <button
            type="button"
            onClick={() => { onCopyLink(); setOpen(false) }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-gray-50"
          >
            <Copy className="h-3.5 w-3.5 text-gray-400" />
            Copier le lien
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-gray-50"
          >
            <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
            Paramètres SEO
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BuilderPage() {
  const params = useParams()
  const router = useRouter()
  const id     = params.id as string

  const [lpData,       setLpData]       = useState<LPData | null>(null)
  const [sections,     setSections]     = useState<LandingSection[]>([])
  const [selectedType, setSelectedType] = useState<SectionType | null>(null)
  const [isActive,     setIsActive]     = useState(false)
  const [language,     setLanguageState] = useState<PageLanguage>("fr")
  const [saving,       setSaving]       = useState(false)
  const [dirty,        setDirty]        = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [pageTitle,    setPageTitle]    = useState("")
  const isDirty = useRef(false)

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/admin/landing-pages/${id}`)
      .then((r) => r.json())
      .then((d: LPData) => {
        setLpData(d)
        setSections(d.sections ?? [])
        setIsActive(d.isActive)
        setPageTitle(d.product.titleFr)
        const lang = (d.language ?? "fr") as PageLanguage
        setLanguageState(LANGUAGES.some((l) => l.value === lang) ? lang : "fr")
        const first = (d.sections ?? []).find((s) => s.enabled)
        if (first) setSelectedType(first.type)
        setLoading(false)
      })
      .catch(() => { toast.error("Erreur de chargement"); router.push("/admin/landing-pages") })
  }, [id, router])

  // ── Language change ───────────────────────────────────────────────────────

  async function handleLanguageChange(lang: PageLanguage) {
    setLanguageState(lang)
    // Persist immediately — language change is a quick toggle, not part of section dirty state
    await fetch(`/api/admin/landing-pages/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ language: lang }),
    })
    const langMeta = LANGUAGES.find((l) => l.value === lang)
    toast.success(`Langue : ${langMeta?.flag} ${langMeta?.label}${langMeta?.dir === "rtl" ? " (RTL)" : ""}`)
  }

  // ── Sections ──────────────────────────────────────────────────────────────

  function handleSectionsChange(newSections: LandingSection[]) {
    setSections(newSections)
    isDirty.current = true
    setDirty(true)
  }

  function handleSectionEdit(updated: LandingSection) {
    setSections((prev) => prev.map((s) => s.type === updated.type ? updated : s))
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

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#F8F8F8]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-medium text-gray-500">Chargement du builder…</p>
        </div>
      </div>
    )
  }

  if (!lpData) return null

  const selectedSection = sections.find((s) => s.type === selectedType) ?? null
  const previewProduct  = {
    titleFr:      lpData.product.titleFr,
    price:        lpData.product.price,
    comparePrice: lpData.product.comparePrice,
    images:       lpData.product.images,
    reviews:      lpData.product.reviews as unknown as Review[],
    offers:       lpData.product.offers,
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#F8F8F8]" style={{ zIndex: 40 }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">

        {/* Left */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/admin/landing-pages"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Landing Pages</span>
          </Link>

          <div className="h-4 w-px bg-gray-200 shrink-0" />

          <EditableTitle value={pageTitle} onSave={setPageTitle} />

          <span className="hidden font-mono text-[11px] text-gray-400 sm:inline shrink-0">
            /{lpData.slug}
          </span>

          {dirty && (
            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Non sauvegardé
            </span>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">

          {/* Language selector */}
          <LanguageSelector value={language} onChange={handleLanguageChange} />

          <div className="h-5 w-px bg-gray-200 shrink-0" />

          {/* Status badge + toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
            <span className="hidden text-[12px] font-medium text-gray-700 sm:inline">
              {isActive ? "Actif" : "Brouillon"}
            </span>
            <Toggle checked={isActive} onChange={toggleActive} />
          </div>

          {/* View */}
          <Link
            href={`/${lpData.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Aperçu</span>
          </Link>

          {/* Save */}
          <button
            type="button"
            onClick={() => save()}
            disabled={saving || !dirty}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:pointer-events-none disabled:opacity-40"
            title="Ctrl+S"
          >
            {saving ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
            ) : dirty ? (
              <Save className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5 text-green-500" />
            )}
            <span className="hidden sm:inline">{saving ? "Sauvegarde…" : "Enregistrer"}</span>
          </button>

          {/* Publish */}
          <button
            type="button"
            onClick={() => save(!isActive)}
            disabled={saving}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12px] font-bold transition-all disabled:opacity-60 ${
              isActive
                ? "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                : "bg-orange-500 text-white shadow-sm shadow-orange-500/30 hover:bg-orange-600"
            }`}
          >
            {isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isActive ? "Dépublier" : "Publier"}</span>
          </button>

          <MoreMenu onCopyLink={copyLink} />
        </div>
      </header>

      {/* ── 3-column body ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — sections (280px) */}
        <div className="w-[280px] shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          <SectionsList
            sections={sections}
            selectedType={selectedType}
            onChange={handleSectionsChange}
            onSelect={(type) => setSelectedType(type)}
          />
        </div>

        {/* Center — preview */}
        <div className="flex-1 overflow-hidden">
          <BuilderPreview sections={sections} product={previewProduct} language={language} />
        </div>

        {/* Right — editor (360px) */}
        <div className="w-[360px] shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          {selectedSection ? (
            <SectionEditor
              section={selectedSection}
              onChange={handleSectionEdit}
              language={language}
              reviews={lpData.product.reviews.map((r) => ({
                id:         r.id,
                authorName: r.authorName,
                authorCity: r.authorCity,
                rating:     r.rating,
              }))}
              productId={lpData.product.id}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                👈
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Aucune section sélectionnée</p>
                <p className="mt-1 text-[12px] text-gray-400 leading-relaxed">
                  Cliquez sur une section dans la liste de gauche pour l&apos;éditer
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
