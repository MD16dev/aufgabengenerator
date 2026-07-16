import { TaskData } from './types';

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

/** Invert a 3x3 integer matrix with determinant ±1 (returns exact integer inverse). */
function matInvInt(M: number[][]): number[][] {
  const [[a, b, c], [d, e, f], [g, h, i]] = M;
  const det = det3(M); // ±1
  const co = [
    [e * i - f * h, -(d * i - f * g), d * h - e * g],
    [-(b * i - c * h), a * i - c * g, -(a * h - b * g)],
    [b * f - c * e, -(a * f - c * d), a * e - b * d]
  ];
  // adjugate = transpose of cofactor matrix, divided by det (±1)
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

function fSimplify(f: Frac): Frac {
  if (f.n === 0) return { n: 0, d: 1 };
  const g = Math.sign(f.d) * gcd(Math.abs(f.n), Math.abs(f.d));
  return { n: f.n / g, d: f.d / g };
}

function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b]; }
  return a;
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
    // Find pivot row
    let pivot = -1;
    for (let i = r; i < rows; i++) {
      if (A[i][lead].n !== 0) { pivot = i; break; }
    }
    if (pivot === -1) continue;

    if (pivot !== r) {
      [A[r], A[pivot]] = [A[pivot], A[r]];
      steps.push('Tausche Zeile ' + (r + 1) + ' und Zeile ' + (pivot + 1) + ': $$' + fracMatToLatex(A) + '$$');
    }

    // Normalize pivot row so the pivot becomes 1
    const pv = A[r][lead];
    if (pv.n !== 0 && !(pv.n === 1 && pv.d === 1)) {
      for (let c = 0; c < cols; c++) A[r][c] = fMul(A[r][c], { n: pv.d, d: pv.n });
      steps.push('Teile Zeile ' + (r + 1) + ' durch ' + fToLatex(pv) + ': $$' + fracMatToLatex(A) + '$$');
    }

    // Eliminate below
    for (let i = r + 1; i < rows; i++) {
      const factor = A[i][lead];
      if (factor.n === 0) continue;
      for (let c = 0; c < cols; c++) {
        A[i][c] = fAdd(A[i][c], fMul(fNeg(factor), A[r][c]));
      }
      steps.push('Zeile ' + (i + 1) + ' \\leftarrow Zeile ' + (i + 1) + ' - (' + fToLatex(factor) + ')\\cdot \\text{Zeile } ' + (r + 1) + ': $$' + fracMatToLatex(A) + '$$');
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
  // Determine pivot columns
  const pivots: number[] = [];
  for (let r = 0; r < 3; r++) {
    const pc = E[r].findIndex((x) => x.n !== 0);
    if (pc !== -1) pivots.push(pc);
  }
  const freeCol = [0, 1, 2].find((c) => !pivots.includes(c)) ?? 0;

  // Set free variable = 1, back-substitute
  const x = [0, 0, 0];
  x[freeCol] = 1;
  for (let r = 2; r >= 0; r--) {
    const pc = E[r].findIndex((v) => v.n !== 0);
    if (pc === -1 || pc === freeCol) continue;
    // sum_{c>pc} E[r][c]*x[c] + E[r][pc]*x[pc] = 0  => x[pc] = -sum/E[r][pc]
    let sum: Frac = { n: 0, d: 1 };
    for (let c = pc + 1; c < 3; c++) sum = fAdd(sum, fMul(E[r][c], fFromInt(x[c])));
    const xpc = fAdd(fNeg(sum), { n: 0, d: 1 });
    x[pc] = xpc.n / xpc.d / (E[r][pc].n / E[r][pc].d);
  }

  // Normalize so first non-zero entry is 1
  const firstNonZero = x.find((v) => v !== 0)!;
  return x.map((v) => v / firstNonZero);
}

/**
 * Generates a task asking for a basis of the eigenspace belonging to the
 * largest eigenvalue of a 3x3 rational matrix A.
 *
 * Built backwards: pick 3 integer eigenvalues -> diagonal D, pick an invertible
 * T with det ±1, set A = T D T^{-1}. The eigenspace of lambda_k is the span of
 * the corresponding column(s) of T.
 */
export function generateEigenbasis(): TaskData {
  let A: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  let T: number[][] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  let Tinv: number[][] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  let eigenvalues: number[] = [0, 0, 0];
  let largest = 0;
  let eigenspaceCols: number[][] = [];
  let attempts = 0;

  do {
    attempts++;
    // 3 distinct integer eigenvalues in a small range.
    const pool = [-3, -2, -1, 0, 1, 2, 3, 4, 5];
    eigenvalues = [];
    while (eigenvalues.length < 3) {
      const v = pool[randInt(0, pool.length - 1)];
      if (!eigenvalues.includes(v)) eigenvalues.push(v);
    }
    eigenvalues.sort((a, b) => a - b);
    largest = eigenvalues[2];

    // Pick T with det ±1 from a small set of simple invertible matrices.
    const candidates: number[][][] = [
      [[1, 1, 0], [0, 1, 1], [0, 0, 1]],
      [[1, 0, 1], [0, 1, 0], [1, 0, 1]],
      [[1, 2, 0], [0, 1, 0], [0, 0, 1]],
      [[1, 0, 0], [1, 1, 0], [0, 1, 1]],
      [[2, 1, 0], [1, 1, 0], [0, 0, 1]],
      [[1, 1, 1], [0, 1, 1], [0, 0, 1]]
    ];
    T = candidates[randInt(0, candidates.length - 1)];
    const det = det3(T);
    if (det !== 1 && det !== -1) continue; // ensure integer inverse
    Tinv = matInvInt(T);

    const D = [
      [eigenvalues[0], 0, 0],
      [0, eigenvalues[1], 0],
      [0, 0, eigenvalues[2]]
    ];
    A = matMul(matMul(T, D), Tinv);

    // Eigenspace of the largest eigenvalue = span of columns of T whose
    // eigenvalue equals `largest`. Since eigenvalues are distinct, it's a
    // single column.
    eigenspaceCols = T.map((_, col) => T.map((row) => row[col])).filter(
      (_, col) => eigenvalues[col] === largest
    );
  } while (
    (eigenspaceCols.length === 0 || A.some((row) => row.some((x) => !Number.isInteger(x)))) &&
    attempts < 50
  );

  const basis = eigenspaceCols.map(normalize);
  const answer = basis.map((v) => `(${v.join(',')})`).join(',');

  const mathQuery = `A = \\begin{pmatrix} ${A.map((r) => r.join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;

  // Build (A - lambda_max * I) and solve the homogeneous LGS via Gauss.
  const AminusLambda: Frac[][] = A.map((row, i) =>
    row.map((val, j) => fFromInt(i === j ? val - largest : val))
  );
  const { echelon, steps } = gaussEchelon(AminusLambda);
  const nullVec = nullspaceFromEchelon(echelon);
  const nullVecNorm = (() => {
    const f = nullVec.find((v) => v !== 0)!;
    return nullVec.map((v) => v / f);
  })();

  const explanation: string[] = [
    `Die Matrix $A$ hat die drei Eigenwerte $\\lambda_1=${eigenvalues[0]},\\; \\lambda_2=${eigenvalues[1]},\\; \\lambda_3=${eigenvalues[2]}$.`,
    `Gesucht ist der Eigenraum zum größten Eigenwert $\\lambda_{\\max}=${largest}$. Dazu lösen wir das homogene lineare Gleichungssystem $(A - \\lambda_{\\max} I)\\,x = 0$.`,
    `Wir stellen die Matrix auf: $$A - ${largest}\\,I = ${fracMatToLatex(AminusLambda)}$$`,
  ];

  if (steps.length > 0) {
    explanation.push(`Mit dem Gauß-Algorithmus bringen wir sie auf Zeilenstufenform:`);
    explanation.push(...steps);
  } else {
    explanation.push(`Die Matrix ist bereits in Zeilenstufenform.`);
  }

  explanation.push(
    `Aus der Zeilenstufenform lesen wir den Eigenvektor ab (freie Variable $=1$): $v = \\begin{pmatrix} ${nullVec.join(' \\\\ ')} \\end{pmatrix}$.`
  );
  explanation.push(
    `Wir normieren ihn, sodass der erste Nicht-Null-Eintrag $1$ ist: $v \\mapsto \\begin{pmatrix} ${nullVecNorm.join(' \\\\ ')} \\end{pmatrix}$. Der Eigenraum wird von diesem Vektor aufgespannt.`
  );
  explanation.push(`Eine Basis des Eigenraums ist damit: $\\left\\{ \\begin{pmatrix} ${nullVecNorm.join(' \\\\ ')} \\end{pmatrix} \\right\\}$.`);

  return {
    type: 'calc_eigenbasis',
    mathQuery,
    answer,
    explanation,
    prompt: `Bestimme eine Basis des Eigenraums zum größten Eigenwert von $A$.`,
    inputHint: 'Kommagetrennte Vektoren, erster Nicht-Null-Eintrag = 1, z.B. (1,2,0),(0,1,1)'
  };
}
