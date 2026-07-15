# Projekt-Status & KI-Handoff-Protokoll

Diese Datei dient als Synchronisationspunkt zwischen Entwicklern und KI-Agenten. Sie dokumentiert den aktuellen Entwicklungsstand, offene Tasks und technische Blocker.

---

## 1. Aktueller Gesamtstatus
* **Letztes Update:** 15. Juli 2026
* **Aktiver Branch:** `cursor/feedback-admin-panel` (mit Remote tracking auf `origin/cursor/feedback-admin-panel`)
* **Datenbank-Status:** SQLite lokal eingerichtet, Schema migriert (`dev.db`), Prisma Client generiert.

---

## 2. Letztes Handoff-Protokoll
*(Dieses Protokoll wird von der KI am Ende jeder Session aktualisiert)*

* **Ausführender Agent / Entwickler:** GitHub Copilot (Tencent: Hy3)
* **Was wurde erledigt:**
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
  - [x] Flüssig gleitende und morphende Spotlight-Onboarding-Tour (über ein einziges CSS-transformiertes Masken-Overlay).
  - [x] Fehlerfreie Farbdarstellung im Dark- & Whitemode durch Bereinigung nicht-standardmäßiger Tailwind-Klassen (z. B. `slate-850` zu `slate-800`).
  - [x] Integration des `@custom-variant dark` in `index.css` zur Aktivierung der Tailwind v4 CSS-Klassen-Kopplung.
  - [x] GitHub-Verweis im Footer inklusive offiziellem GitHub-Logo, der das Repository in einem neuen Tab öffnet.
  - [x] **Feedback-System:** Einreichung (Bug/Feedback) im Frontend (`FeedbackModal`), Admin-Abruf (`GET /api/feedback`) und Speicherung via Prisma.
  - [x] **Feedback löschen:** Admin kann Einträge über `DELETE /api/feedback/:id` (Backend + Löschen-Button im `AdminPanel`) entfernen.
  - [x] **GitHub-Issue mit Eingabemodal:** Beim Erstellen eines Issues öffnet sich ein Modal (`GitHubIssueModal`), in dem Titel und Beschreibung vorab befüllt und anpassbar sind; Backend akzeptiert optionale `title`/`body`.
  - [x] **PII-Bereinigung im Issue-Template:** Absender (E-Mail) und Benutzer-ID wurden aus dem Standard-Issue-Body entfernt – es erscheinen nur noch Erstellungsdatum und App-Hinweis.
  - [x] **Dev-Skript:** `npm run dev` startet Server + Client parallel via `scripts/dev.sh`.
* **Aktuell in Arbeit / Unfertig:**
  - [ ] PR von `cursor/feedback-admin-panel` nach `main` mergen (wartet auf Review).
  - [ ] Implementierung weiterer Aufgabengeneratoren (z.B. Analysis oder Betriebssysteme).
* **Identifizierte Blocker / Probleme:**
  - Keine Blocker vorhanden.
* **Nächste konkrete Schritte:**
  1. PR `cursor/feedback-admin-panel` → `main` reviewen und mergen.
  2. Mathematischen Generator für Ableitungen (Analysis) im Backend entwerfen.
  3. Erste Betriebssysteme-Aufgabe (z. B. Speicher-Adressübersetzung) programmieren.
  4. Leaderboard mit Pagination oder Top-10-Filter ausstatten.

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