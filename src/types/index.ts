// ============================================================
// EduGame AI — Core TypeScript Types
// Entspricht dem Datenmodell aus EDUGAME_AI_TODO.md Abschnitt 23
// ============================================================

// --- Enums ---------------------------------------------------

export type Wissensform =
  | 'faktenwissen'
  | 'begriffswissen'
  | 'konzeptuelles_wissen'
  | 'prozedurales_wissen'
  | 'strategisches_wissen'
  | 'metakognitives_wissen'
  | 'sprachliches_wissen'
  | 'interpretatives_wissen'
  | 'bewertungs_urteilswissen'

export type Lernform =
  | 'wiederholendes_lernen'
  | 'verstehendes_lernen'
  | 'anwendungsorientiertes_lernen'
  | 'entdeckendes_lernen'
  | 'fehlerbasiertes_lernen'
  | 'problemloesendes_lernen'
  | 'sprachproduktives_lernen'
  | 'reflexives_lernen'

export type Wissensstruktur =
  | 'begriffswissen'
  | 'kategorien_ordnungswissen'
  | 'prozesswissen'
  | 'ursache_wirkungs_wissen'
  | 'vergleichswissen'
  | 'argumentationswissen'
  | 'quellen_text_interpretationswissen'
  | 'regel_systemwissen'
  | 'prozedurales_wissen'
  | 'sprachliches_produktionswissen'
  | 'modell_darstellungswissen'
  | 'bewertungs_urteilswissen'

export type Denkhandlung =
  | 'erkennen_wiedergeben'
  | 'zuordnen_klassifizieren'
  | 'erklaeren_erlaeutern'
  | 'strukturieren_darstellen'
  | 'anwenden_uebertragen'
  | 'analysieren_untersuchen'
  | 'bewerten_beurteilen'
  | 'produzieren_gestalten'

export type Komplexitaetsstufe = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type Differenzierungsniveau = 'basis' | 'standard' | 'schwer'

export type Antwortformat =
  | 'single_choice'
  | 'multiple_choice'
  | 'zuordnung'
  | 'reihenfolge'
  | 'sortierung'
  | 'drag_and_drop'
  | 'lueckentext_feste_begriffe'
  | 'fehler_markieren'
  | 'modell_beschriften'
  | 'satzbaustein_erklaerung'
  | 'fallentscheidung'
  | 'kriterienzuordnung'
  | 'pro_contra_sortierung'
  | 'ursache_folge_kette'
  | 'textstelle_beleg_zuordnung'
  | 'deutungshypothese_beleg'

export type SpielbarkeitsAmpel = 'gruen' | 'gelb' | 'rot'

export type Spielfunktion =
  | 'vorbereitung'
  | 'uebung'
  | 'sicherung'
  | 'diagnose'
  | 'teilueberpruefung'

export type Ursprung = 'original' | 'ki_ergaenzung' | 'didaktisch_reduziert'

export type LernzielStatus = 'erreicht' | 'teilweise_erreicht' | 'noch_nicht_gesichert'

export type Ampelfarbe = 'gruen' | 'gelb' | 'rot'

// --- Core Data Models ----------------------------------------

export interface MaterialAbschnitt {
  id: string          // z.B. "A1", "A2"
  text: string
  seite?: number
}

export interface Material {
  id: string
  lehrer_id: string
  datei_url: string
  dateiname: string
  extrahierter_text: string
  abschnitte: MaterialAbschnitt[]
  fach: string
  jahrgangsstufe: string
  schulform: string
  bundesland: string
  upload_datum: string
}

export interface Analyse {
  id: string
  material_id: string
  zusammenfassung: string
  kernaussagen: {
    aussage: string
    abschnitt_ref: string
    wichtigkeit: 'primaer' | 'sekundaer'
  }[]
  wissensform_primaer: Wissensform
  wissensform_sekundaer: Wissensform[]
  lernform_primaer: Lernform
  lernform_sekundaer: Lernform | null
  wissensstruktur: Wissensstruktur
  denkhandlungen: Denkhandlung[]
  komplexitaetsstufe: Komplexitaetsstufe
  lernziel_original: string
  lernziel_mvp_variante: string | null
  spielbarkeit_ampel: SpielbarkeitsAmpel
  spielbarer_anteil: string
  nicht_spielbarer_anteil: string | null
  antwortformat_primaer: Antwortformat
  antwortformat_sekundaer: Antwortformat | null
  spielfunktion: Spielfunktion
  abdeckung: {
    vollstaendig: string[]
    teilweise: string[]
    nicht_abgedeckt: string[]
  }
}

export interface Aufgabe {
  id: string
  spiel_id: string
  text: string
  antwortformat: Antwortformat
  loesungen: string[]
  teilloesungen: string[]
  abschnitt_ref: string
  ursprung: Ursprung
  teilkompetenz: string
  komplexitaetsstufe: Komplexitaetsstufe
  differenzierungen: {
    basis: { text_variante: string | null; hilfen: string[]; distraktoren: string[] }
    standard: { text_variante: string | null; hilfen: string[]; distraktoren: string[] }
    schwer: { text_variante: string | null; hilfen: string[]; distraktoren: string[] }
  }
  fehlvorstellungen: {
    fehler: string
    fehlvorstellung: string
    distraktor_repraesentiert: boolean
  }[]
  feedbackbausteine: {
    bei_korrekt: string
    bei_falsch: string
    bei_fehlvorstellung: Record<string, string>
  }
}

export interface Spiel {
  id: string
  analyse_id: string
  lehrer_id: string
  titel: string
  spieltyp_didaktisch: string
  game_engine: string
  game_skin: string
  aufgaben: Aufgabe[]
  zeitregelung_sekunden: number | null
  zeitdruck_aktiv: boolean
  status: 'entwurf' | 'geprueft' | 'freigegeben'
  erstellt_am: string
}

export interface LehrkraftCheck {
  id: string
  spiel_id: string
  gesamtampel: SpielbarkeitsAmpel
  lernziel_original: string
  lernziel_mvp_variante: string | null
  dimensionen: {
    fachliche_korrektheit: 'ok' | 'warnung' | 'problem'
    lernzielpassung: 'ok' | 'warnung' | 'problem'
    spielbarkeit_ampel: SpielbarkeitsAmpel
    mvp_tauglichkeit: 'ok' | 'warnung' | 'problem'
    game_engine_passung: 'ok' | 'warnung' | 'problem'
    regelbasiert_auswertbar: boolean
    ki_call_pro_antwort_vermieden: boolean
    differenzierung: 'ok' | 'warnung' | 'problem'
    feedbackqualitaet: 'ok' | 'warnung' | 'problem'
    reduktion_markiert: 'ok' | 'warnung' | 'problem'
    altersangemessen: 'ok' | 'warnung' | 'problem'
    sourcemapping_vollstaendig: 'ok' | 'warnung' | 'problem'
  }
  lernzielanteile: {
    vollstaendig: string[]
    teilweise: string[]
    nicht_abgedeckt: string[]
  }
  spielfunktion: Spielfunktion
  hinweise_fuer_lehrkraft: string[]
  begruendung_anpassungen: string | null
  signoff_lehrkraft: boolean
  erstellt_am: string
}

export interface SchuelerSession {
  id: string
  spiel_id: string
  code: string              // Tiername + Zufallscode, kein Klarname
  differenzierungsniveau: Differenzierungsniveau
  gestartet_am: string
  abgeschlossen_am: string | null
  lernpfad_abgeschlossen: boolean
}

export interface Antwort {
  id: string
  session_id: string
  aufgabe_id: string
  antwort_wert: string
  status: 'korrekt' | 'teilweise_korrekt' | 'falsch' | 'nicht_bearbeitet'
  versuche: number
  hilfen_genutzt: number
  bearbeitungszeit_sekunden: number | null
  ausgeloestes_feedback: string | null
  abgebrochen: boolean
}

export interface Klasse {
  id: string
  lehrer_id: string
  name: string
  jahrgangsstufe: string
  fach: string
  erstellt_am: string
}

// --- Diagnosis Types -----------------------------------------

export interface DiagnoseKompakt {
  auswertung_id: string
  sitzungs_id: string
  klassenueberblick: {
    anzahl_codes: number
    lernziel_erreicht: number
    lernziel_teilweise: number
    lernziel_noch_nicht_gesichert: number
    gesamteinschaetzung: string
    abdeckungshinweis: string
  }
  kompetenzampel: { teilkompetenz: string; status: Ampelfarbe; einschaetzung: string }[]
  haeufige_fehlvorstellungen: {
    fehlvorstellung: string
    haeufigkeit: number
    empfehlung: string
  }[]
  empfehlungen: {
    plenum: string[]
    vertiefung: string[]
    erweiterung: string[]
  }
  individuelle_diagnosen: {
    code: string
    lernzielstatus: LernzielStatus
    sichere_teilkompetenzen: string[]
    unsichere_teilkompetenzen: string[]
    empfehlung: string
  }[]
  sus_rueckmeldungen: {
    code: string
    lernstand_satz: string
    kann_schon_gut: string[]
    noch_ueben: string[]
    naechster_schritt: string
  }[]
}
