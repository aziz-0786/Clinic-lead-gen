"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Users, BarChart3, Settings, MessageSquare,
  LogOut, Stethoscope, ExternalLink, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",                     label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/leads",               label: "Leads",    icon: Users },
  { href: "/dashboard/reports",             label: "Reports",  icon: BarChart3 },
  { href: "/dashboard/chatbot-settings",    label: "Chatbot",  icon: MessageSquare },
  { href: "/dashboard/settings",            label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const slug = (session?.user as any)?.businessSlug;

  return (
    <>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-cyan-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700 space-y-0.5">
        {slug && (
          <Link
            href={`/demo/${slug}`}
            target="_blank"
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            View Demo Page
          </Link>
        )}
        <button
          onClick={() => { onNavigate?.(); signOut({ callbackUrl: "/login" }); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center shrink-0">
        <Stethoscope className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="font-semibold text-sm leading-tight">ClinicLeads</p>
        <p className="text-xs text-slate-400 leading-tight">Dashboard</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Mobile top bar (visible below md) ────────────────────────── */}
      <header className="md:hidden fixed inset-x-0 top-0 z-40 h-14 bg-slate-900 border-b border-slate-700 flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo />
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 text-slate-100 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <Logo />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar (always visible ≥ md) ─────────────────────── */}
      <aside className="hidden md:flex w-56 lg:w-64 bg-slate-900 text-slate-100 flex-col min-h-screen shrink-0">
        <div className="p-5 border-b border-slate-700">
          <Logo />
        </div>
        <NavLinks />
      </aside>
    </>
  );
}
