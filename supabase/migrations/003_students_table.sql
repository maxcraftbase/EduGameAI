-- Migration 003: Persistente Schüler-Codes pro Klasse
CREATE TABLE IF NOT EXISTS students (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  code        text NOT NULL,
  erstellt_am timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS students_class_code_idx ON students(class_id, code);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_select_own" ON students
  FOR SELECT USING (
    class_id IN (SELECT id FROM classes WHERE lehrer_id = auth.uid())
  );

CREATE POLICY "students_insert_own" ON students
  FOR INSERT WITH CHECK (
    class_id IN (SELECT id FROM classes WHERE lehrer_id = auth.uid())
  );

CREATE POLICY "students_delete_own" ON students
  FOR DELETE USING (
    class_id IN (SELECT id FROM classes WHERE lehrer_id = auth.uid())
  );
