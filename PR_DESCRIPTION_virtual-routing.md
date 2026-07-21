# PR: Virtual Routing (URL-driven Navigation) + OS Scheduling Generators

## Zusammenfassung
Dieser PR führt framework-freies Virtual Routing im Client ein (kein neues Dependency) und ergänzt zwei neue Betriebssystem-Aufgabengeneratoren inkl. Drag-and-Drop-Runner.

## Änderungen

### Virtual Routing (Client)
- **`client/src/hooks/useRoute.ts`** (neu): Framework-freier Routing-Hook. Verwaltet einen `RouteState` (view, module, task, duel, modals, onboarding, Leaderboard-Filter), parst/serialisiert die URL und abonniert `popstate` für Browser-Back/Forward.
- **`client/src/main.tsx`**: Parst die URL einmalig vor dem Mount (`parseRoute()`) und übergibt sie als `initialRoute` an `App` → Deep-Links booten direkt korrekt.
- **`client/src/App.tsx`**: Nutzt `useRoute(initialRoute)`; alle Navigationen laufen über `setRoute(...)`. Der Duel-Payload (nicht serialisierbar) bleibt lokal, nur die `duelId` steht in der URL.
- **`client/src/components/OnboardingTour.tsx`**: Akzeptiert `initialStep`/`onStepChange` → Tour-Schritt persistiert in der URL (`?onboarding=1&step=N`).
- **`NavHeader`, `TasksPage`, `HomePage`, `DuelLobby`, `DuelRunner`**: Nutzen die von `App` durchgereichten `setRoute`-Handler.

### URL-Schema
- Top-Level-View als Pfad: `/tasks`, `/leaderboard`, `/profile`, `/admin`, `/duels` (bzw. `/` für home)
- Sub-State als Query-Params: `?module=`, `?task=`, `?duel=`, `?auth=1`, `?feedback=1`, `?onboarding=1&step=N`, `?lbf=&lbm=&lbt=&lbtm=` (Leaderboard-Filter)

### Bewusst NICHT in der URL
- Pomodoro-Timer (`usePomodoro`) und voller Duel-Payload — sonst Timer-Reset bzw. nicht-serialisierbare Objekte.
- Duel-Socket (`useDuelSocket`) bleibt als Singleton erhalten; `DuelRunner` unmountet nur bei `duelId`-Wechsel.

### OS Scheduling Generators (Server + Client)
- **`server/src/services/math/osSchedulingGantt.ts`** (neu): Gantt-Diagramm-Scheduling-Generator.
- **`server/src/services/math/osSchedulingWait.ts`** (neu): Wait-Time-Scheduling-Generator.
- **`server/src/services/math/registry.ts`**: Beide Generatoren registriert.
- **`server/src/services/math/types.ts`**: Typen für Scheduling-Tasks ergänzt.
- **`client/src/components/SchedulingDragDropRunner.tsx`** (neu): Drag-and-Drop-Runner für Scheduling-Aufgaben.
- **`client/src/components/TasksPage.tsx`**, `GenericTaskRunner.tsx`, `ModuleSelector.tsx`: Anbindung des neuen Runners.
- **`server/src/controllers/scoreController.ts`**: Scoring-Anpassung für neue Task-Typen.

## Test
- `npm run build` (client) läuft fehlerfrei durch.
- `tsc --noEmit` ohne Fehler.
- Registry-Smoke-Test-Konflikt beim Rebase aufgelöst (`await gen()` übernommen, da Generator-Typ `TaskData | Promise<TaskData>` ist).

## PR erstellen
Link: https://github.com/MD16dev/aufgabengenerator/pull/new/feature/virtual-routing
