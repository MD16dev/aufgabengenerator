import { TaskData } from './types';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Gaussian elimination over F_2 to compute the row rank of a binary matrix. */
function rankF2(matrix: number[][]): number {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const M = matrix.map((r) => r.slice());
  let rank = 0;
  let row = 0;
  for (let col = 0; col < cols && row < rows; col++) {
    // Find pivot
    let pivot = -1;
    for (let r = row; r < rows; r++) {
      if (M[r][col] === 1) { pivot = r; break; }
    }
    if (pivot === -1) continue;
    [M[row], M[pivot]] = [M[pivot], M[row]];
    // Eliminate other rows
    for (let r = 0; r < rows; r++) {
      if (r !== row && M[r][col] === 1) {
        for (let c = col; c < cols; c++) M[r][c] ^= M[row][c];
      }
    }
    row++;
    rank++;
  }
  return rank;
}

/** Hamming weight of a binary vector. */
function weight(v: number[]): number {
  return v.reduce((s, x) => s + x, 0);
}

/**
 * Generates a task asking for the parameters [n, k, d] of a linear block code
 * C <= F_2^n given by its generator matrix A.
 *
 * - n = number of columns
 * - k = rank of A over F_2
 * - d = minimum Hamming distance = minimal weight among all non-zero codewords
 *       (all 2^k - 1 non-zero linear combinations of the rows).
 */
export function generateLinearCodeParameters(): TaskData {
  // Choose dimensions: rows in {3,4,5}, columns in {5,6,7} (n >= k).
  const rows = randInt(3, 5);
  const cols = randInt(rows, 7);

  let A: number[][];
  let k: number;
  let d: number;
  let attempts = 0;

  do {
    attempts++;
    A = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => (Math.random() < 0.5 ? 0 : 1))
    );
    k = rankF2(A);

    // Generate all 2^k - 1 non-zero linear combinations of the rows.
    const codewords: number[][] = [];
    for (let mask = 1; mask < (1 << k); mask++) {
      const cw = new Array(cols).fill(0);
      for (let r = 0; r < rows; r++) {
        if ((mask >> r) & 1) {
          for (let c = 0; c < cols; c++) cw[c] ^= A[r][c];
        }
      }
      codewords.push(cw);
    }
    d = Math.min(...codewords.map(weight));
  } while ((k < 1 || d < 1) && attempts < 50);

  const n = cols;
  const answer = `[${n},${k},${d}]`;

  const mathQuery = `A = \\begin{pmatrix} ${A.map((r) => r.join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;

  // Find a concrete minimal-weight non-zero codeword to illustrate d.
  const codewords: number[][] = [];
  for (let mask = 1; mask < (1 << k); mask++) {
    const cw = new Array(cols).fill(0);
    for (let r = 0; r < rows; r++) {
      if ((mask >> r) & 1) {
        for (let c = 0; c < cols; c++) cw[c] ^= A[r][c];
      }
    }
    codewords.push(cw);
  }
  const minCodeword = codewords.reduce((best, cw) =>
    weight(cw) < weight(best) ? cw : best
  );

  const explanation = [
    `$n$ ist die Länge des Codes, also die Spaltenanzahl der Erzeugermatrix: $n = ${n}$.`,
    `$k$ ist die Dimension, gleich dem Zeilenrang von $A$ über $\\mathbb{F}_2$ (nach Zeilenstufenform): $k = ${k}$. Es gibt also $2^{${k}}$ Codewörter.`,
    `Die Minimaldistanz $d$ ist das kleinste Hamming-Gewicht eines von Null verschiedenen Codeworts. Wir betrachten alle $2^{${k}}-1$ nichttrivialen Linearkombinationen der Zeilen.`,
    `Ein Codewort mit minimalem Gewicht ist $c = (${minCodeword.join('\\;')})$ mit Hamming-Gewicht $\\operatorname{wt}(c) = ${d}$.`,
    `Also gilt $d = ${d}$, und der Code hat die Parameter: $${answer}$$`
  ];

  return {
    type: 'calc_linear_code_parameters',
    mathQuery,
    answer,
    explanation,
    prompt: `Bestimme die Parameter $[n, k, d]$ des linearen Codes mit Erzeugermatrix $A$.`,
    inputHint: 'Array-String [n,k,d], z.B. [7,4,3]'
  };
}
