import { TaskData } from './types';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Modular inverse over a prime field F_q via Fermat's little theorem. */
function modInv(a: number, q: number): number {
  a = ((a % q) + q) % q;
  let res = 1;
  let base = a;
  let e = q - 2;
  while (e > 0) {
    if (e & 1) res = (res * base) % q;
    base = (base * base) % q;
    e >>= 1;
  }
  return res;
}

/** Negation in F_q. */
function neg(x: number, q: number): number {
  return (((-x) % q) + q) % q;
}

/**
 * Reduced row echelon form (RREF) over the prime field F_q.
 * Pivots are normalized to 1 using the modular inverse, then all other rows
 * are eliminated. Over F_2 the inverse of 1 is 1, so this collapses to the
 * familiar XOR elimination.
 */
function rrefFq(M: number[][], q: number): number[][] {
  const rows = M.length;
  const cols = M[0].length;
  const A = M.map((r) => r.map((x) => ((x % q) + q) % q));
  let pivotRow = 0;
  for (let col = 0; col < cols && pivotRow < rows; col++) {
    // Find a pivot in this column.
    let pr = -1;
    for (let r = pivotRow; r < rows; r++) {
      if (A[r][col] !== 0) { pr = r; break; }
    }
    if (pr === -1) continue;
    [A[pivotRow], A[pr]] = [A[pr], A[pivotRow]];
    // Normalize the pivot row so the pivot becomes 1.
    const inv = modInv(A[pivotRow][col], q);
    for (let c = col; c < cols; c++) A[pivotRow][c] = (A[pivotRow][c] * inv) % q;
    // Eliminate this column from every other row.
    for (let r = 0; r < rows; r++) {
      if (r !== pivotRow && A[r][col] !== 0) {
        const factor = A[r][col];
        for (let c = col; c < cols; c++) {
          A[r][c] = ((A[r][c] - factor * A[pivotRow][c]) % q + q) % q;
        }
      }
    }
    pivotRow++;
  }
  return A;
}

/** Matrix multiplication over F_q. */
function matMulFq(A: number[][], B: number[][], q: number): number[][] {
  const m = A.length;
  const n = B[0].length;
  const p = B.length;
  const C = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < p; k++) s = (s + A[i][k] * B[k][j]) % q;
      C[i][j] = s;
    }
  }
  return C;
}

/**
 * Builds a guaranteed invertible k×k matrix over F_q by starting from the
 * identity and applying random elementary row operations (swap, add a multiple
 * of one row to another, scale a row by a non-zero scalar).
 */
function randomInvertibleFq(k: number, q: number): number[][] {
  const S: number[][] = Array.from({ length: k }, (_, i) =>
    Array.from({ length: k }, (_, j) => (i === j ? 1 : 0) as number)
  );
  const ops = 2 * k + randInt(1, 3);
  for (let t = 0; t < ops; t++) {
    const type = randInt(0, 2);
    if (type === 0) {
      const i = randInt(0, k - 1);
      const j = randInt(0, k - 1);
      [S[i], S[j]] = [S[j], S[i]];
    } else if (type === 1) {
      const i = randInt(0, k - 1);
      const j = randInt(0, k - 1);
      if (i !== j) {
        const a = randInt(1, q - 1);
        for (let c = 0; c < k; c++) S[j][c] = ((S[j][c] + a * S[i][c]) % q + q) % q;
      }
    } else {
      const i = randInt(0, k - 1);
      const a = randInt(1, q - 1);
      for (let c = 0; c < k; c++) S[i][c] = (S[i][c] * a) % q;
    }
  }
  return S;
}

/** Enumerates all q^k codewords = { c·G : c ∈ F_q^k } of a k×n generator G. */
function allCodewords(G: number[][], q: number): number[][] {
  const k = G.length;
  const n = G[0].length;
  const result: number[][] = [];
  const total = Math.pow(q, k);
  for (let idx = 0; idx < total; idx++) {
    let t = idx;
    const coeff = new Array(k).fill(0);
    for (let i = 0; i < k; i++) {
      coeff[i] = t % q;
      t = Math.floor(t / q);
    }
    const cw = new Array(n).fill(0);
    for (let i = 0; i < k; i++) {
      if (coeff[i] !== 0) {
        const a = coeff[i];
        for (let c = 0; c < n; c++) cw[c] = ((cw[c] + a * G[i][c]) % q + q) % q;
      }
    }
    result.push(cw);
  }
  return result;
}

/** Hamming distance: number of positions in which two vectors differ. */
function hamming(a: number[], b: number[]): number {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

/** Matrix as LaTeX pmatrix. */
function matToLatex(M: number[][]): string {
  return `\\begin{pmatrix} ${M.map((r) => r.join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
}

/** Matrix as canonical string "[r0c0,r0c1;r1c0,r1c1]". */
function matToString(M: number[][]): string {
  return `[${M.map((r) => r.join(',')).join(';')}]`;
}

/** Vector as canonical string "a,b,c". */
function vecToString(v: number[]): string {
  return v.join(',');
}

/** Vector as LaTeX row "[a,b,c]". */
function vecToLatex(v: number[]): string {
  return `[${v.join(',')}]`;
}

/**
 * Builds a full-row-rank k×n generator matrix G over F_q in a "scrambled" form
 * G = S·[I_k | P] (S invertible). Its RREF is exactly [I_k | P], so no column
 * permutations are needed when constructing the parity-check matrix.
 */
function buildGenerator(q: number, k: number, nMinusK: number): number[][] {
  const n = k + nMinusK;
  const P = Array.from({ length: k }, () =>
    Array.from({ length: nMinusK }, () => randInt(0, q - 1))
  );
  const Gstd = Array.from({ length: k }, (_, i) => {
    const row = new Array(n).fill(0);
    row[i] = 1;
    for (let j = 0; j < nMinusK; j++) row[k + j] = P[i][j];
    return row;
  });
  const S = randomInvertibleFq(k, q);
  return matMulFq(S, Gstd, q);
}

/**
 * Generates a task asking for a parity-check (control) matrix H of the linear
 * code C ≤ F_q^n with (scrambled) generator matrix G.
 *
 * The student must bring G to RREF → [I_k | P], then form
 * H = [-P^T | I_{n-k}] (over F_2 the minus sign is the identity).
 */
export function generateParityCheckMatrix(): TaskData {
  const q = Math.random() < 0.8 ? 2 : 3;
  const k = randInt(2, 4);
  const nMinusK = randInt(2, 4);
  const n = k + nMinusK;

  const G = buildGenerator(q, k, nMinusK);

  // RREF of G is [I_k | P]; extract the P block (last n-k columns).
  const rref = rrefFq(G, q);
  const Pblock = rref.map((r) => r.slice(k)); // k × (n-k)

  // H = [-P^T | I_{n-k}]  ( (n-k) × n )
  const Htop = Array.from({ length: nMinusK }, (_, i) =>
    Array.from({ length: k }, (_, j) => neg(Pblock[j][i], q))
  );
  const H = Htop.map((row, i) => [
    ...row,
    ...Array.from({ length: nMinusK }, (_, j) => (i === j ? 1 : 0)),
  ]);

  const answer = matToString(H);

  const explanation = [
    `Gegeben ist die Erzeugermatrix $G$ eines linearen Codes der Dimension $k = ${k}$ und Länge $n = ${n}$ über $\\mathbb{F}_{${q}}$.`,
    `Wir bringen $G$ auf reduzierte Zeilenstufenform (RREF) über $\\mathbb{F}_{${q}}$:`,
    `$$G \\xrightarrow{\\text{RREF}} ${matToLatex(rref)}$$`,
    `Die RREF hat die Form $[I_{${k}} \\mid P]$ mit $P = ${matToLatex(Pblock)}$.`,
    `Eine Kontrollmatrix ist $H = [-P^{\\top} \\mid I_{${nMinusK}}]$.${q === 2 ? ' Über $\\mathbb{F}_2$ ist $- = +$, also $H = [P^{\\top} \\mid I_{' + nMinusK + '}]$.' : ''}`,
    `$$H = ${matToLatex(H)}$$`,
    `Probe: $G H^{\\top} = 0$ (jedes Codewort liegt im Kern von $H$).`
  ];

  return {
    type: 'calc_linear_code_parity_check',
    mathQuery: `G = ${matToLatex(G)}`,
    answer,
    explanation,
    prompt: `Bestimme eine Kontrollmatrix $H$ des linearen Codes mit Erzeugermatrix $G$ über $\\mathbb{F}_{${q}}$.`,
    inputHint: 'Matrix im Format [r0;r1;...], z.B. [1,0,1;0,1,1]'
  };
}

/**
 * Generates a nearest-neighbor decoding task: given a generator matrix G of a
 * linear code C ≤ F_q^n and a received vector v ∈ F_q^n, find all codewords
 * with minimal Hamming distance to v.
 *
 * All q^k codewords are enumerated (k is kept small), their Hamming distances
 * to v are computed, and the minima are returned (ties separated by "|").
 */
export function generateNearestNeighborDecoding(): TaskData {
  const q = Math.random() < 0.8 ? 2 : 3;
  const kMax = q === 2 ? 4 : 3; // keep q^k ≤ 27
  const k = randInt(2, kMax);
  const nMinusK = randInt(2, 4);
  const n = k + nMinusK;

  let G: number[][] = [];
  let codewords: number[][] = [];
  let v: number[] = [];
  let nearest: number[][] = [];
  let minD = 0;
  let dists: number[] = [];

  let outerAttempts = 0;
  while (outerAttempts < 100) {
    outerAttempts++;
    G = buildGenerator(q, k, nMinusK);
    codewords = allCodewords(G, q);

    let attempts = 0;
    do {
      v = Array.from({ length: n }, () => randInt(0, q - 1));
      dists = codewords.map((cw) => hamming(cw, v));
      minD = Math.min(...dists);
      nearest = codewords.filter((_, i) => dists[i] === minD);
      attempts++;
    } while (
      (nearest.length !== 1 || minD === 0) &&
      attempts < 30
    );

    if (nearest.length === 1 && minD > 0) {
      break;
    }
  }

  const answer = nearest.map(vecToString).join('|');

  // Compact distance table for the explanation.
  const table = codewords
    .map((cw, i) => `(${vecToString(cw)}) &\\to d = ${dists[i]}${dists[i] === minD ? ' \\;\\checkmark' : ''}`)
    .join(' \\\\ ');

  const explanation = [
    `Gegeben ist die Erzeugermatrix $G$ (Code $C \\le \\mathbb{F}_{${q}}^{${n}}$, Dimension $k = ${k}$) und der empfangene Vektor $v = ${vecToLatex(v)}$.`,
    `Wir erzeugen alle ${Math.pow(q, k)} Codewörter als Linearkombinationen der Zeilen von $G$ und messen ihren Hamming-Abstand zu $v$:`,
    `$$\\begin{aligned} ${table} \\end{aligned}$$`,
    `Der minimale Abstand ist $d_{\\min} = ${minD}$. Die (nächsten) Codewörter mit diesem Abstand sind:`,
    `$${nearest.map((cw) => vecToLatex(cw)).join('\\;,\\;')}$`,
    `Bei der nächsten-Nachbarn-Decodierung wird $v$ zu ${nearest.length === 1 ? 'diesem Codewort' : 'einem dieser Codewörter'} decodiert.`
  ];

  return {
    type: 'calc_linear_code_nearest_neighbor',
    mathQuery: `G = ${matToLatex(G)}, \\quad v = ${vecToLatex(v)}`,
    answer,
    explanation,
    prompt: `Decodiere $v$ mit nächster-Nachbarn-Decodierung: gib alle Codewörter mit minimalem Hamming-Abstand zu $v$ an.`,
    inputHint: 'Codewörter als a,b,c; mehrere durch | trennen, z.B. 1,0,1,0|0,1,1,0'
  };
}
