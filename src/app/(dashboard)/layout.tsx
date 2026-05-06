'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/playground', label: 'Playground', icon: '⚡' },
  { href: '/modules', label: 'Module', icon: '🎮' },
  { href: '/classes', label: 'Klassen', icon: '👥' },
  { href: '/results', label: 'Auswertungen', icon: '📊' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col flex-shrink-0"
        style={{
          background: 'oklch(0.11 0.03 285)',
          borderRight: '1px solid oklch(1 0 0 / 7%)',
        }}>

        {/* Logo */}
        <div className="px-4 pt-5 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'oklch(0.55 0.24 290)' }}>E</div>
            <span className="font-semibold text-sm tracking-tight"
              style={{ color: 'oklch(0.95 0.02 290)' }}>EduGame AI</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: active ? 'oklch(0.55 0.24 290 / 18%)' : 'transparent',
                  color: active ? 'oklch(0.80 0.18 290)' : 'oklch(0.58 0.04 290)',
                  fontWeight: active ? '500' : '400',
                  borderLeft: active ? '2px solid oklch(0.55 0.24 290)' : '2px solid transparent',
                }}
              >
                <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid oklch(1 0 0 / 7%)' }}>
          <p className="text-xs" style={{ color: 'oklch(0.38 0.03 285)' }}>Lehrkraft-Portal</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-background">{children}</main>
    </div>
  )
}
