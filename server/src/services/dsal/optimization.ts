import { TaskData } from '../math/types';

/**
 * Optimization exercise generators (dynamic programming + linear programming),
 * translated from the official exercisegenerator optimization/*.java.
 * These belong to the DSAL module per the user's request.
 */

/* ------------------------------- Knapsack -------------------------------- */

function getRandomInt(min: number, max: number): number {
  if (max < min) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Build the (n+1) x (capacity+1) knapsack DP table. */
function knapsackDP(weights: number[], values: number[], capacity: number): number[][] {
  const n = weights.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));
  for (let item = 0; item < n; item++) {
    for (let w = 1; w <= capacity; w++) {
      if (weights[item] > w) {
        dp[item + 1][w] = dp[item][w];
      } else {
        dp[item + 1][w] = Math.max(
          dp[item][w],
          dp[item][w - weights[item]] + values[item],
        );
      }
    }
  }
  return dp;
}

/** Trace back the DP table to find which items (1-indexed) are taken. */
function knapsackTraceback(dp: number[][], weights: number[], n: number, capacity: number): number[] {
  const taken: number[] = [];
  let i = n;
  let j = capacity;
  while (i > 0) {
    const valueAbove = i === 0 ? 0 : dp[i - 1][j];
    if (dp[i][j] > valueAbove) {
      taken.push(i);
      j -= weights[i - 1];
    }
    i--;
  }
  taken.sort((a, b) => a - b);
  return taken;
}

export function generateKnapsack(): TaskData {
  // Generate parameters that make the task non-trivial: the capacity must be
  // small enough that not everything fits, but at least two items fit on their
  // own, and there must be a genuine trade-off (an item that fits but is left
  // out in favour of a better combination). Otherwise the optimum is obvious.
  let n = 0;
  let weights: number[] = [];
  let values: number[] = [];
  let capacity = 0;
  let attempts = 0;
  do {
    n = getRandomInt(3, 6);
    capacity = getRandomInt(3, 8);
    weights = [];
    values = [];
    for (let i = 0; i < n; i++) {
      // Every item must fit on its own: weight is at most the capacity.
      weights.push(getRandomInt(1, capacity));
      values.push(getRandomInt(1, 11));
    }
    attempts++;
    const fitCount = weights.filter((w) => w <= capacity).length;
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    // Need: not all fit, at least 2 fit individually, and a real trade-off
    // exists (some fitting item is excluded because a better combo wins).
    if (fitCount >= 2 && totalWeight > capacity) {
      const dp = knapsackDP(weights, values, capacity);
      const taken = knapsackTraceback(dp, weights, n, capacity);
      const excludedFitting = weights.some(
        (w, i) => w <= capacity && !taken.includes(i + 1),
      );
      if (excludedFitting) break;
    }
  } while (attempts < 200);

  // DP table (n+1) x (capacity+1)
  const dp: number[][] = knapsackDP(weights, values, capacity);
  const taken: number[] = knapsackTraceback(dp, weights, n, capacity);
  const maxValue = dp[n][capacity];
  const taskAnswer = `Wert: ${maxValue}, Gegenstände: {${taken.join(', ')}}`;
  // KaTeX-rendered version of the answer for the solution display.
  const taskAnswerLatex = `\\text{Eingabe (Musterlösung): } \\text{Wert: } ${maxValue},\\ \\text{Gegenstände: } \\{${taken.join(', ')}\\}`;

  // Render the filled DP table as a KaTeX array for the solution display.
  const header = `i \\backslash w & ${Array.from({ length: capacity + 1 }, (_, w) => w).join(' & ')}`;
  const rows = dp.map((row, i) => `${i} & ${row.join(' & ')}`).join(' \\\\ ');
  const tableLatex = `\\begin{array}{c|${'c'.repeat(capacity + 1)}} ${header} \\\\ \\hline ${rows} \\end{array}`;

  return {
    type: 'dsal_opt_knapsack',
    mathQuery: `\\text{Rucksack Kapazität } ${capacity}.\\ w = [${weights.join(', ')}],\\ v = [${values.join(', ')}].`,
    answer: taskAnswer,
    prompt: `Bestimmen Sie mit dynamischer Programmierung den maximalen Gesamtwert und die mitzunehmenden Gegenstände (1-indiziert).`,
    inputHint: 'Format: "Wert: X, Gegenstände: {i, j, ...}".',
    explanation: [
      `Wir füllen eine DP-Tabelle $T_{i,w}$ zeilenweise von $i=0$ bis $n$ und $w=0$ bis $W$ auf. Für jeden Gegenstand $i$ und jedes Gewicht $w$ gilt die Rekursion $T_{i,w} = \\max\\bigl(T_{i-1,w},\\ T_{i-1,\\,w-w_i}+v_i\\bigr)$ (falls $w_i \\le w$; sonst übernimmt man einfach $T_{i-1,w}$).`,
      `Die vollständig gefüllte Tabelle (Zeile $i$ = nach Betrachtung der ersten $i$ Gegenstände, Spalte $w$ = Kapazität):`,
      `$$${tableLatex}$$`,
      `Der Eintrag $T_{n,W}$ liefert den maximalen Gesamtwert. Die konkret mitgenommenen Gegenstände erhält man durch Backtracking: man startet bei $(n,W)$ und nimmt Gegenstand $i$, sobald $T_{i,w} > T_{i-1,w}$ gilt, und verringert dann $w$ um $w_i$.`,
      `$${taskAnswerLatex}$`,
    ],
  };
}

/* --------------------------------- LCS ----------------------------------- */

function randomUpperCase(length: number): string {
  let s = '';
  for (let i = 0; i < length; i++) s += String.fromCharCode(65 + getRandomInt(0, 25));
  return s;
}

export function generateLCS(): TaskData {
  // Regenerate until the two words actually share at least one character, so
  // the LCS (and thus the answer) is non-empty and the task is meaningful.
  let word1 = '';
  let word2 = '';
  let result = '';
  let attempts = 0;
  do {
    const len1 = getRandomInt(3, 10);
    const len2 = getRandomInt(3, 10);
    word1 = randomUpperCase(len1);
    word2 = randomUpperCase(len2);
    attempts++;
    // Quick shared-character check before building the full DP table.
    const shared = word1.split('').some((ch) => word2.includes(ch));
    if (!shared) continue;

    const rows = word1.length;
    const cols = word2.length;
    const dp: number[][] = Array.from({ length: rows + 1 }, () => new Array(cols + 1).fill(0));
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const above = dp[r - 1][c];
        const left = dp[r][c - 1];
        const max = Math.max(left, above);
        if (word1[r - 1] === word2[c - 1]) {
          dp[r][c] = Math.max(max, dp[r - 1][c - 1] + 1);
        } else {
          dp[r][c] = max;
        }
      }
    }
    // Traceback
    result = '';
    let r = rows;
    let c = cols;
    while (r > 0 && c > 0) {
      if (dp[r - 1][c] === dp[r][c]) {
        r--;
      } else if (dp[r][c - 1] === dp[r][c]) {
        c--;
      } else {
        result = word1[r - 1] + result;
        r--;
        c--;
      }
    }
  } while (result.length === 0 && attempts < 200);

  const rows = word1.length;
  const cols = word2.length;
  // Rebuild the DP table for the final (valid) word pair for the solution view.
  const dp: number[][] = Array.from({ length: rows + 1 }, () => new Array(cols + 1).fill(0));
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const above = dp[r - 1][c];
      const left = dp[r][c - 1];
      const max = Math.max(left, above);
      if (word1[r - 1] === word2[c - 1]) {
        dp[r][c] = Math.max(max, dp[r - 1][c - 1] + 1);
      } else {
        dp[r][c] = max;
      }
    }
  }

  // Render the filled LCS DP table as a KaTeX array for the solution display.
  const colLabels = word2.split('').map((ch, i) => `${ch}_{${i + 1}}`).join(' & ');
  const header = `& \\emptyset & ${colLabels}`;
  const tableRows = dp.map((row, r) => {
    const label = r === 0 ? '\\emptyset' : `${word1[r - 1]}_{${r}}`;
    return `${label} & ${row.join(' & ')}`;
  }).join(' \\\\ ');
  const tableLatex = `\\begin{array}{c|${'c'.repeat(cols + 1)}} ${header} \\\\ \\hline ${tableRows} \\end{array}`;

  return {
    type: 'dsal_opt_lcs',
    mathQuery: `w_1 = \\text{${word1}},\\ w_2 = \\text{${word2}}.`,
    answer: result,
    prompt: `Bestimmen Sie die längste gemeinsame Teilfolge (LCS) der Zeichenfolgen "${word1}" und "${word2}" mit dynamischer Programmierung.`,
    inputHint: 'Geben Sie die Teilfolge als Zeichenkette an (eine Teilfolge muss nicht zusammenhängend sein).',
    explanation: [
      `Wir füllen eine DP-Tabelle $L_{i,j}$ für die Präfixe der beiden Wörter auf. Bei übereinstimmenden Zeichen gilt $L_{i,j} = L_{i-1,\\,j-1}+1$; sonst $L_{i,j} = \\max(L_{i-1,j},\\ L_{i,j-1})$.`,
      `Die vollständig gefüllte Tabelle (Zeile $i$ = Präfix von $w_1$ der Länge $i$, Spalte $j$ = Präfix von $w_2$ der Länge $j$):`,
      `$$${tableLatex}$$`,
      `Der Wert $L_{|w_1|,|w_2|}$ ist die Länge der LCS. Die Teilfolge selbst rekonstruiert man durch Backtracking von der Ecke: bei Übereinstimmung geht man schräg nach links-oben (Zeichen übernehmen), sonst in die Richtung des größeren Nachbarn. Achtung: eine Teilfolge (im Gegensatz zu einem Teilstring) muss nicht zusammenhängend sein.`,
      `$\\text{LCS (Musterlösung): } \\text{${result}}$`,
    ],
  };
}

/* -------------------------------- Simplex -------------------------------- */

// Exact rational arithmetic with bigint to avoid floating point errors.
class Frac {
  readonly num: bigint;
  readonly den: bigint; // always > 0
  constructor(num: bigint | number, den: bigint | number = 1) {
    let n = typeof num === 'bigint' ? num : BigInt(num);
    let d = typeof den === 'bigint' ? den : BigInt(den);
    if (d === 0n) throw new Error('division by zero');
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = Frac.gcd(n < 0n ? -n : n, d);
    this.num = n / g;
    this.den = d / g;
  }
  static gcd(a: bigint, b: bigint): bigint {
    while (b !== 0n) {
      [a, b] = [b, a % b];
    }
    return a < 0n ? -a : a;
  }
  add(o: Frac): Frac {
    return new Frac(this.num * o.den + o.num * this.den, this.den * o.den);
  }
  sub(o: Frac): Frac {
    return new Frac(this.num * o.den - o.num * o.den, this.den * o.den);
  }
  mul(o: Frac): Frac {
    return new Frac(this.num * o.num, this.den * o.den);
  }
  div(o: Frac): Frac {
    return new Frac(this.num * o.den, this.den * o.num);
  }
  isPositive(): boolean {
    return this.num > 0n;
  }
  isNegative(): boolean {
    return this.num < 0n;
  }
  isZero(): boolean {
    return this.num === 0n;
  }
  toString(): string {
    if (this.den === 1n) return this.num.toString();
    return `${this.num}/${this.den}`;
  }
}

type SimplexResult =
  | { status: 'solved'; x: Frac[]; z: Frac }
  | { status: 'unbounded' }
  | { status: 'unsolvable' };

/**
 * Two-phase simplex for a maximization LP in standard form:
 *   maximize  sum c_j x_j   subject to  sum A_ij x_j <= b_i,  x_j >= 0.
 * All b_i must be >= 0 (caller guarantees this). Uses fractions for exactness.
 */
function simplexSolve(c: Frac[], A: Frac[][], b: Frac[]): SimplexResult {
  const n = c.length; // original variables
  const m = A.length; // constraints
  const totalCols = n + m + 1; // vars + slacks + RHS
  // tableau: m constraint rows + 1 objective row
  const tableau: Frac[][] = Array.from({ length: m + 1 }, () => new Array(totalCols).fill(new Frac(0)));
  const basis: number[] = new Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) tableau[i][j] = A[i][j];
    tableau[i][n + i] = new Frac(1); // slack
    tableau[i][totalCols - 1] = b[i];
    basis[i] = n + i;
  }
  // objective row: reduced costs (c_j - z_j); start at c_j (z_j = 0)
  for (let j = 0; j < n; j++) tableau[m][j] = c[j];
  for (let j = n; j < totalCols; j++) tableau[m][j] = new Frac(0);

  const pivot = (prow: number, pcol: number) => {
    const pivotVal = tableau[prow][pcol];
    for (let j = 0; j < totalCols; j++) tableau[prow][j] = tableau[prow][j].div(pivotVal);
    for (let i = 0; i <= m; i++) {
      if (i === prow) continue;
      const factor = tableau[i][pcol];
      if (factor.isZero()) continue;
      for (let j = 0; j < totalCols; j++) {
        tableau[i][j] = tableau[i][j].sub(factor.mul(tableau[prow][j]));
      }
    }
    basis[prow] = pcol;
  };

  // Phase 2 loop (b_i >= 0 guaranteed, so no artificial variables needed)
  let guard = 0;
  while (guard++ < 1000) {
    // pivot column = most positive reduced cost
    let pcol = -1;
    let best = new Frac(0);
    for (let j = 0; j < totalCols - 1; j++) {
      if (tableau[m][j].isPositive() && tableau[m][j].num * best.den > best.num * tableau[m][j].den) {
        best = tableau[m][j];
        pcol = j;
      }
    }
    if (pcol === -1) break; // optimal
    // pivot row = min ratio among rows with positive entry in pcol
    let prow = -1;
    let minRatio: Frac | null = null;
    for (let i = 0; i < m; i++) {
      const entry = tableau[i][pcol];
      if (entry.isPositive()) {
        const ratio = tableau[i][totalCols - 1].div(entry);
        if (minRatio === null || ratio.num * minRatio.den < minRatio.num * ratio.den) {
          minRatio = ratio;
          prow = i;
        }
      }
    }
    if (prow === -1) return { status: 'unbounded' };
    pivot(prow, pcol);
  }

  // Extract solution
  const x: Frac[] = new Array(n).fill(new Frac(0));
  for (let i = 0; i < m; i++) {
    if (basis[i] < n) x[basis[i]] = tableau[i][totalCols - 1];
  }
  let z = new Frac(0);
  for (let j = 0; j < n; j++) z = z.add(c[j].mul(x[j]));
  return { status: 'solved', x, z };
}

export function generateSimplex(): TaskData {
  const n = getRandomInt(2, 3);
  const m = getRandomInt(2, 3);
  // target coefficients: nonzero integers in [-10,10]
  const c: Frac[] = [];
  for (let j = 0; j < n; j++) {
    let v = getRandomInt(1, 10);
    if (getRandomInt(1, 4) === 1) v = -v;
    c.push(new Frac(v));
  }
  // constraints: positive coefficients (=> bounded) and positive RHS (=> feasible)
  const A: Frac[][] = [];
  const b: Frac[] = [];
  for (let i = 0; i < m; i++) {
    const row: Frac[] = [];
    for (let j = 0; j < n; j++) row.push(new Frac(getRandomInt(1, 10)));
    A.push(row);
    b.push(new Frac(getRandomInt(5, 20)));
  }

  const result = simplexSolve(c, A, b);

  const targetStr = c.map((coef, idx) => `${coef.toString()}x_{${idx + 1}}`).join(' + ').replace(/\+ -/g, '- ');
  const consStr = A.map((row, i) => `${row.map((coef, idx) => `${coef.toString()}x_{${idx + 1}}`).join(' + ')} \\leq ${b[i].toString()}`).join(',\\ ');

  if (result.status === 'unbounded') {
    return {
      type: 'dsal_opt_simplex',
      mathQuery: `\\max\\ ${targetStr}\\ \\text{ s.t. }\\ ${consStr},\\ x_i \\geq 0.`,
      answer: 'unbeschränkt',
      prompt: `Lösen Sie das lineare Programm (Simplex) und geben Sie die optimale Belegung und den Zielfunktionswert an, oder begründen Sie, warum es keine optimale Lösung gibt.`,
      inputHint: 'Bei Unbeschränktheit: "unbeschränkt".',
      explanation: ['Das LP ist unbeschränkt: im Simplex-Schritt existiert eine Spalte mit positiven reduzierten Kosten, aber kein positiver Eintrag in der rechten Seite – die Zielfunktion lässt sich beliebig vergrößern.'],
    };
  }
  if (result.status === 'unsolvable') {
    return {
      type: 'dsal_opt_simplex',
      mathQuery: `\\max\\ ${targetStr}\\ \\text{ s.t. }\\ ${consStr},\\ x_i \\geq 0.`,
      answer: 'unlösbar',
      prompt: `Lösen Sie das lineare Programm (Simplex) und geben Sie die optimale Belegung und den Zielfunktionswert an, oder begründen Sie, warum es keine optimale Lösung gibt.`,
      inputHint: 'Bei Unlösbarkeit: "unlösbar".',
      explanation: ['Das LP ist unlösbar (die Nebenbedingungen sind inkonsistent, es existiert keine zulässige Lösung).'],
    };
  }

  const assignStr = result.x.map((val, idx) => `x_{${idx + 1}}^* = ${val.toString()}`).join(',\\ ');
  return {
    type: 'dsal_opt_simplex',
    mathQuery: `\\max\\ ${targetStr}\\ \\text{ s.t. }\\ ${consStr},\\ x_i \\geq 0.`,
    answer: `${result.x.map((val, idx) => `x${idx + 1}* = ${val.toString()}`).join(', ')}, z = ${result.z.toString()}`,
    prompt: `Lösen Sie das lineare Programm mit dem Simplex-Algorithmus: Maximiere ${targetStr} unter den Nebenbedingungen ${consStr} (und $x_i \\geq 0$). Geben Sie die optimale Belegung und den Zielfunktionswert an.`,
    inputHint: 'Format: "x1* = a, x2* = b, z = c" (Brüche als "p/q").',
    explanation: [
      `Wir stellen das LP als Tableau auf: die Nebenbedingungen mit Schlupfvariablen und die Zielfunktion als Zeile der reduzierten Kosten. Pro Iteration wenden wir Gauss-Jordan-Elimination an, um eine Basisvariable gegen eine Nichtbasisvariable auszutauschen.`,
      `Pivot-Regel: Die Eingangsvariable ist die Spalte mit den größten positiven reduzierten Kosten; die Ausgangsvariable bestimmt man per Minimum-Quotienten-Test (kleinstes $b_i/a_{ij}$ mit $a_{ij}>0$ in dieser Spalte). Ist keine positive reduzierte Kosten mehr vorhanden, ist $x^*$ optimal und $z$ ist der Zielfunktionswert.`,
      `Optimale Belegung: $${assignStr}$, optimaler Zielfunktionswert: $z = ${result.z.toString()}$.`,
    ],
  };
}
