"use client";

import { Menu, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { useCartStore } from "@/stores/cart-store";

export function SiteHeader() {
  const openCart = useCartStore((state) => state.openCart);
  const count = useCartStore((state) => state.items.length);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-card border md:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-card border" aria-label="Cart" onClick={openCart}>
            <ShoppingCart className="h-5 w-5" />
            {count > 0 ? (
              <span className="absolute -left-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-xs font-bold text-white">
                {count}
              </span>
            ) : null}
          </button>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-bold text-gray-700 md:flex">
          <Link href="/collections/home-organization">تنظيم الدار</Link>
          <Link href="/collections/kitchen-solutions">الكوزينة</Link>
          <Link href="/collections/laundry-organization">الغسيل</Link>
          <Link href="/faq">FAQ</Link>
        </nav>
        <Link href="/" aria-label="Souk Click home">
          <Logo />
        </Link>
      </div>
    </header>
  );
}
