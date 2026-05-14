-- Migration 004: Verknüpfung Klasse ↔ Spiel
CREATE TABLE IF NOT EXISTS class_games (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id       uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  game_id        uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  zugewiesen_am  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, game_id)
);

ALTER TABLE class_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_games_select_own" ON class_games
  FOR SELECT USING (
    class_id IN (SELECT id FROM classes WHERE lehrer_id = auth.uid())
  );

CREATE POLICY "class_games_insert_own" ON class_games
  FOR INSERT WITH CHECK (
    class_id IN (SELECT id FROM classes WHERE lehrer_id = auth.uid())
  );

CREATE POLICY "class_games_delete_own" ON class_games
  FOR DELETE USING (
    class_id IN (SELECT id FROM classes WHERE lehrer_id = auth.uid())
  );
