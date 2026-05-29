"use client"

import { useId } from "react"
import { fromCentimes, toCentimes } from "@/lib/format"

interface PriceInputProps {
  value:       number        // centimes
  onChange:    (centimes: number) => void
  label?:      string
  placeholder?: string
  required?:   boolean
  disabled?:   boolean
  className?:  string
}

export function PriceInput({
  value,
  onChange,
  label,
  placeholder = "0",
  required,
  disabled,
  className = "",
}: PriceInputProps) {
  const id = useId()
  const displayValue = value > 0 ? fromCentimes(value).toString() : ""

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9.]/g, "")
    if (raw === "" || raw === ".") { onChange(0); return }
    const n = parseFloat(raw)
    if (!isNaN(n)) onChange(toCentimes(n))
  }

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-16 text-sm outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
          MAD
        </span>
      </div>
    </div>
  )
}
