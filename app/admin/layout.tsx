import { getAdminSession } from "@/lib/auth"
import { AdminShell }      from "@/components/admin/AdminShell"
import { NextAuthProvider } from "@/components/admin/NextAuthProvider"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()

  // No session → middleware already redirected to /admin/login.
  // But if we're ON /admin/login the middleware lets it through — render
  // children directly without the shell so there's no infinite redirect.
  if (!session?.user) {
    return (
      <NextAuthProvider>
        {children}
      </NextAuthProvider>
    )
  }

  return (
    <NextAuthProvider>
      <AdminShell user={session.user}>
        {children}
      </AdminShell>
    </NextAuthProvider>
  )
}
