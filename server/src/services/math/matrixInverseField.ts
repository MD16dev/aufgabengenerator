import { TaskData } from './types';

/**
 * Category 6: "Matrizeninversion & Basiswechsel" over the finite field F_p.
 *
 * Setup: V = F_p^{n×1}, phi: V -> V, v -> A·v with an invertible matrix
 * A in F_p^{n×n}, and a target vector b in F_p^{n×1}.
 * (p in {3,5,7}, n in {2,3}.)
 *
 * Implemented generators:
 *   - generateMatrixInverseField : compute A^{-1} in F_p (Gauß-Jordan).
 *   - generatePreimageField      : solve A·x = b in F_p (Gauß-elimination).
 *
 * Not implemented (see report):
 *   - Rang & Defekt : degenerate, since A is always invertible => Rang = n, Def = 0.
 *   - Basiswechsel  : M_B^B(phi) = A always (columns of A^{-1} form B), so the
 *                     answer is just the given matrix A — a conceptual trap, not
 *                     a meaningful computation.
 */

// ---------------------------------------------------------------------------
// Finite-field arithmetic helpers
// ---------------------------------------------------------------------------

/** Reduce an integer into the canonical residue 0..p-1. */
function mod(a: number, p: number): number {
  return ((a % p) + p) % p;
}

/**
 * Modular inverse of a modulo p via the extended Euclidean algorithm.
 * p is prime, so any a != 0 (mod p) has a unique inverse.
 */
function modInverse(a: number, p: number): number {
  a = mod(a, p);
  let [old_r, r] = [a, p];
  let [old_s, s] = [1, 0];
  while (r !== 0) {
    const q = Math.floor(old_r / r);
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }
  // old_r is gcd(a,p) = 1; old_s is the inverse (may be negative).
  return mod(old_s, p);
}

/** Determinant of a square matrix over F_p (used to guarantee invertibility). */
function determinantMod(A: number[][], p: number): number {
  const n = A.length;
  const M = A.map((row) => row.map((x) => mod(x, p)));
  let det = 1;
  for (let col = 0; col < n; col++) {
    // Partial pivot search.
    let pivot = -1;
    for (let r = col; r < n; r++) {
      if (M[r][col] !== 0) {
        pivot = r;
        break;
      }
    }
    if (pivot === -1) return 0; // singular
    if (pivot !== col) {
      [M[col], M[pivot]] = [M[pivot], M[col]];
      det = mod(-det, p); // row swap flips the sign
    }
    det = mod(det * M[col][col], p);
    const inv = modInverse(M[col][col], p);
    for (let r = col + 1; r < n; r++) {
      const f = mod(M[r][col] * inv, p);
      if (f !== 0) {
        for (let j = col; j < n; j++) {
          M[r][j] = mod(M[r][j] - f * M[col][j], p);
        }
      }
    }
  }
  return det;
}

/**
 * Invert A over F_p using Gauß-Jordan elimination on the augmented matrix
 * [A | I]. Returns A^{-1} (residues 0..p-1). Assumes A is invertible.
 */
function matrixInverseMod(A: number[][], p: number): number[][] {
  const n = A.length;
  // Build [A | I].
  const M: number[][] = A.map((row, i) => [
    ...row.map((x) => mod(x, p)),
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);
  for (let col = 0; col < n; col++) {
    // Partial pivot.
    let pivot = -1;
    for (let r = col; r < n; r++) {
      if (M[r][col] !== 0) {
        pivot = r;
        break;
      }
    }
    if (pivot !== col) [M[col], M[pivot]] = [M[pivot], M[col]];
    // Normalize pivot row: multiply by inverse of the pivot element.
    const inv = modInverse(M[col][col], p);
    for (let j = 0; j < 2 * n; j++) M[col][j] = mod(M[col][j] * inv, p);
    // Eliminate all other rows.
    for (let r = 0; r < n; r++) {
      if (r !== col && M[r][col] !== 0) {
        const f = M[r][col];
        for (let j = 0; j < 2 * n; j++) {
          M[r][j] = mod(M[r][j] - f * M[col][j], p);
        }
      }
    }
  }
  // Right half is the inverse.
  return M.map((row) => row.slice(n).map((x) => mod(x, p)));
}

/**
 * Solve A·x = b over F_p via Gauß elimination on the augmented matrix
 * [A | b]. Returns the unique solution vector (residues 0..p-1).
 * Assumes A is invertible, so the system is always solvable.
 */
function solveMod(A: number[][], b: number[], p: number): number[] {
  const n = A.length;
  const M: number[][] = A.map((row, i) => [
    ...row.map((x) => mod(x, p)),
    mod(b[i], p),
  ]);
  for (let col = 0; col < n; col++) {
    let pivot = -1;
    for (let r = col; r < n; r++) {
      if (M[r][col] !== 0) {
        pivot = r;
        break;
      }
    }
    if (pivot !== col) [M[col], M[pivot]] = [M[pivot], M[col]];
    const inv = modInverse(M[col][col], p);
    for (let j = col; j <= n; j++) M[col][j] = mod(M[col][j] * inv, p);
    for (let r = 0; r < n; r++) {
      if (r !== col && M[r][col] !== 0) {
        const f = M[r][col];
        for (let j = col; j <= n; j++) {
          M[r][j] = mod(M[r][j] - f * M[col][j], p);
        }
      }
    }
  }
  return M.map((row) => mod(row[n], p));
}

/** Matrix product C = A·B over F_p. */
function matMulMod(A: number[][], B: number[][], p: number): number[][] {
  const n = A.length;
  const m = B[0].length;
  const k = A[0].length;
  const C: number[][] = Array.from({ length: n }, () => Array(m).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      let s = 0;
      for (let t = 0; t < k; t++) s = mod(s + A[i][t] * B[t][j], p);
      C[i][j] = s;
    }
  }
  return C;
}

// ---------------------------------------------------------------------------
// Formatting helpers (mirror existing conventions)
// ---------------------------------------------------------------------------

/** Matrix as a LaTeX pmatrix. */
function matrixToLatex(M: number[][]): string {
  const rows = M.map((row) => row.join(' & ')).join(' \\\\ ');
  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}

/** Matrix as canonical string `[r0c0,r0c1;r1c0,r1c1]`. */
function formatMatrix(M: number[][]): string {
  return `[${M.map((row) => row.join(',')).join(';')}]`;
}

/** Vector as canonical string `[a,b,c]`. */
function formatVector(v: number[]): string {
  return `[${v.join(',')}]`;
}

/** Vector as a LaTeX column pmatrix. */
function vectorToLatex(v: number[]): string {
  return `\\begin{pmatrix} ${v.join(' \\\\ ')} \\end{pmatrix}`;
}

/** Augmented matrix [A | b] as LaTeX with a vertical bar. */
function augmentedToLatex(A: number[][], b: number[]): string {
  const n = A.length;
  const rows = A.map((row, i) => `${row.join(' & ')} & ${b[i]}`).join(' \\\\ ');
  return `\\left(\\begin{array}{${'c'.repeat(n)}|c} ${rows} \\end{array}\\right)`;
}

/** Augmented matrix [A | I] as LaTeX with a vertical bar. */
function augmentedInvToLatex(A: number[][], n: number): string {
  const rows = A.map(
    (row, i) =>
      `${row.join(' & ')} & ${Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)).join(' & ')}`
  ).join(' \\\\ ');
  return `\\left(\\begin{array}{${'c'.repeat(n)}|${'c'.repeat(n)}} ${rows} \\end{array}\\right)`;
}

// ---------------------------------------------------------------------------
// Random setup
// ---------------------------------------------------------------------------

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Generate a random invertible n×n matrix over F_p. */
function randomInvertibleMatrix(n: number, p: number): number[][] {
  let A: number[][];
  let attempts = 0;
  do {
    A = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => randInt(0, p - 1))
    );
    attempts++;
  } while (determinantMod(A, p) === 0 && attempts < 100);
  return A;
}

function randomVector(n: number, p: number): number[] {
  return Array.from({ length: n }, () => randInt(0, p - 1));
}

// ---------------------------------------------------------------------------
// Generator 1: Inverse Darstellungsmatrix
// ---------------------------------------------------------------------------

/**
 * Compute A^{-1} in F_p. The matrix A is guaranteed invertible (det != 0 mod p),
 * so the inverse always exists and is unique.
 */
export function generateMatrixInverseField(): TaskData {
  const primes = [3, 5, 7];
  const p = primes[randInt(0, primes.length - 1)];
  const n = randInt(2, 3);

  const A = randomInvertibleMatrix(n, p);
  const Ainv = matrixInverseMod(A, p);

  const mathQuery = `A^{-1} \\in \\mathbb{F}_{${p}} \\quad\\text{für}\\quad A = ${matrixToLatex(A)}`;

  // Verification: A · A^{-1} ≡ I (mod p).
  const I = matMulMod(A, Ainv, p);
  const identityOk = I.every((row, i) => row.every((v, j) => (i === j ? v === 1 : v === 0)));

  const explanation = [
    `Gesucht ist die inverse Matrix $A^{-1}$ über dem Körper $\\mathbb{F}_{${p}}$, also mit $A\\cdot A^{-1} \\equiv I \\pmod{${p}}$.`,
    `Wir erweitern $A$ zur augmentierten Matrix $[A\\mid I]$ und wenden den Gauß-Jordan-Algorithmus an, wobei alle Rechnungen modulo $p = ${p}$ erfolgen (Division = Multiplikation mit dem modularen Inversen):`,
    `$${augmentedInvToLatex(A, n)}$$`,
    `Durch Zeilenumformungen (Pivotelement normieren via modularem Inversen, andere Zeilen eliminieren) erhalten wir:`,
    `$$\\left(I \\mid A^{-1}\\right), \\qquad A^{-1} = ${matrixToLatex(Ainv)}$$`,
    `Probe: $A\\cdot A^{-1} \\equiv ${matrixToLatex(I)} \\equiv I \\pmod{${p}}$ ${identityOk ? '✓' : ''}.`
  ];

  return {
    type: 'calc_matrix_inverse_field',
    mathQuery,
    answer: formatMatrix(Ainv),
    explanation,
    prompt: `Bestimme die inverse Matrix $A^{-1}$ in $\\mathbb{F}_{${p}}$.`,
    inputHint: `Matrix im Format [r0c0,r0c1;r1c0,r1c1] (Einträge modulo ${p}).`
  };
}

// ---------------------------------------------------------------------------
// Generator 2: Urbild bestimmen
// ---------------------------------------------------------------------------

/**
 * Solve A·x = b over F_p. Since A is invertible, the preimage phi^{-1}({b}) is
 * the unique vector x = A^{-1}·b.
 */
export function generatePreimageField(): TaskData {
  const primes = [3, 5, 7];
  const p = primes[randInt(0, primes.length - 1)];
  const n = randInt(2, 3);

  const A = randomInvertibleMatrix(n, p);
  const b = randomVector(n, p);
  const x = solveMod(A, b, p);

  const mathQuery = `\\varphi^{-1}(\\{b\\}) \\text{ für } \\varphi(v)=A\\cdot v,\\quad A = ${matrixToLatex(A)},\\; b = ${vectorToLatex(b)}`;

  // Verification: A · x ≡ b (mod p). Treat x as a column vector (n×1 matrix).
  const xCol: number[][] = x.map((v) => [v]);
  const Ax = matMulMod(A, xCol, p).map((row) => row[0]);
  const ok = Ax.every((v, i) => v === b[i]);

  const explanation = [
    `Gesucht ist das Urbild $\\varphi^{-1}(\\{b\\}) = \\{x\\in\\mathbb{F}_{${p}}^{${n}}\\mid A\\cdot x = b\\}$. Da $A$ invertierbar ist, gibt es genau eine Lösung $x = A^{-1}\\cdot b$.`,
    `Wir lösen das lineare System $A\\cdot x = b$ mit dem Gauß-Algorithmus über $\\mathbb{F}_{${p}}$ (alle Operationen modulo $p = ${p}$):`,
    `$${augmentedToLatex(A, b)}$$`,
    `Nach Elimination (Pivotelemente via modularem Inversen normieren, Zeilen addieren) erhalten wir die Lösung:`,
    `$$x = ${vectorToLatex(x)}$$`,
    `Probe: $A\\cdot x \\equiv ${vectorToLatex(Ax)} \\equiv b \\pmod{${p}}$ ${ok ? '✓' : ''}.`
  ];

  return {
    type: 'calc_preimage_field',
    mathQuery,
    answer: formatVector(x),
    explanation,
    prompt: `Bestimme das Urbild $\\varphi^{-1}(\\{b\\})$ (den Vektor $x$).`,
    inputHint: `Vektor im Format [a,b,c] (Einträge modulo ${p}).`
  };
}
