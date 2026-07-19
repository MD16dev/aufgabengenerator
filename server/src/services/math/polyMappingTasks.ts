import { TaskData } from './types';
import {
  pickRule,
  formatMatrix,
  formatPoly,
  buildRepresentationMatrix,
} from './polyMappingMatrix';

/**
 * Generators for "Lineare Abbildungen auf Polynomräumen" (Kategorie 2).
 * Konventionen (wie in polyMappingMatrix.ts):
 *  - Polynom f = c3 X^3 + c2 X^2 + c1 X + c0 als Koordinatenvektor [c3,c2,c1,c0].
 *  - Matrix als [r0c0,r0c1,r0c2,r0c3; ...] (Zeilen ';', Einträge ',').
 *  - Bild-Basis: mehrere Vektoren durch '|' getrennt: [1,0,0,0]|[0,1,0,0].
 */

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function matVec(M: number[][], v: number[]): number[] {
  return M.map((row) => row.reduce((s, val, j) => s + val * v[j], 0));
}

function matMul(A: number[][], B: number[][]): number[][] {
  const n = A.length;
  const C: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += A[i][k] * B[k][j];
      C[i][j] = s;
    }
  }
  return C;
}

function matPow(M: number[][], p: number): number[][] {
  let res = M.map((r) => r.slice());
  for (let i = 1; i < p; i++) res = matMul(res, M);
  return res;
}

function getColumn(M: number[][], c: number): number[] {
  return M.map((row) => row[c]);
}

/**
 * Returns the pivot columns (0-based) and the row-echelon form of M via
 * Gaussian elimination. Coefficients are small integers, so floating-point
 * elimination with a zero tolerance is exact enough for pivot detection.
 */
function gaussianEchelon(M: number[][]): { pivots: number[]; echelon: number[][] } {
  const A = M.map((r) => r.slice());
  const rows = A.length;
  const cols = A[0].length;
  const pivots: number[] = [];
  let row = 0;
  for (let col = 0; col < cols && row < rows; col++) {
    let p = row;
    while (p < rows && Math.abs(A[p][col]) < 1e-9) p++;
    if (p === rows) continue;
    [A[row], A[p]] = [A[p], A[row]];
    pivots.push(col);
    for (let r = row + 1; r < rows; r++) {
      const f = A[r][col] / A[row][col];
      for (let c = col; c < cols; c++) A[r][c] -= f * A[row][c];
    }
    row++;
  }
  const echelon = A.map((r) => r.map((x) => (Math.abs(x) < 1e-9 ? 0 : Math.round(x * 1e6) / 1e6)));
  return { pivots, echelon };
}

/**
 * Abbildung anwenden: Berechne phi(p(X)) für ein zufälliges Polynom p.
 */
export function generatePolyApply(): TaskData {
  const rule = pickRule();
  const images = rule.images;
  const M = buildRepresentationMatrix(images);

  let v: number[];
  let w: number[];
  do {
    v = [randInt(-3, 3), randInt(-3, 3), randInt(-3, 3), randInt(-3, 3)];
    w = matVec(M, v);
  } while (v.every((c) => c === 0) || w.every((c) => c === 0));

  const pStr = formatPoly(v);
  const resultStr = formatPoly(w);

  const explanation = [
    `Gegeben ist $\\varphi$ mit ${rule.description} auf $P_3$ mit Basis $B = \\{X^3, X^2, X, 1\\}$.`,
    `Gesucht ist $\\varphi(p)$ für das Polynom $p(X) = ${pStr}$.`,
    `Der Koordinatenvektor von $p$ bezüglich $B$ ist $v = [${v.join(',')}]$.`,
    `Die Spalten von $M_B^B(\\varphi)$ sind die Bilder der Basisvektoren:`,
    `$$M_B^B(\\varphi) = ${formatMatrix(M)}$$`,
    `Es gilt $\\varphi(p) = M \\cdot v$. Wir berechnen das Matrix-Vektor-Produkt:`,
    `$$[${w.join(',')}] = ${formatMatrix(M)} \\cdot [${v.join(',')}]$$`,
    `Der Ergebnisvektor $[${w.join(',')}]$ entspricht dem (ausmultiplizierten) Polynom $\\varphi(p(X)) = ${resultStr}$.`
  ];

  return {
    type: 'calc_poly_apply',
    mathQuery: `\\varphi(p(X)) \\text{ mit } p(X) = ${pStr}`,
    answer: resultStr,
    explanation,
    prompt: `Berechne $\\varphi(p(X))$ für $p(X) = ${pStr}$ und die Abbildung $\\varphi$ mit ${rule.description}. Gib das Ergebnis als ausmultipliziertes Polynom an (absteigend nach Grad, z.B. $2X^3+3X^2+1$).`,
    inputHint: 'Polynom absteigend nach Grad, z.B. 2X^3+3X^2+1'
  };
}

/**
 * Basis des Bildes: Spaltenraum der Darstellungsmatrix via Gauss.
 */
export function generatePolyImageBasis(): TaskData {
  const rule = pickRule();
  const images = rule.images;
  const M = buildRepresentationMatrix(images);
  const { pivots, echelon } = gaussianEchelon(M);
  const basis = pivots.map((c) => getColumn(M, c));
  const rank = pivots.length;
  const answer = basis.map((v) => `[${v.join(',')}]`).join('|');

  const explanation = [
    `Gegeben ist $\\varphi$ mit ${rule.description} auf $P_3$.`,
    `$\\operatorname{Bild}(\\varphi)$ ist der Spaltenraum von $M_B^B(\\varphi)$. Eine Basis erhalten wir, indem wir die linear unabhängigen Spalten via Gauss-Elimination bestimmen.`,
    `$$M_B^B(\\varphi) = ${formatMatrix(M)}$$`,
    `Stufenform (Zeilenstufenform):`,
    `$$\\operatorname{Stufen}(M) = ${formatMatrix(echelon)}$$`,
    `Die Pivotspalten (1-basiert) sind: ${pivots.map((c) => c + 1).join(', ')}.`,
    `Diese Spalten der ursprünglichen Matrix bilden eine Basis von $\\operatorname{Bild}(\\varphi)$:`,
    basis.map((v) => `$$[${v.join(',')}]$$`).join(' '),
    `Also $\\dim\\operatorname{Bild}(\\varphi) = ${rank}$ und eine Basis ist $\\{${basis.map((v) => `[${v.join(',')}]`).join(',\\, ')}\\}$.`
  ];

  return {
    type: 'calc_poly_image_basis',
    mathQuery: `\\operatorname{Basis}\\left(\\operatorname{Bild}(\\varphi)\\right)`,
    answer,
    explanation,
    prompt: `Bestimme eine Basis des Bildes von $\\varphi$ (Spaltenraum von $M_B^B(\\varphi)$) für $\\varphi$ mit ${rule.description}. Gib die Basisvektoren als Koordinatenvektoren (absteigend $[c_3,c_2,c_1,c_0]$) durch '|' getrennt an, z.B. $[1,0,0,0]|[0,1,0,0]$.`,
    inputHint: 'Koordinatenvektoren durch | getrennt, z.B. [1,0,0,0]|[0,1,0,0]'
  };
}

/**
 * Defekt: Def(phi) = dim(Kern) = 4 - Rang(M).
 */
export function generatePolyDefect(): TaskData {
  const rule = pickRule();
  const images = rule.images;
  const M = buildRepresentationMatrix(images);
  const { pivots, echelon } = gaussianEchelon(M);
  const rank = pivots.length;
  const defect = 4 - rank;

  const explanation = [
    `Gegeben ist $\\varphi$ mit ${rule.description} auf $P_3$.`,
    `Der Defekt ist $\\operatorname{Def}(\\varphi) = \\dim\\ker(\\varphi) = 4 - \\operatorname{Rang}\\left(M_B^B(\\varphi)\\right)$.`,
    `$$M_B^B(\\varphi) = ${formatMatrix(M)}$$`,
    `Stufenform:`,
    `$$\\operatorname{Stufen}(M) = ${formatMatrix(echelon)}$$`,
    `Der Rang ist die Anzahl der Pivotspalten: $\\operatorname{Rang}(M) = ${rank}$ (Pivotspalten ${pivots.map((c) => c + 1).join(', ')}).`,
    `Damit $\\operatorname{Def}(\\varphi) = 4 - ${rank} = ${defect}$.`
  ];

  return {
    type: 'calc_poly_defect',
    mathQuery: `\\operatorname{Def}(\\varphi)`,
    answer: String(defect),
    explanation,
    prompt: `Berechne den Defekt $\\operatorname{Def}(\\varphi) = \\dim\\ker(\\varphi)$ für $\\varphi$ mit ${rule.description}.`,
    inputHint: 'Gib eine ganze Zahl ein'
  };
}

/**
 * Verkettung: Basis von Bild(phi^3) = Spaltenraum von M^3.
 */
export function generatePolyComposition(): TaskData {
  const rule = pickRule();
  const images = rule.images;
  const M = buildRepresentationMatrix(images);
  const M3 = matPow(M, 3);
  const { pivots, echelon } = gaussianEchelon(M3);
  const basis = pivots.map((c) => getColumn(M3, c));
  const rank = pivots.length;
  const answer = basis.map((v) => `[${v.join(',')}]`).join('|');

  const explanation = [
    `Gegeben ist $\\varphi$ mit ${rule.description} auf $P_3$.`,
    `Gesucht ist eine Basis von $\\operatorname{Bild}(\\varphi\\circ\\varphi\\circ\\varphi) = \\operatorname{Bild}(\\varphi^3)$. Diese ist der Spaltenraum von $M^3 = \\left(M_B^B(\\varphi)\\right)^3$.`,
    `$$M_B^B(\\varphi) = ${formatMatrix(M)}$$`,
    `Wir berechnen die dritte Matrixpotenz:`,
    `$$M^3 = ${formatMatrix(M3)}$$`,
    `Stufenform von $M^3$:`,
    `$$\\operatorname{Stufen}(M^3) = ${formatMatrix(echelon)}$$`,
    `Die Pivotspalten (1-basiert) von $M^3$ sind: ${pivots.map((c) => c + 1).join(', ')}.`,
    `Die entsprechenden Spalten von $M^3$ bilden eine Basis von $\\operatorname{Bild}(\\varphi^3)$:`,
    basis.map((v) => `$$[${v.join(',')}]$$`).join(' '),
    `Also $\\dim\\operatorname{Bild}(\\varphi^3) = ${rank}$.`
  ];

  return {
    type: 'calc_poly_composition',
    mathQuery: `\\operatorname{Basis}\\left(\\operatorname{Bild}(\\varphi^3)\\right)`,
    answer,
    explanation,
    prompt: `Bestimme eine Basis des Bildes von $\\varphi^3 = \\varphi\\circ\\varphi\\circ\\varphi$ (Spaltenraum von $M^3$) für $\\varphi$ mit ${rule.description}. Gib die Basisvektoren als Koordinatenvektoren (absteigend $[c_3,c_2,c_1,c_0]$) durch '|' getrennt an.`,
    inputHint: 'Koordinatenvektoren durch | getrennt, z.B. [1,0,0,0]|[0,1,0,0]'
  };
}
