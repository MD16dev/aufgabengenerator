# Projekt-Status & KI-Handoff-Protokoll

Diese Datei dient als Synchronisationspunkt zwischen Entwicklern und KI-Agenten. Sie dokumentiert den aktuellen Entwicklungsstand, offene Tasks und technische Blocker.

---

## 1. Aktueller Gesamtstatus
* **Letztes Update:** [Datum eintragen, z. B. 14. Juli 2026]
* **Aktiver Branch:** `main` (oder z. B. `feature/user-auth`)
* **Datenbank-Status:** [z. B. SQLite lokal eingerichtet, Schema für User existiert]

---

## 2. Letztes Handoff-Protokoll
*(Dieses Protokoll wird von der KI am Ende jeder Session aktualisiert)*

* **Ausführender Agent / Entwickler:** [z. B. Gemini-1.5-Pro]
* **Was wurde erledigt:**
  - [x] Express-Grundgerüst aufgesetzt
  - [x] Erste API-Route für `/api/tasks/determinant` erstellt
  - [x] Unit-Tests für den Determinanten-Generator geschrieben (100% Pass)
* **Aktuell in Arbeit / Unfertig:**
  - [ ] React-Frontend-Anbindung an den `/api/tasks/determinant`-Endpunkt (State-Management angefangen, aber API-Call schlägt noch fehl).
* **Identifizierte Blocker / Probleme:**
  - CORS-Fehler zwischen React (Port 5173) und Express (Port 5000). Express-Middleware muss noch konfiguriert werden.
* **Nächste konkrete Schritte:**
  1. CORS im Express-Backend erlauben (`npm install cors`).
  2. Den API-Response im React-Frontend mit `fetch` oder `axios` abfangen und im State speichern.
  3. UI-Komponente zur Eingabe der User-Lösung bauen.

---

## 3. Priorisiertes Backlog (Roadmap)
*Hier stehen die großen Features, die noch anstehen.*

### Phase 1: MVP (Aufgabengenerierung)
- [ ] Core: Mathematischer Generator für Lineare Algebra (Determinanten) -> *In Arbeit*
- [ ] Core: Mathematischer Generator für Analysis (Ableitungen)
- [ ] Frontend: KaTeX-Integration zur sauberen Darstellung von Matrizen und Formeln

### Phase 2: User- & Leaderboard-System
- [ ] DB: Schema für User und gelöste Aufgaben definieren
- [ ] Backend: JWT-basierte Authentifizierung (Register/Login)
- [ ] Backend: API-Endpunkt für Highscores (`/api/leaderboard`)
- [ ] Frontend: Leaderboard-Tab und Profil-Ansicht