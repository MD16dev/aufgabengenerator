# Projekt-Status & KI-Handoff-Protokoll

Diese Datei dient als Synchronisationspunkt zwischen Entwicklern und KI-Agenten. Sie dokumentiert den aktuellen Entwicklungsstand, offene Tasks und technische Blocker.

---

## 1. Aktueller Gesamtstatus
* **Letztes Update:** 14. Juli 2026
* **Aktiver Branch:** `main` (mit Remote tracking auf `origin/main`)
* **Datenbank-Status:** SQLite lokal eingerichtet, Schema migriert (`dev.db`), Prisma Client generiert.

---

## 2. Letztes Handoff-Protokoll
*(Dieses Protokoll wird von der KI am Ende jeder Session aktualisiert)*

* **Ausführender Agent / Entwickler:** Antigravity (Gemini 3.5 Flash)
* **Was wurde erledigt:**
  - [x] Express-Grundgerüst mit TypeScript und modularer Verzeichnisstruktur eingerichtet.
  - [x] API-Route für `/api/tasks/determinant` implementiert.
  - [x] Mathematischer Generator für $2 \times 2$ Determinanten mit LaTeX-Musterlösung implementiert.
  - [x] Vitest Unit- und Integrationstests (Supertest) geschrieben (100% Pass).
  - [x] Prisma ORM mit SQLite und Tabellen (`User`, `TaskType`, `SolvedTask`) initialisiert und migriert.
  - [x] Benutzerregistrierung und Login (JWT-basiert, PBKDF2-Passworthashs) im Backend implementiert.
  - [x] `/api/tasks/solve` (POST) und `/api/tasks/leaderboard` (GET) Endpunkte implementiert.
  - [x] React-Vite-Client mit TypeScript initialisiert und dedupliziert.
  - [x] Tailwind CSS v4 und KaTeX in React integriert.
  - [x] Light-/Darkmode-Umschalter mit automatischer Systemerkennung (prefers-color-scheme) und CSS-Variablentheming erstellt.
  - [x] Startseiten-Fächerauswahl-Dashboard (`ModuleSelector`) mit Modulen und Aufgabetypen (sowie bald verfügbaren Lock-Cards) erstellt.
  - [x] Interaktive Onboarding-Tour (`OnboardingTour`) für Erstbesucher implementiert (gespeichert in LocalStorage).
  - [x] AuthModal für Login & Registrierung mit Frontend-Anbindung an JWT-Endpoints implementiert.
* **Aktuell in Arbeit / Unfertig:**
  - [ ] Implementierung weiterer Aufgabengeneratoren (z.B. Analysis oder Betriebssysteme).
* **Identifizierte Blocker / Probleme:**
  - Keine Blocker vorhanden.
* **Nächste konkrete Schritte:**
  1. Mathematischen Generator für Ableitungen (Analysis) im Backend entwerfen.
  2. Erste Betriebssysteme-Aufgabe (z. B. Speicher-Adressübersetzung) programmieren.
  3. Leaderboard mit Pagination oder Top-10-Filter ausstatten.

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