// Schüler-Spielseite — kein Login erforderlich
// Zugang nur per Link (gameId) + Code
export default async function PlayPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Spiel laden…</h1>
        <p className="text-muted-foreground">ID: {gameId}</p>
        {/* TODO Phase 2: Game-Engine-Komponente */}
      </div>
    </div>
  )
}
