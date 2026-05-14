-- Migration 008: Lernpfad-Spalte zur analyses-Tabelle hinzufügen
-- Speichert den didaktischen Lernpfad-Typ (Steps 12-13 der Pipeline)
-- inkl. empfohlener Spielfunktion und Lerninhalt-/Spielerlebnis-Balance

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS lernpfad jsonb;
