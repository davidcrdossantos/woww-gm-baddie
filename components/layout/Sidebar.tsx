"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { id: "clients", label: "Clients", icon: "📦", href: "/dashboard/clients" },
  { divider: true },
  { id: "avatars", label: "Dream Buyer Avatars", icon: "🎯", href: "/dashboard/avatars" },
  { id: "google-ads", label: "Google Ads Generator", icon: "🔍", href: "/dashboard/google-ads" },
  { id: "facebook-ads", label: "Facebook Ad Generator", icon: "📣", href: "/dashboard/facebook-ads" },
  { id: "ad-creatives", label: "Ad Creatives", icon: "🎨", href: "/dashboard/ad-creatives" },
  { id: "headlines", label: "DR Headlines", icon: "✍️", href: "/dashboard/headlines" },
  { id: "hvco", label: "HVCO Titles", icon: "🧲", href: "/dashboard/hvco" },
  { id: "mechanisms", label: "Hero Mechanisms", icon: "⚡", href: "/dashboard/mechanisms" },
  { id: "landing-pages", label: "Landing Pages", icon: "📄", href: "/dashboard/landing-pages" },
  { id: "godfather-offers", label: "Godfather Offers", icon: "💎", href: "/dashboard/godfather-offers" },
  { divider: true },
  { id: "meta-ads", label: "Meta Ads Uploader", icon: "📤", href: "/dashboard/meta-ads/upload", badge: "NEW" },
] as const;

type NavItem =
  | { divider: true }
  | { id: string; label: string; icon: string; href: string; badge?: string; divider?: false };

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col flex-shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center text-black font-black text-sm">W</div>
          <span className="font-black text-white text-lg tracking-tight">Woww GM</span>
        </div>
        <p className="text-zinc-400 text-xs pl-0.5">Dream campaigns for a Dream Team</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {(NAV_ITEMS as readonly NavItem[]).map((item, idx) => {
          if ("divider" in item && item.divider) {
            return <div key={idx} className="my-2 border-t border-zinc-800" />;
          }
          const navItem = item as Exclude<NavItem, { divider: true }>;
          const isActive =
            pathname === navItem.href ||
            (navItem.href !== "/dashboard/clients" && pathname.startsWith(navItem.href));

          return (
            <Link
              key={navItem.id}
              href={navItem.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <span className="text-base">{navItem.icon}</span>
              <span className="flex-1">{navItem.label}</span>
              {navItem.badge && (
                <span className="text-xs bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded-full">
                  {navItem.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-zinc-800 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-xs font-black text-black flex-shrink-0">W</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">Woww GM</p>
          <p className="text-xs text-zinc-400 truncate">Meta Marketing API v22.0</p>
        </div>
      </div>
    </aside>
  );
}
