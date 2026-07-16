import { TaskData } from './types';

/**
 * Basis order used throughout: B = {X^3, X^2, X, 1}.
 * A polynomial f = c3*X^3 + c2*X^2 + c1*X + c0 is stored as [c3, c2, c1, c0].
 */

interface PolyRule {
  /** Human-readable LaTeX description of the linear map. */
  description: string;
  /** images[col] = coordinate vector (in basis B) of phi(b_col). */
  images: number[][];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Picks a random linear transformation rule on P_3 and returns the images of
 * the basis vectors. The representation matrix M_B^B(phi) has these images as
 * its columns.
 */
function pickRule(): PolyRule {
  const rules: Array<() => PolyRule> = [
    // Scaled derivative: phi(f) = m * f'
    () => {
      const m = randInt(1, 3);
      return {
        description: `\\varphi(f) = ${m}\\, f'`,
        images: [
          [0, 3 * m, 0, 0], // phi(X^3) = 3m X^2
          [0, 0, 2 * m, 0], // phi(X^2) = 2m X
          [0, 0, 0, m],     // phi(X)   = m
          [0, 0, 0, 0]      // phi(1)   = 0
        ]
      };
    },
    // Multiply derivative by X: phi(f) = X * f'
    () => ({
      description: `\\varphi(f) = X \\cdot f'`,
      images: [
        [3, 0, 0, 0], // phi(X^3) = 3 X^3
        [0, 2, 0, 0], // phi(X^2) = 2 X^2
        [0, 0, 1, 0], // phi(X)   = X
        [0, 0, 0, 0]  // phi(1)   = 0
      ]
    }),
    // Finite difference: phi(f) = f(X+1) - f(X)
    () => ({
      description: `\\varphi(f) = f(X+1) - f(X)`,
      images: [
        [0, 3, 3, 1], // phi(X^3) = 3X^2 + 3X + 1
        [0, 0, 2, 1], // phi(X^2) = 2X + 1
        [0, 0, 0, 1], // phi(X)   = 1
        [0, 0, 0, 0]  // phi(1)   = 0
      ]
    }),
    // Shift up: phi(X^k) = X^{k+1} for k<3, phi(X^3)=0
    () => ({
      description: `\\varphi(X^k) = X^{k+1} \\text{ für } k<3,\\; \\varphi(X^3)=0`,
      images: [
        [0, 0, 0, 0], // phi(X^3) = 0
        [1, 0, 0, 0], // phi(X^2) = X^3
        [0, 1, 0, 0], // phi(X)   = X^2
        [0, 0, 1, 0]  // phi(1)   = X
      ]
    }),
    // Scaling: phi(f) = s * f
    () => {
      const s = randInt(2, 3);
      return {
        description: `\\varphi(f) = ${s}\\, f`,
        images: [
          [s, 0, 0, 0],
          [0, s, 0, 0],
          [0, 0, s, 0],
          [0, 0, 0, s]
        ]
      };
    }
  ];

  return rules[randInt(0, rules.length - 1)]();
}

function formatMatrix(M: number[][]): string {
  const rows = M.map((row) => row.join(',')).join(';');
  return `[${rows}]`;
}

/**
 * Generates a task asking for the representation matrix M_B^B(phi) of a linear
 * map on the polynomial space P_3 with respect to B = {X^3, X^2, X, 1}.
 */
export function generatePolyMappingMatrix(): TaskData {
  const rule = pickRule();

  // Build the 4x4 matrix: column col = coordinate vector of phi(b_col).
  const matrix: number[][] = [[], [], [], []];
  for (let col = 0; col < 4; col++) {
    const img = rule.images[col];
    for (let row = 0; row < 4; row++) {
      matrix[row][col] = img[row];
    }
  }

  const mathQuery = `M_B^B(\\varphi) \\text{ mit } B = \\{X^3, X^2, X, 1\\}`;

  const explanation = [
    `Die Abbildung ist gegeben durch $${rule.description}$$ (Regel im Aufgabentext).`,
    `Wir wenden $\\varphi$ auf jede Basisvektor $b_i \\in B = \\{X^3, X^2, X, 1\\}$ an.`,
    `Die Koordinaten von $\\varphi(b_i)$ bezüglich $B$ bilden die $i$-te Spalte der Matrix.`,
    `Ergebnis: $${formatMatrix(matrix)}$$`
  ];

  return {
    type: 'calc_poly_mapping_matrix',
    mathQuery,
    answer: formatMatrix(matrix),
    explanation,
    prompt: `Gegeben sei die lineare Abbildung $\\varphi$ mit ${rule.description}. Bestimme die Darstellungsmatrix $M_B^B(\\varphi)$ bezüglich $B = \\{X^3, X^2, X, 1\\}$.`,
    inputHint: 'Matrix zeilenweise, Einträge durch Komma, Zeilen durch Semikolon, z.B. [1,0,0,0;0,2,1,0;...]'
  };
}
