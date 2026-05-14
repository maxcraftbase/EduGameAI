-- Migration 007: Spielmapping-Spalte zur analyses-Tabelle hinzufügen
-- Speichert alle 5 Spielvorschläge aus dem Spielmapping-Prompt
-- inkl. ausgewähltem Vorschlag und Auswahlbegründung

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS spielmapping jsonb;
