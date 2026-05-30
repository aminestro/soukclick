"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus, Eye, EyeOff, Trash2, X } from "lucide-react"
import type { LandingSection, SectionType } from "@/types/landing"
import { Toggle } from "@/components/admin/builder/editors/HeroEditor"

// ─── Section metadata ─────────────────────────────────────────────────────────

const SECTION_META: Record<SectionType, { label: string; icon: string; description: string }> = {
  hero:         { label: "Hero",              icon: "🦸", description: "Titre, image produit et bouton d'achat" },
  benefits:     { label: "Bénéfices",         icon: "✨", description: "Liste des avantages du produit"        },
  features:     { label: "Caractéristiques",  icon: "⚡", description: "Détails et fonctionnalités"            },
  video:        { label: "Vidéo",             icon: "🎥", description: "Intégrer une vidéo YouTube ou TikTok"  },
  reviews:      { label: "Avis clients",      icon: "⭐", description: "Témoignages et notes clients"          },
  faq:          { label: "FAQ",               icon: "❓", description: "Questions / réponses fréquentes"       },
  before_after: { label: "Avant / Après",     icon: "🔄", description: "Comparaison visuelle avant/après"      },
  cta:          { label: "Appel à l'action",  icon: "🎯", description: "Section de conversion finale"          },
}

const ALL_SECTION_TYPES: SectionType[] = [
  "hero", "benefits", "features", "video", "reviews", "faq", "before_after", "cta",
]

// ─── Default data factory ────────────────────────────────────────────────────

function makeDefaultSection(type: SectionType, order: number): LandingSection {
  const defaults: Record<SectionType, LandingSection["data"]> = {
    hero:         { headline: "Titre principal", subheadline: "", image_url: null, video_url: null, cta_text: "Commander", cta_color: "#f97316", show_price: true, show_compare_price: true, badges: ["cod"] },
    benefits:     { title: "Nos avantages", items: [{ icon: "⭐", title: "Bénéfice 1", description: "" }] },
    features:     { title: "Caractéristiques", items: [{ image_url: null, title: "Feature 1", description: "" }] },
    video:        { url: "", thumbnail_url: null, caption: null },
    reviews:      { title: "Avis clients", review_ids: [] },
    faq:          { title: "FAQ", items: [{ question: "Question ?", answer: "Réponse." }] },
    before_after: { before_image: "", after_image: "", caption: null },
    cta:          { headline: "Commandez maintenant", cta_text: "Commander", cta_color: "#f97316", urgency_text: null },
  }
  return { type, enabled: true, order, data: defaults[type] } as LandingSection
}

// ─── Add section modal ────────────────────────────────────────────────────────

function AddSectionModal({
  availableTypes,
  onAdd,
  onClose,
}: {
  availableTypes: SectionType[]
  onAdd:          (type: SectionType) => void
  onClose:        () => void
}) {
  const [hovered, setHovered] = useState<SectionType | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/20">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Ajouter une section</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Choisissez le type de section à ajouter</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-2 p-4">
          {ALL_SECTION_TYPES.map((type) => {
            const meta      = SECTION_META[type]
            const available = availableTypes.includes(type)
            const isHovered = hovered === type

            return (
              <button
                key={type}
                type="button"
                disabled={!available}
                onClick={() => { onAdd(type); onClose() }}
                onMouseEnter={() => setHovered(type)}
                onMouseLeave={() => setHovered(null)}
                className={`group relative flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 ${
                  !available
                    ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50"
                    : isHovered
                    ? "border-orange-400 bg-orange-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
              >
                <span className="mt-0.5 text-xl leading-none">{meta.icon}</span>
                <div className="min-w-0">
                  <p className={`text-[13px] font-semibold leading-tight ${isHovered && available ? "text-orange-700" : "text-gray-900"}`}>
                    {meta.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-gray-400">{meta.description}</p>
                  {!available && (
                    <span className="mt-1 inline-block text-[10px] font-semibold text-gray-400">Déjà ajouté</span>
                  )}
                </div>
                {available && isHovered && (
                  <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                    <Plus className="h-3 w-3" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Sortable item ────────────────────────────────────────────────────────────

function SortableItem({
  section,
  selectedType,
  onSelect,
  onToggle,
  onDelete,
}: {
  section:      LandingSection
  selectedType: SectionType | null
  onSelect:     () => void
  onToggle:     (enabled: boolean) => void
  onDelete:     () => void
}) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: `${section.type}-${section.order}` })

  const meta     = SECTION_META[section.type]
  const selected = selectedType === section.type
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div
      ref={setNodeRef}
      style={{
        transform:  CSS.Transform.toString(transform),
        transition,
        opacity:    isDragging ? 0.4 : 1,
        zIndex:     isDragging ? 10 : undefined,
      }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div
        onClick={onSelect}
        className={`group relative flex items-center gap-2 rounded-xl border px-2.5 py-2.5 cursor-pointer transition-all duration-150 select-none ${
          selected
            ? "border-orange-400/60 bg-orange-50 shadow-[inset_2px_0_0_0_#f97316]"
            : "border-gray-200/80 bg-white hover:border-gray-300 hover:bg-gray-50/80"
        } ${!section.enabled ? "opacity-50" : ""}`}
      >
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>

        {/* Icon */}
        <span className="text-base leading-none shrink-0">{meta.icon}</span>

        {/* Label */}
        <span className={`flex-1 truncate text-[13px] font-medium ${
          selected ? "text-orange-800" : section.enabled ? "text-gray-800" : "text-gray-400"
        }`}>
          {meta.label}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Visibility toggle */}
          <button
            type="button"
            onClick={() => onToggle(!section.enabled)}
            className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
              section.enabled
                ? "text-gray-400 hover:text-gray-700"
                : "text-gray-300 hover:text-gray-500"
            }`}
            title={section.enabled ? "Masquer" : "Afficher"}
          >
            {section.enabled
              ? <Eye className="h-3 w-3" />
              : <EyeOff className="h-3 w-3" />
            }
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={onDelete}
            className={`flex h-6 w-6 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-150 ${
              showDelete ? "opacity-100" : "opacity-0"
            }`}
            title="Supprimer"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SectionsListProps {
  sections:     LandingSection[]
  selectedType: SectionType | null
  onChange:     (sections: LandingSection[]) => void
  onSelect:     (type: SectionType) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SectionsList({ sections, selectedType, onChange, onSelect }: SectionsListProps) {
  const [showModal, setShowModal] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const items   = sections.map((s) => `${s.type}-${s.order}`)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx   = items.indexOf(active.id as string)
    const newIdx   = items.indexOf(over.id as string)
    const reordered = arrayMove(sections, oldIdx, newIdx).map((s, i) => ({ ...s, order: i + 1 }))
    onChange(reordered)
  }

  function toggleSection(type: SectionType, enabled: boolean) {
    onChange(sections.map((s) => s.type === type ? { ...s, enabled } : s))
  }

  function deleteSection(type: SectionType) {
    const next = sections.filter((s) => s.type !== type).map((s, i) => ({ ...s, order: i + 1 }))
    onChange(next)
    if (selectedType === type) onSelect(next[0]?.type ?? ("" as SectionType))
  }

  function addSection(type: SectionType) {
    const newSection = makeDefaultSection(type, sections.length + 1)
    onChange([...sections, newSection])
    onSelect(type)
  }

  const presentTypes    = new Set(sections.map((s) => s.type))
  const availableToAdd  = ALL_SECTION_TYPES.filter((t) => !presentTypes.has(t))

  const enabledCount  = sections.filter((s) => s.enabled).length
  const disabledCount = sections.filter((s) => !s.enabled).length

  return (
    <>
      <div className="flex h-full flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
          <div>
            <h3 className="text-[13px] font-bold text-gray-900">Sections</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {enabledCount} active{enabledCount !== 1 ? "s" : ""}
              {disabledCount > 0 && ` · ${disabledCount} masquée${disabledCount !== 1 ? "s" : ""}`}
            </p>
          </div>
          {availableToAdd.length > 0 && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm shadow-orange-500/30 hover:bg-orange-600 transition-colors"
              title="Ajouter une section"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sortable list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {sections.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200">
              <span className="text-2xl">📄</span>
              <p className="text-[12px] text-gray-400">Aucune section</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items} strategy={verticalListSortingStrategy}>
                {sections.map((section) => (
                  <SortableItem
                    key={`${section.type}-${section.order}`}
                    section={section}
                    selectedType={selectedType}
                    onSelect={() => onSelect(section.type)}
                    onToggle={(enabled) => toggleSection(section.type, enabled)}
                    onDelete={() => deleteSection(section.type)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Footer add button */}
        {availableToAdd.length > 0 && (
          <div className="border-t border-gray-100 p-3">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-[12px] font-semibold text-gray-500 transition-all hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter une section
            </button>
          </div>
        )}
      </div>

      {/* Add section modal */}
      {showModal && (
        <AddSectionModal
          availableTypes={availableToAdd}
          onAdd={addSection}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
