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
  - [x] Prisma ORM mit SQLite initialisiert und Tabellen (`User`, `TaskType`, `SolvedTask`) migriert.
  - [x] React-Vite-Client mit TypeScript initialisiert und dedupliziert.
  - [x] Tailwind CSS v4 in React integriert.
  - [x] KaTeX-Integration im Client zur LaTeX-Rendrung von Formeln und gemischtem Text (`LatexTextRenderer`).
  - [x] Antwort-Validierung im Frontend mit sofortigem Feedback und lokalem Session-Score.
  - [x] Tab-Layout in React (Aufgaben, Bestenliste, Profil) gestaltet.
* **Aktuell in Arbeit / Unfertig:**
  - [ ] Echte JWT-Authentifizierung und Anbindung der SQLite-Datenbank an das Frontend (aktuell Mock/Lokaler Score).
* **Identifizierte Blocker / Probleme:**
  - Keine Blocker vorhanden. Die Codebases für Server und Client laufen lauffähig parallel.
* **Nächste konkrete Schritte:**
  1. JWT-basierte Benutzerregistrierung und Login im Express-Backend umsetzen (Phase 2).
  2. Die `SolvedTask`-Tabelle bei korrekt gelösten Aufgaben über API befüllen.
  3. API-Endpunkt für das globale Leaderboard (`/api/leaderboard`) bauen und im Client einbinden.

---

## 3. Priorisiertes Backlog (Roadmap)
*Hier stehen die großen Features, die noch anstehen.*

### Phase 1: MVP (Aufgabengenerierung)
- [x] Core: Mathematischer Generator für Lineare Algebra (Determinanten)
- [ ] Core: Mathematischer Generator für Analysis (Ableitungen)
- [x] Frontend: KaTeX-Integration zur sauberen Darstellung von Matrizen und Formeln

### Phase 2: User- & Leaderboard-System
- [x] DB: Schema für User und gelöste Aufgaben definiert
- [ ] Backend: JWT-basierte Authentifizierung (Register/Login)
- [ ] Backend: API-Endpunkt für Highscores (`/api/leaderboard`)
- [ ] Frontend: Leaderboard-Tab und Profil-Ansicht mit echten Backend-Daten füttern