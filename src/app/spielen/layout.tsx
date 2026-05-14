export default function SpielerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a0a3e 0%, #2d1069 50%, #160B2E 100%)' }}>
      {children}
    </div>
  )
}
