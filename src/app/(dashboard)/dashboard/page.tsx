'use client'

import Link from 'next/link'

const statCards = [
  { label: 'Erstellte Spiele', value: '0', icon: '🎮', color: '#7C3AED', bg: '#EDE9FE' },
  { label: 'Aktive Klassen', value: '0', icon: '👥', color: '#0891B2', bg: '#E0F2FE' },
  { label: 'Schüler gesamt', value: '0', icon: '🎓', color: '#059669', bg: '#D1FAE5' },
  { label: 'Ø Erfolgsquote', value: '–', icon: '📈', color: '#D97706', bg: '#FEF3C7' },
]

const quickActions = [
  { href: '/playground', label: 'Neues Spiel erstellen', desc: 'Material hochladen & KI analysieren lassen', icon: '✦', color: '#7C3AED', bg: 'linear-gradient(135deg, #7C3AED, #A855F7)' },
  { href: '/classes', label: 'Klasse anlegen', desc: 'Neue Klasse erstellen und Codes generieren', icon: '⊙', color: '#0891B2', bg: 'linear-gradient(135deg, #0891B2, #06B6D4)' },
  { href: '/spiele', label: 'Spiele verwalten', desc: 'Spiele in Ordnern organisieren & zuweisen', icon: '▤', color: '#059669', bg: 'linear-gradient(135deg, #059669, #10B981)' },
  { href: '/results', label: 'Auswertung ansehen', desc: 'Lernfortschritt & Schwächen analysieren', icon: '◈', color: '#D97706', bg: 'linear-gradient(135deg, #D97706, #F59E0B)' },
]

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: '#1F1235' }}>Guten Morgen! 👋</h1>
        <p className="mt-1 text-base" style={{ color: '#7A6A94' }}>
          Hier ist deine Übersicht — alles auf einen Blick.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: '#FFFFFF', boxShadow: '0 2px 16px rgba(124,58,237,0.08)', border: '1px solid #E9D5FF' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: card.bg }}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#1F1235' }}>{card.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#7A6A94' }}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1F1235' }}>Schnellstart</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}
              className="rounded-2xl p-5 flex items-start gap-4 transition-all hover:scale-[1.01] hover:shadow-lg"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 16px rgba(124,58,237,0.08)', border: '1px solid #E9D5FF', textDecoration: 'none' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: action.bg }}>
                <span className="text-white text-lg">{action.icon}</span>
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#1F1235' }}>{action.label}</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#7A6A94' }}>{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Workflow Guide */}
      <div className="rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, #7C3AED08, #A855F705)', border: '1px solid #E9D5FF' }}>
        <h2 className="text-base font-bold mb-4" style={{ color: '#1F1235' }}>So funktioniert EduGame AI</h2>
        <div className="flex items-start gap-0">
          {[
            { step: '1', label: 'Material hochladen', desc: 'PDF oder Text', icon: '📄' },
            { step: '2', label: 'KI analysiert', desc: 'In 21 Schritten', icon: '🤖' },
            { step: '3', label: 'Spiel erstellt', desc: 'Automatisch generiert', icon: '🎮' },
            { step: '4', label: 'Freigeben', desc: 'Lehrkraft-Check', icon: '✅' },
            { step: '5', label: 'Klasse zuweisen', desc: 'Schüler spielen', icon: '👥' },
            { step: '6', label: 'Auswertung', desc: 'Lernfortschritt sehen', icon: '📊' },
          ].map((item, i, arr) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center text-center flex-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2"
                  style={{ background: '#EDE9FE' }}>
                  {item.icon}
                </div>
                <p className="text-xs font-semibold" style={{ color: '#1F1235' }}>{item.label}</p>
                <p className="text-xs" style={{ color: '#7A6A94' }}>{item.desc}</p>
              </div>
              {i < arr.length - 1 && (
                <div className="flex-shrink-0 px-1 pb-5" style={{ color: '#C4B5FD', fontSize: 18 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
