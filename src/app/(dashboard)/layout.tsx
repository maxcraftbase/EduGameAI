import Link from 'next/link'

const navItems = [
  { href: '/playground', label: 'Playground' },
  { href: '/classes', label: 'Klassen' },
  { href: '/modules', label: 'Module' },
  { href: '/results', label: 'Auswertungen' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-muted/40 flex flex-col p-4 gap-1">
        <div className="font-bold text-lg mb-6 px-2">EduGame AI</div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
