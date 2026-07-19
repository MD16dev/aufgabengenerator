import { TaskData } from './types';

/* ------------------------------------------------------------------ *
 * Shared helpers (mirror eigenbasis.ts conventions)                   *
 * ------------------------------------------------------------------ */

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Determinant of a 3x3 integer matrix. */
function det3(M: number[][]): number {
  const [[a, b, c], [d, e, f], [g, h, i]] = M;
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

/** Multiply 3x3 integer matrices. */
function matMul(A: number[][], B: number[][]): number[][] {
  const r: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++) r[i][j] += A[i][k] * B[k][j];
  return r;
}

/** Invert a 3x3 integer matrix with determinant ±1 (exact integer inverse). */
function matInvInt(M: number[][]): number[][] {
  const [[a, b, c], [d, e, f], [g, h, i]] = M;
  const det = det3(M); // ±1
  const co = [
    [e * i - f * h, -(d * i - f * g), d * h - e * g],
    [-(b * i - c * h), a * i - c * g, -(a * h - b * g)],
    [b * f - c * e, -(a * f - c * d), a * e - b * d]
  ];
  const inv: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) inv[i][j] = co[j][i] * det; // det = ±1
  return inv;
}

/** Normalize a vector so its first non-zero entry is 1. */
function normalize(v: number[]): number[] {
  const firstNonZero = v.find((x) => x !== 0);
  if (firstNonZero === undefined) return v;
  return v.map((x) => x / firstNonZero);
}

/** Exact rational number as numerator/denominator (kept reduced). */
interface Frac {
  n: number;
  d: number;
}

function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function fSimplify(f: Frac): Frac {
  if (f.n === 0) return { n: 0, d: 1 };
  const g = Math.sign(f.d) * gcd(Math.abs(f.n), Math.abs(f.d));
  return { n: f.n / g, d: f.d / g };
}

function fAdd(a: Frac, b: Frac): Frac {
  return fSimplify({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
}

function fMul(a: Frac, b: Frac): Frac {
  return fSimplify({ n: a.n * b.n, d: a.d * b.d });
}

function fNeg(a: Frac): Frac {
  return { n: -a.n, d: a.d };
}

function fFromInt(x: number): Frac {
  return { n: x, d: 1 };
}

function fToLatex(f: Frac): string {
  if (f.d === 1) return String(f.n);
  return `${f.n}/${f.d}`;
}

/** Render a 3x3 matrix of fractions as a pmatrix. */
function fracMatToLatex(M: Frac[][]): string {
  const rows = M.map((row) => row.map(fToLatex).join(' & ')).join(' \\\\ ');
  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}

/** Render a 3x3 integer matrix as a pmatrix. */
function intMatToLatex(M: number[][]): string {
  const rows = M.map((row) => row.join(' & ')).join(' \\\\ ');
  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}

/** Render a 3x3 integer matrix in the canonical `[...;...]` answer format. */
function intMatToAnswer(M: number[][]): string {
  return M.map((row) => `[${row.join(',')}]`).join(';');
}

/**
 * Gaussian elimination over Q on a 3x3 matrix. Returns the row-echelon form
 * and a list of human-readable step descriptions (LaTeX).
 */
function gaussEchelon(M: Frac[][]): { echelon: Frac[][]; steps: string[] } {
  const A = M.map((r) => r.slice());
  const steps: string[] = [];
  let lead = 0;
  const rows = 3;
  const cols = 3;

  for (let r = 0; r < rows && lead < cols; lead++) {
    let pivot = -1;
    for (let i = r; i < rows; i++) {
      if (A[i][lead].n !== 0) { pivot = i; break; }
    }
    if (pivot === -1) continue;

    if (pivot !== r) {
      [A[r], A[pivot]] = [A[pivot], A[r]];
      steps.push('Tausche Zeile ' + (r + 1) + ' und Zeile ' + (pivot + 1) + ': $$' + fracMatToLatex(A) + '$$');
    }

    const pv = A[r][lead];
    if (pv.n !== 0 && !(pv.n === 1 && pv.d === 1)) {
      for (let c = 0; c < cols; c++) A[r][c] = fMul(A[r][c], { n: pv.d, d: pv.n });
      steps.push('Teile Zeile ' + (r + 1) + ' durch ' + fToLatex(pv) + ': $$' + fracMatToLatex(A) + '$$');
    }

    for (let i = r + 1; i < rows; i++) {
      const factor = A[i][lead];
      if (factor.n === 0) continue;
      for (let c = 0; c < cols; c++) {
        A[i][c] = fAdd(A[i][c], fMul(fNeg(factor), A[r][c]));
      }
      steps.push('$\\text{Zeile } ' + (i + 1) + ' \\leftarrow \\text{Zeile } ' + (i + 1) + ' - (' + fToLatex(factor) + ')\\cdot \\text{Zeile } ' + (r + 1) + '$: $$' + fracMatToLatex(A) + '$$');
    }
    lead++;
    r++;
  }

  return { echelon: A, steps };
}

/**
 * Reads the nullspace vector (1-dimensional) off a 3x3 row-echelon form.
 * Returns the vector with the free variable set so the first non-zero entry is 1.
 */
function nullspaceFromEchelon(E: Frac[][]): number[] {
  const pivots: number[] = [];
  for (let r = 0; r < 3; r++) {
    const pc = E[r].findIndex((x) => x.n !== 0);
    if (pc !== -1) pivots.push(pc);
  }
  const freeCol = [0, 1, 2].find((c) => !pivots.includes(c)) ?? 0;

  const x = [0, 0, 0];
  x[freeCol] = 1;
  for (let r = 2; r >= 0; r--) {
    const pc = E[r].findIndex((v) => v.n !== 0);
    if (pc === -1 || pc === freeCol) continue;
    let sum: Frac = { n: 0, d: 1 };
    for (let c = pc + 1; c < 3; c++) sum = fAdd(sum, fMul(E[r][c], fFromInt(x[c])));
    const xpc = fAdd(fNeg(sum), { n: 0, d: 1 });
    x[pc] = xpc.n / xpc.d / (E[r][pc].n / E[r][pc].d);
  }

  const firstNonZero = x.find((v) => v !== 0)!;
  return x.map((v) => v / firstNonZero);
}

/**
 * Build a 3x3 rational matrix A backwards as A = T·D·T^{-1} with integer T
 * (det ±1) and diagonal D of eigenvalues. Guarantees exact, "rechenfreundliche"
 * integer entries in A and known eigenspaces (columns of T).
 *
 * `distinct` forces three distinct eigenvalues; otherwise repeats are allowed
 * (so we can also test non-diagonalizable / repeated-eigenvalue cases).
 */
function buildMatrix(opts: { distinct: boolean }): {
  A: number[][];
  T: number[][];
  Tinv: number[][];
  eigenvalues: number[];
} {
  const candidates: number[][][] = [
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    [[1, 1, 0], [0, 1, 1], [0, 0, 1]],
    [[1, 0, 0], [1, 1, 0], [0, 1, 1]],
    [[1, 1, 1], [0, 1, 1], [0, 0, 1]],
    [[1, 0, 1], [0, 1, 0], [1, 0, 2]],
    [[1, 0, -1], [0, 1, 1], [1, 0, 0]],
    [[1, 1, 0], [0, 1, 1], [-1, 0, 0]]
  ];

  for (let attempts = 0; attempts < 200; attempts++) {
    const pool = [-3, -2, -1, 0, 1, 2, 3, 4, 5];
    const eigenvalues: number[] = [];
    while (eigenvalues.length < 3) {
      const v = pool[randInt(0, pool.length - 1)];
      if (opts.distinct) {
        if (!eigenvalues.includes(v)) eigenvalues.push(v);
      } else {
        eigenvalues.push(v);
      }
    }
    eigenvalues.sort((a, b) => a - b);

    const T = candidates[randInt(0, candidates.length - 1)];
    const det = det3(T);
    if (det !== 1 && det !== -1) continue;
    const Tinv = matInvInt(T);

    const D = [
      [eigenvalues[0], 0, 0],
      [0, eigenvalues[1], 0],
      [0, 0, eigenvalues[2]]
    ];
    const A = matMul(matMul(T, D), Tinv);
    if (A.some((row) => row.some((x) => !Number.isInteger(x)))) continue;

    return { A, T, Tinv, eigenvalues };
  }

  // Fallback (extremely unlikely): identity-like matrix.
  return {
    A: [[2, 0, 0], [0, 3, 0], [0, 0, 3]],
    T: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    Tinv: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    eigenvalues: [2, 3, 3]
  };
}

/** Format an integer polynomial [c0,c1,c2,c3] (c0 + c1 X + ...) in X, descending. */
function formatPoly(poly: number[]): string {
  if (poly.length === 0 || poly.every((c) => c === 0)) return '0';
  const parts: string[] = [];
  for (let d = poly.length - 1; d >= 0; d--) {
    const c = poly[d];
    if (c === 0) continue;
    const abs = Math.abs(c);
    const termStr =
      d === 0 ? String(abs) : d === 1 ? (abs === 1 ? 'X' : `${abs}X`) : (abs === 1 ? `X^${d}` : `${abs}X^${d}`);
    parts.push((c < 0 ? '-' : (parts.length === 0 ? '' : '+')) + termStr);
  }
  return parts.join(' ');
}

/** Format a single linear factor (X - λ). */
function formatFactor(lambda: number): string {
  if (lambda >= 0) return `(X-${lambda})`;
  return `(X+${-lambda})`;
}

/* ------------------------------------------------------------------ *
 * 1) Charakteristisches Polynom (ausmultipliziert)                     *
 * ------------------------------------------------------------------ */

export function generateCharPolyExpanded(): TaskData {
  const { A, eigenvalues } = buildMatrix({ distinct: true });
  const [l1, l2, l3] = eigenvalues;
  // chi_A = X^3 - (sum) X^2 + (sumPairwise) X - (product)
  const a = l1 + l2 + l3;
  const b = l1 * l2 + l1 * l3 + l2 * l3;
  const c = l1 * l2 * l3;
  const poly = [-c, b, -a, 1]; // c0 + c1 X + c2 X^2 + c3 X^3
  const answer = formatPoly(poly);

  const mathQuery = `A = ${intMatToLatex(A)}`;

  const explanation = [
    `Wir berechnen $\\chi_A(X) = \\det(X I - A)$. Mit der Spur- und Determinanten-Formel für $3\\times 3$-Matrizen gilt`,
    `$$\\chi_A(X) = X^3 - \\operatorname{tr}(A)\\,X^2 + \\left(\\sum_{i<j}\\lambda_i\\lambda_j\\right)X - \\det(A).$$`,
    `Hier ist $\\operatorname{tr}(A) = ${a}$, $\\sum_{i<j}\\lambda_i\\lambda_j = ${b}$ und $\\det(A) = ${c}$.`,
    `Einsetzen liefert: $${answer}$$`,
    `Probe: Die Nullstellen dieses Polynoms sind die Eigenwerte $\\lambda_1=${l1},\\;\\lambda_2=${l2},\\;\\lambda_3=${l3}$.`
  ];

  return {
    type: 'calc_charpoly_expanded',
    mathQuery,
    answer,
    explanation,
    prompt: `Bestimme das charakteristische Polynom $\\chi_A(X)=\\det(XI-A)$ von $A$ in der Form $X^3 - aX^2 + bX - c$ (ausmultipliziert, absteigend nach $X$ geordnet).`,
    inputHint: 'Polynom in X, z.B. X^3-6X^2+11X-6'
  };
}

/* ------------------------------------------------------------------ *
 * 2) Charakteristisches Polynom (faktorisiert)                        *
 * ------------------------------------------------------------------ */

export function generateCharPolyFactored(): TaskData {
  const { A, eigenvalues } = buildMatrix({ distinct: true });
  const [l1, l2, l3] = eigenvalues;
  const answer = `${formatFactor(l1)}${formatFactor(l2)}${formatFactor(l3)}`;

  const mathQuery = `A = ${intMatToLatex(A)}`;

  const explanation = [
    `Die Eigenwerte von $A$ sind $\\lambda_1=${l1},\\;\\lambda_2=${l2},\\;\\lambda_3=${l3}$ (alle rational, da $A$ rückwärts aus ganzzahligen Eigenwerten gebaut wurde).`,
    `Das charakteristische Polynom zerfällt daher vollständig in Linearfaktoren:`,
    `$$\\chi_A(X) = (X-\\lambda_1)(X-\\lambda_2)(X-\\lambda_3) = ${answer}.$$`,
    `Ausmultipliziert ergibt sich $X^3 - ${l1 + l2 + l3}X^2 + ${l1 * l2 + l1 * l3 + l2 * l3}X - ${l1 * l2 * l3}$.`
  ];

  return {
    type: 'calc_charpoly_factored',
    mathQuery,
    answer,
    explanation,
    prompt: `Gib das charakteristische Polynom $\\chi_A(X)$ von $A$ in Linearfaktoren an (z.B. $(X-1)(X-2)(X-3)$).`,
    inputHint: 'Produkt von Linearfaktoren, z.B. (X-1)(X-2)(X-3)'
  };
}

/* ------------------------------------------------------------------ *
 * 3) Eigenwerte & algebraische Vielfachheiten                         *
 * ------------------------------------------------------------------ */

export function generateEigenvalues(): TaskData {
  // Allow repeated eigenvalues so algebraic multiplicities > 1 occur.
  const { A, eigenvalues } = buildMatrix({ distinct: false });

  // Count algebraic multiplicities (eigenvalues are sorted).
  const mult = new Map<number, number>();
  for (const l of eigenvalues) mult.set(l, (mult.get(l) ?? 0) + 1);
  const distinct = [...mult.keys()].sort((x, y) => x - y);
  const answer = distinct.map((l) => `${l} (${mult.get(l)})`).join(', ');

  const mathQuery = `A = ${intMatToLatex(A)}`;

  const explanation = [
    `Wir lesen die Eigenwerte direkt an der Diagonalisierung $A = T D T^{-1}$ ab: die Diagonaleinträge von $D$ sind die Eigenwerte.`,
    `Gefundene Eigenwerte (mit algebraischer Vielfachheit): ` +
      distinct.map((l) => `$\\lambda=${l}$ mit alg. Vielfachheit ${mult.get(l)}`).join(', '),
    `Das charakteristische Polynom ist $\\chi_A(X) = ${distinct.map((l) => formatFactor(l)).join('')}$ (jeder Linearfaktor tritt so oft auf wie die algebraische Vielfachheit).`
  ];

  return {
    type: 'calc_eigenvalues',
    mathQuery,
    answer,
    explanation,
    prompt: `Bestimme alle Eigenwerte von $A$ zusammen mit ihrer algebraischen Vielfachheit (Format: "λ (m)", durch Komma getrennt, z.B. 2 (1), 3 (2)).`,
    inputHint: 'λ (Vielfachheit), z.B. 1 (2), 2 (1)'
  };
}

/* ------------------------------------------------------------------ *
 * 4) Eigenräume (Basis zum kleinsten / größten Eigenwert)             *
 * ------------------------------------------------------------------ */

export function generateEigenspace(): TaskData {
  const { A, T, eigenvalues } = buildMatrix({ distinct: true });
  const smallest = eigenvalues[0];
  const largest = eigenvalues[2];

  // Eigenspace of lambda_k = span of columns of T whose eigenvalue equals lambda_k.
  const colOf = (lambda: number): number[] => {
    const colIdx = eigenvalues.indexOf(lambda);
    return T.map((row) => row[colIdx]);
  };

  // Randomly ask for smallest or largest eigenspace.
  const useLargest = Math.random() < 0.5;
  const target = useLargest ? largest : smallest;
  const rawVec = colOf(target);
  const basis = normalize(rawVec);
  const answer = `(${basis.join(',')})`;

  const mathQuery = `A = ${intMatToLatex(A)}`;

  const AminusLambda: Frac[][] = A.map((row, i) =>
    row.map((val, j) => fFromInt(i === j ? val - target : val))
  );
  const { echelon, steps } = gaussEchelon(AminusLambda);
  const nullVec = nullspaceFromEchelon(echelon);
  const nullVecNorm = (() => {
    const f = nullVec.find((v) => v !== 0)!;
    return nullVec.map((v) => v / f);
  })();

  const explanation: string[] = [
    `Gesucht ist der Eigenraum zum ${useLargest ? 'größten' : 'kleinsten'} Eigenwert $\\lambda=${target}$. Wir lösen $(A - \\lambda I)\\,x = 0$.`,
    `$$A - ${target}\\,I = ${fracMatToLatex(AminusLambda)}$$`
  ];
  if (steps.length > 0) {
    explanation.push(`Mit dem Gauß-Algorithmus bringen wir die Matrix auf Zeilenstufenform:`);
    explanation.push(...steps);
  } else {
    explanation.push(`Die Matrix ist bereits in Zeilenstufenform.`);
  }
  explanation.push(
    `Aus der Zeilenstufenform lesen wir den Eigenvektor ab (freie Variable $=1$): $v = \\begin{pmatrix} ${nullVec.join(' \\\\ ')} \\end{pmatrix}$.`
  );
  explanation.push(
    `Normiert (erster Nicht-Null-Eintrag $=1$): $v \\mapsto \\begin{pmatrix} ${nullVecNorm.join(' \\\\ ')} \\end{pmatrix}$. Der Eigenraum wird von diesem Vektor aufgespannt.`
  );
  explanation.push(`Eine Basis des Eigenraums ist: $\\left\\{ \\begin{pmatrix} ${nullVecNorm.join(' \\\\ ')} \\end{pmatrix} \\right\\}$.`);

  return {
    type: 'calc_eigenspace',
    mathQuery,
    answer,
    explanation,
    prompt: `Bestimme eine Basis des Eigenraums zum ${useLargest ? 'größten' : 'kleinsten'} Eigenwert $\\lambda=${target}$ von $A$ (erster Nicht-Null-Eintrag = 1).`,
    inputHint: 'Vektor in Klammern, z.B. (1,2,0)'
  };
}

function buildNonDiagonalizableMatrix(): {
  A: number[][];
  T: number[][];
  Tinv: number[][];
  eigenvalues: number[];
} {
  const candidates: number[][][] = [
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    [[1, 1, 0], [0, 1, 1], [0, 0, 1]],
    [[1, 0, 0], [1, 1, 0], [0, 1, 1]],
    [[1, 1, 1], [0, 1, 1], [0, 0, 1]],
    [[1, 0, 1], [0, 1, 0], [1, 0, 2]],
    [[1, 0, -1], [0, 1, 1], [1, 0, 0]],
    [[1, 1, 0], [0, 1, 1], [-1, 0, 0]]
  ];

  for (let attempts = 0; attempts < 200; attempts++) {
    const pool = [-2, -1, 1, 2, 3, 4];
    const lambda = pool[randInt(0, pool.length - 1)];
    let mu = pool[randInt(0, pool.length - 1)];
    while (mu === lambda) {
      mu = pool[randInt(0, pool.length - 1)];
    }

    const T = candidates[randInt(0, candidates.length - 1)];
    const det = det3(T);
    if (det !== 1 && det !== -1) continue;
    const Tinv = matInvInt(T);

    const J = [
      [lambda, 1, 0],
      [0, lambda, 0],
      [0, 0, mu]
    ];
    const A = matMul(matMul(T, J), Tinv);
    if (A.some((row) => row.some((x) => !Number.isInteger(x)))) continue;

    return { A, T, Tinv, eigenvalues: [lambda, lambda, mu] };
  }

  return {
    A: [[2, 1, 0], [0, 2, 0], [0, 0, 3]],
    T: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    Tinv: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    eigenvalues: [2, 2, 3]
  };
}

/* ------------------------------------------------------------------ *
 * 5) Diagonalisierbarkeit (ja/nein + T, D)                            *
 * ------------------------------------------------------------------ */

export function generateDiagonalizable(): TaskData {
  const isDiag = Math.random() < 0.5;

  if (isDiag) {
    // Build with distinct eigenvalues -> always diagonalizable (nice case).
    const { A, T, eigenvalues } = buildMatrix({ distinct: true });

    const D = [
      [eigenvalues[0], 0, 0],
      [0, eigenvalues[1], 0],
      [0, 0, eigenvalues[2]]
    ];

    const mathQuery = `A = ${intMatToLatex(A)}`;

    const explanation = [
      `Da $A$ drei paarweise verschiedene Eigenwerte $\\lambda_1=${eigenvalues[0]},\\;\\lambda_2=${eigenvalues[1]},\\;\\lambda_3=${eigenvalues[2]}$ besitzt, sind die zugehörigen Eigenräume je 1-dimensional und insgesamt linear unabhängig.`,
      `Somit ist $A$ diagonalisierbar: es gibt eine invertierbare Matrix $T$ aus Eigenvektoren und eine Diagonalmatrix $D$ mit $T^{-1} A T = D$.`,
      `Wir wählen als Spalten von $T$ die Eigenvektoren (hier die Spalten der beim Rückwärts-Aufbau verwendeten Matrix):`,
      `$$T = ${intMatToLatex(T)}, \\qquad D = ${intMatToLatex(D)}.$$`,
      `Probe: $T^{-1} A T = D$ (die Spalte $j$ von $T$ ist Eigenvektor zum Eigenwert $D_{jj}$).`
    ];

    return {
      type: 'calc_diagonalizable',
      mathQuery,
      answer: 'ja',
      explanation,
      prompt: `Ist $A$ diagonalisierbar? Antworte mit "ja" oder "nein". Falls ja, gib eine Eigenvektorbasis $T$ und die Diagonalmatrix $D$ mit $T^{-1}AT=D$ an (siehe Lösung).`,
      inputHint: 'ja oder nein'
    };
  } else {
    // Build non-diagonalizable matrix
    const { A, eigenvalues } = buildNonDiagonalizableMatrix();
    const [lambda, , mu] = eigenvalues; // lambda is repeated twice, mu is single

    const mathQuery = `A = ${intMatToLatex(A)}`;

    const AminusLambda: Frac[][] = A.map((row, i) =>
      row.map((val, j) => fFromInt(i === j ? val - lambda : val))
    );
    const { steps } = gaussEchelon(AminusLambda);

    const explanation = [
      `Wir bestimmen zunächst die Eigenwerte von $A$ (z.B. über das charakteristische Polynom $\\det(XI-A)$).`,
      `Die Eigenwerte sind $\\lambda_1 = ${lambda}$ (algebraische Vielfachheit 2) und $\\lambda_2 = ${mu}$ (algebraische Vielfachheit 1).`,
      `Um zu prüfen, ob $A$ diagonalisierbar ist, berechnen wir die Dimension des Eigenraums (die geometrische Vielfachheit) zum mehrfachen Eigenwert $\\lambda = ${lambda}$.`,
      `Dazu lösen wir das homogene LGS $(A - ${lambda}\\,I)\\,x = 0$ mit:`,
      `$$A - ${lambda}\\,I = ${fracMatToLatex(AminusLambda)}$$`,
      `Mit dem Gauß-Algorithmus bringen wir diese Matrix auf Zeilenstufenform:`,
      ...steps.map(s => `${s}`),
      `Die Zeilenstufenform hat Rang 2 (zwei Pivotspalten). Somit hat der Kern (Eigenraum) die Dimension $3 - 2 = 1$.`,
      `Die geometrische Vielfachheit des Eigenwerts $\\lambda = ${lambda}$ ist also $1$, was echt kleiner ist als seine algebraische Vielfachheit $2$.`,
      `Da für mindestens einen Eigenwert die geometrische Vielfachheit strikt kleiner ist als die algebraische Vielfachheit, ist die Matrix $A$ **nicht diagonalisierbar** (Antwort: nein).`
    ];

    return {
      type: 'calc_diagonalizable',
      mathQuery,
      answer: 'nein',
      explanation,
      prompt: `Ist $A$ diagonalisierbar? Antworte mit "ja" oder "nein". Falls ja, gib eine Eigenvektorbasis $T$ und die Diagonalmatrix $D$ mit $T^{-1}AT=D$ an (siehe Lösung).`,
      inputHint: 'ja oder nein'
    };
  }
}
