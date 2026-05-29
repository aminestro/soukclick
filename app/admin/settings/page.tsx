"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Save, Loader2, Eye, EyeOff } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "pixels" | "whatsapp" | "general"

type Settings = Record<string, string>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  name,
  value,
  onChange,
  secret = false,
  placeholder = "",
}: {
  label:        string
  hint?:        string
  name:         string
  value:        string
  onChange:     (k: string, v: string) => void
  secret?:      boolean
  placeholder?: string
}) {
  const [show, setShow] = useState(false)

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-gray-400">{hint}</p>}
      <div className="relative">
        <input
          type={secret && !show ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 pr-10"
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

function ToggleSetting({
  label,
  hint,
  name,
  value,
  onChange,
}: {
  label:    string
  hint?:    string
  name:     string
  value:    string
  onChange: (k: string, v: string) => void
}) {
  const on = value === "true"
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(name, on ? "false" : "true")}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${on ? "bg-green-500" : "bg-gray-300"}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${on ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  )
}

function SaveButton({ saving }: { saving: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
    >
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Enregistrer
    </button>
  )
}

// ─── Tab Pixels ───────────────────────────────────────────────────────────────

function PixelsTab({ settings, onChange, onSave, saving }: {
  settings: Settings
  onChange: (k: string, v: string) => void
  onSave:   (keys: string[]) => Promise<void>
  saving:   boolean
}) {
  const keys = [
    "META_PIXEL_ID","META_ACCESS_TOKEN","META_TEST_EVENT_CODE",
    "TIKTOK_PIXEL_ID","TIKTOK_ACCESS_TOKEN",
    "GA4_MEASUREMENT_ID","GTM_ID",
  ]

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(keys) }} className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
        Ces valeurs sont stockées en base de données et lues au runtime. Pour une sécurité maximale, préférez les configurer directement dans les <strong>Variables d'environnement EasyPanel</strong>.
      </div>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Meta / Facebook</h3>
        <Field label="Meta Pixel ID"         name="META_PIXEL_ID"          value={settings.META_PIXEL_ID          ?? ""} onChange={onChange} placeholder="123456789012345" />
        <Field label="Meta Access Token"     name="META_ACCESS_TOKEN"      value={settings.META_ACCESS_TOKEN      ?? ""} onChange={onChange} secret placeholder="EAAxxxx…" />
        <Field label="Meta Test Event Code"  name="META_TEST_EVENT_CODE"   value={settings.META_TEST_EVENT_CODE   ?? ""} onChange={onChange} placeholder="TEST12345" />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">TikTok</h3>
        <Field label="TikTok Pixel ID"       name="TIKTOK_PIXEL_ID"        value={settings.TIKTOK_PIXEL_ID        ?? ""} onChange={onChange} placeholder="CXXXXXXXXXXXXXXXX" />
        <Field label="TikTok Access Token"   name="TIKTOK_ACCESS_TOKEN"    value={settings.TIKTOK_ACCESS_TOKEN    ?? ""} onChange={onChange} secret placeholder="xxxx…" />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Google</h3>
        <Field label="GA4 Measurement ID"    name="GA4_MEASUREMENT_ID"     value={settings.GA4_MEASUREMENT_ID     ?? ""} onChange={onChange} placeholder="G-XXXXXXXXXX" />
        <Field label="GTM Container ID"      name="GTM_ID"                 value={settings.GTM_ID                 ?? ""} onChange={onChange} placeholder="GTM-XXXXXXX" />
      </section>

      <SaveButton saving={saving} />
    </form>
  )
}

// ─── Tab WhatsApp ─────────────────────────────────────────────────────────────

function WhatsappTab({ settings, onChange, onSave, saving }: {
  settings: Settings
  onChange: (k: string, v: string) => void
  onSave:   (keys: string[]) => Promise<void>
  saving:   boolean
}) {
  const keys = [
    "WHATSAPP_ADMIN_PHONE",
    "NOTIFY_NEW_ORDER","NOTIFY_BLACKLIST_ORDER","NOTIFY_LOW_STOCK",
  ]

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(keys) }} className="space-y-5">
      <Field
        label="Numéro WhatsApp admin"
        hint="Format international : +212612345678"
        name="WHATSAPP_ADMIN_PHONE"
        value={settings.WHATSAPP_ADMIN_PHONE ?? ""}
        onChange={onChange}
        placeholder="+212600000000"
      />

      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Notifications</h3>
        <ToggleSetting
          label="Nouvelle commande"
          hint="Recevoir un message WhatsApp à chaque commande"
          name="NOTIFY_NEW_ORDER"
          value={settings.NOTIFY_NEW_ORDER ?? "true"}
          onChange={onChange}
        />
        <ToggleSetting
          label="Commande blacklistée"
          hint="Alerter quand une commande appartient à un client blacklisté"
          name="NOTIFY_BLACKLIST_ORDER"
          value={settings.NOTIFY_BLACKLIST_ORDER ?? "true"}
          onChange={onChange}
        />
        <ToggleSetting
          label="Stock faible"
          hint="Alerter quand un produit passe sous le seuil d'alerte"
          name="NOTIFY_LOW_STOCK"
          value={settings.NOTIFY_LOW_STOCK ?? "true"}
          onChange={onChange}
        />
      </section>

      <SaveButton saving={saving} />
    </form>
  )
}

// ─── Tab Général ──────────────────────────────────────────────────────────────

function GeneralTab({ settings, onChange, onSave, saving }: {
  settings: Settings
  onChange: (k: string, v: string) => void
  onSave:   (keys: string[]) => Promise<void>
  saving:   boolean
}) {
  const keys = [
    "STORE_NAME","DEFAULT_DELIVERY_PRICE","MIN_ORDER_AMOUNT",
  ]

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(keys) }} className="space-y-5">
      <Field
        label="Nom de la boutique"
        name="STORE_NAME"
        value={settings.STORE_NAME ?? "SoukClick"}
        onChange={onChange}
        placeholder="SoukClick"
      />

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Prix livraison par défaut (MAD)
        </label>
        <p className="mb-1.5 text-xs text-gray-400">Utilisé quand aucune ville ne correspond</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="0.5"
            value={settings.DEFAULT_DELIVERY_PRICE ?? "3000"}
            onChange={(e) => onChange("DEFAULT_DELIVERY_PRICE", e.target.value)}
            className="w-32 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-gray-500">MAD (en centimes)</span>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Montant minimum de commande (centimes)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="100"
            value={settings.MIN_ORDER_AMOUNT ?? "0"}
            onChange={(e) => onChange("MIN_ORDER_AMOUNT", e.target.value)}
            className="w-32 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-gray-500">centimes (0 = pas de minimum)</span>
        </div>
      </div>

      <SaveButton saving={saving} />
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "pixels",   label: "Pixels & Tracking"       },
  { id: "whatsapp", label: "WhatsApp & Notifications" },
  { id: "general",  label: "Général"                  },
]

export default function SettingsPage() {
  const [tab,      setTab]      = useState<Tab>("pixels")
  const [settings, setSettings] = useState<Settings>({})
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d: Settings) => { setSettings(d); setLoading(false) })
  }, [])

  function handleChange(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = useCallback(async (keys: string[]) => {
    setSaving(true)
    const payload = Object.fromEntries(keys.map((k) => [k, settings[k] ?? ""]))
    const res = await fetch("/api/admin/settings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    if (res.ok) {
      toast.success("Paramètres enregistrés")
    } else {
      toast.error("Erreur de sauvegarde")
    }
    setSaving(false)
  }, [settings])

  return (
    <div className="max-w-2xl space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="mb-1.5 h-3 w-24 rounded bg-gray-100" />
                <div className="h-10 rounded-xl bg-gray-100" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {tab === "pixels"   && <PixelsTab   settings={settings} onChange={handleChange} onSave={handleSave} saving={saving} />}
            {tab === "whatsapp" && <WhatsappTab settings={settings} onChange={handleChange} onSave={handleSave} saving={saving} />}
            {tab === "general"  && <GeneralTab  settings={settings} onChange={handleChange} onSave={handleSave} saving={saving} />}
          </>
        )}
      </div>
    </div>
  )
}
