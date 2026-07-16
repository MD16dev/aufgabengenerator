import { TaskData } from './types';

/**
 * Generates a task asking for the cardinality of GL_n(F_p), i.e. the number of
 * invertible n x n matrices over the finite field F_p.
 *
 * The count is given by the product formula:
 *   |GL_n(F_p)| = ∏_{i=0}^{n-1} (p^n - p^i)
 */
export function generateGLnCardinality(): TaskData {
  // Choose p from {2, 3, 5} and n from {2, 3, 4}
  const primes = [2, 3, 5];
  const p = primes[Math.floor(Math.random() * primes.length)];
  const dims = [2, 3, 4];
  const n = dims[Math.floor(Math.random() * dims.length)];

  // Compute the product ∏_{i=0}^{n-1} (p^n - p^i)
  const pPowN = Math.pow(p, n);
  let cardinality = 1;
  for (let i = 0; i < n; i++) {
    cardinality *= pPowN - Math.pow(p, i);
  }

  const mathQuery = `\\left|\\operatorname{GL}_{${n}}(\\mathbb{F}_{${p}})\\right|`;

  // Concrete factors of the product formula.
  const factors: number[] = [];
  for (let i = 0; i < n; i++) factors.push(pPowN - Math.pow(p, i));
  const factorStr = factors.map((f) => String(f)).join(' \\cdot ');

  const explanation = [
    `Gesucht ist die Anzahl der invertierbaren $n\\times n$-Matrizen über $\\mathbb{F}_{${p}}$, also $\\left|\\operatorname{GL}_{${n}}(\\mathbb{F}_{${p}})\\right|$.`,
    `Wir bauen die Matrix spaltenweise: die 1. Spalte kann ein beliebiger Vektor $\\neq 0$ sein $\\Rightarrow p^{${n}}-1 = ${factors[0]}$ Möglichkeiten.`,
    `Die 2. Spalte darf nicht im Span der 1. liegen $\\Rightarrow p^{${n}}-p = ${factors[1]}$ Möglichkeiten${n > 2 ? `, usw.` : ``}.`,
    `Allgemein hat die $(i+1)$-te Spalte $p^{${n}}-p^{i}$ Möglichkeiten. Die Formel lautet:`,
    `$$\\left|\\operatorname{GL}_{${n}}(\\mathbb{F}_{${p}})\\right| = \\prod_{i=0}^{${n - 1}} \\left(p^{${n}} - p^{i}\\right) = ${factorStr} = ${cardinality}$$`
  ];

  return {
    type: 'calc_gl_n_cardinality',
    mathQuery,
    answer: String(cardinality),
    explanation,
    prompt: 'Wie viele invertierbare Matrizen gibt es?',
    inputHint: 'Gib das Ergebnis als ganze Zahl ein.'
  };
}
