"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, ShoppingCart, Phone, Package,
  FileText, ImageIcon, FlaskConical, TrendingUp, Truck,
  Users, Tag, BarChart2, Bell, Settings, Sparkles,
  LogOut, ChevronRight, ChevronLeft, Megaphone,
  Search, Moon, Menu,
} from "lucide-react"
import type { AdminRole } from "@prisma/client"

// ─── Nav definition ───────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "PRINCIPAL",
    items: [
      { href: "/admin/dashboard",   label: "Dashboard",     icon: LayoutDashboard, badge: null      },
      { href: "/admin/orders",      label: "Commandes",     icon: ShoppingCart,    badge: "orders"  },
      { href: "/admin/call-center", label: "Call Center",   icon: Phone,           badge: "pending" },
    ],
  },
  {
    label: "CATALOGUE",
    items: [
      { href: "/admin/products",      label: "Produits",      icon: Package,   badge: null },
      { href: "/admin/landing-pages", label: "Landing Pages", icon: FileText,  badge: null },
      { href: "/admin/creatives",     label: "Créatifs",      icon: ImageIcon, badge: null },
    ],
  },
  {
    label: "MARKETING",
    items: [
      { href: "/admin/ai-tools", label: "AI Tools",   icon: Sparkles,  badge: "new" },
      { href: "/admin/ads",      label: "Publicités", icon: Megaphone, badge: null  },
      { href: "/admin/offers",   label: "Offres",     icon: Tag,       badge: null  },
    ],
  },
  {
    label: "ANALYSE",
    items: [
      { href: "/admin/profit",   label: "Profit",    icon: TrendingUp,   badge: null },
      { href: "/admin/research", label: "Recherche", icon: FlaskConical, badge: null },
    ],
  },
  {
    label: "GESTION",
    items: [
      { href: "/admin/delivery",      label: "Livraison",     icon: Truck,    badge: null    },
      { href: "/admin/customers",     label: "Clients",       icon: Users,    badge: null    },
      { href: "/admin/reviews",       label: "Avis",          icon: BarChart2,badge: null    },
      { href: "/admin/notifications", label: "Notifications", icon: Bell,     badge: "notif" },
      { href: "/admin/settings",      label: "Paramètres",    icon: Settings, badge: null    },
    ],
  },
]

interface AdminShellProps {
  user:     { id: string; name: string; email: string; role: AdminRole }
  children: React.ReactNode
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  collapsed,
  onToggle,
  unreadCount,
  pendingCount,
  user,
}: {
  collapsed:    boolean
  onToggle:     () => void
  unreadCount:  number
  pendingCount: number
  user:         AdminShellProps["user"]
}) {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href))
  }

  function getBadge(badge: string | null): React.ReactNode {
    if (!badge) return null
    if (badge === "new") {
      return (
        <span className="ml-auto rounded-md bg-orange-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white leading-none tracking-wide">
          NEW
        </span>
      )
    }
    const count =
      badge === "notif"   ? unreadCount :
      badge === "pending" ? pendingCount :
      badge === "orders"  ? pendingCount :
      0
    if (!count) return null
    return (
      <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white leading-none">
        {count > 99 ? "99+" : count}
      </span>
    )
  }

  return (
    <aside
      className="flex h-screen flex-col border-r border-white/[0.06] transition-all duration-300 ease-in-out"
      style={{ width: collapsed ? 64 : 240, backgroundColor: "#0F0F0F", flexShrink: 0 }}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-white/[0.06] px-3">
        {collapsed ? (
          <button onClick={onToggle} className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-xs font-extrabold text-white shadow-lg shadow-orange-500/20">
            SC
          </button>
        ) : (
          <>
            <Link href="/admin/dashboard" className="flex flex-1 items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-xs font-extrabold text-white shadow-lg shadow-orange-500/20">
                SC
              </div>
              <div className="min-w-0">
                <span className="block truncate text-sm font-bold text-white tracking-tight">SoukClick</span>
                <span className="block text-[10px] text-gray-600 leading-none mt-0.5">Admin Panel</span>
              </div>
            </Link>
            <button
              onClick={onToggle}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-white/8 hover:text-gray-300 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[9px] font-bold tracking-[0.12em] text-gray-700 uppercase">
                {group.label}
              </p>
            )}
            {collapsed && <div className="my-1 mx-2 h-px bg-white/[0.05]" />}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon   = item.icon
                const active = isActive(item.href)
                const badge  = getBadge(item.badge)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 ${
                      active
                        ? "bg-orange-500/[0.12] text-orange-400"
                        : "text-gray-500 hover:bg-white/[0.05] hover:text-gray-200"
                    } ${collapsed ? "justify-center px-0" : ""}`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r-full bg-orange-500" />
                    )}
                    <Icon className={`h-[15px] w-[15px] shrink-0 ${active ? "text-orange-400" : ""}`} />
                    {!collapsed && (
                      <>
                        <span className={`flex-1 truncate text-[13px] ${active ? "font-semibold" : "font-medium"}`}>
                          {item.label}
                        </span>
                        {badge}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-white/[0.06] p-2">
        {collapsed ? (
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            title="Se déconnecter"
            className="flex w-full items-center justify-center rounded-lg p-2.5 text-gray-600 hover:bg-white/8 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        ) : (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-[11px] font-bold text-white uppercase shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-white leading-tight">{user.name}</p>
                <p className="truncate text-[10px] text-gray-600 leading-tight mt-0.5">{user.role}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-gray-600 transition-colors hover:bg-white/[0.05] hover:text-red-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function AdminShell({ user, children }: AdminShellProps) {
  const [collapsed,     setCollapsed]     = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [pendingCount,  setPendingCount]  = useState(0)
  const pathname = usePathname()

  useEffect(() => { setMobileSidebar(false) }, [pathname])

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [notifRes, ordersRes] = await Promise.all([
          fetch("/api/admin/notifications?unreadOnly=true&limit=0"),
          fetch("/api/admin/orders?status=NOUVEAU&pageSize=0"),
        ])
        if (notifRes.ok) {
          const d = await notifRes.json() as { unreadCount?: number }
          setUnreadCount(d.unreadCount ?? 0)
        }
        if (ordersRes.ok) {
          const d = await ordersRes.json() as { total?: number }
          setPendingCount(d.total ?? 0)
        }
      } catch { /* ignore */ }
    }
    fetchCounts()
    const id = setInterval(fetchCounts, 60_000)
    return () => clearInterval(id)
  }, [])

  const currentItem = NAV_GROUPS.flatMap((g) => g.items).find(
    (n) => pathname === n.href || (n.href !== "/admin/dashboard" && pathname.startsWith(n.href))
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F8F8F8" }}>

      {/* Mobile overlay */}
      {mobileSidebar && (
        <div
          className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          unreadCount={unreadCount}
          pendingCount={pendingCount}
          user={user}
        />
      </div>

      {/* Mobile sidebar */}
      {mobileSidebar && (
        <div className="fixed inset-y-0 left-0 z-30 md:hidden">
          <Sidebar
            collapsed={false}
            onToggle={() => setMobileSidebar(false)}
            unreadCount={unreadCount}
            pendingCount={pendingCount}
            user={user}
          />
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200/80 bg-white px-4 md:px-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebar(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 md:hidden transition-colors"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <div>
              <h1 className="text-[13px] font-bold text-gray-900 leading-tight">
                {currentItem?.label ?? "Admin"}
              </h1>
              <p className="hidden text-[11px] text-gray-400 leading-tight md:block">
                SoukClick · {currentItem?.label ?? "Dashboard"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="hidden h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 md:flex transition-colors">
              <Search className="h-[15px] w-[15px]" />
            </button>
            <button className="hidden h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 md:flex transition-colors">
              <Moon className="h-[15px] w-[15px]" />
            </button>
            <Link
              href="/admin/notifications"
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <Bell className="h-[15px] w-[15px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <div className="ml-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-[11px] font-bold text-white uppercase shadow-sm">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
