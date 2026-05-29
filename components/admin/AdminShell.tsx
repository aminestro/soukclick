"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, ShoppingCart, Phone, Package,
  FileText, ImageIcon, FlaskConical, TrendingUp, Truck,
  Users, Tag, BarChart2, Bell, Settings, Sparkles,
  LogOut, Menu, X, ChevronRight,
} from "lucide-react"
import type { AdminRole } from "@prisma/client"

// ─── Nav definition ───────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/admin/dashboard",     label: "Dashboard",     icon: LayoutDashboard },
  { href: "/admin/orders",        label: "Commandes",     icon: ShoppingCart },
  { href: "/admin/call-center",   label: "Call Center",   icon: Phone },
  { href: "/admin/products",      label: "Produits",      icon: Package },
  { href: "/admin/landing-pages", label: "Landing Pages", icon: FileText },
  { href: "/admin/creatives",     label: "Créatifs",      icon: ImageIcon },
  { href: "/admin/research",      label: "Recherche",     icon: FlaskConical },
  { href: "/admin/profit",        label: "Profit",        icon: TrendingUp },
  { href: "/admin/delivery",      label: "Livraison",     icon: Truck },
  { href: "/admin/customers",     label: "Clients",       icon: Users },
  { href: "/admin/offers",        label: "Offres",        icon: Tag },
  { href: "/admin/ads",           label: "Publicités",    icon: BarChart2 },
  { href: "/admin/ai-tools",      label: "AI Tools",      icon: Sparkles },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings",      label: "Paramètres",    icon: Settings },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminShellProps {
  user:     { id: string; name: string; email: string; role: AdminRole }
  children: React.ReactNode
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  open,
  onClose,
  unreadCount,
  user,
}: {
  open:        boolean
  onClose:     () => void
  unreadCount: number
  user:        AdminShellProps["user"]
}) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-gray-950 transition-transform duration-200 md:translate-x-0 md:static md:z-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white font-extrabold text-sm">
              SC
            </div>
            <span className="font-bold text-white text-sm">SoukClick</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon    = item.icon
            const active  = pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))
            const isNotif = item.href === "/admin/notifications"

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-orange-500 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {isNotif && unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
                {!isNotif && active && (
                  <ChevronRight className="h-4 w-4 opacity-60" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-gray-800 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-700 text-xs font-bold text-white uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-gray-400">{user.role}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </aside>
    </>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function AdminShell({ user, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [unreadCount, setUnreadCount]   = useState(0)
  const pathname = usePathname()

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  // Poll unread notification count
  useEffect(() => {
    async function fetchUnread() {
      try {
        const res  = await fetch("/api/admin/notifications?unreadOnly=true&limit=0")
        if (!res.ok) return
        const body = await res.json() as { unreadCount: number }
        setUnreadCount(body.unreadCount)
      } catch { /* ignore */ }
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Current page title
  const currentNav = NAV_ITEMS.find(
    (n) => pathname === n.href || (n.href !== "/admin/dashboard" && pathname.startsWith(n.href)),
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        unreadCount={unreadCount}
        user={user}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-bold text-gray-900 md:text-lg">
              {currentNav?.label ?? "Admin"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <Link
              href="/admin/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100"
              aria-label={`${unreadCount} notifications non lues`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Admin avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-sm font-bold text-white uppercase">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
