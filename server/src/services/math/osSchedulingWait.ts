import { TaskData } from './types';

/** Zufällige ganze Zahl im Bereich [min, max] (inklusive). */
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Ein Prozess mit Ankunftszeit und Burst-Zeit. */
interface Process {
  id: string;        // Prozessname, z.B. "P1"
  arrival: number;   // Ankunftszeit
  burst: number;     // Burst-/Service-Zeit
}

/** Unterstützte Scheduling-Verfahren. */
type Scheduler = 'FIFO' | 'SJF' | 'RR';

/**
 * Berechnet die Wartezeit jedes Prozesses für das gewählte Verfahren.
 * Rückgabe: Array der Wartezeiten (exakt, nicht gerundet), indexweise zum
 * übergebenen Prozess-Array passend.
 */
function computeWaitingTimes(processes: Process[], scheduler: Scheduler, quantum: number): number[] {
  const n = processes.length;
  const waiting = new Array<number>(n).fill(0);

  if (scheduler === 'FIFO') {
    // First-Come-First-Served: Prozesse in Ankunftsreihenfolge.
    const order = processes.map((_, i) => i).sort((a, b) => processes[a].arrival - processes[b].arrival);
    let time = 0;
    for (const i of order) {
      // Falls die CPU noch idle ist, springe zur Ankunftszeit.
      if (time < processes[i].arrival) time = processes[i].arrival;
      // Wartezeit = Startzeit - Ankunftszeit.
      waiting[i] = time - processes[i].arrival;
      time += processes[i].burst;
    }
  } else if (scheduler === 'SJF') {
    // Shortest Job First (non-preemptive): bei freier CPU den kürzesten
    // verfügbaren (bereits angekommenen) Prozess wählen.
    const remaining = processes.map((_, i) => i);
    let time = 0;
    while (remaining.length > 0) {
      // Verfügbare Prozesse (ankommen <= time).
      const available = remaining.filter((i) => processes[i].arrival <= time);
      let pick: number;
      if (available.length === 0) {
        // Kein Prozess angekommen: springe zum nächsten Ankunftszeitpunkt.
        const nextArrival = Math.min(...remaining.map((i) => processes[i].arrival));
        time = nextArrival;
        continue;
      }
      // Kürzesten Burst wählen (bei Gleichstand: frühere Ankunft).
      pick = available.reduce((best, i) =>
        processes[i].burst < processes[best].burst ||
        (processes[i].burst === processes[best].burst && processes[i].arrival < processes[best].arrival)
          ? i : best);
      waiting[pick] = time - processes[pick].arrival;
      time += processes[pick].burst;
      remaining.splice(remaining.indexOf(pick), 1);
    }
  } else {
    // Round Robin (preemptive): zirkuläre Warteschlange mit Quantum.
    const arrival = processes.map((p) => p.arrival);
    const burstLeft = processes.map((p) => p.burst);
    const endTime = new Array<number>(n).fill(0); // Zeitpunkt, an dem Prozess fertig wird.
    const queue: number[] = [];
    let time = 0;
    let done = 0;
    // Initial alle Prozesse, die zur Zeit 0 ankommen, in die Queue.
    for (let i = 0; i < n; i++) {
      if (arrival[i] <= time) queue.push(i);
    }
    while (done < n) {
      if (queue.length === 0) {
        // Idle: springe zum nächsten Ankunftszeitpunkt.
        const nextArrival = Math.min(...arrival.filter((_, i) => endTime[i] === 0));
        time = nextArrival;
        for (let i = 0; i < n; i++) {
          if (endTime[i] === 0 && arrival[i] <= time) queue.push(i);
        }
        continue;
      }
      const i = queue.shift()!;
      const run = Math.min(quantum, burstLeft[i]);
      time += run;
      burstLeft[i] -= run;
      // Neu angekommene Prozesse während dieses Runs in die Queue aufnehmen.
      for (let j = 0; j < n; j++) {
        if (endTime[j] === 0 && arrival[j] > time - run && arrival[j] <= time && !queue.includes(j) && j !== i) {
          queue.push(j);
        }
      }
      if (burstLeft[i] === 0) {
        endTime[i] = time;
        done++;
      } else {
        queue.push(i); // Wieder ans Ende der Queue.
      }
    }
    // Wartezeit = (Fertigstellungszeit - Ankunftszeit - Burst-Zeit).
    for (let i = 0; i < n; i++) {
      waiting[i] = endTime[i] - arrival[i] - processes[i].burst;
    }
  }

  return waiting;
}

/** Erzeugt eine LaTeX-Prozesstabelle als array-Umgebung. */
function buildTableLatex(processes: Process[]): string {
  let latex = '\\begin{array}{c|cc}';
  latex += '\\text{Prozess} & \\text{Ankunft} & \\text{Burst} \\\\ \\hline ';
  for (const p of processes) {
    latex += `${p.id} & ${p.arrival} & ${p.burst} \\\\ `;
  }
  latex += '\\end{array}';
  return latex;
}

export function generateSchedulingWaitTask(): TaskData {
  // Zufällig EIN Scheduling-Verfahren wählen.
  const schedulers: Scheduler[] = ['FIFO', 'SJF', 'RR'];
  const scheduler = schedulers[getRandomInt(0, schedulers.length - 1)];

  // Anzahl Prozesse (3–5).
  const n = getRandomInt(3, 5);

  // Quantum nur für Round Robin (2–5).
  const quantum = scheduler === 'RR' ? getRandomInt(2, 5) : 0;

  const processes: Process[] = [];
  for (let i = 0; i < n; i++) {
    const id = `P${i + 1}`;
    // Bei FIFO/SJF klassisch alle zur Zeit 0, sonst sinnvolle Ankunftszeiten.
    const arrival = (scheduler === 'FIFO' || scheduler === 'SJF') ? 0 : getRandomInt(0, 4);
    const burst = getRandomInt(1, 9);
    processes.push({ id, arrival, burst });
  }

  // Wartezeiten berechnen (exakt, intern).
  const waiting = computeWaitingTimes(processes, scheduler, quantum);

  // Durchschnittliche Wartezeit exakt berechnen, dann auf 1 Nachkommastelle runden.
  const avgExact = waiting.reduce((s, w) => s + w, 0) / n;
  const answer = avgExact.toFixed(1);

  // Gantt-Reihenfolge für die Erklärung ermitteln (gleiche Logik wie oben,
  // hier nur zur Darstellung der Ausführungsreihenfolge).
  const order: string[] = [];
  if (scheduler === 'FIFO') {
    const idx = processes.map((_, i) => i).sort((a, b) => processes[a].arrival - processes[b].arrival);
    let time = 0;
    for (const i of idx) {
      if (time < processes[i].arrival) time = processes[i].arrival;
      order.push(`${processes[i].id} (${time}–${time + processes[i].burst})`);
      time += processes[i].burst;
    }
  } else if (scheduler === 'SJF') {
    const remaining = processes.map((_, i) => i);
    let time = 0;
    while (remaining.length > 0) {
      const available = remaining.filter((i) => processes[i].arrival <= time);
      if (available.length === 0) {
        time = Math.min(...remaining.map((i) => processes[i].arrival));
        continue;
      }
      const pick = available.reduce((best, i) =>
        processes[i].burst < processes[best].burst ||
        (processes[i].burst === processes[best].burst && processes[i].arrival < processes[best].arrival)
          ? i : best);
      order.push(`${processes[pick].id} (${time}–${time + processes[pick].burst})`);
      time += processes[pick].burst;
      remaining.splice(remaining.indexOf(pick), 1);
    }
  } else {
    // Round Robin Reihenfolge.
    const arrival = processes.map((p) => p.arrival);
    const burstLeft = processes.map((p) => p.burst);
    const endTime = new Array<number>(n).fill(0);
    const queue: number[] = [];
    let time = 0;
    let done = 0;
    for (let i = 0; i < n; i++) if (arrival[i] <= time) queue.push(i);
    while (done < n) {
      if (queue.length === 0) {
        time = Math.min(...arrival.filter((_, i) => endTime[i] === 0));
        for (let i = 0; i < n; i++) if (endTime[i] === 0 && arrival[i] <= time) queue.push(i);
        continue;
      }
      const i = queue.shift()!;
      const run = Math.min(quantum, burstLeft[i]);
      order.push(`${processes[i].id} (${time}–${time + run})`);
      time += run;
      burstLeft[i] -= run;
      for (let j = 0; j < n; j++) {
        if (endTime[j] === 0 && arrival[j] > time - run && arrival[j] <= time && !queue.includes(j) && j !== i) {
          queue.push(j);
        }
      }
      if (burstLeft[i] === 0) { endTime[i] = time; done++; } else queue.push(i);
    }
  }

  // Erklärung-Schritt-für-Schritt als LaTeX-Strings aufbauen.
  const explanation: string[] = [];
  const schedulerName = scheduler === 'FIFO' ? 'FIFO (FCFS)' : scheduler === 'SJF' ? 'SJF (non-preemptive)' : `Round Robin (Quantum ${quantum})`;
  explanation.push(`\\text{Verfahren: } ${schedulerName}`);
  explanation.push(`\\text{Prozesstabelle: } ${buildTableLatex(processes)}`);
  explanation.push(`\\text{Ausführungsreihenfolge (Gantt): } ${order.join('\\;\\rightarrow\\;')}`);
  // Wartezeit pro Prozess.
  const waitParts = processes.map((p, i) => `${p.id}: ${waiting[i]}`);
  explanation.push(`\\text{Wartezeiten: } ${waitParts.join(',\\; ')}`);
  explanation.push(`\\text{Durchschnittliche Wartezeit } = \\frac{${waiting.join('+')}}{${n}} = ${answer}`);

  // LaTeX nur für die Prozesstabelle. Die Aufgabenstellung ("Berechne die
  // durchschnittliche Wartezeit ...") steht bereits als prompt-Überschrift im
  // Frontend (GenericTaskRunner) und wird dort als Klartext gerendert, nicht
  // als LaTeX. Wird vom Frontend mit MathRenderer block (BlockMath) gerendert.
  const mathQuery = `\\begin{gather}`
    + `${buildTableLatex(processes)}`
    + `\\end{gather}`;

  return {
    type: 'os_scheduling_wait',
    mathQuery,
    answer,
    explanation,
    prompt: `Berechne die durchschnittliche Wartezeit für das Verfahren ${schedulerName}.`,
    inputHint: 'Gib die durchschnittliche Wartezeit als Dezimalzahl ein (z.B. 5.5).'
  };
}
