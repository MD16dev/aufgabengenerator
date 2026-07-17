# AufgabenGenerator 🎓

Ein moderner, interaktiver Übungsaufgabengenerator für Informatik- und Mathematik-Studierende. Die Plattform bietet unendlich viele, dynamisch generierte Aufgaben mit detaillierten Schritt-für-Schritt-Musterlösungen in LaTeX, ein integriertes Benutzer- und Ranglistensystem, ein Feedback- & Admin-System sowie integrierte Produktivitätstools (Pomodoro-Timer).

---

## 🚀 Features

### 1. Dynamische Aufgabengenerierung (Math Engine)
* **Dynamische Generierung:** Jede Aufgabe wird zur Laufzeit auf dem Server zufällig generiert – keine vordefinierten Aufgabenpools.
* **LaTeX-Musterlösungen:** Vollständige, mathematisch korrekte Lösungswege, gerendert mit KaTeX für erstklassige visuelle Qualität.
* **Registry-Pattern:** Neue Aufgabentypen werden in einer zentralen Registry (`server/src/services/math/registry.ts`) angemeldet. Controller und Routen bleiben unverändert – ein neuer Generator reicht zum Hinzufügen.
* **Derzeit verfügbare Generatoren (Lineare Algebra & Calculations):**
  * `lin_alg_det` – Determinante einer $2 \times 2$ Matrix
  * `lin_alg_det3x3` – Determinante einer $3 \times 3$ Matrix
  * `lin_alg_matmul` – Matrix-Multiplikation
  * `calc_gl_n_cardinality` – Kardinalität von $\mathrm{GL}(n, q)$ (allgemeine lineare Gruppe)
  * `calc_param_determinant_finite_field` – Determinante über einem endlichen Körper
  * `calc_poly_mapping_matrix` – Abbildungsmatrix eines Polynomraums
  * `calc_eigenbasis` – Eigenwerte & Eigenbasis
  * `calc_linear_code_parameters` – Parameter eines linearen Codes (Hamming-Distanz, Rate)
  * *Geplant:* Betriebssysteme (Speicheradressübersetzung), Formale Systeme (DFA/Regex), Algorithmen (AVL, Dijkstra).

### 2. Benutzer- & Ranglistensystem
* **Authentifizierung:** Sicheres JWT-basiertes Registrierungs- und Anmeldesystem mit clientseitigem Token-Caching in LocalStorage.
* **Passwort-Hashing:** Serverseitiges PBKDF2-Hashing mit eindeutigem Salt pro User (`crypto.pbkdf2Sync`, SHA-512).
* **Profil-Verwaltung:** Anpassbare Anzeigenamen, Passwortänderung und Base64-Profilbild-Upload (bis zu 1,5 MB).
* **Live-Leaderboards:**
  * Globale Rangliste aller Benutzer.
  * Modul- und aufgabenspezifische Bestenlisten.
  * **Live-Updates:** Die Rangliste auf der Aufgabenseite aktualisiert sich sofort in Echtzeit, sobald eine Aufgabe erfolgreich gelöst wird.
  * **Anti-Cheat:** Sobald der Rechenweg aufgedeckt wird, sperrt sich das Eingabefeld und die Aufgabe wird nicht mehr für das Leaderboard gewertet.

### 3. Feedback- & Admin-System
* **Feedback-Einreichung:** Nutzer können über das `FeedbackModal` Bugs oder Feedback (mit optionaler E-Mail) einsenden – auch als Gast (optionaler Auth).
* **Admin-Panel:** Erreichbar über den „Admin"-Tab in der Navigation (nur für Administratoren sichtbar). Enthält zwei Bereiche:
  * **Feedback:** Übersicht aller Einsendungen (Bugs/Feedback), Filter, Löschen einzelner Einträge und Erstellung eines GitHub-Issues mit vorab befülltem, editierbarem Titel/Beschreibung.
  * **Benutzer:** Liste aller Accounts mit Admin-Status, gelösten Aufgaben und Erstellungsdatum. Administratoren können hier andere Nutzer **zum Admin befördern oder ihnen die Rechte entziehen** (eigene Rechte können nicht selbst entzogen werden, um Selbst-Aussperrung zu verhindern).
* **GitHub-Integration:** Feedback kann direkt als Issue im konfigurierten Repository (`GITHUB_REPO`) angelegt werden (PII wie E-Mail/User-ID werden aus dem Standard-Issue-Body entfernt).

### 4. Modernes, kontrastreiches UI/UX Design
* **Unabhängiges Theming:** Voller Support für Light- und Darkmode, gesteuert über einen dedizierten Sonne/Mond-Theme-Umschalter, der perfekt mit Tailwind CSS v4 und CSS-Variablen synchronisiert ist.
* **Premium-Aktivitäten:** Keine störenden, schwammigen "Grau-auf-Grau"-Transparenzüberlagerungen im Light-Mode; stattdessen klare, solide Kontraste und moderne Indigo-Schatten.
* **Spotlight-Onboarding:** Eine flüssig gleitende und morphende Einführungstour für neue Benutzer, die über ein einziges CSS-transformiertes Masken-Overlay realisiert wird und automatisch zum passenden Tab navigiert.

### 5. Integrierter Pomodoro-Timer
* **Timer-Widgets:** Ein konfigurierbarer Timer auf dem Dashboard sowie ein schwebendes, minimierbares Widget in der Ecke, das auf allen Seiten aktiv bleibt.
* **Echtzeit-Anpassung:** Zeitregler (Slider) für Fokuszeit (5–60 min, lila akzentuiert) und Pausenzeit (1–30 min, grün akzentuiert).
* **Audio-Alarme:** Echtzeitsynthese von Signaltönen (Glockenspiel) über die browserseitige `AudioContext`-API bei Ablauf des Timers (keine externen Mediendateien erforderlich).

---

## 🛠️ Technologie-Stack

### Frontend (`/client`)
* **Framework:** React 19, TypeScript, Vite 6
* **Styling:** Tailwind CSS v4 (mit `@custom-variant dark` für präzises Theming)
* **Symbole & Formeln:** Lucide React, KaTeX (zur LaTeX-Visualisierung)
* **Linting:** oxlint

### Backend (`/server`)
* **Laufzeitumgebung:** Node.js, Express, TypeScript
* **Datenbank & ORM:** SQLite (`dev.db`), Prisma ORM
* **Sicherheit:** JSON Web Tokens (JWT), PBKDF2 Passworthashs, rollenbasierte Admin-Autorisierung
* **Testing:** Vitest, Supertest

### Monorepo-Struktur
Das Projekt ist ein npm-Workspace mit zwei Paketen (`client`, `server`). Root-Skripte starten beide parallel.

---

## ⚙️ Installation & Setup

### Voraussetzungen
Stelle sicher, dass **Node.js** (v18+) auf deinem System installiert ist.

### 1. Repository klonen & Abhängigkeiten installieren
```bash
git clone https://github.com/MD16dev/aufgabengenerator.git
cd aufgabengenerator
npm install
```

### 2. Umgebungsvariablen konfigurieren
Erstelle eine `.env`-Datei im `server/`-Verzeichnis (Beispiel unten). **Wichtig:** Die `.env` ist in `.gitignore` ausgeschlossen und enthält sensible Daten (GitHub-Token) – sie wird niemals committet.

```env
# server/.env
DATABASE_URL="file:./dev.db"
PORT=5001

# JWT-Signierung (in Produktion zwingend einen starken, zufälligen Wert setzen)
JWT_SECRET="dev-key-keep-it-secret"

# GitHub-Integration für Feedback-Issues (optional, aber für Issue-Erstellung nötig)
GITHUB_TOKEN=github_pat_xxx
GITHUB_REPO=MD16dev/aufgabengenerator

# Admin-Konfiguration: komma-getrennte Liste von Usernamen, die Admin-Rechte
# erhalten. Fallback auf "MD16", wenn nicht gesetzt. Dient als Bootstrap-Garantie,
# damit du dich nie selbst aussperrst – der persistierte isAdmin-Flag in der DB
# ist jedoch die autoritative Quelle für die Berechtigung.
ADMIN_USERNAMES=MD16
```

### 3. Datenbank einrichten
Führe die Prisma-Migrationen aus, um die lokale SQLite-Datenbank zu erstellen und den Client zu generieren:
```bash
npm run prisma:migrate --workspace=server
```

### 4. Entwicklungs-Server starten
Starte sowohl das Backend als auch das Frontend parallel mit einem einzigen Befehl:
```bash
npm run dev
```
* **Frontend:** Erreichbar unter [http://localhost:5173](http://localhost:5173)
* **Backend API:** Läuft auf [http://localhost:5001](http://localhost:5001)

---

## 👤 Admin-Rechte vergeben

Admin-Status ist rollenbasiert und serverseitig abgesichert (Feld `isAdmin` im `User`-Modell, im JWT verankert). Es gibt drei Wege, einen Account zum Admin zu machen:

1. **Über das Admin-Panel (empfohlen):** Im Admin-Panel auf den Tab **Benutzer** wechseln und beim gewünschten Account auf **„Zum Admin"** klicken. Der User hat sofort Rechte.
2. **Über die `.env` (`ADMIN_USERNAMES`):** Komma-getrennte Liste. Beim nächsten Login wird der User automatisch auf `isAdmin = true` gesetzt. Gedacht als Bootstrap, falls die DB leer/inkonsistent ist.
3. **Direkt in der Datenbank:**
   ```bash
   cd server
   npx prisma db execute --stdin <<'SQL'
   UPDATE "User" SET "isAdmin" = 1 WHERE "username" = 'andererUser';
   SQL
   ```
   Danach muss sich der User einmal neu einloggen, damit das Token mit `isAdmin: true` ausgestellt wird.

Ein Admin kann seine **eigenen** Admin-Rechte nicht selbst entziehen (Schutz vor Selbst-Aussperrung).

---

## 🧪 Tests & Build

### Testsuite ausführen (Vitest)
Starte die backendseitigen API- und Math-Tests (50 Tests: Math-Generatoren, Auth, Feedback, Admin-User-Management):
```bash
npm run test:server
```

### Produktion-Build kompilieren
Kompiliere das gesamte clientseitige React-Bundle fehlerfrei:
```bash
npm run build --workspace=client
```

### Linting (Frontend)
```bash
npm run lint --workspace=client
```

---

## 📡 API-Überblick

### Auth (`/api/auth`)
| Methode | Pfad | Auth | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/register` | – | Neue Registrierung (setzt `isAdmin`, falls Username in `ADMIN_USERNAMES`) |
| `POST` | `/login` | – | Login, gibt JWT + User zurück |
| `GET` | `/me` | JWT | Aktuelles Profil inkl. `isAdmin` |
| `PUT` | `/profile` | JWT | Anzeigename, Passwort, Avatar ändern |
| `GET` | `/users` | Admin | Liste aller User (ohne Passwörter) |
| `PATCH` | `/users/:id/admin` | Admin | `isAdmin` setzen/entziehen (eigene Rechte geschützt) |

### Tasks & Leaderboard (`/api/tasks`)
| Methode | Pfad | Auth | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/:type` | – | Generiert Aufgabe vom Typ `:type` via Registry |
| `POST` | `/solve` | JWT | Markiert Aufgabe als gelöst, erhöht Score |
| `GET` | `/leaderboard` | optional | Globale/Modul-/Aufgaben-Rangliste |

### Feedback (`/api/feedback`)
| Methode | Pfad | Auth | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/` | optional | Feedback/Bug einreichen |
| `GET` | `/` | Admin | Alle Einsendungen abrufen |
| `DELETE` | `/:id` | Admin | Einsendung löschen |
| `POST` | `/:id/github-issue` | Admin | GitHub-Issue aus Feedback erstellen |

---

## 🗂️ Projektstruktur (Auszug)

```
aufgabengenerator/
├── client/                 # React 19 + Vite Frontend
│   └── src/
│       ├── components/     # AdminPanel, NavHeader, GenericTaskRunner, ...
│       ├── hooks/          # useAuth, useLeaderboard, usePomodoro
│       └── types.ts        # UserProfile (inkl. isAdmin)
├── server/                 # Express + TypeScript Backend
│   ├── prisma/             # Schema + Migrationen (inkl. add_is_admin)
│   └── src/
│       ├── controllers/    # auth, feedback, score, task
│       ├── middleware/     # auth (JWT + isAdmin im Request)
│       ├── routes/         # auth, feedback, task
│       └── services/math/  # Generatoren + registry.ts
├── scripts/dev.sh          # Startet Server + Client parallel
└── package.json            # npm-Workspace-Root
```

---

## 📄 Lizenz
Dieses Projekt wurde exklusiv für Kommilitonen zur gemeinsamen Prüfungsvorbereitung entwickelt. Lizenzfrei und Open-Source.