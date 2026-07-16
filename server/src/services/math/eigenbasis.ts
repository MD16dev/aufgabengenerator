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

  // Show the eigenvector v (the column of T belonging to the largest eigenvalue)
  // and verify A v = lambda * v.
  const vRaw = eigenspaceCols[0];
  const vNorm = basis[0];
  const Av = A.map((row) => row.reduce((s, x, j) => s + x * vRaw[j], 0));
  const lambdaV = vRaw.map((x) => x * largest);

  const explanation = [
    `Die Matrix $A$ hat die drei Eigenwerte $\\lambda_1=${eigenvalues[0]},\\; \\lambda_2=${eigenvalues[1]},\\; \\lambda_3=${eigenvalues[2]}$.`,
    `Gesucht ist der Eigenraum zum größten Eigenwert $\\lambda_{\\max}=${largest}$.`,
    `Ein zugehöriger Eigenvektor ist $v = \\begin{pmatrix} ${vRaw.join(' \\\\ ')} \\end{pmatrix}$. Wir prüfen $A\\,v = \\lambda_{\\max}\\,v$:`,
    `$$A\\,v = \\begin{pmatrix} ${Av.join(' \\\\ ')} \\end{pmatrix} = ${largest}\\cdot\\begin{pmatrix} ${vRaw.join(' \\\\ ')} \\end{pmatrix} = \\begin{pmatrix} ${lambdaV.join(' \\\\ ')} \\end{pmatrix} = \\lambda_{\\max}\\,v$$`,
    `Der Eigenraum wird von diesem Vektor aufgespannt. Wir normieren ihn, sodass der erste Nicht-Null-Eintrag $1$ ist: $v \\mapsto \\begin{pmatrix} ${vNorm.join(' \\\\ ')} \\end{pmatrix}$.`,
    `Eine Basis des Eigenraums ist damit: $${answer}$$`
  ];

  return {
    type: 'calc_eigenbasis',
    mathQuery,
    answer,
    explanation,
    prompt: `Bestimme eine Basis des Eigenraums zum größten Eigenwert von $A$.`,
    inputHint: 'Kommagetrennte Vektoren, erster Nicht-Null-Eintrag = 1, z.B. (1,2,0),(0,1,1)'
  };
}
