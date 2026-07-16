import { describe, it, expect } from 'vitest';
import { generateLinearCodeParameters } from '../../services/math/linearCodeParameters';

describe('Linear Code Parameters Generator', () => {
  it('should return the unified TaskData shape', () => {
    const task = generateLinearCodeParameters();
    expect(task.type).toBe('calc_linear_code_parameters');
    expect(task).toHaveProperty('mathQuery');
    expect(task).toHaveProperty('answer');
    expect(typeof task.answer).toBe('string');
    expect(Array.isArray(task.explanation)).toBe(true);
  });

  it('should produce a [n,k,d] array string with n >= k >= 1 and d >= 1', () => {
    for (let trial = 0; trial < 30; trial++) {
      const task = generateLinearCodeParameters();
      const m = task.answer.match(/^\[(\d+),(\d+),(\d+)\]$/);
      expect(m).not.toBeNull();
      const n = Number(m![1]);
      const k = Number(m![2]);
      const d = Number(m![3]);
      expect(n).toBeGreaterThanOrEqual(k);
      expect(k).toBeGreaterThanOrEqual(1);
      expect(d).toBeGreaterThanOrEqual(1);
    }
  });

  it('should render a binary generator matrix in the query', () => {
    const task = generateLinearCodeParameters();
      const m = task.mathQuery.match(/\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/);
    expect(m).not.toBeNull();
    const body = m![1].replace(/[&\\]/g, '').replace(/\s+/g, '');
    for (const ch of body) {
      expect(['0', '1']).toContain(ch);
    }
  });
});
