# AufgabenGenerator 🎓

Ein moderner, interaktiver Übungsaufgabengenerator für Informatik- und Mathematik-Studierende. Die Plattform bietet unendlich viele, dynamisch generierte Aufgaben mit detaillierten Schritt-für-Schritt-Musterlösungen in LaTeX, ein integriertes Benutzer- und Ranglistensystem sowie integrierte Produktivitätstools (Pomodoro-Timer).

---

## 🚀 Features

### 1. Dynamische Aufgabengenerierung (Math Engine)
* **Dynamische Generierung:** Jede Aufgabe wird zur Laufzeit auf dem Server zufällig generiert – keine vordefinierten Aufgabenpools.
* **LaTeX-Musterlösungen:** Vollständige, mathematisch korrekte Lösungswege, gerendert mit KaTeX für erstklassige visuelle Qualität.
* **Derzeitige Module:**
  * **LA (Lineare Algebra):** Berechnung von $2 \times 2$ Determinanten.
  * **BUS (Betriebssysteme):** Speicheradressübersetzung, CPU-Scheduling *(geplant)*.
  * **FOSAP (Formale Systeme):** DFA-zu-Regex Konvertierung, Wahrheitstabellen *(geplant)*.
  * **DSAL (Algorithmen & Datenstrukturen):** AVL-Baum-Rotationen, Dijkstra-Wegfindung *(geplant)*.

### 2. Benutzer- & Ranglistensystem
* **Authentifizierung:** Sicheres JWT-basiertes Registrierungs- und Anmeldesystem mit clientseitigem Token-Caching in LocalStorage.
* **Passwort-Hashing:** Lokale Verschlüsselung über den sicheren, C-bindungsfreien `scrypt`-Algorithmus (Verhinderung von nativen Build-Fehlern).
* **Profil-Verwaltung:** Anpassbare Anzeigenamen, Passwortänderung und Base64-Profilbild-Upload (bis zu 1,5 MB).
* **Live-Leaderboards:**
  * Globale Rangliste aller Benutzer.
  * Modul- und aufgabenspezifische Bestenlisten.
  * **Live-Updates:** Die Rangliste auf der Aufgabenseite aktualisiert sich sofort in Echtzeit, sobald eine Aufgabe erfolgreich gelöst wird.
  * **Anti-Cheat:** Sobald der Rechenweg aufgedeckt wird, sperrt sich das Eingabefeld und die Aufgabe wird nicht mehr für das Leaderboard gewertet.

### 3. Modernes, kontrastreiches UI/UX Design
* **Unabhängiges Theming:** Voller Support für Light- und Darkmode, gesteuert über einen dedizierten Sonne/Mond-Theme-Umschalter, der perfekt mit Tailwind CSS v4 und CSS-Variablen synchronisiert ist.
* **Premium-Aktivitäten:** Keine störenden, schwammigen "Grau-auf-Grau"-Transparenzüberlagerungen im Light-Mode; stattdessen klare, solide Kontraste und moderne Indigo-Schatten.
* **Spotlight-Onboarding:** Eine flüssig gleitende und morphende Einführungstour für neue Benutzer, die über ein einziges CSS-transformiertes Masken-Overlay realisiert wird.

### 4. Integrierter Pomodoro-Timer
* **Timer-Widgets:** Ein konfigurierbarer Timer auf dem Dashboard sowie ein schwebendes, minimierbares Widget in der Ecke, das auf allen Seiten aktiv bleibt.
* **Echtzeit-Anpassung:** Zeitregler (Slider) für Fokuszeit (5–60 min, lila akzentuiert) und Pausenzeit (1–30 min, grün akzentuiert).
* **Audio-Alarme:** Echtzeitsynthese von Signaltönen (Glockenspiel) über die browserseitige `AudioContext`-API bei Ablauf des Timers (keine externen Mediendateien erforderlich).

---

## 🛠️ Technologie-Stack

### Frontend (`/client`)
* **Framework:** React 19, TypeScript, Vite
* **Styling:** Tailwind CSS v4 (mit `@custom-variant dark` für präzises Theming)
* **Symbole & Formeln:** Lucide React, KaTeX (zur LaTeX-Visualisierung)

### Backend (`/server`)
* **Laufzeitumgebung:** Node.js, Express, TypeScript
* **Datenbank & ORM:** SQLite (`dev.db`), Prisma ORM
* **Sicherheit:** JSON Web Tokens (JWT), PBKDF2/scrypt Passworthashs
* **Testing:** Vitest, Supertest

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

### 2. Datenbank einrichten
Führe die Prisma-Migrationen aus, um die lokale SQLite-Datenbank zu erstellen und den Client zu generieren:
```bash
npm run prisma:migrate --workspace=server
```

### 3. Entwicklungs-Server starten
Starte sowohl das Backend als auch das Frontend parallel mit einem einzigen Befehl:
```bash
npm run dev
```
* **Frontend:** Erreichbar unter [http://localhost:5173](http://localhost:5173)
* **Backend API:** Läuft auf [http://localhost:5000](http://localhost:5000)

---

## 🧪 Tests & Build

### Testsuite ausführen (Vitest)
Starte die backendseitigen API- und Math-Tests (14 integrierte Unittests):
```bash
npm run test:server
```

### Produktion-Build kompilieren
Kompiliere das gesamte clientseitige React-Bundle fehlerfrei:
```bash
npm run build --workspace=client
```

---

## 📄 Lizenz
Dieses Projekt wurde exklusiv für Kommilitonen zur gemeinsamen Prüfungsvorbereitung entwickelt. Lizenzfrei und Open-Source.