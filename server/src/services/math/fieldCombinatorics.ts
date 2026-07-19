import { TaskData } from './types';

/**
 * Category 5 — "Kombinatorik über endlichen Körpern & Matrizenräumen".
 *
 * Generators for counting problems over the finite field F_q and the matrix
 * space V = F_q^{m x n}. Conventions mirror `glCardinality.ts`:
 *   - `answer` is an explicit integer (string).
 *   - `explanation` is a list of LaTeX steps.
 *   - Small parameters (q in {2,3}, m,n <= 4, r <= m) keep numbers handhabbar.
 *   - Math.random is used; every task is always solvable.
 */

/**
 * Gaussian (q-binomial) coefficient [n choose r]_q as an exact integer:
 *   [n choose r]_q = ∏_{i=0}^{r-1} (q^{n-i} - 1) / (q^{r-i} - 1)
 * This is always an integer for integer q >= 2.
 */
function gaussianBinomial(n: number, r: number, q: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  let num = 1;
  let den = 1;
  for (let i = 0; i < r; i++) {
    num *= Math.pow(q, n - i) - 1;
    den *= Math.pow(q, r - i) - 1;
  }
  // Exact integer division (ratio is guaranteed integral for these sizes).
  return Math.round(num / den);
}

/**
 * Size of the matrix vector space V = F_q^{m x n}.
 *   |V| = q^{m * n}
 */
export function generateVectorSpaceSize(): TaskData {
  const fields = [2, 3];
  const q = fields[Math.floor(Math.random() * fields.length)];
  const dims = [1, 2, 3, 4];
  const m = dims[Math.floor(Math.random() * dims.length)];
  const n = dims[Math.floor(Math.random() * dims.length)];

  const size = Math.pow(q, m * n);

  const mathQuery = `\\left|\\mathbb{F}_{${q}}^{${m}\\times ${n}}\\right|`;

  const explanation = [
    `Der Raum $\\mathbb{F}_{${q}}^{${m}\\times ${n}}$ besteht aus allen ${m}\\times ${n}$-Matrizen über dem Körper $\\mathbb{F}_{${q}}$.`,
    `Jeder der $m\\cdot n = ${m * n}$ Matrixeinträge kann unabhängig einen von ${q} Werten aus $\\mathbb{F}_{${q}}$ annehmen.`,
    `Daher gilt:`,
    `$$\\left|\\mathbb{F}_{${q}}^{${m}\\times ${n}}\\right| = q^{m\\cdot n} = ${q}^{${m * n}} = ${size}$$`
  ];

  return {
    type: 'calc_field_vecspace_size',
    mathQuery,
    answer: String(size),
    explanation,
    prompt: 'Wie viele Elemente hat dieser Vektorraum?',
    inputHint: 'Gib das Ergebnis als ganze Zahl ein.'
  };
}

/**
 * Number of symmetric n x n matrices over F_q (only defined for m = n).
 *   #symmetric = q^{n(n+1)/2}
 * A symmetric matrix is fixed by its entries on and above the diagonal:
 * n diagonal + n(n-1)/2 off-diagonal = n(n+1)/2 free entries.
 */
export function generateSymmetricMatrixCount(): TaskData {
  const fields = [2, 3];
  const q = fields[Math.floor(Math.random() * fields.length)];
  const dims = [1, 2, 3, 4];
  const n = dims[Math.floor(Math.random() * dims.length)];

  const freeEntries = (n * (n + 1)) / 2;
  const count = Math.pow(q, freeEntries);

  const mathQuery = `\\#\\{\\ A \\in \\mathbb{F}_{${q}}^{${n}\\times ${n}} \\mid A^{T} = A\\ \\}`;

  const explanation = [
    `Gesucht ist die Anzahl der symmetrischen $n\\times n$-Matrizen über $\\mathbb{F}_{${q}}$ (hier $n=${n}$).`,
    `Eine symmetrische Matrix ist durch ihre Einträge auf und oberhalb der Hauptdiagonale eindeutig festgelegt.`,
    `Frei wählbar sind $n$ Diagonaleinträge plus $\\frac{n(n-1)}{2}$ Einträge oberhalb der Diagonale, also insgesamt $n + \\frac{n(n-1)}{2} = \\frac{n(n+1)}{2} = \\frac{${n}(${n}+1)}{2} = ${freeEntries}$ Einträge.`,
    `Jeder dieser ${freeEntries} Einträge hat ${q} Möglichkeiten, daher:`,
    `$$\\#\\{\\text{symmetrisch}\\} = q^{\\frac{n(n+1)}{2}} = ${q}^{${freeEntries}} = ${count}$$`
  ];

  return {
    type: 'calc_field_symmetric_count',
    mathQuery,
    answer: String(count),
    explanation,
    prompt: 'Wie viele symmetrische Matrizen gibt es?',
    inputHint: 'Gib das Ergebnis als ganze Zahl ein.'
  };
}

/**
 * Number of m x n matrices over F_q in reduced row echelon form (RREF) with
 * rank exactly r.
 *
 * CORRECT FORMULA:  #RREF(rank r) = [n choose r]_q  (Gaussian binomial),
 * independent of m (as long as m >= r).
 *
 * Reason: each RREF matrix of rank r has exactly r non-zero rows spanning an
 * r-dimensional subspace of F_q^n, and every r-dimensional subspace of F_q^n
 * has exactly ONE RREF basis representation (the remaining m-r rows are zero
 * rows). Hence the count equals the number of r-dimensional subspaces of F_q^n.
 *
 * NOTE: The originally suggested formula q^{r(m-r)} * [m choose r]_q is NOT the
 * count of RREF matrices; it is implemented here as the correct [n choose r]_q.
 */
export function generateRREFRankCount(): TaskData {
  const fields = [2, 3];
  const q = fields[Math.floor(Math.random() * fields.length)];
  const ns = [2, 3, 4];
  const n = ns[Math.floor(Math.random() * ns.length)];

  const rs: number[] = [];
  for (let r = 1; r <= n; r++) rs.push(r);
  const r = rs[Math.floor(Math.random() * rs.length)];

  // m only needs to satisfy m >= r; keep it small (<= 4).
  const ms: number[] = [];
  for (let m = r; m <= 4; m++) ms.push(m);
  const m = ms[Math.floor(Math.random() * ms.length)];

  const count = gaussianBinomial(n, r, q);

  const mathQuery = `\\#\\{\\ A \\in \\mathbb{F}_{${q}}^{${m}\\times ${n}} \\mid \\text{RREF},\\ \\operatorname{rank}(A)=${r}\\ \\}`;

  const explanation = [
    `Gesucht ist die Anzahl der $m\\times n$-Matrizen über $\\mathbb{F}_{${q}}$ in reduzierter Zeilenstufenform (RREF) mit Rang $r=${r}$ (hier $m=${m}$, $n=${n}$).`,
    `Jede RREF-Matrix vom Rang $r$ hat genau $r$ von Null verschiedene Zeilen; diese spannen einen $r$-dimensionalen Unterraum von $\\mathbb{F}_{${q}}^{n}$ auf.`,
    `Umgekehrt besitzt jeder $r$-dimensionale Unterraum von $\\mathbb{F}_{${q}}^{n}$ genau EINE RREF-Basisdarstellung (die übrigen $m-r$ Zeilen sind Nullzeilen).`,
    `Die gesuchte Anzahl ist also gleich der Anzahl der $r$-dimensionalen Unterräume von $\\mathbb{F}_{${q}}^{n}$ — dem Gaußschen Binomialkoeffizienten $\\binom{${n}}{${r}}_{q}$.`,
    `$$\\binom{${n}}{${r}}_{q} = \\prod_{i=0}^{${r - 1}} \\frac{q^{${n}-i}-1}{q^{${r}-i}-1} = ${count}$$`,
    `Hinweis: Das Ergebnis hängt nur von $n$ und $r$ ab, nicht von $m$ (solange $m\\ge r$).`
  ];

  return {
    type: 'calc_field_rref_rank_count',
    mathQuery,
    answer: String(count),
    explanation,
    prompt: 'Wie viele solche RREF-Matrizen gibt es?',
    inputHint: 'Gib das Ergebnis als ganze Zahl ein.'
  };
}
