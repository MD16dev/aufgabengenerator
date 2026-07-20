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

/** Unterstützte Scheduling-Verfahren für diese Drag-and-Drop-Aufgabe. */
type Scheduler = 'FIFO' | 'RR';

/**
 * Berechnet die korrekte Slot-Belegung (Gantt-Diagramm) für das gewählte
 * Verfahren. Jeder Slot entspricht einer Zeiteinheit. Die Gesamtlänge liegt
 * im Bereich 12-20.
 */
function computeGantt(processes: Process[], scheduler: Scheduler, quantum: number): string[] {
  const n = processes.length;

  if (scheduler === 'FIFO') {
    // First-Come-First-Served: Prozesse in Ankunftsreihenfolge abarbeiten.
    const order = processes.map((_, i) => i).sort((a, b) => processes[a].arrival - processes[b].arrival);
    const gantt: string[] = [];
    let time = 0;
    for (const i of order) {
      // Falls die CPU noch idle ist, bis zur Ankunftszeit überspringen.
      if (time < processes[i].arrival) {
        for (let t = time; t < processes[i].arrival; t++) gantt.push('IDLE');
        time = processes[i].arrival;
      }
      for (let b = 0; b < processes[i].burst; b++) {
        gantt.push(processes[i].id);
        time++;
      }
    }
    return gantt;
  }

  // Round Robin (preemptive): zirkuläre Warteschlange mit Quantum.
  const arrival = processes.map((p) => p.arrival);
  const burstLeft = processes.map((p) => p.burst);
  const done = new Array<boolean>(n).fill(false);
  const queue: number[] = [];
  const gantt: string[] = [];
  let time = 0;
  let finished = 0;

  // Initial alle Prozesse, die zur Zeit 0 ankommen, in die Queue.
  for (let i = 0; i < n; i++) {
    if (arrival[i] <= time) queue.push(i);
  }

  while (finished < n) {
    if (queue.length === 0) {
      // Idle: springe zum nächsten Ankunftszeitpunkt.
      const nextArrival = Math.min(...arrival.filter((_, i) => !done[i]));
      for (let t = time; t < nextArrival; t++) gantt.push('IDLE');
      time = nextArrival;
      for (let i = 0; i < n; i++) {
        if (!done[i] && arrival[i] <= time && !queue.includes(i)) queue.push(i);
      }
      continue;
    }
    const i = queue.shift()!;
    const run = Math.min(quantum, burstLeft[i]);
    for (let b = 0; b < run; b++) {
      gantt.push(processes[i].id);
      time++;
    }
    burstLeft[i] -= run;
    // Neu angekommene Prozesse während dieses Runs in die Queue aufnehmen.
    for (let j = 0; j < n; j++) {
      if (!done[j] && arrival[j] > time - run && arrival[j] <= time && !queue.includes(j) && j !== i) {
        queue.push(j);
      }
    }
    if (burstLeft[i] === 0) {
      done[i] = true;
      finished++;
    } else {
      queue.push(i); // Wieder ans Ende der Queue.
    }
  }

  return gantt;
}

/** Erzeugt eine LaTeX-Prozesstabelle als array-Umgebung. */
function buildTableLatex(processes: Process[]): string {
  let latex = '\\begin{array}{c|ccc}';
  latex += '\\text{Prozess} & \\text{Ankunft} & \\text{Burst} & \\text{Verbleibend} \\\\ \\hline ';
  for (const p of processes) {
    latex += `${p.id} & ${p.arrival} & ${p.burst} & ${p.burst} \\\\ `;
  }
  latex += '\\end{array}';
  return latex;
}

/**
 * Erzeugt eine Scheduling-Aufgabe als Drag-and-Drop Gantt-Diagramm.
 * Der Nutzer muss die Prozesse in die korrekte Slot-Reihenfolge ziehen.
 */
export function generateSchedulingGanttTask(): TaskData {
  // Verfahren zufällig wählen: FIFO oder Round Robin.
  const scheduler: Scheduler = Math.random() < 0.5 ? 'FIFO' : 'RR';
  const quantum = scheduler === 'RR' ? getRandomInt(2, 5) : 0;

  // 4-6 Prozesse erzeugen.
  const n = getRandomInt(4, 6);
  const processes: Process[] = [];
  for (let i = 0; i < n; i++) {
    processes.push({
      id: `P${i + 1}`,
      arrival: getRandomInt(0, 3),
      burst: getRandomInt(2, 5),
    });
  }

  // Gantt-Diagramm (Slot-Belegung) berechnen.
  let gantt = computeGantt(processes, scheduler, quantum);

  // Sicherstellen, dass die Länge im Bereich 12-20 liegt.
  while (gantt.length < 12) {
    // Weitere Prozesse/Wiederholungen anhängen, falls zu kurz.
    const extra = processes[getRandomInt(0, n - 1)].id;
    gantt.push(extra);
  }
  if (gantt.length > 20) {
    gantt = gantt.slice(0, 20);
  }
  const slots = gantt.length;

  const algorithmLabel = scheduler === 'FIFO' ? 'FIFO (FCFS)' : `Round Robin (Q=${quantum})`;

  const prompt = `Ziehe die Prozesse per Drag-and-Drop in die ${slots} Slots, um das korrekte Gantt-Diagramm für ${algorithmLabel} zu bilden.`;

  const mathQuery = `\\text{Gegeben seien folgende Prozesse:} \\\\ ${buildTableLatex(processes)} \\\\ \\\\ ` +
    `\\text{Verfahren: } ${algorithmLabel} \\\\ \\\\ ` +
    `\\text{Ziehe die Prozesse in die korrekte Reihenfolge (${slots} Slots).}`;

  const explanation = [
    `Verfahren: ${algorithmLabel}.`,
    scheduler === 'FIFO'
      ? 'Die Prozesse werden in Reihenfolge ihrer Ankunftszeit abgearbeitet; bei gleicher Ankunft in aufsteigender Nummerierung.'
      : `Jeder Prozess läuft maximal ${quantum} Zeiteinheiten (Quantum), dann wird der nächste wartende Prozess bedient (zirkuläre Warteschlange).`,
    `Die korrekte Slot-Belegung lautet: ${gantt.join(', ')}.`,
    'Leere/IDLE-Slots entstehen, wenn die CPU wartet, bis der nächste Prozess ankommt.',
  ];

  return {
    type: 'os_scheduling_gantt',
    mathQuery,
    answer: gantt.join(','),
    explanation,
    prompt,
    inputHint: 'Ziehe die Prozesse per Drag-and-Drop in die Slots.',
    schedulingDragDrop: {
      algorithm: algorithmLabel,
      processes: processes.map((p) => ({
        id: p.id,
        name: p.id,
        burst: p.burst,
        arrival: p.arrival,
        remaining: p.burst,
      })),
      slots,
      solution: gantt,
      prompt,
    },
  };
}
