import { TaskData } from './types';

export interface DeterminantTask {
  type: string;
  matrix: number[][];
  latex: string;
  answer: number;
  steps: string[];
}

/**
 * Generates a random integer in the range [min, max] (inclusive).
 */
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random 2x2 matrix determinant task with a step-by-step LaTeX solution.
 */
export function generate2x2DeterminantTask(): DeterminantTask {
  // Generate nice, readable random integers between -9 and 9
  const a = getRandomInt(-9, 9);
  const b = getRandomInt(-9, 9);
  const c = getRandomInt(-9, 9);
  const d = getRandomInt(-9, 9);

  const matrix = [
    [a, b],
    [c, d]
  ];

  const answer = a * d - b * c;

  // Build LaTeX representation of the matrix
  const latex = `\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}`;

  // Helper to safely format negative numbers with parentheses
  const fmt = (num: number) => num < 0 ? `(${num})` : `${num}`;

  const ad = a * d;
  const bc = b * c;

  // Build step-by-step explanation in LaTeX format
  const steps = [
    `Gegeben ist die Matrix $M = ${latex}$. Gesucht ist die Determinante $\\det(M)$.`,
    `Die Formel für die Determinante einer $2 \\times 2$ Matrix ist:
     $$\\det \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = a \\cdot d - b \\cdot c$$`,
    `Wir setzen die Werte der Matrix ein:
     $$\\det(M) = ${fmt(a)} \\cdot ${fmt(d)} - ${fmt(b)} \\cdot ${fmt(c)}$$`,
    `Wir berechnen die Produkte:
     $$${a * d} - ${fmt(b * c)}$$`,
    `Das ergibt das Endergebnis:
     $$\\det(M) = ${answer}$$`
  ];

  return {
    type: 'lin_alg_det',
    matrix,
    latex,
    answer,
    steps
  };
}

/**
 * Registry-compatible generator. Returns the unified TaskData shape so the
 * GenericTaskRunner on the frontend can render it without knowing the domain.
 */
export function generateDeterminant(): TaskData {
  const task = generate2x2DeterminantTask();
  return {
    type: task.type,
    mathQuery: `\\det ${task.latex}`,
    answer: String(task.answer),
    explanation: task.steps,
    prompt: 'Berechne die Determinante der folgenden Matrix:',
    inputHint: 'Gib das Ergebnis als ganze Zahl ein (z.B. -5).'
  };
}

/**
 * Generates a random 3x3 matrix determinant task with a step-by-step LaTeX solution.
 */
export function generate3x3DeterminantTask(): DeterminantTask {
  // Generate random integers between -6 and 6 to keep calculations readable
  const a = getRandomInt(-6, 6);
  const b = getRandomInt(-6, 6);
  const c = getRandomInt(-6, 6);
  const d = getRandomInt(-6, 6);
  const e = getRandomInt(-6, 6);
  const f = getRandomInt(-6, 6);
  const g = getRandomInt(-6, 6);
  const h = getRandomInt(-6, 6);
  const i = getRandomInt(-6, 6);

  const matrix = [
    [a, b, c],
    [d, e, f],
    [g, h, i]
  ];

  const diag1 = a * e * i;
  const diag2 = b * f * g;
  const diag3 = c * d * h;
  const sumDiag = diag1 + diag2 + diag3;

  const anti1 = g * e * c;
  const anti2 = h * f * a;
  const anti3 = i * d * b;
  const sumAnti = anti1 + anti2 + anti3;

  const answer = sumDiag - sumAnti;

  const latex = `\\begin{pmatrix} ${a} & ${b} & ${c} \\\\ ${d} & ${e} & ${f} \\\\ ${g} & ${h} & ${i} \\end{pmatrix}`;

  const fmt = (num: number) => num < 0 ? `(${num})` : `${num}`;

  const steps = [
    `Gegeben ist die Matrix $M = ${latex}$. Gesucht ist die Determinante $\\det(M)$.`,
    `Zur Berechnung einer $3 \\times 3$ Matrix verwenden wir die \Regel von Sarrus. Dazu schreiben wir die ersten zwei Spalten der Matrix rechts daneben auf:
     $$\\begin{matrix}
     ${a} & ${b} & ${c} & | & ${a} & ${b} \\\\
     ${d} & ${e} & ${f} & | & ${d} & ${e} \\\\
     ${g} & ${h} & ${i} & | & ${g} & ${h}
     \\end{matrix}$$`,
    `Die Determinante berechnet sich als Summe der Produkte der drei Hauptdiagonalen (von links oben nach rechts unten) minus die Summe der Produkte der drei Nebendiagonalen (von links unten nach rechts oben):
     $$\\det(M) = (${fmt(a)} \\cdot ${fmt(e)} \\cdot ${fmt(i)} + ${fmt(b)} \\cdot ${fmt(f)} \\cdot ${fmt(g)} + ${fmt(c)} \\cdot ${fmt(d)} \\cdot ${fmt(h)}) - (${fmt(g)} \\cdot ${fmt(e)} \\cdot ${fmt(c)} + ${fmt(h)} \\cdot ${fmt(f)} \\cdot ${fmt(a)} + ${fmt(i)} \\cdot ${fmt(d)} \\cdot ${fmt(b)})$$`,
    `Wir berechnen die Produkte der Hauptdiagonalen:
     * $${fmt(a)} \\cdot ${fmt(e)} \\cdot ${fmt(i)} = ${diag1}$
     * $${fmt(b)} \\cdot ${fmt(f)} \\cdot ${fmt(g)} = ${diag2}$
     * $${fmt(c)} \\cdot ${fmt(d)} \\cdot ${fmt(h)} = ${diag3}$
     
     Summe der Hauptdiagonalen: $${fmt(diag1)} + ${fmt(diag2)} + ${fmt(diag3)} = ${sumDiag}$`,
    `Wir berechnen die Produkte der Nebendiagonalen:
     * $${fmt(g)} \\cdot ${fmt(e)} \\cdot ${fmt(c)} = ${anti1}$
     * $${fmt(h)} \\cdot ${fmt(f)} \\cdot ${fmt(a)} = ${anti2}$
     * $${fmt(i)} \\cdot ${fmt(d)} \\cdot ${fmt(b)} = ${anti3}$
     
     Summe der Nebendiagonalen: $${fmt(anti1)} + ${fmt(anti2)} + ${fmt(anti3)} = ${sumAnti}$`,
    `Nun subtrahieren wir die Nebendiagonalen von den Hauptdiagonalen:
     $$\\det(M) = ${sumDiag} - ${fmt(sumAnti)} = ${answer}$$`,
    `Das ergibt das Endergebnis:
     $$\\det(M) = ${answer}$$`
  ];

  return {
    type: 'lin_alg_det3x3',
    matrix,
    latex,
    answer,
    steps
  };
}

export function generateDeterminant3x3(): TaskData {
  const task = generate3x3DeterminantTask();
  return {
    type: task.type,
    mathQuery: `\\det ${task.latex}`,
    answer: String(task.answer),
    explanation: task.steps,
    prompt: 'Berechne die Determinante der folgenden 3x3 Matrix mit der Regel von Sarrus:',
    inputHint: 'Gib das Ergebnis als ganze Zahl ein (z.B. 42).'
  };
}
