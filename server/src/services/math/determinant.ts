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
