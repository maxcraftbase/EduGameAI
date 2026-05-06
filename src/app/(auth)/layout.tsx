export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'oklch(0.10 0.04 285)' }}>
      {/* Glow blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'oklch(0.55 0.24 290)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'oklch(0.50 0.22 270)' }} />
      <div className="relative z-10 w-full flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
}
