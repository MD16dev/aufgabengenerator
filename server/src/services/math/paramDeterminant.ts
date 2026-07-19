import { TaskData } from './types';

/**
 * Polynomial in the variable `a`, coefficients reduced modulo p and stored as
 * [c0, c1, c2, ...] representing c0 + c1*a + c2*a^2 + ...
 */
type Poly = number[];

function trim(poly: Poly): Poly {
  let i = poly.length - 1;
  while (i > 0 && poly[i] === 0) i--;
  return poly.slice(0, i + 1);
}

function padd(a: Poly, b: Poly, p: number): Poly {
  const n = Math.max(a.length, b.length);
  const r = new Array(n).fill(0);
  for (let i = 0; i < n; i++) r[i] = (((a[i] || 0) + (b[i] || 0)) % p + p) % p;
  return trim(r);
}

function psub(a: Poly, b: Poly, p: number): Poly {
  return padd(a, b.map((c) => (p - c) % p), p);
}

function pmul(a: Poly, b: Poly, p: number): Poly {
  if (a.length === 0 || b.length === 0) return [];
  const r = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      r[i + j] = (r[i + j] + a[i] * b[j]) % p;
    }
  }
  return trim(r);
}

/** Determinant of a 3x3 matrix of polynomials. */
function det3Poly(M: Poly[][], p: number): Poly {
  const m = (r: number, c: number) => M[r][c];
  const term =
    (A: Poly, B: Poly, C: Poly, D: Poly) => psub(pmul(A, B, p), pmul(C, D, p), p);
  const minor00 = term(m(1, 1), m(2, 2), m(1, 2), m(2, 1));
  const minor01 = term(m(1, 0), m(2, 2), m(1, 2), m(2, 0));
  const minor02 = term(m(1, 0), m(2, 1), m(1, 1), m(2, 0));
  // det = a00*(a11*a22 - a12*a21) - a01*(a10*a22 - a12*a20) + a02*(a10*a21 - a11*a20)
  return padd(psub(pmul(m(0, 0), minor00, p), pmul(m(0, 1), minor01, p), p), pmul(m(0, 2), minor02, p), p);
}

function formatPoly(poly: Poly): string {
  if (poly.length === 0 || poly.every((c) => c === 0)) return '0';
  const parts: string[] = [];
  for (let d = poly.length - 1; d >= 0; d--) {
    const c = poly[d];
    if (c === 0) continue;
    if (d === 0) parts.push(String(c));
    else if (d === 1) parts.push(c === 1 ? 'a' : `${c}a`);
    else parts.push(c === 1 ? `a^${d}` : `${c}a^${d}`);
  }
  return parts.join('+');
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a task asking for the determinant of a 3x3 matrix whose entries
 * contain the parameter `a`, computed in the finite field F_p (p in {3,5,7}).
 * The answer is the determinant as a polynomial in `a` (coefficients mod p).
 */
export function generateParamDeterminantFiniteField(): TaskData {
  const primes = [3, 5, 7];
  const p = primes[randInt(0, primes.length - 1)];

  // Build a 3x3 matrix of constants in F_p, then place 1-2 variables `a`.
  let matrix: Poly[][];
  let det: Poly;
  let attempts = 0;
  do {
    attempts++;
    matrix = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => [randInt(0, p - 1)] as Poly)
    );
    const numVars = randInt(1, 2);
    const positions = new Set<number>();
    while (positions.size < numVars) positions.add(randInt(0, 8));
    for (const pos of positions) {
      matrix[Math.floor(pos / 3)][pos % 3] = [0, 1]; // the variable `a`
    }
    det = det3Poly(matrix, p);
    // Retry until the determinant actually depends on `a` (degree >= 1) and is non-zero.
  } while ((det.length <= 1 || det.every((c) => c === 0)) && attempts < 50);

  // Build LaTeX representation of the matrix.
  const disp = matrix.map((row) => row.map((entry) => (entry.length > 1 ? 'a' : String(entry[0]))));
  const latexRows = disp.map((row) => row.join(' & ')).join(' \\\\ ');
  const mathQuery = `\\det\\begin{pmatrix} ${latexRows} \\end{pmatrix} \\quad \\text{in } \\mathbb{F}_{${p}}`;

  // Sarrus expansion with the concrete entries (a stays symbolic).
  const m = (r: number, c: number) => disp[r][c];
  const term = (a: string, b: string, c: string) => `${a}\\cdot ${b}\\cdot ${c}`;
  const sarrusPos = [
    term(m(0, 0), m(1, 1), m(2, 2)),
    term(m(0, 1), m(1, 2), m(2, 0)),
    term(m(0, 2), m(1, 0), m(2, 1))
  ];
  const sarrusNeg = [
    term(m(0, 2), m(1, 1), m(2, 0)),
    term(m(0, 0), m(1, 2), m(2, 1)),
    term(m(0, 1), m(1, 0), m(2, 2))
  ];

  const explanation = [
    `Wir berechnen die Determinante der $3\\times 3$ Matrix über $\\mathbb{F}_{${p}}$ mit der Regel von Sarrus. Die Variable ist $a$.`,
    `$$\\det = ${sarrusPos.join(' + ')} - \\left(${sarrusNeg.join(' + ')}\\right)$$`,
    `Jetzt fassen wir nach Potenzen von $a$ zusammen. Da wir in $\\mathbb{F}_{${p}}$ rechnen, werden alle Koeffizienten modulo $p = ${p}$ reduziert.`,
    `Das liefert das Polynom in $a$: $${formatPoly(det)}$$`
  ];

  return {
    type: 'calc_param_determinant_finite_field',
    mathQuery,
    answer: formatPoly(det),
    explanation,
    prompt: `Berechne die Determinante in $\\mathbb{F}_{${p}}$. Gib das Polynom in $a$ an (absteigend geordnet, z.B. 4a^2+1).`,
    inputHint: 'Polynom in a, Koeffizienten modulo ' + p + ' (z.B. 2a+1).'
  };
}
