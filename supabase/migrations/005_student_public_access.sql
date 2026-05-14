-- Migration 005: Öffentlicher Lesezugriff für Schüler (kein Login nötig)
-- Schüler sind nicht authentifiziert — anon key + RLS

-- students: Schüler darf seinen eigenen Code nachschlagen
CREATE POLICY "students_anon_read" ON students
  FOR SELECT USING (true);

-- class_games: Schüler darf sehen welche Spiele seiner Klasse zugewiesen sind
CREATE POLICY "class_games_anon_read" ON class_games
  FOR SELECT USING (true);

-- games: Schüler darf freigegebene Spiele lesen
CREATE POLICY "games_anon_read" ON games
  FOR SELECT USING (status = 'freigegeben');

-- student_sessions: Schüler darf eigene Session anlegen und lesen
CREATE POLICY "sessions_anon_insert" ON student_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "sessions_anon_select" ON student_sessions
  FOR SELECT USING (true);

-- answers: Schüler darf Antworten einreichen
CREATE POLICY "answers_anon_insert" ON answers
  FOR INSERT WITH CHECK (true);
