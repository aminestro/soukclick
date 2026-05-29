"use client"

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
import { GripVertical, Plus } from "lucide-react"
import type { LandingSection, SectionType } from "@/types/landing"
import { Toggle } from "@/components/admin/builder/editors/HeroEditor"

// ─── Section metadata ─────────────────────────────────────────────────────────

const SECTION_META: Record<SectionType, { label: string; icon: string }> = {
  hero:         { label: "Hero",              icon: "🖼️" },
  benefits:     { label: "Bénéfices",         icon: "✅" },
  features:     { label: "Caractéristiques",  icon: "🔧" },
  video:        { label: "Vidéo",             icon: "🎬" },
  reviews:      { label: "Avis clients",      icon: "⭐" },
  faq:          { label: "FAQ",               icon: "❓" },
  before_after: { label: "Avant / Après",     icon: "🔄" },
  cta:          { label: "Appel à l'action",  icon: "🎯" },
}

const ALL_SECTION_TYPES: SectionType[] = [
  "hero","benefits","features","video","reviews","faq","before_after","cta",
]

// Default data factory for newly added sections
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

// ─── Sortable item ────────────────────────────────────────────────────────────

function SortableItem({
  section,
  selectedType,
  onSelect,
  onToggle,
}: {
  section:      LandingSection
  selectedType: SectionType | null
  onSelect:     () => void
  onToggle:     (enabled: boolean) => void
}) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: `${section.type}-${section.order}` })

  const meta     = SECTION_META[section.type]
  const selected = selectedType === section.type

  return (
    <div
      ref={setNodeRef}
      style={{
        transform:  CSS.Transform.toString(transform),
        transition,
        opacity:    isDragging ? 0.5 : 1,
        zIndex:     isDragging ? 10 : undefined,
      }}
      onClick={onSelect}
      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer transition select-none ${
        selected
          ? "border-orange-400 bg-orange-50"
          : "border-gray-200 bg-white hover:bg-gray-50"
      } ${!section.enabled ? "opacity-50" : ""}`}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </span>

      {/* Icon + label */}
      <span className="text-base leading-none">{meta.icon}</span>
      <span className={`flex-1 text-sm font-medium ${section.enabled ? "text-gray-900" : "text-gray-400"}`}>
        {meta.label}
      </span>

      {/* Toggle */}
      <span onClick={(e) => e.stopPropagation()}>
        <Toggle checked={section.enabled} onChange={onToggle} />
      </span>
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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // Stable IDs for dnd-kit (type + order combo)
  const items = sections.map((s) => `${s.type}-${s.order}`)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIdx = items.indexOf(active.id as string)
    const newIdx = items.indexOf(over.id as string)
    const reordered = arrayMove(sections, oldIdx, newIdx).map((s, i) => ({ ...s, order: i + 1 }))
    onChange(reordered)
  }

  function toggleSection(type: SectionType, enabled: boolean) {
    onChange(sections.map((s) => s.type === type ? { ...s, enabled } : s))
  }

  // Sections not yet in the list
  const presentTypes = new Set(sections.map((s) => s.type))
  const availableToAdd = ALL_SECTION_TYPES.filter((t) => !presentTypes.has(t))

  function addSection(type: SectionType) {
    const newOrder  = sections.length + 1
    const newSection = makeDefaultSection(type, newOrder)
    onChange([...sections, newSection])
    onSelect(type)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="font-bold text-gray-900 text-sm">Sections</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">Glissez pour réorganiser</p>
      </div>

      {/* Sortable list */}
      <div className="flex-1 overflow-y-auto p-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {sections.map((section) => (
                <SortableItem
                  key={`${section.type}-${section.order}`}
                  section={section}
                  selectedType={selectedType}
                  onSelect={() => onSelect(section.type)}
                  onToggle={(enabled) => toggleSection(section.type, enabled)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add section */}
        {availableToAdd.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Ajouter une section
            </p>
            <div className="space-y-1">
              {availableToAdd.map((type) => {
                const meta = SECTION_META[type]
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addSection(type)}
                    className="flex w-full items-center gap-2 rounded-xl border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-500 hover:border-orange-300 hover:text-orange-600 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
