-- Migration 009: Einheiten-Tabelle für Multi-Game-Sequenzen
-- Eine Einheit fasst N Spiele zusammen, die ein Lehrer für eine Unterrichtsstunde erstellt.

CREATE TABLE IF NOT EXISTS einheiten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lehrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
  analyse_id uuid REFERENCES analyses(id) ON DELETE SET NULL,
  titel text NOT NULL,
  zeitrahmen_minuten int NOT NULL,
  anzahl_spiele int NOT NULL,
  status text NOT NULL DEFAULT 'entwurf',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE games ADD COLUMN IF NOT EXISTS einheit_id uuid REFERENCES einheiten(id) ON DELETE SET NULL;
ALTER TABLE games ADD COLUMN IF NOT EXISTS reihenfolge int;

-- RLS
ALTER TABLE einheiten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lehrer sieht eigene Einheiten"
  ON einheiten FOR SELECT
  USING (lehrer_id = auth.uid());

CREATE POLICY "Lehrer erstellt eigene Einheiten"
  ON einheiten FOR INSERT
  WITH CHECK (lehrer_id = auth.uid());

CREATE POLICY "Lehrer aktualisiert eigene Einheiten"
  ON einheiten FOR UPDATE
  USING (lehrer_id = auth.uid());
