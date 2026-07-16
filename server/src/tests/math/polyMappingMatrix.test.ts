import { describe, it, expect } from 'vitest';
import { generatePolyMappingMatrix } from '../../services/math/polyMappingMatrix';

describe('Poly Mapping Matrix Generator', () => {
  it('should return the unified TaskData shape', () => {
    const task = generatePolyMappingMatrix();
    expect(task.type).toBe('calc_poly_mapping_matrix');
    expect(task).toHaveProperty('mathQuery');
    expect(task).toHaveProperty('answer');
    expect(typeof task.answer).toBe('string');
    expect(Array.isArray(task.explanation)).toBe(true);
  });

  it('should produce a 4x4 matrix string [r,r,r,r;r,r,r,r;r,r,r,r;r,r,r,r]', () => {
    for (let trial = 0; trial < 30; trial++) {
      const task = generatePolyMappingMatrix();
      const m = task.answer.match(/^\[([\d,]+);([\d,]+);([\d,]+);([\d,]+)\]$/);
      expect(m).not.toBeNull();
      // Each row must have exactly 4 entries.
      for (let i = 1; i <= 4; i++) {
        expect(m![i].split(',').length).toBe(4);
      }
    }
  });
});
