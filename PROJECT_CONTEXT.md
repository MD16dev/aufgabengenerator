# Projekt-Kontext: Aufgaben-Generator

Dieses Dokument beschreibt die Vision, die Zielgruppe, die fachlichen Anforderungen und den geplanten Funktionsumfang des Projekts. Es dient KI-Entwicklern als fundamentale Wissensdatenbank, um den Sinn hinter dem Code zu verstehen.

---

## 1. Die Vision & Das Problem

* **Das Problem:** Informatikstudenten (und ihre Freunde) stehen in der Klausurenphase vor der Herausforderung, unzählige Mathe- und Informatikaufgaben üben zu müssen. Statische Altklausuren oder Übungszettel sind schnell durchgerechnet. Es fehlt an einer Quelle für unendlich viele, frische Übungsaufgaben.
* **Die Lösung:** Eine Web-App, die mathematische Übungsaufgaben algorithmisch (und somit unendlich oft) mit zufälligen Werten generiert. Die App validiert die Eingabe des Nutzers, liefert eine Musterlösung und motiviert durch ein kompetitives Leaderboard-System.

---

## 2. Die Zielgruppe

* **Primäre Nutzer:** Informatikstudenten (wir selbst und unsere Kommilitonen).
* **Anspruch:** Die UI muss extrem pragmatisch, schnell und ohne Schnickschnack bedienbar sein. Der Fokus liegt auf schnellem Rechnen und direktem Feedback.

---

## 3. Die Core-Features (Fachliche Anforderungen)

### Feature A: Modul- & Aufgabenauswahl (Die Struktur)
* Die App ist in **Module** (Tabs) unterteilt, die typischen Uni-Fächern entsprechen:
  * *Lineare Algebra* (z. B. Matrizenmultiplikation, Determinanten, LGS lösen)
  * *Betriebssysteme und Systemsoftware*
  * *Formale Systeme Automaten und Prozesse*
  * *Datenstrukturen und Algorithmen*
* Unter jedem Modul wählt der Nutzer einen konkreten **Aufgabetyp** aus einer Liste aus.

### Feature B: Unendliche Aufgabengenerierung (Der Core-Loop)
* **Keine statischen Aufgaben:** Aufgaben werden nicht aus einer Datenbank geladen, sondern bei jedem Klick durch Algorithmen im Backend zufällig erzeugt (z. B. Erstellung einer zufälligen $2 \times 2$ oder $3 \times 3$ Matrix mit ganzzahligen, "schönen" Werten).
* **Musterlösung:** Neben dem Endergebnis muss das System in der Lage sein, den Rechenweg Schritt für Schritt zu generieren und anzuzeigen, falls der Nutzer nicht weiterkommt.
* **Mathematische Darstellung:** Alle Formeln, Matrizen und mathematischen Symbole müssen im Frontend sauber mittels LaTeX (via KaTeX/MathJax) gerendert werden.

### Feature C: Antwort-Validierung
* Der Nutzer gibt seine Lösung in ein Eingabefeld ein.
* Das System vergleicht die Eingabe mit der berechneten Musterlösung (Toleranzberechnungen bei Fließkommazahlen beachten!).
* Der Nutzer erhält sofort visuelles Feedback (Richtig/Falsch) und die Option, die Musterlösung einzublenden.

### Feature D: Account-System & Gamification
* **Registrierung & Login:** Nutzer können ein einfaches Profil erstellen (Username + Passwort).
* **Fortschrittstracking:** Für jede *richtig* gelöste Aufgabe wird im Benutzerprofil ein Punkt (Score) gutgeschrieben. Mehrfachlösen desselben Aufgabentyps ist erlaubt, soll aber idealerweise getrackt werden.
* **Globales Leaderboard:** Eine Rangliste, die alle registrierten User absteigend nach der Anzahl ihrer gelösten Aufgaben sortiert anzeigt, um den Wettkampfcharakter zu fördern.

---

## 4. Konzeptionelles Datenmodell (Mental Model für die KI)

Für das Backend und die Datenbank musst du folgendes mentale Modell im Kopf haben:

* **User:** `id`, `username`, `password_hash`, `created_at`
* **TaskType:** Ein vordefinierter Aufgabetyp (z. B. `id: "lin_alg_det"`, `name: "Determinante bestimmen"`, `module: "Lineare Algebra"`)
* **SolvedTask (Die Relation für das Leaderboard):** `id`, `user_id`, `task_type_id`, `solved_at`

*Hinweis für die KI: Jedes Mal, wenn ein User eine Aufgabe richtig löst, wird ein neuer Eintrag in `SolvedTask` erzeugt. Das Leaderboard aggregiert diese Einträge (`COUNT`) pro User.*

---

## 5. Leitplanken für die Entwicklung

* **Keep It Simple (KISS):** Fang mit einer einzigen funktionierenden Aufgabe an (z. B. $2 \times 2$ Determinante). Wenn der komplette Flow (Generieren -> Anzeigen -> Lösen -> Speichern -> Leaderboard-Update) steht, fügen wir weitere Aufgabetypen hinzu.
* **Mathematische Präzision:** Achte darauf, dass die generierten Aufgaben lösbar sind und die Zahlen "rechenfreundlich" bleiben (keine krummen Dezimalzahlen als Endergebnis, es sei denn, das Thema verlangt es).
