# Projekt-Status & KI-Handoff-Protokoll

Diese Datei dient als Synchronisationspunkt zwischen Entwicklern und KI-Agenten. Sie dokumentiert den aktuellen Entwicklungsstand, offene Tasks und technische Blocker.

---

## 1. Aktueller Gesamtstatus
* **Letztes Update:** 16. Juli 2026
* **Aktiver Branch:** `feature/onboarding-overhaul` (Onboarding-Tour überarbeitet, noch nicht gemerged)
* **Datenbank-Status:** SQLite lokal eingerichtet, Schema migriert (`dev.db`), Prisma Client generiert.

---

## 2. Letztes Handoff-Protokoll
*(Dieses Protokoll wird von der KI am Ende jeder Session aktualisiert)*

* **Ausführender Agent / Entwickler:** GitHub Copilot (Tencent: Hy3)
* **Was wurde erledigt (Session 16.07.2026 – Onboarding-Overhaul):**
  - [x] **Onboarding-Tour komplett überarbeitet (`feature/onboarding-overhaul`):** Deckt jetzt alle Features ab, die seit der ursprünglichen Tour dazugekommen sind (Aufgaben lösen/Rechenweg, Live-Rangliste auf Aufgabenseite, globale Bestenliste, Pomodoro-Timer, Feedback-Button).
  - [x] **Auto-Navigation pro Schritt:** Jeder Schritt hat ein `navigateTo`-Ziel; die Tour wechselt automatisch auf den richtigen Tab (und wählt ggf. den Aufgabentyp `lin_alg_det`), bevor das Zielelement hervorgehoben wird. Verdrahtet über neue `onNavigate`-Prop in `App.tsx`.
  - [x] **Rest der Seite wird verdunkelt:** Statt nur einem Highlight-Kasten nutzt die Tour jetzt ein Spotlight mit "ausgestanztem" Loch (`.onboarding-spotlight` in `index.css` via riesigem `box-shadow`), sodass nur der Zielbereich sichtbar bleibt; pulsierender Ring zieht die Aufmerksamkeit auf sich. Alte `.spotlight-overlay-box`-Klasse entfernt.
  - [x] **Fehlende Ziel-IDs ergänzt:** `feedback-btn` + `help-btn` in `NavHeader`, `home-pomodoro-panel` + `home-quicknav-panel` in `HomePage`, `pomodoro-widget` in `PomodoroWidget`.
  - [x] **Tour-Schritte von 4 auf 9 erweitert** (Willkommen, Fächer/Aufgaben, Aufgabe lösen, Live-Rangliste, globale Bestenliste, Profil/Login, Pomodoro, Feedback/Hilfe, Theme-Toggle).
  - [x] **Typecheck (`tsc -b`) & Lint (`oxlint`) der geänderten Dateien fehlerfrei.**
* **Was wurde erledigt (Session 16.07.2026):**
  - [x] **Issue #4 behoben – Leaderboard-Flickern beim Filterwechsel:** Spinner-Block im Hauptbereich entfernt (verursachte Größenänderung des Kastens bei leerer vorheriger Liste), Ladezustand nur noch über absolut positionierte Top-Bar + Eck-Spinner.
  - [x] **Feste Panel-Höhe statt `min-h`:** `h-[28rem]` mit internem Scrollen, damit der Kasten beim Tab-Wechsel (z. B. Gesamt → Modul/DSAL ohne Einträge) nicht mehr schrumpft/wächst.
  - [x] **Modul-Chips wiederverwendet:** Die Modul-Auswahl ist nun die einzige Modul-Reihe und wird von "Modul"- und "Aufgabe"-Tab geteilt (keine doppelte Modul-Reihe mehr auf dem Aufgabe-Tab). Beim Wechsel Modul ↔ Aufgabe fährt nur die Aufgaben-Reihe rein/raus → smooth.
  - [x] **PR #5** (`fix/leaderboard-filters`) gegen `main` erstellt und gemerged.
  - [x] **Branches aufgeräumt:** `fix/leaderboard-filters`, `refactor/app-split` und `cursor/feedback-admin-panel` (lokal + remote) gelöscht; nur `main` verbleibt.
  - [x] Express-Grundgerüst mit TypeScript und modularer Verzeichnisstruktur eingerichtet.
  - [x] API-Route für `/api/tasks/determinant` und mathematischer Generator mit LaTeX-Musterlösung.
  - [x] Vitest Unit- und Integrationstests (Supertest) geschrieben (14/14 Pass).
  - [x] Prisma ORM mit SQLite und Tabellen (`User`, `TaskType`, `SolvedTask`, `Feedback`) initialisiert und migriert.
  - [x] Benutzerregistrierung und Login (JWT-basiert, PBKDF2-Passworthashs) im Backend.
  - [x] Profileinstellungen im Frontend (Anzeigename, Passwort ändern, Base64-Avatar-Upload).
  - [x] Dedizierte Startseite (Home) mit Schnellnavigation, Statistiken und Pomodoro-Timer-Konfiguration.
  - [x] Pomodoro-Timer mit stufenlosen Slidern (Fokus: 5-60 min, Pause: 1-30 min) zur Laufzeitanpassung.
  - [x] Schwebendes Pomodoro-Widget (minimierbare Pille in der Ecke mit kreisförmigem Fortschrittsring, der im maximierten Zustand vollständig gefüllt wird, Glocken-Sound bei Ablauf).
  - [x] Split-Screen-Layout auf der Aufgaben-Seite (links: Aufgaben/Rechnen, rechts: Modul-/Aufgaben-Rangliste mit Live-Aktualisierung).
  - [x] Flüssig gleitende Onboarding-Tour mit Spotlight (Zielbereich bleibt sichtbar, Rest wird per "ausgestanztem" Loch verdunkelt) und automatischer Navigation zum jeweiligen Tab/Aufgabentyp pro Schritt.
  - [x] Fehlerfreie Farbdarstellung im Dark- & Whitemode durch Bereinigung nicht-standardmäßiger Tailwind-Klassen (z. B. `slate-850` zu `slate-800`).
  - [x] Integration des `@custom-variant dark` in `index.css` zur Aktivierung der Tailwind v4 CSS-Klassen-Kopplung.
  - [x] GitHub-Verweis im Footer inklusive offiziellem GitHub-Logo, der das Repository in einem neuen Tab öffnet.
  - [x] **Feedback-System:** Einreichung (Bug/Feedback) im Frontend (`FeedbackModal`), Admin-Abruf (`GET /api/feedback`) und Speicherung via Prisma.
  - [x] **Feedback löschen:** Admin kann Einträge über `DELETE /api/feedback/:id` (Backend + Löschen-Button im `AdminPanel`) entfernen.
  - [x] **GitHub-Issue mit Eingabemodal:** Beim Erstellen eines Issues öffnet sich ein Modal (`GitHubIssueModal`), in dem Titel und Beschreibung vorab befüllt und anpassbar sind; Backend akzeptiert optionale `title`/`body`.
  - [x] **PII-Bereinigung im Issue-Template:** Absender (E-Mail) und Benutzer-ID wurden aus dem Standard-Issue-Body entfernt – es erscheinen nur noch Erstellungsdatum und App-Hinweis.
  - [x] **Dev-Skript:** `npm run dev` startet Server + Client parallel via `scripts/dev.sh`.
* **Aktuell in Arbeit / Unfertig:**
  - [ ] Implementierung weiterer Aufgabengeneratoren (z.B. Analysis oder Betriebssysteme).
  - [ ] Leaderboard mit Pagination oder Top-10-Filter ausstatten (optional).
* **Identifizierte Blocker / Probleme:**
  - Keine Blocker vorhanden.
* **Nächste konkrete Schritte:**
  1. Mathematischen Generator für Ableitungen (Analysis) im Backend entwerfen.
  2. Erste Betriebssysteme-Aufgabe (z. B. Speicher-Adressübersetzung) programmieren.
  3. Weitere Aufgabentypen in `LEADERBOARD_MODULE_TASKS` (useLeaderboard.ts) pflegen, sobald neue Generatoren live sind.

---

## 3. Priorisiertes Backlog (Roadmap)
*Hier stehen die großen Features, die noch anstehen.*

### Phase 1: MVP (Aufgabengenerierung)
- [x] Core: Mathematischer Generator für Lineare Algebra (Determinanten)
- [ ] Core: Mathematischer Generator für Analysis (Ableitungen)
- [x] Frontend: KaTeX-Integration zur sauberen Darstellung von Matrizen und Formeln

### Phase 2: User- & Leaderboard-System
- [x] DB: Schema für User und gelöste Aufgaben definiert
- [x] Backend: JWT-basierte Authentifizierung (Register/Login)
- [x] Backend: API-Endpunkt für Highscores (`/api/leaderboard`)
- [x] Frontend: Leaderboard-Tab und Profil-Ansicht mit echten Backend-Daten füttern
- [x] Frontend: Onboarding-Tutorial für neue User
- [x] Frontend: Light/Darkmode-Toggle
- [x] Frontend: Modulauswahl-Startseite (Dashboard)
- [x] Frontend: Eigene Startseite (Home) mit Pomodoro-Timer
- [x] Frontend: Persistentes Pomodoro-Timer-Widget
- [x] Frontend: Split-Screen-Layout mit Live-Ranglisten-Updates
- [x] Frontend: Profil bearbeiten (Anzeigename, Passwort, Avatar-Upload)
- [x] Backend: Feedback-System (Einreichung, Admin-Abruf, Löschen)
- [x] Backend: GitHub-Issue-Erstellung aus Feedback mit editierbarem Titel/Beschreibung
- [x] Frontend: Admin-Panel zum Verwalten/Löschen von Feedback und Erstellen von GitHub-Issues
- [x] Frontend: FeedbackModal zur Einreichung von Bugs/Feedback durch Nutzer