-- Migration 002: Differenzierungsniveau auf 4 Stufen korrigieren
-- Vorher: basis | standard | schwer
-- Nachher: leichter | mittel | schwer | sehr_schwer

alter table student_sessions
  drop constraint if exists student_sessions_differenzierungsniveau_check;

alter table student_sessions
  alter column differenzierungsniveau set default 'mittel',
  add constraint student_sessions_differenzierungsniveau_check
    check (differenzierungsniveau in ('leichter', 'mittel', 'schwer', 'sehr_schwer'));
