# Pull Request: Elo-Leaderboard, DSAL-Aufgabengeneratoren & Echtzeit-Duellsystem

Dieser PR integriert drei große Feature-Bereiche in `main`: ein per-Modul-Elo-System
mit Bestenliste, 35 neue DSAL-Aufgabengeneratoren (Algorithmen & Datenstrukturen)
und ein vollständiges Echtzeit-Duellsystem.

## 🏆 Elo-System & Bestenliste
- Per-Modul-Elo (LinAlg, OS, FormalSys, AlgoStruct) + allgemeines Elo in `User`-Modell
- Neuer Elo-Tab in der Bestenliste mit Modul-Filter (Gesamt/LA/BUS/FOSAP/DSAL)
- Elo-Anzeige im Profil (6 Karten: gesamt + 4 Module + Duel-Bilanz) und im Duel-HUD
- `GET /api/tasks/elo-leaderboard?module=...` liefert modulspezifische Rankings

## 🌳 DSAL-Generatoren (35 neue Aufgabentypen)
- **Bäume:** BST / AVL / Red-Black / B-Tree — Insertion **und** Deletion
- **Sorting:** Bubble, Insertion, Selection, Quick, Merge, Heap, Counting, Bucket
- **Graphen:** BFS, DFS, Topo, Dijkstra, Bellman-Ford, Prim, Kruskal, Union-Find,
  Kosaraju, Floyd-Warshall
- **Hashing:** Division/Multiplikation × Open/Linear/Quadratic Probing
- **Optimization:** Knapsack, LCS, Simplex
- Stepwise-Flashcard-Darstellung mit `TreeRenderer`, `GraphRenderer`, `StepTaskRunner`
- Umfangreiche Tests pro Generator + Registry-Smoke-Test über alle 35 Typen

## ⚔️ Echtzeit-Duellsystem
- Socket.io-basiertes Matchmaking mit Modul-Elo
- Countdown, synchronisierte Tasks, Live-Score, Forfeit-Handling
- Singleton-Socket verhindert Verbindungsabbrüche beim Component-Unmount

## 🐛 Bugfixes
- `paramDeterminant.ts`: falsches Vorzeichen in `det3Poly` korrigiert
  (Determinantenformel)
- `osBusAnki`: `options` → `choices` Migration für einheitliches Frontend-Rendering
- `TasksPage`: doppelte `TASK_LABELS`-Deklaration entfernt

## 🔧 Infrastruktur
- Zentrale `config.ts` (VITE_API_URL) für Netzwerk-Play
- `autoComplete="off"` auf Aufgaben-Inputs
- DB-Migrationen: `isAdmin`, `solved_outcome`, Duel-Tabellen

**Getestet:** Server & Client kompilieren fehlerfrei (`tsc --noEmit`), alle
Generatoren via Smoke-Test verifiziert.

---

PR erstellen unter:
https://github.com/MD16dev/aufgabengenerator/compare/main...feature/elo-leaderboard
