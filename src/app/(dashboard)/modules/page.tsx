import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const STATUS_LABEL: Record<string, string> = {
  entwurf: 'Entwurf',
  geprueft: 'Geprüft',
  freigegeben: 'Freigegeben',
}
const STATUS_COLOR: Record<string, string> = {
  entwurf: 'bg-muted text-muted-foreground',
  geprueft: 'bg-yellow-100 text-yellow-800',
  freigegeben: 'bg-green-100 text-green-800',
}

export default async function ModulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: spiele } = await supabase
    .from('games')
    .select('id, titel, spieltyp_didaktisch, game_skin, status, erstellt_am, analyses(lernziel_original, spielbarkeit_ampel)')
    .eq('lehrer_id', user.id)
    .order('erstellt_am', { ascending: false })

  const AMPEL_DOT: Record<string, string> = {
    gruen: 'bg-green-500', gelb: 'bg-yellow-400', rot: 'bg-red-500',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Module</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Generierte Spielmodule verwalten und freigeben</p>
        </div>
        <Link href="/playground"
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
          + Neues Modul
        </Link>
      </div>

      {!spiele?.length ? (
        <div className="border-2 border-dashed border-muted rounded-xl p-16 text-center">
          <p className="text-muted-foreground text-sm">Noch keine Module. Material hochladen im Playground.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {spiele.map((spiel) => {
            const analyse = Array.isArray(spiel.analyses) ? spiel.analyses[0] : spiel.analyses
            return (
              <Link key={spiel.id} href={`/modules/${spiel.id}`}
                className="flex items-center gap-4 border rounded-xl px-5 py-4 hover:bg-muted/30 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {analyse?.spielbarkeit_ampel && (
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${AMPEL_DOT[analyse.spielbarkeit_ampel] ?? 'bg-muted'}`} />
                    )}
                    <p className="font-medium text-sm truncate">{spiel.titel}</p>
                  </div>
                  {analyse?.lernziel_original && (
                    <p className="text-xs text-muted-foreground truncate">{analyse.lernziel_original}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {spiel.spieltyp_didaktisch} · {spiel.game_skin} · {new Date(spiel.erstellt_am).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLOR[spiel.status]}`}>
                  {STATUS_LABEL[spiel.status]}
                </span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">→</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
