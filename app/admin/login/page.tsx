import { Suspense } from "react"
import { LoginForm } from "@/components/admin/LoginForm"

export const metadata = { title: "Connexion — SoukClick Admin" }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

function LoginSkeleton() {
  return (
    <div className="w-full max-w-sm animate-pulse">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gray-800" />
        <div className="h-6 w-40 rounded bg-gray-800" />
      </div>
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 space-y-4">
        <div className="h-10 rounded-xl bg-gray-800" />
        <div className="h-10 rounded-xl bg-gray-800" />
        <div className="h-11 rounded-xl bg-gray-700" />
      </div>
    </div>
  )
}
