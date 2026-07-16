import { describe, it, expect } from 'vitest';
import { generateParamDeterminantFiniteField } from '../../services/math/paramDeterminant';

describe('Param Determinant (Finite Field) Generator', () => {
  it('should return the unified TaskData shape', () => {
    const task = generateParamDeterminantFiniteField();
    expect(task.type).toBe('calc_param_determinant_finite_field');
    expect(task).toHaveProperty('mathQuery');
    expect(task).toHaveProperty('answer');
    expect(typeof task.answer).toBe('string');
    expect(Array.isArray(task.explanation)).toBe(true);
  });

  it('should produce a polynomial answer depending on a', () => {
    for (let trial = 0; trial < 30; trial++) {
      const task = generateParamDeterminantFiniteField();
      // The determinant must contain the variable `a`.
      expect(task.answer).toMatch(/a/);
      // Coefficients must be valid residues for some p in {3,5,7}.
      const coeffs = task.answer.split('+').map((t) => parseInt(t.replace(/a.*/, '') || '0', 10));
      for (const c of coeffs) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThan(7);
      }
    }
  });

  it('should reference a valid prime p in {3,5,7}', () => {
    for (let trial = 0; trial < 20; trial++) {
      const task = generateParamDeterminantFiniteField();
      const m = task.mathQuery.match(/\\mathbb\{F\}_\{(\d+)\}/);
      expect(m).not.toBeNull();
      expect(['3', '5', '7']).toContain(m![1]);
    }
  });
});
