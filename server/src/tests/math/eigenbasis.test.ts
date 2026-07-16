import { describe, it, expect } from 'vitest';
import { generateEigenbasis } from '../../services/math/eigenbasis';

describe('Eigenbasis Generator', () => {
  it('should return the unified TaskData shape', () => {
    const task = generateEigenbasis();
    expect(task.type).toBe('calc_eigenbasis');
    expect(task).toHaveProperty('mathQuery');
    expect(task).toHaveProperty('answer');
    expect(typeof task.answer).toBe('string');
    expect(Array.isArray(task.explanation)).toBe(true);
  });

  it('should produce normalized vectors with first non-zero entry = 1', () => {
    for (let trial = 0; trial < 30; trial++) {
      const task = generateEigenbasis();
      const m = task.answer.match(/^(\([^)]+\))(,\([^)]+\))*$/);
      expect(m).not.toBeNull();
      const vectors = [...task.answer.matchAll(/\(([^)]+)\)/g)].map((m) =>
        m[1].split(',').map(Number)
      );
      for (const v of vectors) {
        expect(v.length).toBe(3);
        const firstNonZero = v.find((x) => x !== 0);
        expect(firstNonZero).toBe(1);
      }
    }
  });

  it('should render a 3x3 matrix in the query', () => {
    const task = generateEigenbasis();
      const m = task.mathQuery.match(/\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/);
    expect(m).not.toBeNull();
    expect(m![1].split('\\\\').length).toBe(3);
  });
});
