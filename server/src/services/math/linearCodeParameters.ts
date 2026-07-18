import { TaskData } from './types';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Gaussian elimination over F_2. Returns the rank and the row-echelon form. */
function rankF2(matrix: number[][]): { rank: number; echelon: number[][] } {
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
  return { rank, echelon: M };
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
  let echelon: number[][];
  let codewords: number[][] = [];
  let attempts = 0;

  do {
    attempts++;
    A = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => (Math.random() < 0.5 ? 0 : 1))
    );
    const res = rankF2(A);
    k = res.rank;
    echelon = res.echelon;

    // Generate all 2^k - 1 non-zero linear combinations of the rows.
    codewords = [];
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

  // Concrete codewords to illustrate d: a few non-trivial combinations.
  const exampleCombos: Array<{ label: string; cw: number[] }> = [];
  for (let mask = 1; mask < (1 << k) && exampleCombos.length < 3; mask++) {
    const cw = new Array(cols).fill(0);
    const usedRows: number[] = [];
    for (let r = 0; r < rows; r++) {
      if ((mask >> r) & 1) {
        usedRows.push(r + 1);
        for (let c = 0; c < cols; c++) cw[c] ^= A[r][c];
      }
    }
    exampleCombos.push({ label: usedRows.join('+'), cw });
  }
  // The displayed example must be a genuine minimum-weight codeword.
  // Reuse the full codeword list that was already used to compute d.
  const minCodeword = codewords.reduce((best, cw) =>
    weight(cw) < weight(best) ? cw : best
  );

  const explanation = [
    `$n$ ist die Länge des Codes, also die Spaltenanzahl der Erzeugermatrix: $n = ${n}$.`,
    `Für die Dimension $k$ bringen wir $A$ über $\\mathbb{F}_2$ auf Zeilenstufenform (Gauß-Elimination):`,
    `$$A \\xrightarrow{\\text{Zeilenstufenform}} \\begin{pmatrix} ${echelon.map((r) => r.join(' & ')).join(' \\\\ ')} \\end{pmatrix}$$`,
    `Es bleiben ${k} linear unabhängige Zeilen (Pivotzeilen) übrig, also ist die Dimension $k = ${k}$. Der Code hat $2^{${k}}$ Codewörter.`,
    `Die Minimaldistanz $d$ ist das kleinste Hamming-Gewicht eines von Null verschiedenen Codeworts. Wir bilden Linearkombinationen der Zeilen (Addition über $\\mathbb{F}_2$):`,
    exampleCombos
      .map((ex) => `$$\\text{Zeile } ${ex.label}: \\; (${ex.cw.join('\\;')}) \\quad \\operatorname{wt} = ${weight(ex.cw)}$$`)
      .join(' '),
    `Unter allen $2^{${k}}-1$ nichttrivialen Kombinationen ist das minimale Gewicht $d = ${d}$ (z.B. das Codewort $(${minCodeword.join('\\;')})$).`,
    `Damit hat der Code die Parameter: $${answer}$$`
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
