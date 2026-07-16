import { TaskData } from './types';

export interface MatrixMultiplicationTask {
  type: string;
  matrixA: number[][];
  matrixB: number[][];
  matrixC: number[][];
  latexA: string;
  latexB: string;
  latexC: string;
  answer: string;
  steps: string[];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMatrix(rows: number, cols: number): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      row.push(getRandomInt(-4, 4));
    }
    matrix.push(row);
  }
  return matrix;
}

function multiplyMatrices(A: number[][], B: number[][]): number[][] {
  const n = A.length;
  const m = A[0].length;
  const k = B[0].length;
  const C: number[][] = Array.from({ length: n }, () => Array(k).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < k; j++) {
      let sum = 0;
      for (let p = 0; p < m; p++) {
        sum += A[i][p] * B[p][j];
      }
      C[i][j] = sum;
    }
  }
  return C;
}

function matrixToLatex(matrix: number[][]): string {
  const rows = matrix.map(row => row.join(' & ')).join(' \\\\ ');
  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}

export function generateMatrixMultiplicationTask(): MatrixMultiplicationTask {
  // Generate random dimensions n, m, k in [2, 4]
  const n = getRandomInt(2, 4);
  const m = getRandomInt(2, 4);
  const k = getRandomInt(2, 4);

  const matrixA = generateMatrix(n, m);
  const matrixB = generateMatrix(m, k);
  const matrixC = multiplyMatrices(matrixA, matrixB);

  const latexA = matrixToLatex(matrixA);
  const latexB = matrixToLatex(matrixB);
  const latexC = matrixToLatex(matrixC);

  const answer = matrixC.map(row => row.join(',')).join(';');

  const fmt = (num: number) => num < 0 ? `(${num})` : `${num}`;

  const steps = [
    `Gegeben sind die Matrizen:
     $$A = ${latexA} \\quad (${n} \\times ${m}) \\quad \\text{und} \\quad B = ${latexB} \\quad (${m} \\times ${k})$$`,
    `Gesucht ist das Produkt $C = A \\cdot B$. Die Multiplikation ist definiert, weil die Spaltenzahl von $A$ (${m}) gleich der Zeilenzahl von $B$ (${m}) ist. Die Ergebnismatrix $C$ hat die Dimension ${n} \\times ${k}.`,
  ];

  steps.push(`Wir berechnen die Eintraege von $C$ mit dem Schema "Zeile mal Spalte": jedes $C_{i,j}$ ist das Skalarprodukt aus der $i$-ten Zeile von $A$ und der $j$-ten Spalte von $B$.`);

  for (let i = 0; i < n; i++) {
    const rowLines: string[] = [];
    for (let j = 0; j < k; j++) {
      const terms: string[] = [];
      let sumVal = 0;
      for (let p = 0; p < m; p++) {
        const valA = matrixA[i][p];
        const valB = matrixB[p][j];
        terms.push(`${fmt(valA)} \\cdot ${fmt(valB)}`);
        sumVal += valA * valB;
      }
      const sumExpr = terms.join(' + ');
      const termProducts = matrixA[i].map((valA, p) => valA * matrixB[p][j]);
      const termProductsStr = termProducts.map(fmt).join(' + ');

      rowLines.push(`C_{${i+1},${j+1}} = ${sumExpr} = ${termProductsStr} = ${sumVal}`);
    }
    steps.push(`Zeile ${i+1} von $C$ (Zeile ${i+1} von $A$ mal die Spalten von $B$):\n$$${rowLines.join(' \\\\ ')}$$`);
  }

  steps.push(`Wir setzen die berechneten Werte in die Produktmatrix ein:
     $$C = A \\cdot B = ${latexC}$$`);

  return {
    type: 'lin_alg_matmul',
    matrixA,
    matrixB,
    matrixC,
    latexA,
    latexB,
    latexC,
    answer,
    steps
  };
}

export function generateMatrixMultiplication(): TaskData {
  const task = generateMatrixMultiplicationTask();
  return {
    type: task.type,
    mathQuery: `A \\cdot B = ${task.latexA} \\cdot ${task.latexB}`,
    answer: task.answer,
    explanation: task.steps,
    prompt: 'Berechne das Matrixprodukt $C = A \\cdot B$ der folgenden Matrizen:',
    inputHint: 'Gib das Ergebnis zeilenweise ein, getrennt durch Semikolon, Werte durch Kommata (z.B. 1,2;3,4 für eine 2x2 Matrix).'
  };
}
