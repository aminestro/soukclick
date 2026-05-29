"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const loginSchema = z.object({
  email:    z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/admin/dashboard"

  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginValues) {
    setLoading(true)
    setError(null)

    const result = await signIn("credentials", {
      email:    values.email.toLowerCase().trim(),
      password: values.password,
      redirect: false,
    })

    if (!result?.ok || result.error) {
      setError("Email ou mot de passe incorrect.")
      setLoading(false)
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white font-extrabold text-xl shadow-lg">
          SC
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-white">SoukClick Admin</h1>
        <p className="mt-1 text-sm text-gray-400">Connectez-vous pour continuer</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl space-y-4"
        noValidate
      >
        {error && (
          <div className="rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@soukclick.store"
            {...register("email")}
            className={`w-full rounded-xl border bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:ring-2 focus:ring-orange-500 ${
              errors.email ? "border-red-600" : "border-gray-700"
            }`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-300">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            className={`w-full rounded-xl border bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:ring-2 focus:ring-orange-500 ${
              errors.password ? "border-red-600" : "border-gray-700"
            }`}
          />
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Connexion...
            </span>
          ) : (
            "Se connecter"
          )}
        </button>

        <p className="text-center text-xs text-gray-600">
          Accès réservé à l'équipe SoukClick
        </p>
      </form>
    </div>
  )
}
