import { TaskData } from './types';

/**
 * Generators for "Parametrisierte Matrizen & Gleichungssysteme über endlichen
 * Körpern" (Kategorie 1). All matrices are 3x3 over F_p (p in {3,5,7}) and
 * contain the parameter `a` in 1-2 entries. The determinant is computed as a
 * polynomial in `a` (reusing the Sarrus/cofactor approach from
 * paramDeterminant.ts), and Gauss elimination over F_p is used for rank,
 * kernel and solution-count tasks.
 *
 * Conventions mirror the existing generators:
 *  - matrices are rendered as LaTeX pmatrix,
 *  - polynomials in `a` use the same formatPoly layout (e.g. `2a^2+3a+1`),
 *  - `answer` is a canonical, checkable string.
 */

// ---------------------------------------------------------------------------
// Polynomial arithmetic over F_p (coefficients reduced mod p)
// ---------------------------------------------------------------------------

/** Polynomial in `a`: [c0, c1, c2, ...] = c0 + c1*a + c2*a^2 + ... */
type Poly = number[];

function trim(poly: Poly): Poly {
  let i = poly.length - 1;
  while (i > 0 && poly[i] === 0) i--;
  return poly.slice(0, i + 1);
}

function padd(a: Poly, b: Poly, p: number): Poly {
  const n = Math.max(a.length, b.length);
  const r = new Array(n).fill(0);
  for (let i = 0; i < n; i++) r[i] = (((a[i] || 0) + (b[i] || 0)) % p + p) % p;
  return trim(r);
}

function psub(a: Poly, b: Poly, p: number): Poly {
  return padd(a, b.map((c) => (p - c) % p), p);
}

function pmul(a: Poly, b: Poly, p: number): Poly {
  if (a.length === 0 || b.length === 0) return [];
  const r = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      r[i + j] = (r[i + j] + a[i] * b[j]) % p;
    }
  }
  return trim(r);
}

/** Determinant of a 3x3 matrix of polynomials over F_p (cofactor expansion). */
function det3Poly(M: Poly[][], p: number): Poly {
  const m = (r: number, c: number) => M[r][c];
  const term = (A: Poly, B: Poly, C: Poly, D: Poly) => psub(pmul(A, B, p), pmul(C, D, p), p);
  const minor00 = term(m(1, 1), m(2, 2), m(1, 2), m(2, 1));
  const minor01 = term(m(1, 0), m(2, 2), m(1, 2), m(2, 0));
  const minor02 = term(m(1, 0), m(2, 1), m(1, 1), m(2, 0));
  return psub(padd(pmul(m(0, 0), minor00, p), pmul(m(0, 2), minor02, p), p), pmul(m(0, 1), minor01, p), p);
}

/** Evaluate a polynomial at x (mod p). */
function evalPoly(poly: Poly, x: number, p: number): number {
  let r = 0;
  let xp = 1;
  for (let i = 0; i < poly.length; i++) {
    r = (r + poly[i] * xp) % p;
    xp = (xp * x) % p;
  }
  return ((r % p) + p) % p;
}

function formatPoly(poly: Poly): string {
  if (poly.length === 0 || poly.every((c) => c === 0)) return '0';
  const parts: string[] = [];
  for (let d = poly.length - 1; d >= 0; d--) {
    const c = poly[d];
    if (c === 0) continue;
    const abs = Math.abs(c);
    const termStr = d === 0 ? String(abs) : d === 1 ? (abs === 1 ? 'a' : `${abs}a`) : (abs === 1 ? `a^${d}` : `${abs}a^${d}`);
    parts.push((c < 0 ? '-' : (parts.length === 0 ? '' : '+')) + termStr);
  }
  return parts.join(' ');
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// Gauss elimination over F_p
// ---------------------------------------------------------------------------

/** Modular inverse via Fermat's little theorem (p prime). */
function modInverse(x: number, p: number): number {
  x = ((x % p) + p) % p;
  let r = 1;
  let base = x;
  let e = p - 2;
  while (e > 0) {
    if (e & 1) r = (r * base) % p;
    base = (base * base) % p;
    e = Math.floor(e / 2);
  }
  return r;
}

/** Reduced row echelon form of a matrix over F_p. */
function rref(A: number[][], p: number): number[][] {
  const M = A.map((row) => row.map((v) => ((v % p) + p) % p));
  const rows = M.length;
  const cols = M[0].length;
  let row = 0;
  for (let col = 0; col < cols && row < rows; col++) {
    let pivot = -1;
    for (let r = row; r < rows; r++) {
      if (M[r][col] !== 0) { pivot = r; break; }
    }
    if (pivot === -1) continue;
    [M[row], M[pivot]] = [M[pivot], M[row]];
    const inv = modInverse(M[row][col], p);
    for (let c = col; c < cols; c++) M[row][c] = (M[row][c] * inv) % p;
    for (let r = 0; r < rows; r++) {
      if (r !== row && M[r][col] !== 0) {
        const f = M[r][col];
        for (let c = col; c < cols; c++) {
          M[r][c] = ((M[r][c] - f * M[row][c]) % p + p) % p;
        }
      }
    }
    row++;
  }
  return M;
}

/** Rank of a matrix over F_p (number of non-zero rows in its RREF). */
function rankOf(A: number[][], p: number): number {
  const R = rref(A, p);
  let rank = 0;
  for (const row of R) {
    if (row.some((v) => v !== 0)) rank++;
  }
  return rank;
}

/** Basis of the kernel (null space) of A over F_p, as a list of column vectors. */
function kernelBasis(A: number[][], p: number): number[][] {
  const R = rref(A, p);
  const rows = R.length;
  const cols = R[0].length;
  const pivotCols: number[] = [];
  for (let r = 0; r < rows; r++) {
    let pc = -1;
    for (let c = 0; c < cols; c++) {
      if (R[r][c] !== 0) { pc = c; break; }
    }
    if (pc !== -1) pivotCols.push(pc);
  }
  const freeCols: number[] = [];
  for (let c = 0; c < cols; c++) {
    if (!pivotCols.includes(c)) freeCols.push(c);
  }
  const basis: number[][] = [];
  for (const fc of freeCols) {
    const vec = new Array(cols).fill(0);
    vec[fc] = 1;
    for (let r = 0; r < pivotCols.length; r++) {
      const pc = pivotCols[r];
      vec[pc] = ((-R[r][fc]) % p + p) % p;
    }
    basis.push(vec);
  }
  return basis;
}

// ---------------------------------------------------------------------------
// Shared matrix construction
// ---------------------------------------------------------------------------

/** Build a 3x3 matrix over F_p with 1-2 entries equal to the parameter `a`. */
function buildParamMatrix(p: number): { polyMat: Poly[][]; disp: string[][]; det: Poly } {
  const polyMat: Poly[][] = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => [randInt(0, p - 1)] as Poly)
  );
  const numVars = randInt(1, 2);
  const positions = new Set<number>();
  while (positions.size < numVars) positions.add(randInt(0, 8));
  for (const pos of positions) {
    polyMat[Math.floor(pos / 3)][pos % 3] = [0, 1]; // the variable `a`
  }
  const disp = polyMat.map((row) => row.map((entry) => (entry.length > 1 ? 'a' : String(entry[0]))));
  const det = det3Poly(polyMat, p);
  return { polyMat, disp, det };
}

/** Substitute a concrete value x for `a` in a polynomial matrix. */
function substitute(polyMat: Poly[][], x: number, p: number): number[][] {
  return polyMat.map((row) => row.map((poly) => evalPoly(poly, x, p)));
}

function matLatex(M: number[][]): string {
  const rows = M.map((r) => r.join(' & ')).join(' \\\\ ');
  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}

function vecLatex(v: number[]): string {
  return `[${v.join(',')}]`;
}

/** Sarrus expansion terms for the explanation, using the display matrix. */
function sarrusTerms(disp: string[][]) {
  const m = (r: number, c: number) => disp[r][c];
  const term = (a: string, b: string, c: string) => `${a}\\cdot ${b}\\cdot ${c}`;
  return {
    pos: [
      term(m(0, 0), m(1, 1), m(2, 2)),
      term(m(0, 1), m(1, 2), m(2, 0)),
      term(m(0, 2), m(1, 0), m(2, 1))
    ],
    neg: [
      term(m(0, 2), m(1, 1), m(2, 0)),
      term(m(0, 0), m(1, 2), m(2, 1)),
      term(m(0, 1), m(1, 0), m(2, 2))
    ]
  };
}

// ---------------------------------------------------------------------------
// Generator 1: Invertierbarkeit
// ---------------------------------------------------------------------------

/**
 * Für welche a ∈ F_p ist A_a NICHT invertierbar?
 * Bestimme die Nullstellen des Determinantenpolynoms in F_p, indem das
 * Polynom an allen a ∈ F_p ausgewertet wird.
 */
export function generateParamMatrixInvertible(): TaskData {
  const primes = [3, 5, 7];
  const p = primes[randInt(0, primes.length - 1)];

  let polyMat: Poly[][];
  let disp: string[][];
  let det: Poly;
  let roots: number[];
  let attempts = 0;
  do {
    attempts++;
    const built = buildParamMatrix(p);
    polyMat = built.polyMat;
    disp = built.disp;
    det = built.det;
    // Determinante muss von `a` abhängen (Grad >= 1) und 1-2 Nullstellen in F_p haben.
    roots = [];
    if (det.length > 1) {
      for (let a = 0; a < p; a++) {
        if (evalPoly(det, a, p) === 0) roots.push(a);
      }
    }
  } while ((roots.length < 1 || roots.length > 2) && attempts < 100);

  const latexRows = disp.map((row) => row.join(' & ')).join(' \\\\ ');
  const mathQuery = `A_a = \\begin{pmatrix} ${latexRows} \\end{pmatrix} \\quad \\text{über } \\mathbb{F}_{${p}}`;

  const { pos, neg } = sarrusTerms(disp);
  const evalLine = Array.from({ length: p }, (_, a) => `a=${a}:\\; \\det=${evalPoly(det, a, p)}`).join(',\\; ');
  const rootSet = `\\{${roots.join(',')}\\}`;

  const explanation = [
    `Wir bestimmen, für welche $a\\in\\mathbb{F}_{${p}}$ die Matrix $A_a$ nicht invertierbar ist. Das ist genau dann der Fall, wenn $\\det(A_a)=0$.`,
    `Mit der Regel von Sarrus (die Variable ist $a$):`,
    `$$\\det(A_a) = ${pos.join(' + ')} - \\left(${neg.join(' + ')}\\right) = ${formatPoly(det)}$$`,
    `Wir werten das Polynom an jeder Stelle $a\\in\\mathbb{F}_{${p}}$ aus:`,
    `$${evalLine}$`,
    `Die Nullstellen in $\\mathbb{F}_{${p}}$ sind $a\\in ${rootSet}$. Für genau diese Werte ist $A_a$ nicht invertierbar (die Determinante verschwindet).`
  ];

  return {
    type: 'calc_param_matrix_invertible',
    mathQuery,
    answer: `{${roots.join(',')}}`,
    explanation,
    prompt: `Für welche $a\\in\\mathbb{F}_{${p}}$ ist $A_a$ nicht invertierbar?`,
    inputHint: 'Menge der Werte, z.B. {1,3}.'
  };
}

// ---------------------------------------------------------------------------
// Generator 2: Rang (für ein konkret eingesetztes a)
// ---------------------------------------------------------------------------

/**
 * Für ein konkret eingesetztes a: wie groß ist der Rang von A_a?
 * (Gauß-Elimination über F_p. Ergänzt die Invertierbarkeits-Frage sinnvoll,
 * ohne redundant zu sein: hier wird der Rangwert an einem festen a abgefragt.)
 */
export function generateParamMatrixRank(): TaskData {
  const primes = [3, 5, 7];
  const p = primes[randInt(0, primes.length - 1)];

  const built = buildParamMatrix(p);
  const polyMat = built.polyMat;
  const disp = built.disp;
  const det = built.det;

  // Nullstellen des Determinantenpolynoms (für die Wahl von a).
  const roots: number[] = [];
  for (let a = 0; a < p; a++) {
    if (evalPoly(det, a, p) === 0) roots.push(a);
  }

  // Mit 50% Wahrscheinlichkeit eine singuläre Stelle wählen (rang < 3), sonst zufällig.
  let a0: number;
  if (roots.length > 0 && Math.random() < 0.5) {
    a0 = roots[randInt(0, roots.length - 1)];
  } else {
    a0 = randInt(0, p - 1);
  }

  const A = substitute(polyMat, a0, p);
  const rank = rankOf(A, p);

  const latexRows = disp.map((row) => row.join(' & ')).join(' \\\\ ');
  const mathQuery = `A_a = \\begin{pmatrix} ${latexRows} \\end{pmatrix} \\quad \\text{über } \\mathbb{F}_{${p}}, \\qquad a = ${a0}`;

  const R = rref(A, p);
  const explanation = [
    `Wir setzen $a=${a0}$ in $A_a$ ein und erhalten die konstante Matrix über $\\mathbb{F}_{${p}}$:`,
    `$$A_{${a0}} = ${matLatex(A)}$$`,
    `Durch Gauß-Elimination (Reduktion auf Zeilenstufenform über $\\mathbb{F}_{${p}}$) erhalten wir:`,
    `$$\\operatorname{RREF} = ${matLatex(R)}$$`,
    `Die Anzahl der Pivot-Zeilen ist der Rang. Es gibt ${rank} linear unabhängige Zeilen, also $\\operatorname{Rang}(A_{${a0}}) = ${rank}$.`
  ];

  return {
    type: 'calc_param_matrix_rank',
    mathQuery,
    answer: String(rank),
    explanation,
    prompt: `Wie groß ist $\\operatorname{Rang}(A_a)$ für $a=${a0}$?`,
    inputHint: 'Gib den Rang als ganze Zahl ein.'
  };
}

// ---------------------------------------------------------------------------
// Generator 3: Kern / Lösungsraum (homogen, für konkretes a)
// ---------------------------------------------------------------------------

/**
 * Basis des Kerns von A_a (homogen, A_a·v = 0) für ein konkretes a.
 * Gauß-Elimination über F_p; die freien Variablen liefern die Kern-Basis.
 */
export function generateParamMatrixKernel(): TaskData {
  const primes = [3, 5, 7];
  const p = primes[randInt(0, primes.length - 1)];

  let polyMat: Poly[][] = [];
  let disp: string[][] = [];
  let det: Poly = [];
  let a0 = 0;
  let basis: number[][] = [];
  let attempts = 0;
  do {
    attempts++;
    const built = buildParamMatrix(p);
    polyMat = built.polyMat;
    disp = built.disp;
    det = built.det;
    // Wir wollen eine singuläre Stelle (det = 0), damit der Kern nichttrivial ist.
    const roots: number[] = [];
    for (let a = 0; a < p; a++) {
      if (evalPoly(det, a, p) === 0) roots.push(a);
    }
    if (roots.length === 0) continue;
    a0 = roots[randInt(0, roots.length - 1)];
    const A = substitute(polyMat, a0, p);
    basis = kernelBasis(A, p);
  } while ((basis.length < 1) && attempts < 100);

  const A = substitute(polyMat, a0, p);
  const latexRows = disp.map((row) => row.join(' & ')).join(' \\\\ ');
  const mathQuery = `A_a = \\begin{pmatrix} ${latexRows} \\end{pmatrix} \\quad \\text{über } \\mathbb{F}_{${p}}, \\qquad a = ${a0}`;

  const R = rref(A, p);
  const basisStr = basis.map(vecLatex).join('|');
  const explanation = [
    `Wir setzen $a=${a0}$ ein (eine singuläre Stelle, $\\det=0$) und lösen das homogene System $A_{${a0}}\\cdot v = 0$:`,
    `$$A_{${a0}} = ${matLatex(A)}$$`,
    `Gauß-Elimination über $\\mathbb{F}_{${p}}$ liefert die reduzierte Zeilenstufenform:`,
    `$$\\operatorname{RREF} = ${matLatex(R)}$$`,
    `Die freien Variablen ergeben die Basisvektoren des Kerns. Eine Basis des Kerns ist:`,
    `$$\\ker(A_{${a0}}) = \\operatorname{span}\\left\\{ ${basis.map(vecLatex).join(',\\; ')} \\right\\}$$`,
    `Der Kern hat Dimension ${basis.length}.`
  ];

  return {
    type: 'calc_param_matrix_kernel',
    mathQuery,
    answer: basisStr,
    explanation,
    prompt: `Gib eine Basis des Kerns von $A_a$ für $a=${a0}$ an (Vektoren durch | getrennt).`,
    inputHint: 'z.B. [1,0,1]|[0,1,2].'
  };
}

// ---------------------------------------------------------------------------
// Generator 4: Lösungsanzahl (A_a·v = b für konkretes a)
// ---------------------------------------------------------------------------

/**
 * Wie viele Lösungen hat A_a·v = b für ein konkretes a?
 * (0, 1, oder p^k — über Lösbarkeit + Freiheitsgrade. b wird so gewählt, dass
 * das System konsistent ist, also immer lösbar.)
 */
export function generateParamMatrixSolutionCount(): TaskData {
  const primes = [3, 5, 7];
  const p = primes[randInt(0, primes.length - 1)];

  const built = buildParamMatrix(p);
  const polyMat = built.polyMat;
  const disp = built.disp;
  const det = built.det;

  const roots: number[] = [];
  for (let a = 0; a < p; a++) {
    if (evalPoly(det, a, p) === 0) roots.push(a);
  }

  // a wählen: mit 50% eine singuläre Stelle (mehr als 1 Lösung), sonst zufällig.
  let a0: number;
  if (roots.length > 0 && Math.random() < 0.5) {
    a0 = roots[randInt(0, roots.length - 1)];
  } else {
    a0 = randInt(0, p - 1);
  }

  const A = substitute(polyMat, a0, p);

  // b so wählen, dass das System konsistent ist: b = A·v0 für ein zufälliges v0.
  const v0 = Array.from({ length: 3 }, () => randInt(0, p - 1));
  const b = A.map((row) => {
    let s = 0;
    for (let i = 0; i < 3; i++) s = (s + row[i] * v0[i]) % p;
    return ((s % p) + p) % p;
  });

  const rank = rankOf(A, p);
  const free = 3 - rank; // Anzahl Freiheitsgrade
  const numSolutions = Math.pow(p, free); // konsistent ⇒ p^free Lösungen

  const latexRows = disp.map((row) => row.join(' & ')).join(' \\\\ ');
  const mathQuery =
    `A_a = \\begin{pmatrix} ${latexRows} \\end{pmatrix}, \\; b = \\begin{pmatrix} ${b.join(' \\\\ ')} \\end{pmatrix} \\quad \\text{über } \\mathbb{F}_{${p}}, \\qquad a = ${a0}`;

  const R = rref(A.map((row, i) => [...row, b[i]]), p);
  const explanation = [
    `Wir setzen $a=${a0}$ ein:`,
    `$$A_{${a0}} = ${matLatex(A)}, \\qquad b = \\begin{pmatrix} ${b.join(' \\\\ ')} \\end{pmatrix}$$`,
    `Die erweiterte Matrix $[A_{${a0}}\\mid b]$ wird über $\\mathbb{F}_{${p}}$ auf Zeilenstufenform gebracht:`,
    `$$\\left[A_{${a0}}\\mid b\\right] \\xrightarrow{\\text{Gauß}} ${matLatex(R)}$$`,
    `Das System ist konsistent (keine Zeile der Form $[0\\;0\\;0\\mid c]$ mit $c\\neq 0$). Der Rang von $A_{${a0}}$ ist ${rank}.`,
    `Es gibt ${free} freie Variable(n). Da wir über $\\mathbb{F}_{${p}}$ arbeiten, liefert jede freie Variable $p=${p}$ Möglichkeiten.`,
    `Anzahl der Lösungen: $p^{${free}} = ${p}^{${free}} = ${numSolutions}$.`
  ];

  return {
    type: 'calc_param_matrix_solution_count',
    mathQuery,
    answer: String(numSolutions),
    explanation,
    prompt: `Wie viele Lösungen hat $A_a\\cdot v = b$ für $a=${a0}$?`,
    inputHint: 'Gib die Anzahl als ganze Zahl ein (0, 1, oder p^k).'
  };
}
